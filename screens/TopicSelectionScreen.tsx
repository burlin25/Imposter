
import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Camera } from '../components/Camera';
import { generateGameTopic } from '../services/geminiService';

const CATEGORIES = [
    "Food/Drink",
    "Animal",
    "Place",
    "Pop Culture",
    "Person",
    "Character",
    "Object",
    "Activity",
    "Sport",
    "History",
    "Brand",
    "Meme",
    "Other"
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
               <Avatar seed={host?.avatarSeed || '0'} url={host?.avatarUrl} size="xl" className="mb-8 animate-pulse" />
               <h2 className="text-2xl font-bold text-white mb-2">Waiting for {host?.name || 'Host'}...</h2>
               <p className="text-slate-400">They are choosing the secret topic.</p>
               <div className="mt-8">
                   <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
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
      reader.onloadend = () => {
        setTopicImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiSuggest = async () => {
    setIsLoadingAI(true);
    const suggestion = await generateGameTopic();
    setInputTopic(suggestion);
    setIsLoadingAI(false);
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
       {showCamera && (
            <Camera 
                onCapture={(img) => { setTopicImage(img); setShowCamera(false); }}
                onCancel={() => setShowCamera(false)}
            />
       )}

       <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Round Setup</h2>
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">You are the Moderator</p>
       </div>

       <div className="w-full max-w-md bg-game-surface p-6 rounded-3xl border border-white/10 max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Topic Image Upload */}
                <div className="flex flex-col items-center gap-3">
                    <div 
                        className="w-full h-40 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden relative shadow-inner"
                    >
                        {topicImage ? (
                            <img src={topicImage} alt="Topic" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center opacity-40">
                                <span className="text-4xl">📸</span>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-2">Visual Clue (Optional)</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2 w-full">
                         <Button 
                            type="button" 
                            variant="secondary" 
                            className="flex-1 !py-3 !text-[10px] uppercase tracking-widest"
                            onClick={() => fileInputRef.current?.click()}
                         >
                             Gallery
                         </Button>
                         <Button 
                            type="button" 
                            variant="secondary" 
                            className="flex-1 !py-3 !text-[10px] uppercase tracking-widest"
                            onClick={() => setShowCamera(true)}
                         >
                             Camera
                         </Button>
                    </div>

                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>

                <div className="h-px bg-white/5" />

                {/* Secret Topic Input */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-game-success uppercase tracking-[0.2em] px-1">
                        <span className="w-2 h-2 rounded-full bg-game-success"></span>
                        1. The Secret Topic
                    </label>
                    <div className="relative">
                        <input 
                            type="text"
                            value={inputTopic}
                            onChange={(e) => setInputTopic(e.target.value)}
                            placeholder="What is the hidden item?"
                            className="w-full bg-black/40 border border-white/10 focus:border-game-success p-4 rounded-xl text-lg text-white outline-none transition-all placeholder:text-slate-600 font-bold"
                        />
                        <button 
                            type="button" 
                            onClick={handleAiSuggest} 
                            disabled={isLoadingAI} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-lg hover:scale-110 active:scale-95 transition-transform"
                            title="AI Suggestion"
                        >
                            {isLoadingAI ? "⏳" : "🪄"}
                        </button>
                    </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-game-primary uppercase tracking-[0.2em] px-1">
                        <span className="w-2 h-2 rounded-full bg-game-primary"></span>
                        2. Global Category
                    </label>
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-game-primary p-4 rounded-xl text-lg text-white font-bold outline-none appearance-none"
                    >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <p className="text-[10px] text-slate-500 italic px-1">The Imposter ONLY sees this category hint.</p>
                </div>

                <div className="h-px bg-white/5" />

                {/* Imposter Selection */}
                <div className="space-y-3">
                     <label className="text-[10px] font-black text-game-danger uppercase tracking-[0.2em] px-1">
                         3. The Traitor
                     </label>
                     <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                         {potentialImposters.map(p => {
                             const isSelected = selectedImposters.includes(p.id);
                             return (
                                 <button 
                                    key={p.id}
                                    type="button"
                                    onClick={() => toggleImposter(p.id)}
                                    className={`flex flex-col items-center shrink-0 p-3 rounded-2xl border transition-all ${isSelected ? 'border-game-danger bg-game-danger/20 scale-105 shadow-lg shadow-red-500/20' : 'border-white/5 bg-black/20 opacity-60'}`}
                                 >
                                     <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="sm" />
                                     <span className="text-[9px] mt-2 font-black uppercase truncate w-14 text-center">{p.name}</span>
                                 </button>
                             )
                         })}
                     </div>
                     <p className="text-[9px] text-slate-500 font-bold text-center uppercase tracking-widest">
                         {selectedImposters.length === 0 ? "RANDOM Traitor Assigned" : `${selectedImposters.length} Custom Selection`}
                     </p>
                </div>

                <Button type="submit" fullWidth disabled={!inputTopic.trim()} variant="success" className="ring-2 ring-game-success ring-offset-4 ring-offset-game-surface">
                    LAUNCH ROUND
                </Button>
            </form>
       </div>
    </div>
  );
};
