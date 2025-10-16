import React, { useState, useEffect, useRef } from 'react';
import type { Language } from '../App';
import type { ProgressPhoto } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { addProgressPhoto, getProgressPhotosForUser, deleteProgressPhoto } from '../services/dbService';
import { analyzeProgressPhotos } from '../services/geminiService';
import LockedContent from './common/LockedContent';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import Modal from './common/Modal';
import { CameraIcon, UploadIcon, TrashIcon, XIcon } from './icons';

const translations = {
    en: {
        title: "Progress Tracker",
        subtitle: "Visually track your transformation. Upload photos and see your progress over time.",
        uploadTitle: "Upload New Photo",
        notesPlaceholder: "Add notes, e.g., 'Morning weight: 85kg'",
        upload: "Upload",
        uploading: "Uploading...",
        myPhotos: "My Progress Photos",
        noPhotos: "You haven't uploaded any photos yet. Start tracking today!",
        deleteConfirm: "Are you sure you want to delete this photo?",
        compareTitle: "Compare Photos",
        selectTwo: "Select two photos to compare.",
        compare: "Compare with AI",
        analyzing: "Analyzing progress...",
        analysisResult: "AI Progress Analysis",
    },
    ar: {
        title: "متتبع التقدم",
        subtitle: "تتبع تحولك بصريًا. ارفع الصور وشاهد تقدمك بمرور الوقت.",
        uploadTitle: "رفع صورة جديدة",
        notesPlaceholder: "أضف ملاحظات، مثال: 'الوزن صباحًا: 85 كجم'",
        upload: "رفع",
        uploading: "جاري الرفع...",
        myPhotos: "صور تقدمي",
        noPhotos: "لم تقم برفع أي صور بعد. ابدأ التتبع اليوم!",
        deleteConfirm: "هل أنت متأكد أنك تريد حذف هذه الصورة؟",
        compareTitle: "مقارنة الصور",
        selectTwo: "اختر صورتين للمقارنة.",
        compare: "مقارنة بالذكاء الاصطناعي",
        analyzing: "جاري تحليل التقدم...",
        analysisResult: "تحليل التقدم بالذكاء الاصطناعي",
    }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const ProgressTracker: React.FC<{ language: Language }> = ({ language }) => {
    const t = translations[language];
    const { user, subscriptionStatus } = useAuth();
    
    const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
    const [newPhoto, setNewPhoto] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const [selectedPhotos, setSelectedPhotos] = useState<ProgressPhoto[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchPhotos = async () => {
        if (!user) return;
        setLoading(true);
        const userPhotos = await getProgressPhotosForUser(user.id!);
        setPhotos(userPhotos);
        setLoading(false);
    };

    useEffect(() => {
        fetchPhotos();
    }, [user]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await blobToBase64(file);
            setNewPhoto(base64);
        }
    };

    const handleUpload = async () => {
        if (!newPhoto || !user) return;
        setIsUploading(true);
        await addProgressPhoto({
            userId: user.id!,
            photoDataUrl: newPhoto,
            date: new Date(),
            notes: notes,
        });
        setNewPhoto(null);
        setNotes('');
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsUploading(false);
        await fetchPhotos();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t.deleteConfirm)) {
            await deleteProgressPhoto(id);
            await fetchPhotos();
        }
    };

    const handlePhotoSelect = (photo: ProgressPhoto) => {
        setSelectedPhotos(prev => {
            if (prev.find(p => p.id === photo.id)) {
                return prev.filter(p => p.id !== photo.id);
            }
            if (prev.length < 2) {
                return [...prev, photo];
            }
            return [prev[1], photo]; // Keep the last one and add the new one
        });
    };
    
    const handleCompare = async () => {
        if (selectedPhotos.length !== 2) return;
        setIsAnalyzing(true);
        setIsModalOpen(true);
        const [photo1, photo2] = selectedPhotos.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        try {
            const result = await analyzeProgressPhotos(photo1.photoDataUrl, photo2.photoDataUrl, language);
            setAnalysisResult(result);
        } catch (error) {
            console.error(error);
            setAnalysisResult("An error occurred during analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (subscriptionStatus === 'expired') {
        return <LockedContent language={language} />;
    }

    return (
        <div className="space-y-8">
            <header className="text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">{t.title}</h1>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">{t.subtitle}</p>
            </header>

            <Card>
                <h2 className="text-2xl font-bold mb-4">{t.uploadTitle}</h2>
                <div className="space-y-4">
                    <div className="flex justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        {newPhoto ? (
                             <div className="relative">
                                <img src={newPhoto} alt="Preview" className="max-h-60 rounded-lg" />
                                <button onClick={() => { setNewPhoto(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white">
                                    <XIcon className="w-5 h-5"/>
                                </button>
                             </div>
                        ) : (
                            <div className="text-center">
                                <CameraIcon className="w-12 h-12 mx-auto text-gray-400"/>
                                <Button onClick={() => fileInputRef.current?.click()} className="mt-4">
                                    <UploadIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2"/> Choose Photo
                                </Button>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} hidden />
                            </div>
                        )}
                    </div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.notesPlaceholder} rows={2} className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800 dark:border-gray-700"></textarea>
                    <Button onClick={handleUpload} disabled={!newPhoto || isUploading} className="w-full">
                        {isUploading ? <><Spinner/> {t.uploading}</> : t.upload}
                    </Button>
                </div>
            </Card>

            <Card>
                <h2 className="text-2xl font-bold mb-4">{t.myPhotos}</h2>
                {loading ? <Spinner/> : photos.length === 0 ? (
                    <p className="text-center text-gray-500">{t.noPhotos}</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {photos.map(photo => (
                            <div key={photo.id} onClick={() => handlePhotoSelect(photo)}
                                className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${selectedPhotos.find(p => p.id === photo.id) ? 'ring-4 ring-primary' : 'ring-2 ring-transparent'}`}>
                                <img src={photo.photoDataUrl} alt={`Progress on ${new Date(photo.date).toLocaleDateString()}`} className="w-full h-full object-cover aspect-square" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-white">
                                    <p className="text-xs font-bold">{new Date(photo.date).toLocaleDateString()}</p>
                                    <p className="text-xs truncate">{photo.notes}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(photo.id!); }} className="absolute top-1 right-1 p-1 bg-red-600/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TrashIcon className="w-4 h-4 text-white"/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {photos.length >= 2 && (
                    <div className="mt-6 text-center">
                        <Button onClick={handleCompare} disabled={selectedPhotos.length !== 2}>
                            {selectedPhotos.length !== 2 ? t.selectTwo : t.compare}
                        </Button>
                    </div>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t.analysisResult}>
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center h-48">
                        <Spinner/>
                        <p className="mt-4">{t.analyzing}</p>
                    </div>
                ) : (
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{analysisResult}</div>
                )}
            </Modal>
        </div>
    );
};

export default ProgressTracker;
