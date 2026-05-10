//! NeuralSOL — On-chain AI Inference Payment & Revenue Sharing Program
//!
//! Program ID: Updated after `anchor build` + `anchor deploy`
//! Network:    Solana Devnet
//! Framework:  Anchor v0.30.1
//!
//! Instructions:
//!   1. initialize_platform  — Admin one-time setup (platform fee %, admin wallet)
//!   2. register_model       — Creator lists a model on-chain (key, price, splits)
//!   3. pay_inference        — User pays for inference; auto-splits to creator + platform
//!   4. withdraw_earnings    — Creator withdraws accumulated SOL from their vault
//!   5. deactivate_model     — Creator or admin deactivates a model
//!   6. update_platform_fee  — Admin adjusts the platform fee basis points

use anchor_lang::prelude::*;
use anchor_lang::system_program;

// ─── Program ID (updated after first `anchor build`) ─────────────────────────
// Run: solana address -k target/deploy/neuralsol-keypair.json
// Then replace the string below with the output.
declare_id!("84YnB22vbfdsjtCBb8aoM4csRxQsfof7j12dahfVCRrj");

// ─── Constants ────────────────────────────────────────────────────────────────
/// Maximum basis points (100.00%)
const MAX_BPS: u16 = 10_000;

/// Default platform fee: 5% (500 basis points)
const DEFAULT_PLATFORM_FEE_BPS: u16 = 500;

/// Maximum model_key length (matches backend slug)
const MAX_KEY_LEN: usize = 64;

/// Maximum creator name / display label length
const MAX_NAME_LEN: usize = 128;

// ─── Program ──────────────────────────────────────────────────────────────────
#[program]
pub mod neuralsol {
    use super::*;

    /// Initialize the platform configuration account.
    /// Called once by the admin wallet after deployment.
    /// Creates a PDA ["platform_config"] that stores global settings.
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        platform_fee_bps: u16,
    ) -> Result<()> {
        require!(platform_fee_bps <= MAX_BPS, NeuralSolError::InvalidFeeBps);

        let cfg = &mut ctx.accounts.platform_config;
        cfg.admin                 = ctx.accounts.admin.key();
        cfg.platform_wallet       = ctx.accounts.platform_wallet.key();
        cfg.platform_fee_bps      = platform_fee_bps;
        cfg.total_volume_lamports = 0;
        cfg.total_inferences      = 0;
        cfg.total_models          = 0;
        cfg.bump                  = ctx.bumps.platform_config;

        emit!(PlatformInitialized {
            admin:            cfg.admin,
            platform_wallet:  cfg.platform_wallet,
            platform_fee_bps: cfg.platform_fee_bps,
        });

        Ok(())
    }

    /// Creator registers an AI model on-chain.
    /// Creates a PDA ["model", model_key] that stores pricing + stats.
    /// The model starts active — no governance required for on-chain registration.
    pub fn register_model(
        ctx: Context<RegisterModel>,
        model_key:      String,
        model_name:     String,
        price_lamports: u64,
    ) -> Result<()> {
        require!(model_key.len() <= MAX_KEY_LEN,  NeuralSolError::KeyTooLong);
        require!(model_name.len() <= MAX_NAME_LEN, NeuralSolError::NameTooLong);
        require!(price_lamports > 0,              NeuralSolError::ZeroPrice);

        let model = &mut ctx.accounts.model_account;
        model.creator             = ctx.accounts.creator.key();
        model.model_key           = model_key.clone();
        model.model_name          = model_name.clone();
        model.price_lamports      = price_lamports;
        model.total_uses          = 0;
        model.total_earned_lamports = 0;
        model.is_active           = true;
        model.bump                = ctx.bumps.model_account;
        model.registered_at       = Clock::get()?.unix_timestamp;

        // Also create/init the creator's earnings vault PDA
        // (CreatorVault is a system account — just holds SOL)
        // vault bump is stored in model so creator can withdraw later
        model.vault_bump          = ctx.bumps.creator_vault;

        // Increment platform model count
        ctx.accounts.platform_config.total_models += 1;

        emit!(ModelRegistered {
            creator:        model.creator,
            model_key:      model_key,
            model_name:     model_name,
            price_lamports: model.price_lamports,
        });

        Ok(())
    }

    /// User pays for an AI inference request.
    ///
    /// Payment flow:
    ///   user_wallet  ──[amount_lamports]──►  this instruction
    ///                      │
    ///                      ├── [95%] ──► creator_vault PDA  (accumulated earnings)
    ///                      └── [5%]  ──► platform_wallet    (immediate transfer)
    ///
    /// The creator does NOT receive SOL directly per-call.
    /// They accumulate it in their vault PDA and call `withdraw_earnings` when ready.
    /// This pattern is cheaper on gas and safer (atomic split).
    pub fn pay_inference(
        ctx: Context<PayInference>,
        amount_lamports: u64,
    ) -> Result<()> {
        let model = &ctx.accounts.model_account;
        require!(model.is_active, NeuralSolError::ModelInactive);
        require!(
            amount_lamports >= model.price_lamports,
            NeuralSolError::InsufficientPayment
        );

        let cfg           = &ctx.accounts.platform_config;
        let platform_fee  = (amount_lamports as u128)
            .checked_mul(cfg.platform_fee_bps as u128)
            .unwrap()
            .checked_div(MAX_BPS as u128)
            .unwrap() as u64;
        let creator_share = amount_lamports - platform_fee;

        // ── Transfer creator's share into their vault PDA ──────────────────────
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to:   ctx.accounts.creator_vault.to_account_info(),
                },
            ),
            creator_share,
        )?;

        // ── Transfer platform fee directly to platform wallet ──────────────────
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to:   ctx.accounts.platform_wallet.to_account_info(),
                },
            ),
            platform_fee,
        )?;

        // ── Update on-chain stats ──────────────────────────────────────────────
        let model_mut = &mut ctx.accounts.model_account;
        model_mut.total_uses              = model_mut.total_uses.saturating_add(1);
        model_mut.total_earned_lamports   = model_mut.total_earned_lamports.saturating_add(creator_share);

        let cfg_mut = &mut ctx.accounts.platform_config;
        cfg_mut.total_volume_lamports = cfg_mut.total_volume_lamports.saturating_add(amount_lamports);
        cfg_mut.total_inferences      = cfg_mut.total_inferences.saturating_add(1);

        emit!(InferencePaid {
            user:            ctx.accounts.user.key(),
            model_key:       model_mut.model_key.clone(),
            amount_lamports,
            creator_share,
            platform_fee,
        });

        Ok(())
    }

    /// Creator withdraws their accumulated earnings from the vault PDA.
    /// Uses PDA signer seeds to authorize the transfer from the vault.
    pub fn withdraw_earnings(
        ctx: Context<WithdrawEarnings>,
        amount_lamports: u64,
    ) -> Result<()> {
        let vault_balance = ctx.accounts.creator_vault.lamports();
        // Keep rent-exempt minimum in the vault so it stays alive
        let rent_exempt   = Rent::get()?.minimum_balance(0);
        let available     = vault_balance.saturating_sub(rent_exempt);

        require!(amount_lamports > 0,               NeuralSolError::ZeroWithdraw);
        require!(amount_lamports <= available,       NeuralSolError::InsufficientVaultBalance);

        // PDA signer: ["vault", creator_pubkey]
        let creator_key = ctx.accounts.creator.key();
        let seeds: &[&[u8]] = &[
            b"vault",
            creator_key.as_ref(),
            &[ctx.accounts.model_account.vault_bump],
        ];
        let signer_seeds = &[seeds];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.creator_vault.to_account_info(),
                    to:   ctx.accounts.creator.to_account_info(),
                },
                signer_seeds,
            ),
            amount_lamports,
        )?;

        emit!(EarningsWithdrawn {
            creator:        ctx.accounts.creator.key(),
            amount_lamports,
        });

        Ok(())
    }

    /// Creator or admin deactivates a model (stops new inference payments).
    pub fn deactivate_model(ctx: Context<DeactivateModel>) -> Result<()> {
        ctx.accounts.model_account.is_active = false;
        emit!(ModelDeactivated {
            model_key: ctx.accounts.model_account.model_key.clone(),
        });
        Ok(())
    }

    /// Admin updates the platform fee (basis points).
    pub fn update_platform_fee(
        ctx: Context<UpdatePlatformFee>,
        new_fee_bps: u16,
    ) -> Result<()> {
        require!(new_fee_bps <= MAX_BPS, NeuralSolError::InvalidFeeBps);
        ctx.accounts.platform_config.platform_fee_bps = new_fee_bps;
        Ok(())
    }
}

// ─── Account Structs ──────────────────────────────────────────────────────────

#[account]
#[derive(Default)]
pub struct PlatformConfig {
    pub admin:                 Pubkey,   // 32
    pub platform_wallet:       Pubkey,   // 32
    pub platform_fee_bps:      u16,      // 2  (e.g. 500 = 5%)
    pub total_volume_lamports: u64,      // 8
    pub total_inferences:      u64,      // 8
    pub total_models:          u64,      // 8
    pub bump:                  u8,       // 1
}
// Space: 8 (discriminator) + 32 + 32 + 2 + 8 + 8 + 8 + 1 = 99 bytes
impl PlatformConfig {
    pub const LEN: usize = 8 + 32 + 32 + 2 + 8 + 8 + 8 + 1;
}

#[account]
pub struct ModelAccount {
    pub creator:               Pubkey,   // 32
    pub model_key:             String,   // 4 + MAX_KEY_LEN
    pub model_name:            String,   // 4 + MAX_NAME_LEN
    pub price_lamports:        u64,      // 8
    pub total_uses:            u64,      // 8
    pub total_earned_lamports: u64,      // 8
    pub is_active:             bool,     // 1
    pub bump:                  u8,       // 1
    pub vault_bump:            u8,       // 1
    pub registered_at:         i64,      // 8
}
impl ModelAccount {
    pub const LEN: usize = 8 + 32 + (4 + MAX_KEY_LEN) + (4 + MAX_NAME_LEN) + 8 + 8 + 8 + 1 + 1 + 1 + 8;
}

// ─── Instruction Contexts ─────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer  = admin,
        space  = PlatformConfig::LEN,
        seeds  = [b"platform_config"],
        bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// CHECK: This is the platform wallet — just a system account to receive fees
    pub platform_wallet: UncheckedAccount<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(model_key: String)]
pub struct RegisterModel<'info> {
    #[account(
        init,
        payer = creator,
        space = ModelAccount::LEN,
        seeds = [b"model", model_key.as_bytes()],
        bump,
    )]
    pub model_account: Account<'info, ModelAccount>,

    /// CHECK: Creator vault PDA — holds accumulated SOL earnings
    #[account(
        mut,
        seeds = [b"vault", creator.key().as_ref()],
        bump,
    )]
    pub creator_vault: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"platform_config"],
        bump  = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount_lamports: u64)]
pub struct PayInference<'info> {
    #[account(
        mut,
        seeds = [b"model", model_account.model_key.as_bytes()],
        bump  = model_account.bump,
    )]
    pub model_account: Account<'info, ModelAccount>,

    /// CHECK: Creator vault — receives creator's share of the payment
    #[account(
        mut,
        seeds = [b"vault", model_account.creator.as_ref()],
        bump  = model_account.vault_bump,
    )]
    pub creator_vault: UncheckedAccount<'info>,

    /// CHECK: Platform wallet — receives platform fee immediately
    #[account(
        mut,
        constraint = platform_wallet.key() == platform_config.platform_wallet
            @ NeuralSolError::WrongPlatformWallet
    )]
    pub platform_wallet: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"platform_config"],
        bump  = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawEarnings<'info> {
    #[account(
        seeds = [b"model", model_account.model_key.as_bytes()],
        bump  = model_account.bump,
        constraint = model_account.creator == creator.key()
            @ NeuralSolError::NotModelCreator,
    )]
    pub model_account: Account<'info, ModelAccount>,

    /// CHECK: Creator vault PDA — source of withdrawal
    #[account(
        mut,
        seeds = [b"vault", creator.key().as_ref()],
        bump  = model_account.vault_bump,
    )]
    pub creator_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeactivateModel<'info> {
    #[account(
        mut,
        seeds = [b"model", model_account.model_key.as_bytes()],
        bump  = model_account.bump,
        constraint = (
            model_account.creator == authority.key() ||
            platform_config.admin  == authority.key()
        ) @ NeuralSolError::Unauthorized,
    )]
    pub model_account: Account<'info, ModelAccount>,

    #[account(
        seeds = [b"platform_config"],
        bump  = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdatePlatformFee<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump  = platform_config.bump,
        constraint = platform_config.admin == admin.key()
            @ NeuralSolError::Unauthorized,
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    pub admin: Signer<'info>,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct PlatformInitialized {
    pub admin:            Pubkey,
    pub platform_wallet:  Pubkey,
    pub platform_fee_bps: u16,
}

#[event]
pub struct ModelRegistered {
    pub creator:        Pubkey,
    pub model_key:      String,
    pub model_name:     String,
    pub price_lamports: u64,
}

#[event]
pub struct InferencePaid {
    pub user:            Pubkey,
    pub model_key:       String,
    pub amount_lamports: u64,
    pub creator_share:   u64,
    pub platform_fee:    u64,
}

#[event]
pub struct EarningsWithdrawn {
    pub creator:         Pubkey,
    pub amount_lamports: u64,
}

#[event]
pub struct ModelDeactivated {
    pub model_key: String,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum NeuralSolError {
    #[msg("Platform fee basis points must be ≤ 10,000")]
    InvalidFeeBps,

    #[msg("model_key is too long (max 64 chars)")]
    KeyTooLong,

    #[msg("model_name is too long (max 128 chars)")]
    NameTooLong,

    #[msg("Price must be greater than zero")]
    ZeroPrice,

    #[msg("Payment amount is below the model's minimum price")]
    InsufficientPayment,

    #[msg("Model is not active")]
    ModelInactive,

    #[msg("Withdrawal amount must be greater than zero")]
    ZeroWithdraw,

    #[msg("Insufficient vault balance for withdrawal")]
    InsufficientVaultBalance,

    #[msg("Platform wallet does not match config")]
    WrongPlatformWallet,

    #[msg("Only the model creator or platform admin can perform this action")]
    NotModelCreator,

    #[msg("Unauthorized: caller is not admin or creator")]
    Unauthorized,
}
