
import React from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, LogOut, Check, Loader2, Star, Award, TrendingUp } from 'lucide-react';

export const ScoreboardScreen: React.FC = () => {
  const { state, acknowledgeRoundEnd, resetGame, myPlayerId } = useGame();
  const { players, winningPlayerId, phase, currentCycle } = state;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const me = players.find(p => p.id === myPlayerId);

  if (phase === 'WINNER') {
      const winner = players.find(p => p.id === winningPlayerId);
      return (
        <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center overflow-hidden">
             <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
                className="relative mb-8"
             >
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -inset-12 bg-yellow-400/20 rounded-full blur-3xl -z-10"
                />
                <Trophy size={120} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]" />
             </motion.div>

             <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-6xl font-black text-white mb-2 uppercase tracking-tighter"
             >
                CHAMPION
             </motion.h1>
             
             <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center mb-12"
             >
                <Avatar seed={winner?.avatarSeed || '0'} url={winner?.avatarUrl} size="xl" className="mx-auto shadow-2xl mb-6" />
                <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-tight">{winner?.name}</h2>
                <div className="flex items-center gap-2 text-slate-500 font-black uppercase text-xs tracking-[0.3em] mt-2">
                    <Star size={14} fill="currentColor" />
                    Absolute Dominance
                </div>
             </motion.div>

             <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex gap-4 w-full max-w-sm"
             >
                 <Button onClick={resetGame} fullWidth className="!py-5 shadow-yellow-400/20 shadow-xl">
                    <div className="flex items-center justify-center gap-2">
                        <RefreshCw size={20} />
                        PLAY AGAIN
                    </div>
                 </Button>
                 <Button variant="secondary" onClick={() => window.location.reload()} className="!py-5">
                    <div className="flex items-center justify-center gap-2">
                        <LogOut size={20} />
                        EXIT
                    </div>
                 </Button>
             </motion.div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-game-bg flex flex-col p-6 space-y-6">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Scoreboard</h2>
          <div className="flex items-center justify-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] mt-1">
            <TrendingUp size={14} />
            Cycle {currentCycle} of {state.config.cycles}
          </div>
      </motion.div>
      
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
          <AnimatePresence initial={false}>
              {sortedPlayers.map((p, idx) => (
                  <motion.div 
                    key={p.id} 
                    layout
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${p.isReady ? 'bg-green-500/10 border-green-500/30 shadow-lg' : 'bg-slate-900/40 border-white/5 opacity-80'}`}
                  >
                      <div className="flex items-center gap-4">
                          <span className={`font-black text-sm w-6 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-600'}`}>
                            #{idx + 1}
                          </span>
                          <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="sm" />
                          <div className="flex flex-col">
                              <span className="font-bold text-white text-sm">{p.name}</span>
                              <div className="flex items-center gap-1">
                                {p.isReady ? (
                                    <span className="text-[9px] text-green-400 font-black uppercase tracking-widest flex items-center gap-1">
                                        <Check size={10} />
                                        Ready
                                    </span>
                                ) : (
                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                                        <Loader2 size={10} className="animate-spin" />
                                        Waiting
                                    </span>
                                )}
                              </div>
                          </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-black text-2xl text-indigo-400 tracking-tighter">{p.score}</span>
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Points</span>
                      </div>
                  </motion.div>
              ))}
          </AnimatePresence>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl"
      >
          <Button 
            fullWidth 
            variant={me?.isReady ? 'success' : 'primary'}
            onClick={() => myPlayerId && acknowledgeRoundEnd(myPlayerId)}
            className="!py-5 shadow-xl transition-all"
          >
              <div className="flex items-center justify-center gap-2">
                {me?.isReady ? <Check size={20} /> : <Award size={20} />}
                {me?.isReady ? "READY FOR NEXT" : "I AM READY"}
              </div>
          </Button>
          <div className="mt-6 flex justify-center gap-3">
               {players.map(p => (
                   <motion.div 
                    key={p.id} 
                    animate={{ 
                        scale: p.isReady ? 1.2 : 1,
                        backgroundColor: p.isReady ? '#22c55e' : '#1e293b'
                    }}
                    className={`w-2.5 h-2.5 rounded-full ${p.isReady ? 'shadow-[0_0_10px_rgba(34,197,94,0.5)]' : ''}`}
                   />
               ))}
          </div>
      </motion.div>
    </div>
  );
};
