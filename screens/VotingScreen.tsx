
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, Check, Loader2, AlertTriangle, ShieldCheck, Users, Fingerprint } from 'lucide-react';

export const VotingScreen: React.FC = () => {
  const { state, submitVote, myPlayerId, amIGameHost } = useGame();
  const { players, votes } = state;
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);

  const myVote = myPlayerId ? votes[myPlayerId] : null;
  // Voters are everyone except the host
  const voters = players.filter(p => !p.isHost && !p.isDisconnected);
  const candidates = players.filter(p => !p.isHost && p.id !== myPlayerId);

  if (amIGameHost) {
      const voteCount = voters.filter(p => votes[p.id]).length;
      return (
          <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Voting Progress</h2>
                <p className="text-slate-400 text-sm font-medium">Moderating: Waiting for all units to reach consensus...</p>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6"
              >
                  <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <Fingerprint size={14} />
                        Tally Status
                      </div>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full">
                        {voteCount} / {voters.length} Finalized
                      </span>
                  </div>
                  <div className="max-h-[45vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {voters.map(p => (
                          <motion.div 
                            key={p.id} 
                            layout
                            className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5"
                          >
                              <div className="flex items-center gap-3">
                                  <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="sm" />
                                  <div className="flex flex-col text-left">
                                    <span className="font-bold text-sm text-white">{p.name}</span>
                                    {p.isBot && <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">AI Agent</span>}
                                  </div>
                              </div>
                              <AnimatePresence mode="wait">
                                {votes[p.id] ? (
                                    <motion.span 
                                        key="cast"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-green-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-green-500/10 px-3 py-1 rounded-full"
                                    >
                                        <Check size={12} />
                                        Cast
                                    </motion.span>
                                ) : (
                                    <motion.span 
                                        key="waiting"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Loader2 size={12} className="animate-spin" />
                                        Analysing...
                                    </motion.span>
                                )}
                              </AnimatePresence>
                          </motion.div>
                      ))}
                  </div>
              </motion.div>
          </div>
      );
  }

  if (myVote) {
      return (
          <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
              >
                  <ShieldCheck size={48} className="text-green-400" />
              </motion.div>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-black text-white mb-2 uppercase tracking-tighter"
              >
                Decision Locked
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 text-sm font-medium"
              >
                Syncing with other units to reach a consensus...
              </motion.p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-game-bg flex flex-col p-6 overflow-y-auto">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-10"
      >
          <h2 className="text-4xl font-black text-white mb-1 uppercase tracking-tighter">CAST VOTE</h2>
          <div className="flex items-center justify-center gap-2 text-red-400 font-black uppercase tracking-[0.3em] text-[10px]">
            <AlertTriangle size={14} />
            Who is the Imposter?
          </div>
      </motion.div>

      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-8 pb-32">
          {candidates.map((p, i) => {
              const isSelected = selectedSuspect === p.id;
              return (
                  <motion.button 
                    key={p.id} 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedSuspect(p.id)} 
                    className="flex flex-col items-center group relative outline-none"
                  >
                      <div className="relative">
                        <AnimatePresence>
                            {isSelected && (
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="absolute -inset-4 bg-red-500/20 rounded-full blur-xl -z-10"
                                />
                            )}
                        </AnimatePresence>
                        <div className={`relative z-10 rounded-full transition-all duration-300 ${isSelected ? 'shadow-[0_0_25px_rgba(239,68,68,0.4)] scale-110' : 'group-hover:scale-105'}`}>
                            <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="lg" />
                        </div>
                        <AnimatePresence>
                            {isSelected && (
                                <motion.div 
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: -45 }}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-20"
                                >
                                    <Check size={18} strokeWidth={4} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                      </div>
                      <span className={`mt-4 font-black uppercase tracking-widest text-[10px] text-center transition-colors ${isSelected ? 'text-red-400' : 'text-slate-500'}`}>
                        {p.name}
                      </span>
                  </motion.button>
              );
          })}
      </div>

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-game-bg via-game-bg/95 to-transparent"
      >
          <Button 
            onClick={() => selectedSuspect && myPlayerId && submitVote(myPlayerId, selectedSuspect)} 
            disabled={!selectedSuspect} 
            fullWidth 
            className={`!py-5 shadow-xl transition-all ${selectedSuspect ? 'shadow-red-500/20' : ''}`}
          >
              <div className="flex items-center justify-center gap-2">
                <Vote size={20} />
                {selectedSuspect ? `LOCK IN: ${players.find(p=>p.id===selectedSuspect)?.name.toUpperCase()}` : "SELECT A SUSPECT"}
              </div>
          </Button>
      </motion.div>
    </div>
  );
};
