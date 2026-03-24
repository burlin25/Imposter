
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { GamePhase } from '../types';

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
              <div className="mb-8">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Game System</span>
                  <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Round Start</h2>
              </div>
              
              <div className="animate-bounce-in bg-game-surface p-8 rounded-3xl border border-white/10 shadow-2xl mb-8 flex flex-col items-center">
                  <Avatar seed={currentPlayer.avatarSeed} url={currentPlayer.avatarUrl} size="xl" />
                  <span className="mt-4 text-2xl font-black text-white">{currentPlayer.name.toUpperCase()}</span>
              </div>

              <div className="text-lg text-slate-300 mb-12 max-w-xs mx-auto font-medium">
                  Please provide the first clue to start the round!
              </div>

              {amIGameHost ? (
                  <Button onClick={confirmStarter} className="w-full max-w-xs animate-pulse" variant="success">
                      I AM READY
                  </Button>
              ) : (
                  <p className="text-slate-500 animate-pulse font-bold uppercase tracking-widest text-xs">Waiting for host to start...</p>
              )}
          </div>
      );
  }

  // --- IN PERSON MODE: DISCUSSION ---
  if (phase === GamePhase.DISCUSSION) {
    const aiClues = clues.filter(c => players.find(p => p.id === c.playerId)?.isBot);
    
    return (
        <div className="min-h-screen bg-game-bg flex flex-col items-center p-6 text-center">
            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-widest mt-10">DISCUSSION PHASE</h2>
            
            <div className="relative w-40 h-40 mx-auto mb-10">
                <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping"></div>
                <div className="relative z-10 bg-slate-800 w-full h-full rounded-full flex items-center justify-center border-4 border-indigo-500 shadow-xl">
                    <span className="text-5xl">📡</span>
                </div>
            </div>

            {aiClues.length > 0 && (
                <div className="w-full max-w-sm bg-black/30 border border-white/5 rounded-2xl p-4 mb-8 text-left space-y-3">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Bot Observations</p>
                    {aiClues.map((clue, idx) => {
                        const bot = players.find(p => p.id === clue.playerId);
                        return (
                            <div key={idx} className="flex gap-2 items-start border-l-2 border-indigo-500/50 pl-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase shrink-0 w-12 truncate">{bot?.name}:</span>
                                <span className="text-xs text-white font-medium italic">"{clue.text}"</span>
                            </div>
                        )
                    })}
                </div>
            )}

            <p className="text-slate-400 max-w-sm mx-auto mb-12 text-sm">
                Discuss everyone's clues. Use logic to identify the Imposter.
            </p>

            {amIGameHost ? (
                <div className="w-full max-w-xs space-y-4">
                    <Button variant="danger" fullWidth onClick={startVoting} className="shadow-red-500/30">
                        CALL VOTE
                    </Button>
                </div>
            ) : (
                 <p className="text-slate-500 animate-pulse font-bold uppercase tracking-widest text-xs">Waiting for Vote Call...</p>
            )}
        </div>
    );
  }

  // --- CLUES PHASE ---
  const isMyTurn = currentPlayer.id === myPlayerId;

  return (
    <div className="min-h-screen bg-game-bg flex flex-col p-4 pt-8">
      
      <div className="bg-game-surface/80 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/10 shadow-2xl max-h-[30vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3 sticky top-0 bg-game-surface p-1 z-10 border-b border-white/5">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Digital Clue Log</span>
             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Phase {clueRound}/2</span>
        </div>
        
        {clues.length > 0 ? (
            <div className="space-y-4 pt-2">
                 {clues.map((clue, idx) => {
                     const p = players.find(player => player.id === clue.playerId);
                     return (
                         <div key={idx} className={`flex items-start gap-3 animate-fade-in-up`}>
                             <Avatar seed={p?.avatarSeed || '0'} url={p?.avatarUrl} size="sm" />
                             <div className="bg-slate-900/50 px-4 py-2 rounded-2xl rounded-tl-none border border-white/5">
                                 <p className="text-sm font-bold text-white tracking-tight">"{clue.text}"</p>
                                 <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">{p?.name}</span>
                             </div>
                         </div>
                     );
                 })}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-8 opacity-20">
                <span className="text-4xl mb-2">📡</span>
                <p className="text-[10px] font-black uppercase tracking-widest">Waiting for First Transmission</p>
            </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            
            {me && (
                <div className={`p-5 rounded-3xl border-2 text-center w-full max-w-sm shadow-2xl transition-all ${me.isImposter ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
                    <div className="flex items-center gap-5">
                        <div className="shrink-0">
                            {me.isImposter ? (
                                <div className="w-14 h-14 bg-red-950/40 rounded-full flex items-center justify-center text-2xl border-2 border-red-500/50">🕵️</div>
                            ) : (
                                topicImage ? (
                                    <img src={topicImage} alt="Secret" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-game-success/30" />
                                ) : (
                                    <div className="w-14 h-14 bg-green-950/40 rounded-full flex items-center justify-center text-2xl border-2 border-game-success/50">💡</div>
                                )
                            )}
                        </div>
                        <div className="text-left">
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1 ${me.isImposter ? 'text-red-400' : 'text-game-success'}`}>
                                {me.isImposter ? "ROLE: IMPOSTER" : "SECRET TOPIC"}
                            </span>
                            <h3 className="text-2xl font-black text-white leading-none uppercase tracking-tighter">
                                {me.isImposter ? "BLEND IN" : topic}
                            </h3>
                            {me.isImposter && (
                                <p className="text-[10px] text-red-300 mt-2 font-black uppercase tracking-widest">
                                    Category: {category}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isMyTurn ? (
                <div className="w-full max-w-sm animate-bounce-in">
                    <div className="text-center mb-4">
                        <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Your Turn to Speak</p>
                    </div>
                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        <input 
                            type="text"
                            className="w-full bg-black/40 border-2 border-white/5 focus:border-indigo-500 p-5 rounded-2xl text-xl outline-none transition-all text-white text-center font-black placeholder:text-slate-700"
                            placeholder="Type clue..."
                            value={clueText}
                            onChange={(e) => setClueText(e.target.value)}
                            autoFocus
                        />
                        <Button type="submit" fullWidth disabled={!clueText.trim()} variant="primary">
                            SEND CLUE
                        </Button>
                    </form>
                </div>
            ) : (
                <div className="text-center w-full max-w-sm p-8 bg-slate-900/40 rounded-3xl border border-white/5 animate-fade-in backdrop-blur-sm">
                    <div className="relative inline-block mb-6">
                        <Avatar seed={currentPlayer.avatarSeed} url={currentPlayer.avatarUrl} size="lg" />
                        <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-10"></div>
                    </div>
                    <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{currentPlayer.name}</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Thinking of a clue...</p>
                </div>
            )}
      </div>
    </div>
  );
};
