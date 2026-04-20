
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { GameConfig } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, UserPlus, Play, Settings2, Check, Copy, Users } from 'lucide-react';

export const LobbyScreen: React.FC = () => {
  const { state, updateConfig, startGame, addBot, isNetworkHost } = useGame();
  const { players, config, gameCode } = state;
  const [copied, setCopied] = useState(false);

  const handleConfigChange = (updates: Partial<GameConfig>) => {
    if (!isNetworkHost) return;
    updateConfig(updates);
  };

  const handleShare = async () => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('code', gameCode);
      const shareUrl = currentUrl.toString();
      try {
          if (navigator.share) {
              await navigator.share({ title: 'Join Imposter', url: shareUrl });
          } else {
              await navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
          }
      } catch (err) {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  const MIN_PLAYERS = 4;

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-2xl mx-auto space-y-6">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center bg-slate-900/40 p-5 rounded-3xl backdrop-blur-md border border-white/10 shadow-xl"
      >
        <div>
          <span className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase block mb-1">Room Signal</span>
          <h2 className="text-4xl font-mono font-black text-white tracking-tighter">{gameCode}</h2>
        </div>
        <Button 
            variant="secondary" 
            className="!py-3 !px-6 text-xs font-black uppercase tracking-widest shadow-lg" 
            onClick={handleShare}
        >
            <div className="flex items-center gap-2">
                {copied ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}
                {copied ? "COPIED" : "SHARE"}
            </div>
        </Button>
      </motion.div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-400" />
                <h3 className="text-white font-black uppercase text-sm tracking-widest">Crew ({players.length})</h3>
             </div>
             {isNetworkHost && (
                 <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addBot} 
                  className="text-[10px] bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-full border border-indigo-500/20 hover:bg-indigo-500/20 transition-all font-black uppercase tracking-widest flex items-center gap-2"
                 >
                  <UserPlus size={14} />
                  Add Bot
                 </motion.button>
             )}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <motion.div 
                layout
                className="grid grid-cols-3 sm:grid-cols-4 gap-6 pb-8"
            >
                <AnimatePresence mode="popLayout">
                    {players.map((p, i) => (
                        <motion.div 
                            key={p.id}
                            layout
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <Avatar 
                                seed={p.avatarSeed} 
                                url={p.avatarUrl} 
                                name={p.name} 
                                size="md" 
                                className="shadow-2xl"
                            />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate w-full text-center">
                                {p.name}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Settings2 size={12} />
                    Game Mode
                </div>
                <div className={`flex flex-col gap-2 ${!isNetworkHost ? 'opacity-60 pointer-events-none' : ''}`}>
                    {(['IN_PERSON', 'PHONE'] as const).map(mode => (
                        <button 
                            key={mode}
                            onClick={() => handleConfigChange({ mode })}
                            className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all text-center ${config.mode === mode ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-white/5 bg-white/5 text-slate-500 hover:bg-white/10'}`}
                        >
                            {mode === 'IN_PERSON' ? 'Party' : 'Remote'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Settings2 size={12} />
                    Rounds
                </div>
                <div className={`flex flex-col gap-2 ${!isNetworkHost ? 'opacity-60 pointer-events-none' : ''}`}>
                    {[1, 2].map(num => (
                        <button 
                            key={num}
                            onClick={() => handleConfigChange({ cycles: num })}
                            className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all text-center ${config.cycles === num ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-white/5 bg-white/5 text-slate-500 hover:bg-white/10'}`}
                        >
                            {num} {num === 1 ? 'Round' : 'Rounds'}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {isNetworkHost ? (
            <Button 
                fullWidth 
                disabled={players.length < MIN_PLAYERS} 
                onClick={startGame} 
                className="!py-5 shadow-indigo-500/20 shadow-xl"
            >
                <div className="flex items-center justify-center gap-2">
                    <Play size={20} fill="currentColor" />
                    {players.length < MIN_PLAYERS ? `NEED ${MIN_PLAYERS - players.length} MORE` : "START"}
                </div>
            </Button>
        ) : (
            <div className="text-center p-5 text-indigo-400/60 font-black bg-indigo-500/5 rounded-2xl border border-indigo-500/10 animate-pulse uppercase tracking-widest text-[10px]">
              Waiting for commander to start...
            </div>
        )}
      </motion.div>
    </div>
  );
};
