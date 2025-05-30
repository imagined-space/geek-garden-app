import type { Metadata } from 'next';
import { LanguageProvider } from '@components/language/Context';
import { Web3Providers } from '@components/wallet/Providers';
import { headers, cookies } from 'next/headers';

import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import MainLayout from '@/components/common/MainLayout';
import { Toaster } from '@/components/ui/sonner';
import { Provider as JotaiProvider } from 'jotai';
import Header from '@/components/common/Header';
import WalletAuthListener from '@/components/wallet/WalletAuthListener';
import ParticlesBackground from '@/components/effects/ParticlesBackground';
import { WebVitalsMonitor } from '@/components/monitor/WebVitalsMonitor';
import Footer from '@/components/common/Footer';

export const metadata: Metadata = {
  title: 'Geek Garden',
  description: 'A Web3 learning platform with cyberpunk style',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const cookie = cookieStore.get('preferred-language');
  const languageHeader = headersList.get('accept-language');

  let language = 'en'; // 默认语言

  try {
    if (cookie) {
      language = cookie.value;
    } else if (languageHeader) {
      language = languageHeader.split(',')[0].toLocaleLowerCase();
    }
  } catch (error) {
    console.error('[Layout][language]', error);
  }

  return (
    <html lang={language}>
      <body className="cyberpunk-theme">
        <JotaiProvider>
          <LanguageProvider initialLanguage={language}>
            <Web3Providers>
              <WebVitalsMonitor
                position="bottom-right"
                showScore={true}
                debug={process.env.NODE_ENV === 'development'}
              />
              {/* 监听钱包认证状态变化 */}
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
export const runtime = 'edge';
