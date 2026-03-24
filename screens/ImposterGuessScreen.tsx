
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { GamePhase } from '../types';

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
              <div className="min-h-screen bg-game-bg flex flex-col p-6 animate-fade-in">
                  <h2 className="text-2xl font-black text-white text-center mb-6 uppercase tracking-widest">Identify the Topic</h2>
                  <div className="flex-1 bg-slate-800/50 rounded-2xl p-4 overflow-y-auto mb-6 border border-white/5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-[0.2em]">Clue History</p>
                      {clues.map((c, i) => {
                          const author = players.find(p => p.id === c.playerId);
                          return (
                              <div key={i} className="flex items-center gap-2 mb-2">
                                  <Avatar seed={author?.avatarSeed || '0'} url={author?.avatarUrl} size="sm" />
                                  <p className="text-sm italic text-white">"{c.text}"</p>
                              </div>
                          )
                      })}
                  </div>
                  <div className="space-y-4">
                      <input 
                        type="text" 
                        className="w-full bg-slate-900 border-2 border-slate-700 p-4 rounded-xl text-center text-white outline-none focus:border-game-primary transition-all uppercase font-bold" 
                        placeholder="ENTER YOUR GUESS..." 
                        value={guessInput} 
                        onChange={e => setGuessInput(e.target.value.toUpperCase())} 
                      />
                      <Button fullWidth onClick={() => submitImposterGuess(guessInput)} disabled={!guessInput.trim()}>
                          SUBMIT FINAL GUESS
                      </Button>
                  </div>
              </div>
          );
      }
      return (
          <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-8">
                  <Avatar seed={imposter?.avatarSeed || '0'} url={imposter?.avatarUrl} size="xl" className="animate-pulse" />
                  <div className="absolute inset-0 ring-4 ring-red-600 rounded-full animate-ping opacity-20"></div>
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">IMPOSTER IS GUESSING</h2>
              <p className="text-slate-400">Waiting for {imposter?.name} to identify the secret topic...</p>
          </div>
      );
  }

  // 2. Review Phase (Visible to EVERYONE)
  if (phase === GamePhase.HOST_REVIEW) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="mb-10">
                  <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">THE VERDICT</h2>
                  <p className="text-red-600 font-bold uppercase text-xs tracking-[0.3em]">Host is Judging the Guess</p>
              </div>

              <div className="bg-slate-900/50 p-8 rounded-3xl border border-red-900/30 w-full max-w-md mb-10 space-y-8 shadow-[0_0_50px_rgba(220,38,38,0.1)]">
                  <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">The Real Topic Was</p>
                      <p className="text-3xl font-black text-game-success uppercase tracking-tight">{topic}</p>
                  </div>
                  
                  <div className="h-px bg-slate-800 w-full"></div>

                  <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">{imposter?.name} Guessed</p>
                      <p className="text-3xl font-black text-white uppercase italic tracking-tight">"{imposterGuess}"</p>
                  </div>
              </div>

              {amIGameHost ? (
                  <div className="flex gap-4 w-full max-w-md">
                      <Button variant="danger" className="flex-1 !py-6 font-black" onClick={() => judgeImposterGuess(false)}>WRONG</Button>
                      <Button variant="success" className="flex-1 !py-6 font-black" onClick={() => judgeImposterGuess(true)}>CORRECT</Button>
                  </div>
              ) : (
                  <div className="flex flex-col items-center gap-4">
                      <Avatar seed={host?.avatarSeed || '0'} url={host?.avatarUrl} size="md" className="ring-2 ring-indigo-500 rounded-full mb-2" />
                      <p className="text-indigo-400 font-bold animate-pulse text-sm uppercase tracking-widest">Host verdict pending...</p>
                  </div>
              )}
          </div>
      );
  }

  return null;
};
