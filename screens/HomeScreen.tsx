
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Camera } from '../components/Camera';
import { audioService } from '../services/audioService';

const TutorialOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex flex-col p-8 overflow-y-auto animate-fade-in">
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">How to Play</h2>
        <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
      </div>

      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 shrink-0 bg-indigo-500 rounded-full flex items-center justify-center font-black text-white">1</div>
          <div>
            <h3 className="font-bold text-lg text-white">The Setup</h3>
            <p className="text-slate-400 text-sm">One player is the Host. Everyone else is either an <span className="text-green-400 font-bold">Innocent</span> or the <span className="text-red-400 font-bold">Imposter</span>.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 shrink-0 bg-indigo-500 rounded-full flex items-center justify-center font-black text-white">2</div>
          <div>
            <h3 className="font-bold text-lg text-white">Role Reveal</h3>
            <p className="text-slate-400 text-sm">Innocents see the secret topic. The Imposter only sees the category!</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 shrink-0 bg-indigo-500 rounded-full flex items-center justify-center font-black text-white">3</div>
          <div>
            <h3 className="font-bold text-lg text-white">Clues</h3>
            <p className="text-slate-400 text-sm">Everyone gives 2 clues. Innocents want to prove they know the topic without giving it away. Imposters try to fake it!</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 shrink-0 bg-indigo-500 rounded-full flex items-center justify-center font-black text-white">4</div>
          <div>
            <h3 className="font-bold text-lg text-white">Voting</h3>
            <p className="text-slate-400 text-sm">The group votes on who the Imposter is. If the Imposter isn't identified by a clear majority, they win big points!</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 shrink-0 bg-indigo-500 rounded-full flex items-center justify-center font-black text-white">5</div>
          <div>
            <h3 className="font-bold text-lg text-white">Judgement</h3>
            <p className="text-slate-400 text-sm">The Imposter gets one last chance to guess the topic for bonus points.</p>
          </div>
        </div>
      </div>

      <Button fullWidth onClick={onClose} className="mt-8">GOT IT!</Button>
    </div>
  </div>
);

const GameLogo = () => (
  <div className="relative w-32 h-32 mx-auto mb-6 group">
    <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-2xl group-hover:bg-indigo-500/50 transition-all duration-500"></div>
    <svg viewBox="0 0 100 100" className="relative w-full h-full drop-shadow-2xl">
      <defs>
        {/* Fixed duplicate attribute: changed the second x2 to y2 to create a correct linear gradient */}
        <linearGradient id="irisGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500/50 animate-[pulse_3s_infinite]" />
      <g className="animate-blink origin-center">
        <path d="M15 50 C15 50 30 30 50 30 C70 30 85 50 85 50 C85 50 70 70 50 70 C30 70 15 50 15 50 Z" fill="#1e293b" stroke="currentColor" strokeWidth="4" className="text-white" />
        <circle cx="50" cy="50" r="12" fill="url(#irisGradient)" className="animate-pulse" />
        <circle cx="50" cy="50" r="5" fill="#0f172a" />
        <circle cx="47" cy="47" r="2" fill="white" fillOpacity="0.8" />
      </g>
    </svg>
  </div>
);

export const HomeScreen: React.FC = () => {
  const { createGame, joinGame, reconnectGame } = useGame();
  const [view, setView] = useState<'MAIN' | 'JOIN' | 'CREATE'>('MAIN');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeSession, setActiveSession] = useState<{ code: string, id: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
        setJoinCode(urlCode.toUpperCase());
        setView('JOIN');
    }
    const storedCode = sessionStorage.getItem('imposter_gameCode');
    const storedId = sessionStorage.getItem('imposter_playerId');
    if (storedCode && storedId) setActiveSession({ code: storedCode, id: storedId });
  }, []);

  const handleAction = (callback: () => void) => {
    audioService.playMusic();
    callback();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode || !playerName || !avatarUrl) return;
    setIsConnecting(true);
    setErrorMsg('');
    try {
        await joinGame(joinCode, playerName, avatarUrl);
    } catch (err: any) {
        setIsConnecting(false);
        setErrorMsg(err.message || "Failed to join game.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !avatarUrl) return;
    setIsConnecting(true);
    setErrorMsg('');
    try {
        await createGame(playerName, avatarUrl);
    } catch (err: any) {
        setIsConnecting(false);
        setErrorMsg(err.message || "Failed to create game.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center relative overflow-hidden bg-game-bg">
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      
      {isConnecting && (
        <div className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">Waiting for Host</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xs">Attempting to sync with the room signal. This may take a moment...</p>
        </div>
      )}

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500 rounded-full blur-3xl animate-blob"></div>
         <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="z-10 w-full max-w-md space-y-8">
        <div className="animate-fade-in-down">
          <GameLogo />
          <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 mb-1 drop-shadow-lg">IMPOSTER</h1>
          <p className="text-indigo-200/60 text-sm uppercase tracking-[0.5em] font-medium">Digital Deduction</p>
        </div>

        {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 text-sm font-bold animate-shake">
                ⚠️ {errorMsg}
            </div>
        )}

        {view === 'MAIN' && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            {activeSession && (
                <div className="bg-indigo-500/20 border border-indigo-500/50 p-4 rounded-xl flex items-center justify-between animate-bounce-in">
                    <div className="text-left"><p className="text-xs text-indigo-300 font-bold uppercase">Quick Rejoin</p><p className="text-white font-mono">{activeSession.code}</p></div>
                    <Button onClick={() => handleAction(() => reconnectGame(activeSession.code, activeSession.id))} className="!py-2 !px-4 text-sm">REJOIN</Button>
                </div>
            )}
            <Button onClick={() => handleAction(() => setView('CREATE'))}>CREATE GAME</Button>
            <Button variant="secondary" onClick={() => handleAction(() => setView('JOIN'))}>JOIN GAME</Button>
            <button 
                onClick={() => setShowTutorial(true)} 
                className="text-xs font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors mt-2"
            >
                How to Play?
            </button>
          </div>
        )}

        {(view === 'JOIN' || view === 'CREATE') && (
          <form onSubmit={view === 'JOIN' ? handleJoin : handleCreate} className="flex flex-col gap-4 bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 animate-fade-in-up">
            <h2 className="text-xl font-bold mb-2 text-white">{view === 'JOIN' ? 'Join Lobby' : 'Create Game'}</h2>
            
            <div className="flex flex-col items-center gap-4 mb-4">
                {showCamera && (
                    <Camera onCapture={(img) => { setAvatarUrl(img); setShowCamera(false); }} onCancel={() => setShowCamera(false)} />
                )}
                <div className={`w-32 h-32 rounded-full bg-slate-800 border-4 flex items-center justify-center overflow-hidden relative transition-all ${!avatarUrl ? 'border-game-primary border-dashed animate-pulse' : 'border-game-accent shadow-lg scale-105'}`}>
                    {avatarUrl ? <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-4xl text-slate-500">👤</span>}
                </div>
                <div className="flex gap-2 w-full">
                    <Button type="button" variant="secondary" className="flex-1 py-2 text-xs" onClick={() => handleAction(() => fileInputRef.current?.click())}>Upload</Button>
                    <Button type="button" variant="secondary" className="flex-1 py-2 text-xs" onClick={() => handleAction(() => setShowCamera(true))}>Take Selfie</Button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>

            {view === 'JOIN' && (
                <input type="text" placeholder="GAME CODE" maxLength={5} className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-center text-xl font-mono uppercase text-white outline-none focus:border-indigo-500" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} />
            )}
            <input type="text" placeholder="YOUR NAME" className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-center text-xl text-white outline-none focus:border-indigo-500" value={playerName} onChange={e => setPlayerName(e.target.value)} />
            
            <div className="flex gap-3 mt-4">
                <Button type="button" variant="secondary" onClick={() => setView('MAIN')} className="flex-1">Back</Button>
                <Button type="submit" className="flex-1" disabled={!playerName || !avatarUrl || (view === 'JOIN' && !joinCode)}>Enter</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
