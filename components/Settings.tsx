
import React, { useState } from 'react';
import { audioService } from '../services/audioService';
import { useGame } from '../context/GameContext';
import { Button } from './Button';
import { GamePhase } from '../types';
import { Settings as SettingsIcon, Music, Volume2, VolumeX, LogOut, RefreshCw, Users, UserMinus, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './Avatar';

export const Settings: React.FC = () => {
  const { state, reconnectGame, leaveGame, myPlayerId, amIGameHost, handlePlayerRecovery } = useGame();
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

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [kickPlayerId, setKickPlayerId] = useState<string | null>(null);

  const handleLeave = () => {
    leaveGame();
    setIsOpen(false);
    setShowLeaveConfirm(false);
  };

  const handleKick = (playerId: string) => {
    handlePlayerRecovery(playerId, 'KICK');
    audioService.playSfx('danger');
    setKickPlayerId(null);
  };

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div className="relative">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setIsOpen(!isOpen);
            setShowLeaveConfirm(false);
            setKickPlayerId(null);
            audioService.unlock();
            audioService.playSfx('click');
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all border-2 ${isOpen ? 'bg-indigo-600 border-white' : 'bg-slate-800/80 border-white/10 backdrop-blur-lg'}`}
          aria-label="Settings"
        >
          {isOpen ? <X size={24} className="text-white" /> : <SettingsIcon size={24} className="text-white" />}
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px]" 
                onClick={() => {
                  setIsOpen(false);
                  setShowLeaveConfirm(false);
                }} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
                className="absolute top-14 right-0 bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl min-w-[280px] space-y-6 overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {showLeaveConfirm ? (
                    <motion.div 
                      key="confirm-leave"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4 py-2"
                    >
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                          <AlertTriangle className="text-red-400" size={24} />
                        </div>
                        <h3 className="text-white font-bold">Leave Session?</h3>
                        <p className="text-xs text-slate-400">You will lose your current progress in this room.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" fullWidth onClick={() => setShowLeaveConfirm(false)}>Cancel</Button>
                        <Button variant="danger" fullWidth onClick={handleLeave}>Leave</Button>
                      </div>
                    </motion.div>
                  ) : kickPlayerId ? (
                    <motion.div 
                      key="confirm-kick"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4 py-2"
                    >
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                          <UserMinus className="text-red-400" size={24} />
                        </div>
                        <h3 className="text-white font-bold">Kick Player?</h3>
                        <p className="text-xs text-slate-400">Are you sure you want to remove {state.players.find(p => p.id === kickPlayerId)?.name} from the game?</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" fullWidth onClick={() => setKickPlayerId(null)}>Cancel</Button>
                        <Button variant="danger" fullWidth onClick={() => handleKick(kickPlayerId)}>Kick</Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="menu"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                              <Music size={18} className="text-indigo-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">Music</span>
                              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Chill Mystery</span>
                            </div>
                          </div>
                          <button 
                            onClick={toggleMusic}
                            className={`w-10 h-6 rounded-full relative transition-colors ${musicMuted ? 'bg-slate-700' : 'bg-indigo-500'}`}
                          >
                            <motion.div 
                              animate={{ x: musicMuted ? 4 : 20 }}
                              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" 
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                              {sfxMuted ? <VolumeX size={18} className="text-indigo-400" /> : <Volume2 size={18} className="text-indigo-400" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">SFX</span>
                              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Tactile</span>
                            </div>
                          </div>
                          <button 
                            onClick={toggleSfx}
                            className={`w-10 h-6 rounded-full relative transition-colors ${sfxMuted ? 'bg-slate-700' : 'bg-indigo-500'}`}
                          >
                            <motion.div 
                              animate={{ x: sfxMuted ? 4 : 20 }}
                              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" 
                            />
                          </button>
                        </div>
                      </div>

                      {inGame && (
                        <>
                          <div className="h-px bg-white/5" />
                          
                          {/* Player Management for Host */}
                          {amIGameHost && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <Users size={12} />
                                Manage Crew
                              </div>
                              <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {state.players.map(p => (
                                  <div key={p.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2">
                                      <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="xs" />
                                      <span className="text-xs font-bold text-white truncate max-w-[100px]">
                                        {p.name} {p.id === myPlayerId && "(You)"}
                                      </span>
                                    </div>
                                    {p.id !== myPlayerId && (
                                      <button 
                                        onClick={() => setKickPlayerId(p.id)}
                                        className="p-1.5 hover:bg-red-500/20 rounded-md text-red-400 transition-colors"
                                        title="Kick Player"
                                      >
                                        <UserMinus size={14} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

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
                            onClick={() => setShowLeaveConfirm(true)}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <LogOut size={14} />
                              Leave Session
                            </div>
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
                                <div className="flex items-center justify-center gap-2">
                                  <RefreshCw size={14} />
                                  Reconnect
                                </div>
                              </Button>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="text-[9px] text-center text-slate-600 uppercase tracking-widest font-bold">
                        v4.0 stable channel
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
