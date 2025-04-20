'use client';

import React from 'react';
import { useLanguage } from '@components/language/Context';
import CourseSection from '@/components/courses/CourseSection';
import { TokenExchange } from '@components/token/TokenExchange';
import CountUp from '@/components/ui/CountUp';
import Orb from '@components/common/Orb';

const HomePage = () => {
  const { t } = useLanguage();

  return (
    <section>
      {/* Hero section */}
      <section className="relative bg-dark-bg cyberpunk-overlay text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-16 md:py-20">
            <div className="flex flex-col justify-between h-full">
              <div className="flex flex-col justify-center">
                <h1 className="cyberpunk-title text-5xl font-bold mb-6 ">{t('hero.welcome')}</h1>
                <p className="cyberpunk-glow text-lg md:text-2xl mb-4 text-neon-blue">
                  {t('hero.subtitle')}
                </p>
              </div>
              <TokenExchange />
            </div>
            <div className="hidden md:block h-[450px]">
              <Orb />
            </div>
          </div>
        </div>
      </section>

      {/* Course section with cyberpunk styling */}
      <CourseSection />

      {/* 统计数据 */}
      <section className="bg-dark-bg py-16 relative overflow-hidden cyberpunk-overlay">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="cyberpunk-title text-3xl font-bold mb-4" data-text={t('stats.title')}>
              {t('stats.title')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t('stats.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="cyberpunk-card p-6 rounded-lg">
              <div className="text-4xl font-bold text-neon-pink mb-2 cyberpunk-glow">
                <CountUp
                  from={0}
                  to={5000}
                  separator=","
                  direction="up"
                  duration={1}
                  className="count-up-text"
                />
                +
              </div>
              <div className="text-gray-400">{t('stats.students')}</div>
            </div>
            <div className="cyberpunk-card p-6 rounded-lg">
              <div className="text-4xl font-bold text-neon-blue mb-2 cyberpunk-glow">
                <CountUp
                  from={0}
                  to={50}
                  separator=","
                  direction="up"
                  duration={1}
                  className="count-up-text"
                />
                +
              </div>
              <div className="text-gray-400">{t('stats.courses')}</div>
            </div>
            <div className="cyberpunk-card p-6 rounded-lg">
              <div className="text-4xl font-bold text-neon-purple mb-2 cyberpunk-glow">
                <CountUp
                  from={0}
                  to={30}
                  separator=","
                  direction="up"
                  duration={1}
                  className="count-up-text"
                />
                +
              </div>
              <div className="text-gray-400">{t('stats.instructors')}</div>
            </div>
            <div className="cyberpunk-card p-6 rounded-lg">
              <div className="text-4xl font-bold text-neon-green mb-2 cyberpunk-glow">
                <CountUp
                  from={0}
                  to={95}
                  separator=","
                  direction="up"
                  duration={1}
                  className="count-up-text"
                />
                %
              </div>
              <div className="text-gray-400">{t('stats.employmentRate')}</div>
            </div>
          </div>
        </div>

        {/* 背景装饰元素 */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-neon-purple opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-neon-blue opacity-20 rounded-full blur-3xl"></div>
      </section>

      {/* 学员评价 */}
      <section className="bg-darker-bg py-16 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="cyberpunk-title text-3xl font-bold mb-4"
              data-text={t('testimonials.title')}
            >
              {t('testimonials.title')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t('testimonials.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 评价卡片 1 */}
            <div className="cyberpunk-card p-6 rounded-lg relative">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-neon-pink rounded-full flex items-center justify-center text-white">
                "
              </div>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-neon-blue rounded-full flex items-center justify-center text-white font-bold text-xl">
                  李
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-white">李明</h4>
                  <div className="text-neon-pink flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-400">
                "Web3
                University的课程非常实用，讲师都是行业专家，让我在短时间内掌握了智能合约开发技能，现在我已经在一家区块链公司工作了。"
              </p>
            </div>

            {/* 评价卡片 2 */}
            <div className="cyberpunk-card p-6 rounded-lg relative">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-neon-pink rounded-full flex items-center justify-center text-white">
                "
              </div>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-neon-green rounded-full flex items-center justify-center text-white font-bold text-xl">
                  张
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-white">张伟</h4>
                  <div className="text-neon-pink flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-400">
                "作为一名传统金融从业者，我通过Web3
                University的课程顺利转型到了区块链行业。课程内容深入浅出，特别适合想要转行的人。"
              </p>
            </div>

            {/* 评价卡片 3 */}
            <div className="cyberpunk-card p-6 rounded-lg relative">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-neon-pink rounded-full flex items-center justify-center text-white">
                "
              </div>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-neon-purple rounded-full flex items-center justify-center text-white font-bold text-xl">
                  王
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-white">王芳</h4>
                  <div className="text-neon-pink flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-400">
                "Web3
                University提供的DeFi课程非常全面，从基础概念到高级策略都有详细讲解。学习体验很好，随时可以与讲师互动提问。"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 合作伙伴 */}
      {/* <section className="bg-dark-bg py-16 border-t border-neon-blue border-opacity-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="cyberpunk-title text-3xl font-bold mb-4" data-text={t('partners.title')}>
              {t('partners.title')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t('partners.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 flex items-center">
                <div className="h-10 w-32 bg-gradient-to-r from-neon-blue to-neon-purple opacity-30 rounded cyberpunk-border"></div>
              </div>
            ))}
          </div>
        </div>
      </section> */}
    </section>
  );
};

export default HomePage;
