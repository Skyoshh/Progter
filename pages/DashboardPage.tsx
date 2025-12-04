
import React, { useMemo, useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { DBTopic, DBUserProgress } from '../types';
import { CheckCircleIcon, StarIcon } from '../components/icons';
import { databaseService } from '../services/database';

const LessonNode: React.FC<{ lesson: DBTopic; isCompleted: boolean; isUnlocked: boolean; index: number }> = ({ lesson, isCompleted, isUnlocked, index }) => {
  const positionClasses = [
    'top-0 left-1/2 -translate-x-1/2',
    'top-24 left-1/4',
    'top-24 right-1/4',
    'top-48 left-1/2 -translate-x-1/2',
    'top-72 left-1/4',
    'top-72 right-1/4'
  ];
  
  const positionClass = positionClasses[index % positionClasses.length];

  const content = (
    <div className={`absolute ${positionClass} flex flex-col items-center text-center w-24`}>
        <div className={`relative w-24 h-24 flex items-center justify-center rounded-full border-4 transition-all duration-300
          ${isCompleted ? 'bg-green-500 border-green-600' : ''}
          ${isUnlocked && !isCompleted ? 'bg-blue-500 border-blue-600 animate-pulse' : ''}
          ${!isUnlocked ? 'bg-gray-300 border-gray-400' : ''}
        `}>
          <div className="text-4xl">{lesson.icon}</div>
          {isCompleted && (
            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
          )}
        </div>
        <p className={`mt-2 font-bold ${isUnlocked ? 'text-gray-700' : 'text-gray-500'}`}>{lesson.judul_topik}</p>
        <div className="flex items-center text-yellow-500 font-semibold">
           <StarIcon className="w-4 h-4 mr-1"/>
           <span>{lesson.xp_reward} XP</span>
        </div>
    </div>
  );

  if (!isUnlocked) {
    return <div className="cursor-not-allowed">{content}</div>;
  }

  return (
    <Link to={`/lesson/${lesson.id}`} className="transition-transform transform hover:scale-110">
      {content}
    </Link>
  );
};


const DashboardPage: React.FC = () => {
  const { user, isLoading } = useUser();
  const [topics, setTopics] = useState<DBTopic[]>([]);
  const [progress, setProgress] = useState<DBUserProgress[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const { learning_language } = user || {};

  useEffect(() => {
    const fetchData = async () => {
        if (learning_language && user?.id) {
            setLoadingData(true);
            const [fetchedTopics, fetchedProgress] = await Promise.all([
                databaseService.getTopicsByLanguage(learning_language),
                databaseService.getUserProgress(user.id)
            ]);
            setTopics(fetchedTopics);
            setProgress(fetchedProgress);
            setLoadingData(false);
        }
    };
    fetchData();
  }, [learning_language, user]);

  if (isLoading) return <div className="p-8 text-center">Memuat Pengguna...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (!learning_language) {
    return <Navigate to="/select-language" />;
  }

  if (loadingData) return <div className="p-8 text-center">Menyiapkan kurikulum...</div>;

  const completedLessonIds = progress.map(p => p.topik_id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Jalur Belajar Anda</h1>
      <p className="text-gray-600 mb-8">Selesaikan semua topik untuk menjadi master!</p>

      <div className="relative w-full max-w-lg mx-auto h-[40rem]">
        {/* The path line */}
        <svg className="absolute w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="none">
          <path d="M 100 0 C 50 50, 150 50, 100 100 C 50 150, 150 150, 100 200" stroke="#d1d5db" strokeWidth="2" fill="none" strokeDasharray="5,5"/>
        </svg>

        {topics.map((lesson, index) => {
          const isCompleted = completedLessonIds.includes(lesson.id);
          const isUnlocked = index === 0 || completedLessonIds.includes(topics[index-1]?.id);
          return <LessonNode key={lesson.id} lesson={lesson} isCompleted={isCompleted} isUnlocked={isUnlocked} index={index}/>;
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
