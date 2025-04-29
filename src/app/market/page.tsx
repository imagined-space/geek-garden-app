'use client';

import React from 'react';
import { useLanguage } from '@components/language/Context';
import YiDengCoinChart from '@components/charts/YiDengCoinChart';

const MarketPage = () => {
  const { t } = useLanguage();

  return (
    <section>
      {/* Hero section */}
      <section className="relative bg-dark-bg cyberpunk-overlay text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="text-center mb-8">
            <h1
              className="cyberpunk-title text-4xl md:text-5xl font-bold mb-4"
              data-text={t('market.title')}
            >
              {t('market.title')}
            </h1>
            <p className="cyberpunk-glow text-lg md:text-xl mb-8 text-neon-blue max-w-3xl mx-auto">
              {t('market.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main market content */}
      <section className="bg-darker-bg py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-[600px]">
            <YiDengCoinChart />
          </div>
        </div>
      </section>
    </section>
  );
};

export default MarketPage;
