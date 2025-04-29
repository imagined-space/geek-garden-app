'use client';

import React from 'react';
import { useAtom } from 'jotai';
import { useLanguage } from '@/components/language/Context';
import CourseCard from '@/components/courses/CourseCard';
import { coursesAtom } from '@/stores/courseStore';

interface CourseSectionProps {
  className?: string;
}

const CourseSection: React.FC<CourseSectionProps> = () => {
  const { t } = useLanguage();
  const [courses] = useAtom(coursesAtom);

  return (
    <section className="bg-darker-bg relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className="cyberpunk-title text-3xl font-bold mb-8 text-center"
          data-text={t('courses.title')}
        >
          {t('courses.title')}
        </h2>
        {/* 课程卡片示例 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses.map(item => (
            <CourseCard key={item.web2CourseId} item={item}></CourseCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CourseSection;
