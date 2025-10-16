import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Language } from '../App';
import { useAuth } from '../contexts/AuthContext';
import Card from './common/Card';
import CircularProgress from './common/CircularProgress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
    PencilIcon,
    FireIcon,
    DumbbellIcon,
    ActivityIcon,
    CalendarIcon,
    MedalIcon,
    WaterDropIcon,
    ZapIcon,
    BrainCircuitIcon,
    AppleIcon,
    ChevronDownIcon,
    CameraIcon
} from './icons';
import Button from './common/Button';
import { getSetting } from '../services/dbService';
import type { SpecialistStatus, SpecialistChannel } from '../types';
import { getAiCoachingTip } from '../services/geminiService';
import Spinner from './common/Spinner';

const translations = {
    en: {
        membership: "Gold Member",
        location: "Cairo, Egypt",
        motivationalQuote: "Keep pushing forward, {name}!",
        editProfile: "Edit Profile",
        changeProfilePicture: "Change profile picture",
        dashboardTitle: "Dashboard Overview",
        calories: "Calories Burned",
        workouts: "Workouts Completed",
        weeklyProgress: "Weekly Progress",
        activeDays: "Active Days",
        healthTitle: "Health & Nutrition",
        waterIntake: "Water Intake",
        liters: "Liters",
        macros: "Macronutrients (g)",
        protein: "Protein",
        carbs: "Carbs",
        fat: "Fat",
        historyTitle: "Workout History",
        history: {
            chest: "Chest & Triceps",
            legs: "Leg Day",
            back: "Back & Biceps"
        },
        achievementsTitle: "Achievements & Badges",
        footer: "Progress is not about perfection — it’s about persistence. Keep going!",
        streak: "7-Day Streak!",
        badges: {
            bronze: "Bronze Finisher",
            silver: "Silver Star",
            gold: "Gold Champion"
        },
        achievements: {
            unlock_bronze: "Complete 1 workout",
            unlock_silver: "Complete 10 workouts",
            unlock_gold: "Complete 30 workouts",
            locked: "Locked",
            unlocked: "UNLOCKED!",
            dev_controls: "Development Controls",
            dev_description: "Simulate coach approving a workout to test achievements.",
            approve_workout: "Approve Workout (+1)",
            reset_progress: "Reset Progress",
            noWorkouts: "No approved workouts yet. Complete a workout from your plan and wait for coach approval!"
        },
        createNewPlan: "Create a New Fitness Plan",
        mySpecialists: "My Specialists",
        specialists: {
            psychology: {
                title: "Psychological Specialist",
                description: "Access mental health support, motivation, and mindset coaching to overcome challenges.",
            },
            nutrition: {
                title: "Nutrition Specialist",
                description: "Get advanced dietary advice and customized meal planning from a nutrition expert.",
            },
            treatment: {
                title: "Treatment Specialist",
                description: "Consult an expert for health conditions, recovery, and therapeutic guidance.",
            },
        },
        contact: "Contact",
        progressPhotos: "Progress Photos",
        viewGallery: "View Gallery",
        wearable: {
            title: "Wearable Sync",
            sync: "Sync Now",
            syncing: "Syncing...",
            lastSync: "Last sync: Just now",
            data: "Heart Rate: {hr}bpm | Sleep: {sleep}h ({quality})",
            poor: "Poor",
            good: "Good",
            excellent: "Excellent",
            tipTitle: "Today's Tip",
        }
    },
    ar: {
        membership: "عضو ذهبي",
        location: "القاهرة, مصر",
        motivationalQuote: "واصل التقدم يا {name}!",
        editProfile: "تعديل الملف الشخصي",
        changeProfilePicture: "تغيير الصورة الشخصية",
        dashboardTitle: "نظرة عامة على لوحة التحكم",
        calories: "السعرات المحروقة",
        workouts: "التمارين المكتملة",
        weeklyProgress: "التقدم الأسبوعي",
        activeDays: "الأيام النشطة",
        healthTitle: "الصحة والتغذية",
        waterIntake: "استهلاك الماء",
        liters: "لتر",
        macros: "العناصر الغذائية (جم)",
        protein: "بروتين",
        carbs: "كربوهيدرات",
        fat: "دهون",
        historyTitle: "سجل التمارين",
        history: {
            chest: "صدر وترايسبس",
            legs: "يوم الأرجل",
            back: "ظهر وبايسبس"
        },
        achievementsTitle: "الإنجازات والشارات",
        footer: "التقدم لا يتعلق بالكمال، بل بالإصرار. استمر!",
        streak: "مستمر لمدة 7 أيام!",
        badges: {
            bronze: "الإنجاز البرونزي",
            silver: "النجم الفضي",
            gold: "البطل الذهبي"
        },
         achievements: {
            unlock_bronze: "أكمل 1 تمرين",
            unlock_silver: "أكمل 10 تمارين",
            unlock_gold: "أكمل 30 تمرينًا",
            locked: "مغلق",
            unlocked: "تم الفتح!",
            dev_controls: "أدوات المطور",
            dev_description: "محاكاة موافقة المدرب على تمرين لاختبار الإنجازات.",
            approve_workout: "الموافقة على تمرين (+1)",
            reset_progress: "إعادة تعيين التقدم",
            noWorkouts: "لا توجد تمارين معتمدة بعد. أكمل تمريناً وانتظر موافقة مدربك!"
        },
        createNewPlan: "إنشاء خطة لياقة جديدة",
        mySpecialists: "الأخصائيون",
        specialists: {
            psychology: {
                title: "الأخصائي النفسي",
                description: "احصل على الدعم النفسي والتحفيز وتدريب العقلية للتغلب على التحديات.",
            },
            nutrition: {
                title: "أخصائي التغذية",
                description: "احصل على نصائح غذائية متقدمة وتخطيط وجبات مخصص من خبير تغذية.",
            },
            treatment: {
                title: "الأخصائي العلاجي",
                description: "استشر خبيرًا للحالات الصحية والتعافي والإرشاد العلاجي.",
            },
        },
        contact: "تواصل",
        progressPhotos: "صور التقدم",
        viewGallery: "عرض المعرض",
        wearable: {
            title: "مزامنة الجهاز القابل للارتداء",
            sync: "مزامنة الآن",
            syncing: "جاري المزامنة...",
            lastSync: "آخر مزامنة: الآن",
            data: "معدل النبض: {hr}bpm | النوم: {sleep}س ({quality})",
            poor: "ضعيف",
            good: "جيد",
            excellent: "ممتاز",
            tipTitle: "نصيحة اليوم",
        }
    }
};

const specialistInfo: { [key in keyof SpecialistStatus]: { icon: React.FC<any> } } = {
    psychology: { icon: BrainCircuitIcon },
    nutrition: { icon: AppleIcon },
    treatment: { icon: ActivityIcon },
};

const macroData = [
    { name: 'Protein', g: 150 },
    { name: 'Carbs', g: 200 },
    { name: 'Fat', g: 70 },
];

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

interface CompletedWorkout {
  id: number;
  type: string;
  date: Date;
  duration: number;
  calories: number;
}

const Profile: React.FC<{ language: Language }> = ({ language }) => {
    const { user, updateProfilePicture } = useAuth();
    const t = translations[language];
    const isRTL = language === 'ar';
    const navigate = useNavigate();

    const [water, setWater] = useState(1.5);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
    const [globalSpecialistStatus, setGlobalSpecialistStatus] = useState<SpecialistStatus>({ psychology: false, nutrition: false, treatment: false });
    const [isSystemDescVisible, setIsSystemDescVisible] = useState(false);
    const [wearableData, setWearableData] = useState<any>(null);
    const [wearableTip, setWearableTip] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    
    useEffect(() => {
        getSetting('specialists_status').then(status => {
            if (status) {
                setGlobalSpecialistStatus(status);
            }
        });
    }, []);
    
    const verifiedWorkouts = completedWorkouts.length;

    if (!user) return null;
    
    const sampleWorkouts = [
        { type: t.history.chest, duration: 60, calories: 450 },
        { type: t.history.legs, duration: 75, calories: 600 },
        { type: t.history.back, duration: 55, calories: 400 },
    ];
    
    const achievements = [
        { name: t.badges.bronze, threshold: 1, color: '#CD7F32', unlockText: t.achievements.unlock_bronze },
        { name: t.badges.silver, threshold: 10, color: '#C0C0C0', unlockText: t.achievements.unlock_silver },
        { name: t.badges.gold, threshold: 30, color: '#FFD700', unlockText: t.achievements.unlock_gold },
    ];

    const userAssignments = user.assignedSpecialists || { psychology: false, nutrition: false, treatment: false };
    const availableSpecialists = (Object.keys(specialistInfo) as Array<keyof SpecialistStatus>).filter(key => 
        globalSpecialistStatus[key] && userAssignments[key]
    );

    const handleApproveWorkout = () => {
        const randomWorkout = sampleWorkouts[Math.floor(Math.random() * sampleWorkouts.length)];
        const newWorkout: CompletedWorkout = {
            id: Date.now(),
            date: new Date(),
            ...randomWorkout
        };
        setCompletedWorkouts(prev => [newWorkout, ...prev]);
    };

    const handleResetProgress = () => {
        setCompletedWorkouts([]);
    };

    const handlePictureChangeClick = () => {
        fileInputRef.current?.click();
    };

    const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await blobToBase64(file);
                await updateProfilePicture(base64);
            } catch (error) {
                console.error("Failed to upload profile picture:", error);
            }
        }
    };
    
    const handleContactSpecialist = (specialistChannel: SpecialistChannel) => {
        navigate('/conversations', { state: { initialTab: 'specialists', specialistChannel } });
    };

    const handleSyncWearable = async () => {
        setIsSyncing(true);
        setWearableTip('');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const hr = 60 + Math.floor(Math.random() * 20); // 60-80 bpm
        const sleep = 4 + Math.random() * 5; // 4-9 hours
        let quality, qualityKey;
        if (sleep < 6) { qualityKey = 'poor'; quality = t.wearable.poor; }
        else if (sleep < 7.5) { qualityKey = 'good'; quality = t.wearable.good; }
        else { qualityKey = 'excellent'; quality = t.wearable.excellent; }

        const data = { hr, sleep: sleep.toFixed(1), quality, qualityKey };
        setWearableData(data);
        
        const prompt = `Based on this health data (Heart Rate: ${data.hr}bpm, Sleep: ${data.sleep}h which is ${data.qualityKey}), give me one short, actionable fitness or wellness tip for today.`;
        const tip = await getAiCoachingTip(prompt, language);
        setWearableTip(tip);
        setIsSyncing(false);
    };

    return (
        <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header Section */}
            <section className="relative">
                <Card className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 rtl:sm:space-x-reverse bg-gray-900 dark:bg-gradient-to-r dark:from-gray-900 dark:to-primary-900 !p-8">
                    <div className="relative group flex-shrink-0">
                        <img src={user.picture} alt={user.name} className="w-24 h-24 rounded-full border-4 border-primary-500 shadow-lg group-hover:opacity-75 transition-opacity" />
                        <button
                            onClick={handlePictureChangeClick}
                            className="absolute inset-0 w-full h-full bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={t.changeProfilePicture}
                        >
                            <PencilIcon className="w-8 h-8" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePictureUpload}
                            accept="image/png, image/jpeg, image/jpg"
                            hidden
                        />
                    </div>
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                        <p className="text-primary-300 font-semibold">{t.membership} - {t.location}</p>
                        <p className="text-gray-300 mt-2 italic">“{t.motivationalQuote.replace('{name}', user.name.split(' ')[0])}”</p>
                    </div>
                </Card>
            </section>
            
            {/* CTA to create a new plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/plan" className="flex">
                    <Button className="w-full h-full text-lg">
                        <ZapIcon className="w-6 h-6 ltr:mr-3 rtl:ml-3" />
                        {t.createNewPlan}
                    </Button>
                </Link>
                <Link to="/progress-tracker" className="flex">
                    <Button className="w-full h-full text-lg !bg-gray-700 hover:!bg-gray-800">
                         <CameraIcon className="w-6 h-6 ltr:mr-3 rtl:ml-3" />
                         {t.progressPhotos}
                    </Button>
                </Link>
            </div>
            
             {/* My Specialists Section */}
            {availableSpecialists.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-4">{t.mySpecialists}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableSpecialists.map(key => {
                            const spec = t.specialists[key];
                            const Icon = specialistInfo[key].icon;
                            return (
                                <Card key={key} className="flex flex-col">
                                    <div className="flex items-center mb-3">
                                        <div className="p-2 bg-primary-100 dark:bg-gray-800 rounded-full">
                                            <Icon className="w-6 h-6 text-primary"/>
                                        </div>
                                        <h3 className="text-xl font-bold ltr:ml-3 rtl:mr-3">{spec.title}</h3>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm flex-grow">{spec.description}</p>
                                    <Button onClick={() => handleContactSpecialist(key)} className="w-full mt-4 !py-2">
                                        {t.contact}
                                    </Button>
                                </Card>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Dashboard Overview */}
            <section>
                <h2 className="text-2xl font-bold mb-4">{t.dashboardTitle}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="flex flex-col items-center justify-center text-center !bg-gradient-to-br from-orange-400 to-red-500 text-white">
                        <FireIcon className="w-8 h-8 mb-2" />
                        <p className="text-3xl font-bold">12k</p>
                        <h3 className="font-semibold">{t.calories}</h3>
                    </Card>
                    <Card className="flex flex-col items-center justify-center text-center !bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                        <DumbbellIcon className="w-8 h-8 mb-2" />
                        <p className="text-3xl font-bold">{verifiedWorkouts}</p>
                        <h3 className="font-semibold">{t.workouts}</h3>
                    </Card>
                    <Card className="flex flex-col items-center justify-center text-center !bg-gradient-to-br from-green-400 to-teal-500 text-white">
                        <CalendarIcon className="w-8 h-8 mb-2" />
                        <p className="text-3xl font-bold">150</p>
                        <h3 className="font-semibold">{t.activeDays}</h3>
                    </Card>
                     <Card className="flex flex-col items-center justify-center text-center">
                        <CircularProgress progress={75} size={80} strokeWidth={8} />
                        <h3 className="font-semibold mt-2">{t.weeklyProgress}</h3>
                    </Card>
                </div>
            </section>

             {/* Wearable Sync */}
            <section>
                 <Card>
                    <h2 className="text-2xl font-bold mb-4">{t.wearable.title}</h2>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <Button onClick={handleSyncWearable} disabled={isSyncing} className="w-full sm:w-auto">
                            {isSyncing ? <><Spinner/> {t.wearable.syncing}</> : t.wearable.sync}
                        </Button>
                        {wearableData && (
                            <div className="text-center sm:text-left">
                                <p className="font-semibold">{t.wearable.lastSync}</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {t.wearable.data.replace('{hr}', wearableData.hr).replace('{sleep}', wearableData.sleep).replace('{quality}', wearableData.quality)}
                                </p>
                            </div>
                        )}
                    </div>
                    {wearableTip && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-lg text-primary">{t.wearable.tipTitle}</h3>
                            <p className="text-gray-700 dark:text-gray-300">{wearableTip}</p>
                        </div>
                    )}
                </Card>
            </section>

            {/* Health & Nutrition */}
            <section>
                <h2 className="text-2xl font-bold mb-4">{t.healthTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="font-bold text-lg mb-2">{t.waterIntake}</h3>
                        <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
                             <WaterDropIcon className="w-12 h-12 text-primary"/>
                             <p className="text-4xl font-bold">{water.toFixed(1)} <span className="text-xl text-gray-500">{t.liters}</span></p>
                             <div className="flex flex-col space-y-1">
                                <button onClick={() => setWater(w => w + 0.25)} className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary font-bold text-xl">+</button>
                                <button onClick={() => setWater(w => Math.max(0, w - 0.25))} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 font-bold text-xl">-</button>
                             </div>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="font-bold text-lg mb-2">{t.macros}</h3>
                        <div className="w-full h-32">
                             <ResponsiveContainer>
                                <BarChart data={macroData} layout="vertical" margin={{ top: 0, right: 20, left: isRTL ? 40 : 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={isRTL ? 80 : 60} stroke="currentColor" />
                                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.1)'}} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#0052FF', borderRadius: '0.5rem' }}/>
                                    <Bar dataKey="g" fill="#0052FF" radius={[0, 10, 10, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Workout History */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{t.historyTitle}</h2>
                    <div className="bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200 text-sm font-bold px-3 py-1 rounded-full">{t.streak}</div>
                </div>
                <div className="space-y-3">
                    {completedWorkouts.length === 0 ? (
                        <Card className="!py-8 text-center text-gray-500">{t.achievements.noWorkouts}</Card>
                    ) : (
                        completedWorkouts.map((item) => (
                            <Card key={item.id} className="flex items-center justify-between !py-4 !px-6 hover:border-primary/50 border border-transparent">
                                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                    <div className="bg-primary-50 dark:bg-gray-800 p-3 rounded-full"><DumbbellIcon className="w-6 h-6 text-primary"/></div>
                                    <div>
                                        <p className="font-bold text-lg">{item.type}</p>
                                        <div className="flex items-center text-sm text-gray-500 space-x-3 rtl:space-x-reverse mt-1">
                                            <span>{item.duration} min</span>
                                            <span className="flex items-center">
                                                <CalendarIcon className="w-4 h-4 ltr:mr-1 rtl:ml-1"/> 
                                                {item.date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-CA')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 rtl:space-x-reverse text-red-500 font-semibold">
                                    <FireIcon className="w-5 h-5"/>
                                    <span>{item.calories} kcal</span>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </section>
            
            {/* Achievements */}
            <section>
                <h2 className="text-2xl font-bold mb-4">{t.achievementsTitle}</h2>
                <div className="grid grid-cols-3 gap-4">
                     {achievements.map((ach) => {
                        const isUnlocked = verifiedWorkouts >= ach.threshold;
                        return (
                            <div 
                                key={ach.name}
                                className={`transition-all duration-500 ${isUnlocked ? 'shadow-[0_0_20px_var(--glow-color)] rounded-2xl' : ''}`}
                                style={isUnlocked ? { '--glow-color': `${ach.color}80` } as React.CSSProperties : {}}
                            >
                                <Card className={`flex flex-col items-center justify-center text-center transition-all duration-500 h-full ${!isUnlocked ? 'grayscale opacity-60' : 'border border-primary/50'}`}>
                                    <MedalIcon color={isUnlocked ? ach.color : '#9CA3AF'} className="w-16 h-16"/>
                                    <p className="font-semibold mt-2 flex-grow">{ach.name}</p>
                                    <div className="mt-1 h-12 flex flex-col justify-center">
                                        {isUnlocked ? (
                                            <p className="text-sm font-bold text-green-500 dark:text-green-400">{t.achievements.unlocked}</p>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{ach.unlockText}</p>
                                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1">
                                                    ({verifiedWorkouts}/{ach.threshold})
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </section>
            
            {/* Progress System Description */}
            <section>
                <Card>
                    <button onClick={() => setIsSystemDescVisible(!isSystemDescVisible)} className="w-full flex justify-between items-center text-left p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white">Description of the User Profile Progress and Achievement System</h3>
                         <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform flex-shrink-0 ${isSystemDescVisible ? 'rotate-180' : ''}`} />
                    </button>
                    {isSystemDescVisible && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4 text-gray-700 dark:text-gray-300 animate-fade-in">
                            <p className="text-center italic font-semibold text-lg my-4 text-primary dark:text-primary-400">
                                “You do the work — your coach confirms your achievement.”
                            </p>
                            
                            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-lg font-bold flex items-center">🎯<span className="ltr:ml-2 rtl:mr-2">1. Overview</span></h4>
                                <p>When a user creates an account, all progress indicators (workouts, hydration, calories, and overall achievements) start at zero.</p>
                                <p>The system encourages users to perform fitness activities — such as completing workouts, drinking enough water, or maintaining a calorie balance — and then mark them as completed by pressing a “Done” (✅) button.</p>
                                <p>However, these actions are pending approval from the owner/coach, who validates and confirms the progress.</p>
                            </div>
                            
                            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-lg font-bold flex items-center">🧩<span className="ltr:ml-2 rtl:mr-2">2. Page Layout and Structure</span></h4>
                                <h5 className="font-semibold pt-2 flex items-center">📊<span className="ltr:ml-2 rtl:mr-2">a. Progress Summary Section</span></h5>
                                <p>Displays all user metrics with progress bars or circular indicators, initially set to 0%.</p>
                                <p>Categories include:</p>
                                <ul className="list-disc list-inside space-y-1 ltr:pl-4 rtl:pr-4">
                                    <li>Workouts Completed</li>
                                    <li>Water Intake</li>
                                    <li>Calories Burned</li>
                                    <li>Weekly Goals</li>
                                </ul>
                                <p>When the user clicks “Done”, the corresponding metric changes to a “Pending Approval” status (e.g., gray progress ring with a clock icon ⏳).</p>

                                <h5 className="font-semibold pt-2 flex items-center">💪<span className="ltr:ml-2 rtl:mr-2">b. Action Buttons</span></h5>
                                <p>Below each daily task (e.g., workout, hydration, nutrition), there is a button labeled “Mark as Done”.</p>
                                <p>Once clicked:</p>
                                <ul className="list-disc list-inside space-y-1 ltr:pl-4 rtl:pr-4">
                                    <li>The button changes to “Waiting for Coach Approval.”</li>
                                    <li>The request is logged in the database and sent to the owner’s dashboard for review.</li>
                                </ul>
                                <p>Example:</p>
                                <p className="p-2 bg-gray-100 dark:bg-gray-800 rounded">“Workout #3 – 45 min cardio ✅ Status: Pending coach review.”</p>
                                
                                <h5 className="font-semibold pt-2 flex items-center">🧑‍🏫<span className="ltr:ml-2 rtl:mr-2">c. Owner/Coach Review System</span></h5>
                                <p>In the admin panel, the owner can see all pending submissions from users.</p>
                                <p>For each task, the owner can:</p>
                                <ul className="list-disc list-inside space-y-1 ltr:pl-4 rtl:pr-4">
                                    <li>Approve (✔️) → updates the user’s progress in real time.</li>
                                    <li>Reject (❌) → keeps the progress unchanged with optional feedback (e.g., “Workout not verified”).</li>
                                </ul>
                                <p>Once approved, the user’s dashboard automatically updates with a success animation or notification:</p>
                                <p className="p-2 bg-green-100 dark:bg-green-900/50 rounded text-green-800 dark:text-green-200">“🎉 Congratulations! Your workout has been approved by your coach.”</p>
                            </div>

                             <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-lg font-bold flex items-center">💡<span className="ltr:ml-2 rtl:mr-2">3. Data Tracking and Visualization</span></h4>
                                <p>All progress indicators dynamically update only after approval — ensuring realistic growth and integrity.</p>
                                <p>A user’s total progress percentage is calculated from verified actions only.</p>
                                <p>Graphs and charts (like weekly or monthly stats) visually show improvement based on approved data.</p>
                                <p>The system builds trust — users see real results, and coaches maintain full control of validation.</p>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-lg font-bold flex items-center">🏆<span className="ltr:ml-2 rtl:mr-2">4. Achievement Section</span></h4>
                                <p>Initially, all badges and achievements are locked (grayed out).</p>
                                <p>When a user completes enough verified tasks, the achievements unlock one by one:</p>
                                <ul className="list-disc list-inside space-y-1 ltr:pl-4 rtl:pr-4">
                                    <li>🥉 Bronze: First verified workout</li>
                                    <li>🥈 Silver: 10 approved activities</li>
                                    <li>🥇 Gold: 30 approved milestones</li>
                                </ul>
                                <p>This gamified reward system boosts motivation while maintaining credibility.</p>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-lg font-bold flex items-center">🔒<span className="ltr:ml-2 rtl:mr-2">5. Security & Control</span></h4>
                                <p>Every “Done” action is recorded in the database with a timestamp and user ID.</p>
                                <p>Only the owner’s approval can modify the “verified” status.</p>
                                <p>Prevents false progress or self-assigned achievements.</p>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-lg font-bold flex items-center">🧠<span className="ltr:ml-2 rtl:mr-2">6. Motivation and User Experience</span></h4>
                                <p>Users feel a sense of discipline and accomplishment knowing their coach validates every effort.</p>
                                <p>The “0 to 100” visual growth journey gives a real sense of progress over time.</p>
                                <p>The page combines motivation with accountability — making every click meaningful.</p>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-lg font-bold flex items-center">✨<span className="ltr:ml-2 rtl:mr-2">7. Example Message Display</span></h4>
                                <p>When the user starts:</p>
                                <p className="p-2 bg-gray-100 dark:bg-gray-800 rounded italic">“You have 0 completed workouts, 0 liters of water logged, and 0 calories tracked. Start today and mark your progress — your coach will review and approve your achievements.”</p>
                                <p className="mt-2">After approval:</p>
                                <p className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded italic text-blue-800 dark:text-blue-200">“Great job! Your coach confirmed your progress. You’ve moved up to Level 1 – Keep going!”</p>
                            </div>
                        </div>
                    )}
                </Card>
                 <style>{`
                    @keyframes fade-in {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    .animate-fade-in {
                        animation: fade-in 0.5s ease-out forwards;
                    }
                `}</style>
            </section>

             {/* Dev Controls */}
            <section>
                <Card>
                    <h3 className="text-lg font-bold text-center">{t.achievements.dev_controls}</h3>
                    <p className="text-sm text-center text-gray-500 mb-4">{t.achievements.dev_description}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button onClick={handleApproveWorkout}>
                            {t.achievements.approve_workout}
                        </Button>
                        <Button onClick={handleResetProgress} className="!bg-red-600 hover:!bg-red-700">
                            {t.achievements.reset_progress}
                        </Button>
                    </div>
                </Card>
            </section>

             {/* Footer */}
            <footer className="text-center pt-8">
                <p className="text-lg text-gray-500 dark:text-gray-400">{t.footer}</p>
            </footer>
        </div>
    );
};

export default Profile;