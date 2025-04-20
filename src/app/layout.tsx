import type { Metadata } from 'next';
import { LanguageProvider } from '@components/language/Context';
import { Web3Providers } from '@components/wallet/Providers';

import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import MainLayout from '@/components/common/MainLayout';
import { Toaster } from '@/components/ui/sonner';
import { Provider as JotaiProvider } from 'jotai';
import Header from '@/components/common/Header';
import WalletAuthListener from '@/components/wallet/WalletAuthListener';
import ParticlesBackground from '@/components/effects/ParticlesBackground';
import Footer from '@/components/common/Footer';

export const metadata: Metadata = {
  title: 'Geek University',
  description: 'A Web3 learning platform with cyberpunk style',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className='cyberpunk-theme'>
        <JotaiProvider>
          <LanguageProvider>
            <Web3Providers>
              <WalletAuthListener />
              <Header />

              {/* 粒子背景 */}
              <div className="fixed inset-0 pointer-events-none z-[-2]">
                <ParticlesBackground />
              </div>

              {/* 网格背景 */}
              <div className="fixed inset-0 pointer-events-none z-[-1]">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                    linear-gradient(to right, rgba(5, 217, 232, 0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(5, 217, 232, 0.05) 1px, transparent 1px)
                  `,
                    backgroundSize: '40px 40px',
                  }}
                ></div>
              </div>

              <MainLayout>{children}</MainLayout>

              <Footer />
            </Web3Providers>
            <Toaster />
          </LanguageProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
