import React, { useState, useEffect } from 'react';
import type { Language } from '../App';
import type { User } from '../types';
import Card from './common/Card';
import { TrophyIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import LockedContent from './common/LockedContent';
import CircularProgress from './common/CircularProgress';
import { getAllUsers } from '../services/dbService';
import Spinner from './common/Spinner';


const translations = {
    en: {
        title: "Community Challenges",
        subtitle: "Compete, achieve, and get stronger together.",
        challengeTitle: "Weekly Workout Warrior",
        challengeDesc: "Complete the most workouts this week to climb the leaderboard and earn the top spot!",
        yourProgress: "Your Progress",
        workouts: "Workouts",
        leaderboard: "Leaderboard",
    },
    ar: {
        title: "تحديات المجتمع",
        subtitle: "نافس، حقق، وكن أقوى معًا.",
        challengeTitle: "محارب التمرين الأسبوعي",
        challengeDesc: "أكمل أكبر عدد من التمارين هذا الأسبوع لتتصدر قائمة المتصدرين وتحصل على المركز الأول!",
        yourProgress: "تقدمك",
        workouts: "تمارين",
        leaderboard: "قائمة المتصدرين",
    }
};

const Challenges: React.FC<{ language: Language }> = ({ language }) => {
    const t = translations[language];
    const { user, subscriptionStatus, isCoach } = useAuth();
    const [leaderboard, setLeaderboard] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const isRTL = language === 'ar';

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!user) return;
            setLoading(true);
            const allUsers = await getAllUsers(isCoach ? user.id! : -1);
            
            // Add current user to list if not already there (in case they are the coach)
            const userInList = allUsers.find(u => u.id === user.id);
            if (!userInList) {
                allUsers.push(user);
            }

            const sortedUsers = allUsers
                .filter(u => (u.weeklyWorkoutCount || 0) > 0)
                .sort((a, b) => (b.weeklyWorkoutCount || 0) - (a.weeklyWorkoutCount || 0));
            
            setLeaderboard(sortedUsers.slice(0, 10)); // Top 10
            setLoading(false);
        };

        if (subscriptionStatus === 'active') {
            fetchLeaderboard();
        }
    }, [user, subscriptionStatus, isCoach]);

    if (subscriptionStatus === 'expired') {
        return <LockedContent language={language} />;
    }
    
    const currentUserProgress = user?.weeklyWorkoutCount || 0;
    const challengeGoal = 5; // A fixed weekly goal

    return (
        <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
            <header className="text-center">
                <TrophyIcon className="w-16 h-16 mx-auto text-primary mb-2" />
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                    {t.title}
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                    {t.subtitle}
                </p>
            </header>

            <Card>
                <h2 className="text-2xl font-bold text-center mb-2">{t.challengeTitle}</h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">{t.challengeDesc}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-1 flex flex-col items-center">
                        <h3 className="text-lg font-bold mb-2">{t.yourProgress}</h3>
                        <CircularProgress progress={(currentUserProgress / challengeGoal) * 100} />
                        <p className="mt-2 font-semibold">{currentUserProgress} / {challengeGoal} {t.workouts}</p>
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="text-lg font-bold mb-2">{t.leaderboard}</h3>
                        {loading ? <div className="flex justify-center"><Spinner/></div> : (
                            <div className="space-y-2">
                                {leaderboard.map((member, index) => (
                                    <div key={member.id} className={`flex items-center p-3 rounded-lg ${member.id === user?.id ? 'bg-primary-50 dark:bg-primary-900/50 border-2 border-primary' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        <span className="font-bold text-lg w-8">{index + 1}</span>
                                        <img src={member.picture} alt={member.name} className="w-10 h-10 rounded-full ltr:ml-2 rtl:mr-2" />
                                        <p className="font-semibold ltr:ml-3 rtl:mr-3 flex-grow">{member.name}</p>
                                        <p className="font-bold text-primary">{member.weeklyWorkoutCount} <span className="text-sm text-gray-500">{t.workouts}</span></p>
                                    </div>
                                ))}
                                {leaderboard.length === 0 && <p className="text-center text-gray-500">No one has completed a workout yet this week. Be the first!</p>}
                            </div>
                        )}
                    </div>
                </div>
            </Card>

        </div>
    );
};

export default Challenges;
