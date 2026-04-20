
import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { audioService } from '../services/audioService';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, ShieldAlert, ChevronRight, Loader2, Fingerprint, Skull } from 'lucide-react';

export const RevealScreen: React.FC = () => {
  const { state, startImposterGuess, amIGameHost } = useGame();
  const { players } = state;
  const [stage, setStage] = useState(0); 

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStage(1);
    }, 3000); 
    const t2 = setTimeout(() => {
      setStage(2);
      audioService.playSfx('reveal');
    }, 6000); 
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-1000 flex flex-col items-center justify-center p-6 text-center ${stage >= 2 ? 'bg-black' : 'bg-game-bg'}`}>
      
      <AnimatePresence mode="wait">
        {stage === 0 && (
          <motion.div 
            key="stage0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full space-y-12"
          >
             <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px]">
                    <Search size={14} />
                    Scanning Frequencies
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Tallying Votes</h2>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
                {players.filter(p => !p.isHost).map((p, i) => (
                    <motion.div 
                        key={p.id} 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative flex flex-col items-center"
                    >
                        <div className="relative">
                            <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="lg" />
                            <AnimatePresence>
                                {p.voteCount > 0 && (
                                    <motion.div 
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="absolute -top-3 -right-3 bg-white text-black font-black w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] z-10 border-2 border-slate-900"
                                    >
                                        {p.voteCount}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <span className="mt-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.name}</span>
                    </motion.div>
                ))}
             </div>
          </motion.div>
        )}

        {stage === 1 && (
          <motion.div 
            key="stage1"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="space-y-8"
          >
              <motion.div 
                animate={{ x: [-2, 2, -2], y: [1, -1, 1] }}
                transition={{ repeat: Infinity, duration: 0.1 }}
              >
                <h1 className="text-5xl font-black text-white tracking-[0.1em] mb-4 uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    THE IMPOSTER WAS...
                </h1>
              </motion.div>
              <div className="flex justify-center">
                <Loader2 size={48} className="text-white animate-spin opacity-20" />
              </div>
          </motion.div>
        )}

        {stage === 2 && (
          <motion.div 
            key="stage2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg space-y-12"
          >
             <div className="relative py-16 border-y-4 border-red-600 bg-red-950/10 overflow-hidden shadow-[0_0_100px_rgba(220,38,38,0.15)] rounded-[3rem]">
                 <motion.div 
                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-red-600"
                 />
                 
                 <div className="relative z-10 flex flex-col items-center">
                    <motion.div 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex items-center gap-2 text-red-600 font-black text-5xl uppercase tracking-[0.3em] mb-12"
                    >
                        <ShieldAlert size={48} />
                        EXPOSED
                    </motion.div>
                    
                    <div className="flex justify-center gap-12">
                        {players.filter(p => p.isImposter).map((p, i) => (
                            <motion.div 
                                key={p.id} 
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.2 }}
                                className="flex flex-col items-center"
                            >
                                <div className="relative">
                                    <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="xl" className="grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl" />
                                    <motion.div 
                                        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute inset-0 bg-red-600 rounded-full -z-10"
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-red-600 p-2 rounded-lg shadow-lg">
                                        <Skull size={20} className="text-white" />
                                    </div>
                                </div>
                                <span className="mt-8 font-black text-white text-3xl tracking-tighter uppercase">{p.name}</span>
                                <span className="text-red-500 font-black text-[10px] mt-1 tracking-[0.3em] uppercase">IDENTIFIED IMPOSTER</span>
                            </motion.div>
                        ))}
                    </div>
                 </div>
             </div>

             <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="space-y-8"
             >
                 {amIGameHost ? (
                     <div className="flex flex-col items-center gap-6">
                        <div className="flex items-center gap-2 text-red-500/60 font-black uppercase text-[10px] tracking-[0.4em]">
                            <Fingerprint size={14} />
                            Master of Shadows
                        </div>
                        <Button 
                            onClick={startImposterGuess} 
                            variant="danger"
                            className="w-full max-w-xs !py-5 shadow-red-600/20 shadow-2xl ring-2 ring-red-600/50 ring-offset-4 ring-offset-black"
                        >
                            <div className="flex items-center justify-center gap-2">
                                PROCEED TO JUDGEMENT
                                <ChevronRight size={20} />
                            </div>
                        </Button>
                     </div>
                 ) : (
                     <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 text-red-900 font-black uppercase text-xs tracking-[0.3em]">
                            <Loader2 size={16} className="animate-spin" />
                            Waiting for the Host's verdict...
                        </div>
                        <div className="flex justify-center gap-2">
                            {[0, 1, 2].map(i => (
                                <motion.div 
                                    key={i}
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                    className="w-1.5 h-1.5 bg-red-600 rounded-full"
                                />
                            ))}
                        </div>
                     </div>
                 )}
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
