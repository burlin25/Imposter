
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';

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
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Voting Progress</h2>
              <p className="text-slate-400 mb-8">Moderating: Waiting for all units to cast their decision...</p>
              <div className="w-full max-w-md bg-game-surface p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                  <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase">Tally Status</span>
                      <span className="text-xs font-bold text-game-primary uppercase">{voteCount} / {voters.length} Finalized</span>
                  </div>
                  <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                      {voters.map(p => (
                          <div key={p.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                              <div className="flex items-center gap-3">
                                  <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="sm" />
                                  <div className="flex flex-col text-left">
                                    <span className="font-bold text-sm">{p.name}</span>
                                    {p.isBot && <span className="text-[8px] text-indigo-400 font-black uppercase">AI UNIT</span>}
                                  </div>
                              </div>
                              {votes[p.id] ? (
                                <span className="text-game-success text-[10px] font-black uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-game-success animate-pulse"></span>
                                    Cast
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px] font-black uppercase animate-pulse">Analysing...</span>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  if (myVote) {
      return (
          <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-game-success/20 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
                  <span className="text-4xl">✓</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Vote Cast!</h2>
              <p className="text-slate-400">Syncing with other players to reach a consensus...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-game-bg flex flex-col p-6 overflow-y-auto">
      <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white mb-1 uppercase tracking-tighter">CAST VOTE</h2>
          <p className="text-xs text-game-danger font-bold uppercase tracking-widest opacity-80">Who is the Imposter?</p>
      </div>

      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-8 pb-32">
          {candidates.map(p => {
              const isSelected = selectedSuspect === p.id;
              return (
                  <button 
                    key={p.id} 
                    onClick={() => setSelectedSuspect(p.id)} 
                    className="flex flex-col items-center group relative outline-none"
                  >
                      <div className={`relative transition-all duration-300 transform ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
                        {/* Selected Shadow Glow */}
                        {isSelected && (
                            <div className="absolute inset-0 bg-game-success/40 rounded-full blur-xl animate-pulse-fast"></div>
                        )}
                        <div className={`relative z-10 rounded-full border-4 transition-all duration-300 ${isSelected ? 'border-game-success shadow-[0_0_25px_rgba(34,197,94,0.6)]' : 'border-slate-800'}`}>
                            <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="lg" className="!gap-0" />
                        </div>
                        {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-game-success text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-20 animate-bounce-in">
                                <span className="text-lg font-black">✓</span>
                            </div>
                        )}
                      </div>
                      <span className={`mt-3 font-black uppercase tracking-widest text-[10px] text-center transition-colors ${isSelected ? 'text-game-success' : 'text-slate-400'}`}>
                        {p.name}
                      </span>
                  </button>
              );
          })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-game-bg via-game-bg/90 to-transparent">
          <Button 
            onClick={() => selectedSuspect && myPlayerId && submitVote(myPlayerId, selectedSuspect)} 
            disabled={!selectedSuspect} 
            fullWidth 
            variant={selectedSuspect ? 'success' : 'danger'}
            className="ring-4 ring-offset-4 ring-offset-game-bg ring-transparent active:ring-game-success/50"
          >
              {selectedSuspect ? `LOCK IN: ${players.find(p=>p.id===selectedSuspect)?.name.toUpperCase()}` : "SELECT A SUSPECT"}
          </Button>
      </div>
    </div>
  );
};
