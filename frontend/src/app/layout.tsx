import type { Metadata } from 'next';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { SolanaWalletProvider } from '@/context/WalletContext';

export const metadata: Metadata = {
  title: 'NEURAL — The Autonomous AI Economy on Solana',
  description:
    'Deploy AI models, pay per inference, run autonomous agents — all settled on-chain in milliseconds. The first AI marketplace powered by Solana.',
  keywords: ['AI', 'Solana', 'marketplace', 'machine learning', 'web3', 'inference', 'agents'],
  openGraph: {
    title: 'NEURAL — The Autonomous AI Economy on Solana',
    description: 'Deploy AI models, pay per inference, earn SOL. Instant on-chain settlement.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
