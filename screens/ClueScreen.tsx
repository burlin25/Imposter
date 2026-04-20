
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { GamePhase } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Radio, Info, Send, User, Shield, AlertTriangle, Vote, Play, Loader2 } from 'lucide-react';

export const ClueScreen: React.FC = () => {
  const { state, submitClue, confirmStarter, startVoting, myPlayerId, amIGameHost } = useGame();
  const { players, currentTurnIndex, clues, topic, category, topicImage, phase, clueRound } = state;
  const currentPlayer = players[currentTurnIndex] || players[0];
  
  const [clueText, setClueText] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clueText.trim()) {
        submitClue(clueText.trim());
        setClueText('');
    }
  };

  const me = players.find(p => p.id === myPlayerId);

  // --- IN PERSON MODE: ROUND STARTER ---
  if (phase === GamePhase.ROUND_STARTER) {
      return (
          <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
              >
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2">System Initialization</span>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Round Start</h2>
              </motion.div>
              
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl mb-10 flex flex-col items-center"
              >
                  <div className="relative">
                    <Avatar seed={currentPlayer.avatarSeed} url={currentPlayer.avatarUrl} size="xl" />
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -inset-4 bg-indigo-500/20 rounded-full -z-10"
                    />
                  </div>
                  <span className="mt-6 text-2xl font-black text-white uppercase tracking-tighter">{currentPlayer.name}</span>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Starting Player</span>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-slate-400 mb-12 max-w-xs mx-auto font-medium leading-relaxed"
              >
                  Please prepare your first clue to initiate the transmission.
              </motion.div>

              {amIGameHost ? (
                  <Button onClick={confirmStarter} className="w-full max-w-xs !py-5 shadow-indigo-500/20 shadow-xl" variant="primary">
                      <div className="flex items-center justify-center gap-2">
                        <Play size={20} fill="currentColor" />
                        I AM READY
                      </div>
                  </Button>
              ) : (
                  <div className="flex items-center gap-2 text-indigo-400/60 font-black uppercase tracking-widest text-[10px] animate-pulse">
                    <Loader2 size={14} className="animate-spin" />
                    Waiting for host...
                  </div>
              )}
          </div>
      );
  }

  // --- IN PERSON MODE: DISCUSSION ---
  if (phase === GamePhase.DISCUSSION) {
    const aiClues = clues.filter(c => players.find(p => p.id === c.playerId)?.isBot);
    
    return (
        <div className="min-h-screen bg-game-bg flex flex-col items-center p-6 text-center">
            <motion.h2 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-black text-white mb-10 uppercase tracking-[0.2em] mt-10"
            >
                DISCUSSION PHASE
            </motion.h2>
            
            <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-44 h-44 mx-auto mb-12"
            >
                <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-indigo-500 rounded-full"
                />
                <div className="relative z-10 bg-slate-900/80 backdrop-blur-md w-full h-full rounded-full flex items-center justify-center border-4 border-indigo-500 shadow-2xl">
                    <Radio size={64} className="text-indigo-400" />
                </div>
            </motion.div>

            <AnimatePresence>
                {aiClues.length > 0 && (
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-full max-w-sm bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 mb-8 text-left space-y-4 shadow-xl"
                    >
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">
                            <Info size={12} />
                            Bot Observations
                        </div>
                        {aiClues.map((clue, idx) => {
                            const bot = players.find(p => p.id === clue.playerId);
                            return (
                                <motion.div 
                                    key={idx}
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex gap-3 items-start bg-white/5 p-3 rounded-xl border border-white/5"
                                >
                                    <Avatar seed={bot?.avatarSeed || '0'} url={bot?.avatarUrl} size="xs" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">{bot?.name}</span>
                                        <span className="text-xs text-white font-medium italic leading-relaxed">"{clue.text}"</span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-400 max-w-sm mx-auto mb-12 text-sm leading-relaxed font-medium"
            >
                Discuss the clues provided. Analyze speech patterns and logical inconsistencies to identify the Imposter.
            </motion.p>

            {amIGameHost ? (
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full max-w-xs"
                >
                    <Button variant="danger" fullWidth onClick={startVoting} className="!py-5 shadow-red-500/20 shadow-xl">
                        <div className="flex items-center justify-center gap-2">
                            <Vote size={20} />
                            CALL VOTE
                        </div>
                    </Button>
                </motion.div>
            ) : (
                 <div className="flex items-center gap-2 text-indigo-400/60 font-black uppercase tracking-widest text-[10px] animate-pulse">
                    <Loader2 size={14} className="animate-spin" />
                    Waiting for Vote Call...
                 </div>
            )}
        </div>
    );
  }

  // --- CLUES PHASE ---
  const isMyTurn = currentPlayer.id === myPlayerId;

  return (
    <div className="min-h-screen bg-game-bg flex flex-col p-4 pt-8 space-y-6">
      
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-5 border border-white/10 shadow-2xl flex flex-col min-h-0 max-h-[35vh]"
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
             <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Clue Log</span>
             </div>
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded-md">Round {clueRound}/2</span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            <AnimatePresence initial={false}>
                {clues.length > 0 ? (
                    clues.map((clue, idx) => {
                        const p = players.find(player => player.id === clue.playerId);
                        return (
                            <motion.div 
                                key={idx}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="flex items-start gap-3"
                            >
                                <Avatar seed={p?.avatarSeed || '0'} url={p?.avatarUrl} size="sm" />
                                <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 shadow-sm">
                                    <p className="text-sm font-bold text-white tracking-tight leading-relaxed">"{clue.text}"</p>
                                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1 block">{p?.name}</span>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                        <Radio size={48} className="mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Waiting for First Transmission</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            
            {me && (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`p-6 rounded-[2.5rem] border-2 text-center w-full max-w-sm shadow-2xl backdrop-blur-md ${me.isImposter ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}
                >
                    <div className="flex items-center gap-5">
                        <div className="shrink-0">
                            {me.isImposter ? (
                                <div className="w-16 h-16 bg-red-950/40 rounded-2xl flex items-center justify-center text-3xl border-2 border-red-500/50 shadow-lg">
                                    <AlertTriangle className="text-red-500" />
                                </div>
                            ) : (
                                topicImage ? (
                                    <img src={topicImage} alt="Secret" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-green-500/30 shadow-lg" />
                                ) : (
                                    <div className="w-16 h-16 bg-green-950/40 rounded-2xl flex items-center justify-center text-3xl border-2 border-green-500/50 shadow-lg">
                                        <Shield className="text-green-500" />
                                    </div>
                                )
                            )}
                        </div>
                        <div className="text-left">
                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] block mb-1 ${me.isImposter ? 'text-red-400' : 'text-green-400'}`}>
                                {me.isImposter ? "ROLE: IMPOSTER" : "SECRET TOPIC"}
                            </span>
                            <h3 className="text-2xl font-black text-white leading-none uppercase tracking-tighter">
                                {me.isImposter ? "BLEND IN" : topic}
                            </h3>
                            {me.isImposter && (
                                <div className="flex items-center gap-1 mt-2">
                                    <span className="text-[9px] text-red-300/60 font-black uppercase tracking-widest">Category:</span>
                                    <span className="text-[9px] text-red-300 font-black uppercase tracking-widest">{category}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {isMyTurn ? (
                    <motion.div 
                        key="my-turn"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="w-full max-w-sm"
                    >
                        <div className="text-center mb-4">
                            <div className="flex items-center justify-center gap-2 text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
                                <Radio size={12} />
                                Your Turn to Speak
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="w-full space-y-4">
                            <input 
                                type="text"
                                className="w-full bg-black/40 border-2 border-white/5 focus:border-indigo-500/50 p-6 rounded-3xl text-xl outline-none transition-all text-white text-center font-black placeholder:text-slate-800 shadow-inner"
                                placeholder="Type clue..."
                                value={clueText}
                                onChange={(e) => setClueText(e.target.value)}
                                autoFocus
                            />
                            <Button type="submit" fullWidth disabled={!clueText.trim()} className="!py-5 shadow-indigo-500/20 shadow-xl">
                                <div className="flex items-center justify-center gap-2">
                                    <Send size={18} />
                                    SEND CLUE
                                </div>
                            </Button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="waiting"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-center w-full max-w-sm p-10 bg-slate-900/40 rounded-[3rem] border border-white/5 backdrop-blur-md shadow-2xl"
                    >
                        <div className="relative inline-block mb-6">
                            <Avatar seed={currentPlayer.avatarSeed} url={currentPlayer.avatarUrl} size="lg" />
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-indigo-500 rounded-full -z-10"
                            />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">{currentPlayer.name}</h3>
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            <Loader2 size={12} className="animate-spin" />
                            Thinking of a clue...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
      </div>
    </div>
  );
};
