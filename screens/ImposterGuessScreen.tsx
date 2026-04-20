
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { GamePhase } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, AlertTriangle, ShieldCheck, XCircle, CheckCircle, Loader2, Fingerprint, MessageSquare } from 'lucide-react';

export const ImposterGuessScreen: React.FC = () => {
  const { state, submitImposterGuess, judgeImposterGuess, myPlayerId, amIGameHost } = useGame();
  const { phase, players, clues, imposterGuess, topic } = state;
  const [guessInput, setGuessInput] = useState('');

  const me = players.find(p => p.id === myPlayerId);
  const imposter = players.find(p => p.isImposter);
  const host = players.find(p => p.id === state.currentHostId);

  // 1. Guessing Phase
  if (phase === GamePhase.IMPOSTER_GUESS) {
      if (me?.isImposter) {
          return (
              <div className="min-h-screen bg-game-bg flex flex-col p-6 space-y-6">
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-red-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">
                        <AlertTriangle size={14} />
                        Final Protocol
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Identify the Topic</h2>
                  </motion.div>

                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex-1 bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                  >
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 pb-2 border-b border-white/5">
                        <MessageSquare size={14} />
                        Clue History
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                          {clues.map((c, i) => {
                              const author = players.find(p => p.id === c.playerId);
                              return (
                                  <motion.div 
                                    key={i} 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5"
                                  >
                                      <Avatar seed={author?.avatarSeed || '0'} url={author?.avatarUrl} size="sm" className="border border-white/10" />
                                      <p className="text-sm italic text-white font-medium leading-relaxed">"{c.text}"</p>
                                  </motion.div>
                              )
                          })}
                      </div>
                  </motion.div>

                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="space-y-4"
                  >
                      <input 
                        type="text" 
                        className="w-full bg-black/40 border-2 border-white/5 focus:border-red-500/50 p-6 rounded-3xl text-center text-white outline-none transition-all uppercase font-black text-xl placeholder:text-slate-800 shadow-inner" 
                        placeholder="ENTER YOUR GUESS..." 
                        value={guessInput} 
                        onChange={e => setGuessInput(e.target.value.toUpperCase())} 
                        autoFocus
                      />
                      <Button fullWidth onClick={() => submitImposterGuess(guessInput)} disabled={!guessInput.trim()} className="!py-5 shadow-red-500/20 shadow-xl">
                          <div className="flex items-center justify-center gap-2">
                            <Send size={18} />
                            SUBMIT FINAL GUESS
                          </div>
                      </Button>
                  </motion.div>
              </div>
          );
      }
      return (
          <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative mb-10"
              >
                  <Avatar seed={imposter?.avatarSeed || '0'} url={imposter?.avatarUrl} size="xl" className="border-4 border-red-500/30" />
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-red-500 rounded-full -z-10"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-red-500 p-2 rounded-lg shadow-lg">
                    <Search size={20} className="text-white" />
                  </div>
              </motion.div>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-black text-white mb-2 uppercase tracking-tighter"
              >
                Imposter is Guessing
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 text-sm font-medium"
              >
                Waiting for {imposter?.name} to identify the secret topic...
              </motion.p>
          </div>
      );
  }

  // 2. Review Phase (Visible to EVERYONE)
  if (phase === GamePhase.HOST_REVIEW) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-12"
              >
                  <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">THE VERDICT</h2>
                  <div className="flex items-center justify-center gap-2 text-red-600 font-black uppercase text-[10px] tracking-[0.4em]">
                    <Fingerprint size={14} />
                    Host is Judging the Guess
                  </div>
              </motion.div>

              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-white/5 w-full max-w-md mb-12 space-y-10 shadow-2xl"
              >
                  <div className="space-y-3">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">The Real Topic Was</p>
                      <p className="text-4xl font-black text-green-400 uppercase tracking-tighter">{topic}</p>
                  </div>
                  
                  <div className="h-px bg-white/5 w-full"></div>

                  <div className="space-y-3">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">{imposter?.name} Guessed</p>
                      <p className="text-4xl font-black text-white uppercase italic tracking-tighter">"{imposterGuess}"</p>
                  </div>
              </motion.div>

              {amIGameHost ? (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex gap-4 w-full max-w-md"
                  >
                      <Button variant="danger" className="flex-1 !py-6 shadow-red-500/20 shadow-xl" onClick={() => judgeImposterGuess(false)}>
                        <div className="flex flex-col items-center gap-1">
                            <XCircle size={24} />
                            <span className="font-black text-sm">WRONG</span>
                        </div>
                      </Button>
                      <Button variant="success" className="flex-1 !py-6 shadow-green-500/20 shadow-xl" onClick={() => judgeImposterGuess(true)}>
                        <div className="flex flex-col items-center gap-1">
                            <CheckCircle size={24} />
                            <span className="font-black text-sm">CORRECT</span>
                        </div>
                      </Button>
                  </motion.div>
              ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-6"
                  >
                      <div className="relative">
                        <Avatar seed={host?.avatarSeed || '0'} url={host?.avatarUrl} size="md" className="ring-4 ring-indigo-500/20" />
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-indigo-500 rounded-full -z-10"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-indigo-400 font-black text-sm uppercase tracking-[0.2em] animate-pulse">
                        <Loader2 size={16} className="animate-spin" />
                        Host verdict pending...
                      </div>
                  </motion.div>
              )}
          </div>
      );
  }

  return null;
};
