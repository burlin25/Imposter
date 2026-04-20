
import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Camera } from '../components/Camera';
import { generateGameTopic } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Camera as CameraIcon, Image as ImageIcon, Sparkles, UserX, Target, Layers, Play, Loader2 } from 'lucide-react';

const CATEGORIES = [
    "Food/Drink", "Animal", "Place", "Pop Culture", "Person", "Character", 
    "Object", "Activity", "Sport", "History", "Brand", "Meme", "Other"
];

export const TopicSelectionScreen: React.FC = () => {
  const { state, setTopic, amIGameHost } = useGame();
  const host = state.players.find(p => p.id === state.currentHostId) || state.players[0];
  
  const [inputTopic, setInputTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [topicImage, setTopicImage] = useState<string | undefined>(undefined);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedImposters, setSelectedImposters] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!amIGameHost) {
      return (
          <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center">
               <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 3 }}
               >
                <Avatar seed={host?.avatarSeed || '0'} url={host?.avatarUrl} size="xl" className="mb-8 shadow-2xl border-4 border-white/10" />
               </motion.div>
               <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Waiting for {host?.name || 'Host'}...</h2>
               <p className="text-slate-400 text-sm font-medium">They are crafting the secret mission.</p>
               <div className="mt-10">
                   <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(99,102,241,0.3)]"></div>
               </div>
          </div>
      );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTopic.trim()) {
      setTopic(inputTopic.trim(), selectedCategory, topicImage, selectedImposters.length > 0 ? selectedImposters : undefined);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTopicImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAiSuggest = async () => {
    setIsLoadingAI(true);
    try {
        const suggestion = await generateGameTopic();
        setInputTopic(suggestion);
    } catch (err) {
        console.error("AI Suggestion failed", err);
    } finally {
        setIsLoadingAI(false);
    }
  };

  const toggleImposter = (id: string) => {
      if (selectedImposters.includes(id)) {
          setSelectedImposters(prev => prev.filter(x => x !== id));
      } else {
          if (selectedImposters.length < state.config.imposterCount) {
             setSelectedImposters(prev => [...prev, id]);
          }
      }
  };

  const potentialImposters = state.players.filter(p => !p.isHost);

  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6">
       <AnimatePresence>
        {showCamera && (
                <Camera 
                    onCapture={(img) => { setTopicImage(img); setShowCamera(false); }}
                    onCancel={() => setShowCamera(false)}
                />
        )}
       </AnimatePresence>

       <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
       >
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Mission Briefing</h2>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">You are the Commander</p>
       </motion.div>

       <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 max-h-[85vh] overflow-y-auto shadow-2xl relative custom-scrollbar"
       >
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Topic Image Upload */}
                <div className="space-y-3">
                    <div 
                        className="w-full h-44 rounded-3xl bg-black/40 border-2 border-dashed border-white/5 flex items-center justify-center overflow-hidden relative shadow-inner group"
                    >
                        {topicImage ? (
                            <img src={topicImage} alt="Topic" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center opacity-20 group-hover:opacity-40 transition-opacity">
                                <ImageIcon size={48} className="mx-auto" />
                                <p className="text-[10px] font-black uppercase tracking-widest mt-2">Visual Clue (Optional)</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2 w-full">
                         <Button 
                            type="button" 
                            variant="secondary" 
                            className="flex-1 !py-3 !text-[10px] font-black uppercase tracking-widest"
                            onClick={() => fileInputRef.current?.click()}
                         >
                            <div className="flex items-center justify-center gap-2">
                                <ImageIcon size={14} />
                                Gallery
                            </div>
                         </Button>
                         <Button 
                            type="button" 
                            variant="secondary" 
                            className="flex-1 !py-3 !text-[10px] font-black uppercase tracking-widest"
                            onClick={() => setShowCamera(true)}
                         >
                            <div className="flex items-center justify-center gap-2">
                                <CameraIcon size={14} />
                                Camera
                            </div>
                         </Button>
                    </div>

                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>

                <div className="h-px bg-white/5" />

                {/* Secret Topic Input */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-green-400 uppercase tracking-[0.2em] px-1">
                        <Target size={14} />
                        1. The Secret Topic
                    </label>
                    <div className="relative">
                        <input 
                            type="text"
                            value={inputTopic}
                            onChange={(e) => setInputTopic(e.target.value)}
                            placeholder="What is the hidden item?"
                            className="w-full bg-black/40 border border-white/10 focus:border-green-500/50 p-4 rounded-2xl text-lg text-white outline-none transition-all placeholder:text-slate-700 font-bold"
                        />
                        <motion.button 
                            type="button" 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleAiSuggest} 
                            disabled={isLoadingAI} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
                            title="AI Suggestion"
                        >
                            {isLoadingAI ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        </motion.button>
                    </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] px-1">
                        <Layers size={14} />
                        2. Global Category
                    </label>
                    <div className="relative">
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/50 p-4 rounded-2xl text-lg text-white font-bold outline-none appearance-none"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                            <Layers size={18} />
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium px-1 leading-relaxed">The Imposter ONLY sees this category hint. Make it broad!</p>
                </div>

                <div className="h-px bg-white/5" />

                {/* Imposter Selection */}
                <div className="space-y-4">
                     <label className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-[0.2em] px-1">
                         <UserX size={14} />
                         3. The Traitor
                     </label>
                     <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                         {potentialImposters.map(p => {
                             const isSelected = selectedImposters.includes(p.id);
                             return (
                                 <motion.button 
                                    key={p.id}
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => toggleImposter(p.id)}
                                    className={`flex flex-col items-center shrink-0 p-3 rounded-2xl border transition-all ${isSelected ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-white/5 bg-white/5 opacity-40'}`}
                                 >
                                     <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="sm" />
                                     <span className="text-[9px] mt-2 font-black uppercase truncate w-16 text-center">{p.name}</span>
                                 </motion.button>
                             )
                         })}
                     </div>
                     <p className="text-[9px] text-slate-500 font-black text-center uppercase tracking-[0.2em]">
                         {selectedImposters.length === 0 ? "RANDOM Traitor Assigned" : `${selectedImposters.length} Custom Selection`}
                     </p>
                </div>

                <Button 
                    type="submit" 
                    fullWidth 
                    disabled={!inputTopic.trim()} 
                    className="!py-5 shadow-green-500/20 shadow-xl"
                >
                    <div className="flex items-center justify-center gap-2">
                        <Play size={20} fill="currentColor" />
                        LAUNCH MISSION
                    </div>
                </Button>
            </form>
       </motion.div>
    </div>
  );
};
