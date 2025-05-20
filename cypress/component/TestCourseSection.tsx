import React from 'react';
import { useLanguage } from '@components/language/Context';

interface Course {
  id: string | number;
  title: string;
}

const TestCourseSection = ({ courses }: { courses: Course[] }) => {
  const { language } = useLanguage();

  return (
    <section className="py-12">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-8">
          {language === 'zh' ? '精选课程' : 'Featured Courses'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => (
            <div key={course.id} className="bg-darker-bg rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-2">{course.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestCourseSection;
