
import React from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';

export const ScoreboardScreen: React.FC = () => {
  const { state, acknowledgeRoundEnd, resetGame, myPlayerId } = useGame();
  const { players, winningPlayerId, phase, currentCycle } = state;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const me = players.find(p => p.id === myPlayerId);

  if (phase === 'WINNER') {
      const winner = players.find(p => p.id === winningPlayerId);
      return (
        <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center">
             <h1 className="text-5xl font-black text-yellow-400 mb-6">CHAMPION!</h1>
             <Avatar seed={winner?.avatarSeed || '0'} url={winner?.avatarUrl} size="xl" className="mx-auto ring-4 ring-yellow-400 mb-8" />
             <h2 className="text-3xl font-bold text-white mb-8">{winner?.name}</h2>
             <div className="flex gap-4">
                 <Button onClick={resetGame}>PLAY AGAIN</Button>
                 <Button variant="secondary" onClick={() => window.location.reload()}>EXIT</Button>
             </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-game-bg flex flex-col p-6">
      <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-white uppercase tracking-widest">Scoreboard</h2>
          <p className="text-indigo-400 font-bold text-xs">Cycle {currentCycle} of {state.config.cycles}</p>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto mb-6">
          {sortedPlayers.map((p, idx) => (
              <div key={p.id} className={`flex items-center justify-between bg-slate-800 p-3 rounded-xl border ${p.isReady ? 'border-game-success shadow-lg' : 'border-slate-700 opacity-80'}`}>
                  <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 font-bold">#{idx + 1}</span>
                      <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="sm" />
                      <div className="flex flex-col">
                          <span className="font-bold text-white">{p.name}</span>
                          {p.isReady ? (
                              <span className="text-[10px] text-game-success font-black uppercase">READY</span>
                          ) : (
                              <span className="text-[10px] text-slate-500 font-black uppercase">WAITING...</span>
                          )}
                      </div>
                  </div>
                  <span className="font-mono font-black text-xl text-game-primary">{p.score}</span>
              </div>
          ))}
      </div>

      <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 shadow-2xl">
          <Button 
            fullWidth 
            variant={me?.isReady ? 'success' : 'primary'}
            onClick={() => myPlayerId && acknowledgeRoundEnd(myPlayerId)}
          >
              {me?.isReady ? "✓ READY" : "I AM READY"}
          </Button>
          <div className="mt-4 flex justify-center gap-2">
               {players.map(p => (
                   <div key={p.id} className={`w-3 h-3 rounded-full transition-all ${p.isReady ? 'bg-game-success scale-110 shadow-[0_0_10px_#22c55e]' : 'bg-slate-700'}`}></div>
               ))}
          </div>
      </div>
    </div>
  );
};
