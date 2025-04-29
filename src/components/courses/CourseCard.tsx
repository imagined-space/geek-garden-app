'use client';

import { useMemo } from 'react';
import { Course } from '@/types/courses';
import { useAtom } from 'jotai';
import { purchaseCourseAction, updateCourseAction } from '@/stores/courseStore';
import { useCourseContract } from '@/hooks/useCourseContract';
import { toast } from 'sonner';
import ClickSpark from '@/components/ui/ClickSpark';

export default function CourseCard(props: { item: Course }) {
  const { item } = props;
  const [, purchaseCourseWeb2] = useAtom(purchaseCourseAction);
  const [, updateCourse] = useAtom(updateCourseAction);
  const {  purchaseCourse: purchaseCourseWeb3, getAllCourses, isLoading } = useCourseContract();

  const handlePurchase = async (web2CourseId: string) => {
    try {
      purchaseCourseWeb2(web2CourseId);
      await purchaseCourseWeb3(web2CourseId);
      toast.success('shop success');
      // 刷新课程列表
      getAllCourses();
    } catch (_) {
      toast.error('shop failed');
      // 回滚
      updateCourse(web2CourseId, { ...item, isPurchased: false });
    }
  };

  const buttonText = useMemo(() => {
    if (isLoading) {
      return 'shop';
    }
    if (item.isPurchased) {
      return 'purchased';
    }
    return 'shop';
  }, [item.isPurchased, isLoading]);

  return (
    <div
      key={item.web2CourseId}
      className="cyberpunk-card rounded-lg overflow-hidden transition-transform hover:translate-y-[-4px]"
    >
      <div className="h-48 bg-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple opacity-50"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-16 w-16 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div className="absolute top-4 right-4 bg-neon-pink text-white px-2 py-1 text-xs rounded-md">
          热门
        </div>
      </div>

      <div className=" p-5 ">
        <div className="h-68">
          <h3 className="text-xl font-semibold text-neon-blue mb-2">{item.name}</h3>
          <p className="text-gray-400 mb-4 line-clamp-7">{item.description}</p>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neon-green font-semibold">G{item.price}</span>
          <button
            className={`cyberpunk-button px-3 py-1 text-sm rounded ${item.isPurchased ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => handlePurchase(item.web2CourseId)}
            disabled={isLoading || item.isPurchased}
          >
            <ClickSpark
              sparkColor="#fff"
              sparkSize={10}
              sparkRadius={15}
              sparkCount={8}
              duration={400}
            >
              {buttonText}
            </ClickSpark>
          </button>
        </div>
      </div>
    </div>
  );
}
