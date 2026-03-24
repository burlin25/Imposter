
import React from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { GameConfig } from '../types';

export const LobbyScreen: React.FC = () => {
  const { state, updateConfig, startGame, addBot, isNetworkHost } = useGame();
  const { players, config, gameCode } = state;

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
              alert(`Link copied!`);
          }
      } catch (err) {
          await navigator.clipboard.writeText(shareUrl);
          alert(`Link copied!`);
      }
  };

  const MIN_PLAYERS = 4;

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-slate-900/40 p-4 rounded-2xl backdrop-blur-md border border-white/10">
        <div>
          <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Room Code</span>
          <h2 className="text-4xl font-mono font-black text-white">{gameCode}</h2>
        </div>
        <Button variant="secondary" className="!py-2 !px-4 text-xs font-bold" onClick={handleShare}>SHARE LINK</Button>
      </div>

      <div className="flex-1 overflow-y-auto mb-6">
        <div className="flex justify-between items-end mb-6">
             <h3 className="text-indigo-200 font-bold uppercase text-sm tracking-widest">Crew ({players.length})</h3>
             {isNetworkHost && (
                 <button 
                  onClick={addBot} 
                  className="text-xs bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors font-bold uppercase"
                 >
                  + Add Bot
                 </button>
             )}
        </div>
        <div className="grid grid-cols-3 gap-y-8 gap-x-4 pb-8">
          {players.map(p => (
            <div key={p.id} className="animate-bounce-in">
              <Avatar 
                seed={p.avatarSeed} 
                url={p.avatarUrl} 
                name={p.name} 
                size="md" 
                className="transform hover:scale-110 transition-transform cursor-default"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Game Style</label>
            <div className={`flex gap-3 ${!isNetworkHost ? 'opacity-60 pointer-events-none' : ''}`}>
                {(['IN_PERSON', 'PHONE'] as const).map(mode => (
                    <button 
                        key={mode}
                        onClick={() => handleConfigChange({ mode })}
                        className={`flex-1 p-3 rounded-xl font-bold border transition-all ${config.mode === mode ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-slate-700 bg-slate-800/50 text-slate-500 hover:border-slate-600'}`}
                    >
                        {mode === 'IN_PERSON' ? 'Party' : 'Remote'}
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cycles (Rounds)</label>
            <div className={`flex gap-3 ${!isNetworkHost ? 'opacity-60 pointer-events-none' : ''}`}>
                {[1, 2, 3].map(num => (
                    <button 
                        key={num}
                        onClick={() => handleConfigChange({ cycles: num })}
                        className={`flex-1 p-3 rounded-xl font-bold border transition-all ${config.cycles === num ? 'border-game-accent bg-game-accent/20 text-game-accent shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'border-slate-700 bg-slate-800/50 text-slate-500 hover:border-slate-600'}`}
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>

        {isNetworkHost ? (
            <Button fullWidth disabled={players.length < MIN_PLAYERS} onClick={startGame} className="ring-offset-2 ring-offset-slate-900 focus:ring-2 ring-game-primary">
                {players.length < MIN_PLAYERS ? `NEED ${MIN_PLAYERS - players.length} MORE` : "START GAME"}
            </Button>
        ) : (
            <div className="text-center p-5 text-slate-400 font-bold bg-slate-800/30 rounded-2xl border border-slate-700/50 animate-pulse uppercase tracking-widest text-xs">
              Waiting for host to launch...
            </div>
        )}
      </div>
    </div>
  );
};
