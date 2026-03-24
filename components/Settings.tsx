
import React, { useState } from 'react';
import { audioService } from '../services/audioService';
import { useGame } from '../context/GameContext';
import { Button } from './Button';
import { GamePhase } from '../types';

export const Settings: React.FC = () => {
  const { state, reconnectGame, leaveGame, myPlayerId } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [musicMuted, setMusicMuted] = useState(audioService.getMusicMuted());
  const [sfxMuted, setSfxMuted] = useState(audioService.getSfxMuted());
  const [rejoinCode, setRejoinCode] = useState('');

  const activeCode = state.gameCode;
  const inGame = state.phase !== GamePhase.HOME;

  const toggleMusic = () => {
    const newState = audioService.toggleMusicMute();
    setMusicMuted(newState);
    audioService.playSfx('click');
  };

  const toggleSfx = () => {
    const newState = audioService.toggleSfxMute();
    setSfxMuted(newState);
    if (!newState) audioService.playSfx('click');
  };

  const handleManualRejoin = () => {
    if (rejoinCode.length === 5 && myPlayerId) {
      reconnectGame(rejoinCode.toUpperCase(), myPlayerId);
      setIsOpen(false);
    }
  };

  const handleLeave = () => {
    if (window.confirm("Are you sure you want to leave this session?")) {
      leaveGame();
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div className="relative">
        <button 
          onClick={() => {
            setIsOpen(!isOpen);
            audioService.playSfx('click');
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-2xl transition-all active:scale-90 border-2 ${isOpen ? 'bg-indigo-600 border-white' : 'bg-slate-800/80 border-white/10 backdrop-blur-lg'}`}
          aria-label="Settings"
        >
          ⚙️
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
            <div className="absolute top-14 right-0 bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl min-w-[260px] animate-bounce-in space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">Music</span>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Mystery Trap</span>
                  </div>
                  <button 
                    onClick={toggleMusic}
                    className={`w-10 h-6 rounded-full relative transition-colors ${musicMuted ? 'bg-slate-700' : 'bg-indigo-500'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${musicMuted ? 'left-1' : 'left-5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">SFX</span>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Tactile Feedback</span>
                  </div>
                  <button 
                    onClick={toggleSfx}
                    className={`w-10 h-6 rounded-full relative transition-colors ${sfxMuted ? 'bg-slate-700' : 'bg-indigo-500'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${sfxMuted ? 'left-1' : 'left-5'}`} />
                  </button>
                </div>
              </div>

              {inGame && (
                <>
                  <div className="h-px bg-white/5" />
                  <div className="space-y-3 bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Active Room</span>
                    <div className="text-3xl font-mono text-white font-black tracking-tighter text-center">
                        {activeCode || "---"}
                    </div>
                  </div>
                  <Button 
                    variant="danger" 
                    fullWidth 
                    className="!py-3 !text-xs font-black uppercase tracking-widest"
                    onClick={handleLeave}
                  >
                    Leave Session
                  </Button>
                </>
              )}

              {!inGame && (
                <>
                  <div className="h-px bg-white/5" />
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recovery Tools</span>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text" 
                        placeholder="ENTER CODE" 
                        maxLength={5}
                        value={rejoinCode}
                        onChange={(e) => setRejoinCode(e.target.value.toUpperCase())}
                        className="bg-black/40 border border-white/10 p-3 rounded-lg text-white font-mono text-center outline-none focus:border-indigo-500 text-sm"
                      />
                      <Button 
                        variant="outline" 
                        className="!py-2 text-[10px] font-black uppercase tracking-widest"
                        disabled={rejoinCode.length !== 5}
                        onClick={handleManualRejoin}
                      >
                        Reconnect to Room
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <div className="text-[9px] text-center text-slate-600 uppercase tracking-widest font-bold">
                v3.9 stable channel
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
