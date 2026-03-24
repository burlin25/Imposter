
import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { audioService } from '../services/audioService';

export const RevealScreen: React.FC = () => {
  const { state, startImposterGuess, amIGameHost } = useGame();
  const { players } = state;
  const [stage, setStage] = useState(0); 

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStage(1);
    }, 3000); 
    const t2 = setTimeout(() => {
      setStage(2);
      audioService.playSfx('reveal');
    }, 6000); 
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-1000 flex flex-col items-center justify-center p-6 text-center ${stage >= 2 ? 'bg-black' : 'bg-game-bg'}`}>
      
      {stage === 0 && (
        <div className="w-full space-y-8 animate-fade-in">
           <h2 className="text-2xl font-black text-white uppercase tracking-[0.3em]">Tallying Votes...</h2>
           <div className="grid grid-cols-3 gap-8">
              {players.filter(p => !p.isHost).map(p => (
                  <div key={p.id} className="relative flex flex-col items-center">
                      <Avatar seed={p.avatarSeed} url={p.avatarUrl} name={p.name} size="lg" />
                      {p.voteCount > 0 && (
                          <div className="absolute -top-2 -right-2 bg-white text-black font-black w-8 h-8 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)] transform scale-125 z-10">
                              {p.voteCount}
                          </div>
                      )}
                  </div>
              ))}
           </div>
        </div>
      )}

      {stage === 1 && (
        <div className="animate-shake">
            <h1 className="text-5xl font-black text-white tracking-[0.2em] mb-4 uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">THE IMPOSTER WAS...</h1>
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mt-8"></div>
        </div>
      )}

      {stage === 2 && (
        <div className="w-full max-w-lg space-y-12 animate-bounce-in">
             <div className="relative py-12 border-y-4 border-red-600 bg-red-950/20 overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                 <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                 
                 <h2 className="text-red-600 font-black text-4xl uppercase tracking-[0.4em] mb-10 relative z-10 animate-pulse">EXPOSED</h2>
                 
                 <div className="flex justify-center gap-10 relative z-10">
                     {players.filter(p => p.isImposter).map(p => (
                         <div key={p.id} className="flex flex-col items-center group">
                              <div className="relative">
                                  <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="xl" className="ring-4 ring-red-600 rounded-full grayscale hover:grayscale-0 transition-all duration-700" />
                                  <div className="absolute inset-0 bg-red-600/20 rounded-full animate-ping pointer-events-none"></div>
                              </div>
                              <span className="mt-6 font-black text-white text-2xl tracking-widest">{p.name.toUpperCase()}</span>
                              <span className="text-red-500 font-bold text-xs mt-1 tracking-tighter uppercase">IMPOSTER</span>
                         </div>
                     ))}
                 </div>
             </div>

             <div className="space-y-6">
                 {amIGameHost ? (
                     <div className="flex flex-col items-center gap-4">
                        <p className="text-red-500 font-black uppercase text-xs tracking-[0.3em]">Master of Shadows</p>
                        <Button 
                            onClick={startImposterGuess} 
                            variant="danger"
                            className="w-full max-w-xs animate-pulse ring-2 ring-red-500 ring-offset-4 ring-offset-black"
                        >
                            PROCEED TO JUDGEMENT &rarr;
                        </Button>
                     </div>
                 ) : (
                     <div className="space-y-2">
                        <p className="text-red-900 animate-pulse uppercase text-sm font-black tracking-widest">
                            Waiting for the Host's verdict...
                        </p>
                        <div className="flex justify-center gap-1">
                            <div className="w-1 h-1 bg-red-600 animate-bounce"></div>
                            <div className="w-1 h-1 bg-red-600 animate-bounce delay-100"></div>
                            <div className="w-1 h-1 bg-red-600 animate-bounce delay-200"></div>
                        </div>
                     </div>
                 )}
             </div>
        </div>
      )}
    </div>
  );
};
