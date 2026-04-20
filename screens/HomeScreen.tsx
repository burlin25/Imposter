
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Camera } from '../components/Camera';
import { audioService } from '../services/audioService';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Camera as CameraIcon, Upload, ArrowLeft, Play, Users, Shield, Search, Vote, Trophy, X, RefreshCw } from 'lucide-react';

const TutorialOverlay = ({ onClose }: { onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex flex-col p-8 overflow-y-auto"
  >
    <div className="max-w-md mx-auto space-y-8 py-10">
      <div className="text-center relative">
        <button 
            onClick={onClose}
            className="absolute -top-4 -right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
        >
            <X size={24} className="text-white" />
        </button>
        <h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">How to Play</h2>
        <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
      </div>

      <div className="space-y-6">
        {[
            { icon: <Users className="text-indigo-400" />, title: "The Setup", desc: "One player is the Host. Everyone else is either an Innocent or the Imposter." },
            { icon: <Shield className="text-green-400" />, title: "Role Reveal", desc: "Innocents see the secret topic. The Imposter only sees the category!" },
            { icon: <Search className="text-yellow-400" />, title: "Clues", desc: "Everyone gives 2 clues. Innocents prove they know the topic subtly. Imposters fake it!" },
            { icon: <Vote className="text-red-400" />, title: "Voting", desc: "The group votes on the Imposter. If the Imposter isn't caught, they win big points!" },
            { icon: <Trophy className="text-purple-400" />, title: "Judgement", desc: "The Imposter gets one last chance to guess the topic for bonus points." }
        ].map((step, i) => (
            <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 items-start"
            >
                <div className="w-10 h-10 shrink-0 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                    {step.icon}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-white">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
            </motion.div>
        ))}
      </div>

      <Button fullWidth onClick={onClose} className="mt-8 shadow-indigo-500/20 shadow-xl">GOT IT!</Button>
    </div>
  </motion.div>
);

const GameLogo = () => (
  <motion.div 
    className="relative w-32 h-32 mx-auto mb-6 group"
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  >
    <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-2xl group-hover:bg-indigo-500/50 transition-all duration-500"></div>
    <svg viewBox="0 0 100 100" className="relative w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="irisGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <motion.path 
        d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        className="text-indigo-500/50"
        animate={{ strokeDashoffset: [0, 200], strokeDasharray: [100, 100] }}
        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
      />
      <g className="origin-center">
        <path d="M15 50 C15 50 30 30 50 30 C70 30 85 50 85 50 C85 50 70 70 50 70 C30 70 15 50 15 50 Z" fill="#1e293b" stroke="currentColor" strokeWidth="4" className="text-white" />
        <motion.circle 
            cx="50" cy="50" r="12" 
            fill="url(#irisGradient)" 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
        />
        <circle cx="50" cy="50" r="5" fill="#0f172a" />
        <circle cx="47" cy="47" r="2" fill="white" fillOpacity="0.8" />
      </g>
    </svg>
  </motion.div>
);

export const HomeScreen: React.FC = () => {
  const { createGame, joinGame, reconnectGame } = useGame();
  const [view, setView] = useState<'MAIN' | 'JOIN' | 'CREATE'>('MAIN');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeSession, setActiveSession] = useState<{ code: string, id: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
        setJoinCode(urlCode.toUpperCase());
        setView('JOIN');
    }
    const storedCode = sessionStorage.getItem('imposter_gameCode');
    const storedId = sessionStorage.getItem('imposter_playerId');
    if (storedCode && storedId) setActiveSession({ code: storedCode, id: storedId });
  }, []);

  const handleAction = async (callback: () => void) => {
    await audioService.unlock();
    audioService.playSfx('click');
    callback();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode || !playerName || !avatarUrl) return;
    setIsConnecting(true);
    setErrorMsg('');
    try {
        await joinGame(joinCode, playerName, avatarUrl);
    } catch (err: any) {
        setIsConnecting(false);
        setErrorMsg(err.message || "Failed to join game.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !avatarUrl) return;
    setIsConnecting(true);
    setErrorMsg('');
    try {
        await createGame(playerName, avatarUrl);
    } catch (err: any) {
        setIsConnecting(false);
        setErrorMsg(err.message || "Failed to create game.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center relative overflow-hidden bg-game-bg">
      <AnimatePresence>
        {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>
      
      <AnimatePresence>
        {isConnecting && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
            >
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Establishing Signal</h2>
                <p className="text-slate-400 text-sm mt-2 max-w-xs">Syncing with the room. This may take a moment...</p>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500 rounded-full blur-3xl animate-blob"></div>
         <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="z-10 w-full max-w-md space-y-8">
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
        >
          <GameLogo />
          <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 mb-1 drop-shadow-lg">IMPOSTER</h1>
          <p className="text-indigo-200/60 text-sm uppercase tracking-[0.5em] font-medium">Digital Deduction</p>
        </motion.div>

        <AnimatePresence>
            {errorMsg && (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 text-sm font-bold"
                >
                    ⚠️ {errorMsg}
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
            {view === 'MAIN' ? (
            <motion.div 
                key="main"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-4"
            >
                {activeSession && (
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between shadow-lg"
                    >
                        <div className="text-left">
                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Active Session</p>
                            <p className="text-white font-mono text-lg font-black">{activeSession.code}</p>
                        </div>
                        <Button onClick={() => handleAction(() => reconnectGame(activeSession.code, activeSession.id))} className="!py-2 !px-6 text-xs shadow-indigo-500/20 shadow-lg">
                            <div className="flex items-center gap-2">
                                <RefreshCw size={14} />
                                REJOIN
                            </div>
                        </Button>
                    </motion.div>
                )}
                <Button onClick={() => handleAction(() => setView('CREATE'))}>
                    <div className="flex items-center justify-center gap-2">
                        <Play size={20} fill="currentColor" />
                        CREATE GAME
                    </div>
                </Button>
                <Button variant="secondary" onClick={() => handleAction(() => setView('JOIN'))}>
                    <div className="flex items-center justify-center gap-2">
                        <Users size={20} />
                        JOIN GAME
                    </div>
                </Button>
                <button 
                    onClick={() => setShowTutorial(true)} 
                    className="flex items-center justify-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors mt-2"
                >
                    <HelpCircle size={14} />
                    How to Play?
                </button>
            </motion.div>
            ) : (
            <motion.form 
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={view === 'JOIN' ? handleJoin : handleCreate} 
                className="flex flex-col gap-4 bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10"
            >
                <h2 className="text-xl font-bold mb-2 text-white uppercase tracking-tighter">{view === 'JOIN' ? 'Join Lobby' : 'Create Game'}</h2>
                
                <div className="flex flex-col items-center gap-4 mb-4">
                    <AnimatePresence>
                        {showCamera && (
                            <Camera onCapture={(img) => { setAvatarUrl(img); setShowCamera(false); }} onCancel={() => setShowCamera(false)} />
                        )}
                    </AnimatePresence>
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center overflow-hidden relative transition-all ${!avatarUrl ? 'border-2 border-indigo-500/50 border-dashed' : 'shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-105'}`}>
                        {avatarUrl ? <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" /> : <Users size={48} className="text-slate-600" />}
                    </div>
                    <div className="flex gap-2 w-full">
                        <Button type="button" variant="secondary" className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest" onClick={() => handleAction(() => fileInputRef.current?.click())}>
                            <div className="flex items-center justify-center gap-2">
                                <Upload size={14} />
                                Upload
                            </div>
                        </Button>
                        <Button type="button" variant="secondary" className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest" onClick={() => handleAction(() => setShowCamera(true))}>
                            <div className="flex items-center justify-center gap-2">
                                <CameraIcon size={14} />
                                Selfie
                            </div>
                        </Button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>

                {view === 'JOIN' && (
                    <input 
                        type="text" 
                        placeholder="GAME CODE" 
                        maxLength={5} 
                        className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-center text-xl font-mono uppercase text-white outline-none focus:border-indigo-500 transition-colors" 
                        value={joinCode} 
                        onChange={e => setJoinCode(e.target.value.toUpperCase())} 
                    />
                )}
                <input 
                    type="text" 
                    placeholder="YOUR NAME" 
                    className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-center text-xl text-white outline-none focus:border-indigo-500 transition-colors" 
                    value={playerName} 
                    onChange={e => setPlayerName(e.target.value)} 
                />
                
                <div className="flex gap-3 mt-4">
                    <Button type="button" variant="secondary" onClick={() => setView('MAIN')} className="flex-1">
                        <div className="flex items-center justify-center gap-2">
                            <ArrowLeft size={18} />
                            Back
                        </div>
                    </Button>
                    <Button type="submit" className="flex-1 shadow-indigo-500/20 shadow-lg" disabled={!playerName || !avatarUrl || (view === 'JOIN' && !joinCode)}>
                        Enter
                    </Button>
                </div>
            </motion.form>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};
