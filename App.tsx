
import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { GamePhase } from './types';
import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { TopicSelectionScreen } from './screens/TopicSelectionScreen';
import { ClueScreen } from './screens/ClueScreen';
import { VotingScreen } from './screens/VotingScreen';
import { RevealScreen } from './screens/RevealScreen';
import { ImposterGuessScreen } from './screens/ImposterGuessScreen';
import { ScoreboardScreen } from './screens/ScoreboardScreen';
import { Avatar } from './components/Avatar';
import { Button } from './components/Button';
import { Settings } from './components/Settings';
import { audioService } from './services/audioService';

const RecoveryOverlay: React.FC = () => {
    const { state, amIGameHost, handlePlayerRecovery } = useGame();
    if (!state.disconnectedPlayerId) return null;

    const droppedPlayer = state.players.find(p => p.id === state.disconnectedPlayerId);
    if (!droppedPlayer) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-slate-900 border border-red-500/30 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-bounce-in">
                <div className="relative mx-auto mb-6 w-24 h-24">
                    <Avatar seed={droppedPlayer.avatarSeed} url={droppedPlayer.avatarUrl} size="lg" className="grayscale opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl">⚠️</span>
                    </div>
                </div>
                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">{droppedPlayer.name} DISCONNECTED</h2>
                <p className="text-slate-400 text-sm mb-8">
                    {amIGameHost 
                        ? "Connection lost. You can wait as long as you want for them to return, or take action below." 
                        : "Waiting for the host or for the player to rejoin. The session will stay open indefinitely."}
                </p>

                {amIGameHost ? (
                    <div className="flex flex-col gap-3">
                        <Button variant="primary" fullWidth onClick={() => handlePlayerRecovery(droppedPlayer.id, 'AI')}>REPLACE WITH AI</Button>
                        <Button variant="danger" fullWidth onClick={() => handlePlayerRecovery(droppedPlayer.id, 'KICK')}>KICK PLAYER</Button>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Unlimited grace period active. Rejoin with: {state.gameCode}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-1 bg-indigo-500/20 rounded-full overflow-hidden">
                            <div className="w-full h-full bg-indigo-500 animate-[pulse_1s_infinite]"></div>
                        </div>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Waiting for signal...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const RoleRevealScreen: React.FC = () => {
    const { state, finishRoleReveal, myPlayerId } = useGame();
    const { topic, category, topicImage } = state;
    const [isRevealed, setIsRevealed] = useState(false);
    const me = state.players.find(p => p.id === myPlayerId);
    
    if (!me) return <div className="text-white text-center mt-20">Reconnecting...</div>;

    if (me.isHost) {
        return (
            <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-game-surface p-8 rounded-2xl border border-indigo-500/50 shadow-2xl w-full max-w-md animate-fade-in">
                    <Avatar seed={me.avatarSeed} url={me.avatarUrl} size="lg" className="mb-6 ring-4 ring-indigo-500 rounded-full" />
                    <h2 className="text-3xl font-black text-indigo-400 mb-6 uppercase tracking-tighter">MODERATOR</h2>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 w-full mb-6">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Current Topic</p>
                        <p className="text-xl font-bold text-white uppercase">{topic}</p>
                        <p className="text-xs text-slate-400">Category: {category}</p>
                        {topicImage && (
                            <img src={topicImage} alt="Topic Reference" className="w-full h-32 mt-4 rounded-lg object-cover" />
                        )}
                    </div>
                    <ul className="text-left text-slate-300 text-sm space-y-3 mb-8">
                        <li className="flex gap-2"><span className="text-indigo-500 font-bold">1.</span><span>You guide the game, you don't play.</span></li>
                        <li className="flex gap-2"><span className="text-indigo-500 font-bold">2.</span><span>Observe clues, you'll judge the imposter's guess at the end.</span></li>
                    </ul>
                    {me.isReady ? (
                        <p className="text-game-success font-bold animate-pulse">Waiting for players to check roles...</p>
                    ) : (
                        <Button onClick={finishRoleReveal} fullWidth>I AM READY TO MODERATE</Button>
                    )}
                </div>
            </div>
        );
    }

    if (me.isReady) {
        return (
            <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">Role Confirmed!</h2>
                <div className="p-4 bg-slate-900/50 rounded-xl border border-indigo-500/30 mb-8">
                    <p className="text-slate-400 text-sm italic">"Waiting for the other investigators to prepare..."</p>
                </div>
                <div className="flex gap-4 justify-center">
                    {state.players.filter(p => !p.isBot && !p.isHost).map(p => (
                        <div key={p.id} className={`${(p.isReady || p.isBot) ? 'opacity-100' : 'opacity-20'} transition-all duration-500 transform ${(p.isReady || p.isBot) ? 'scale-110' : 'scale-90'}`}>
                            <Avatar seed={p.avatarSeed} url={p.avatarUrl} size="sm" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-[0.4em] opacity-30">Top Secret</h2>
            <div className="bg-game-surface p-8 rounded-2xl border border-slate-700 w-full max-w-md relative min-h-[400px] flex flex-col items-center justify-center shadow-2xl overflow-hidden">
                {!isRevealed ? (
                    <div className="space-y-6 animate-fade-in flex flex-col items-center">
                        <div className="relative">
                            <Avatar seed={me.avatarSeed} url={me.avatarUrl} size="xl" />
                            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 pointer-events-none"></div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white">{me.name.toUpperCase()}</h3>
                            <p className="text-slate-400 text-xs uppercase tracking-widest">Prepare for your mission</p>
                        </div>
                        <Button onClick={() => setIsRevealed(true)} fullWidth>REVEAL IDENTITY</Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-flip-in w-full">
                         {me.isImposter ? (
                            <>
                                <div className="text-6xl mb-6 animate-pulse">🤫</div>
                                <h2 className="text-4xl font-black text-game-danger mb-4 tracking-tighter uppercase">Imposter</h2>
                                <div className="bg-red-500/10 border-y border-red-500/30 py-4 px-2 mb-6 w-full">
                                    <p className="text-slate-300 text-sm font-bold uppercase tracking-wide">Goal: You don't know the topic! Blend in by giving vague clues and try to guess the secret topic from others.</p>
                                </div>
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Your only hint</p>
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-game-danger/30 w-full">
                                    <p className="text-2xl font-bold text-yellow-400 uppercase tracking-widest">{category}</p>
                                </div>
                            </>
                         ) : (
                            <>
                                <div className="text-6xl mb-6 animate-pulse">🔍</div>
                                <h2 className="text-4xl font-black text-game-success mb-4 tracking-tighter uppercase">Innocent</h2>
                                <div className="bg-green-500/10 border-y border-green-500/30 py-4 px-2 mb-6 w-full">
                                    <p className="text-slate-300 text-sm font-bold uppercase tracking-wide">Goal: Prove you know the topic by giving subtle clues that only other Innocents would understand without revealing it to the Imposter.</p>
                                </div>
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Secret Topic</p>
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-game-success/30 w-full mb-4">
                                    <p className="text-2xl font-bold text-white uppercase tracking-widest">{topic}</p>
                                </div>
                                {topicImage && (
                                    <div className="w-full animate-fade-in">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-widest">Evidence</p>
                                        <img src={topicImage} alt="Topic" className="w-full h-32 rounded-lg object-cover ring-2 ring-white/10" />
                                    </div>
                                )}
                            </>
                         )}
                         <Button onClick={finishRoleReveal} className="mt-8" fullWidth variant={me.isImposter ? 'danger' : 'success'}>I AM READY</Button>
                    </div>
                )}
            </div>
        </div>
    )
}

const GameRouter: React.FC = () => {
  const { state } = useGame();
  
  useEffect(() => {
    audioService.playMusic();
  }, []);

  switch (state.phase) {
    case GamePhase.HOME: return <HomeScreen />;
    case GamePhase.LOBBY: return <LobbyScreen />;
    case GamePhase.TOPIC_SELECTION: return <TopicSelectionScreen />;
    case GamePhase.ROLE_REVEAL: return <RoleRevealScreen />;
    case GamePhase.ROUND_STARTER:
    case GamePhase.DISCUSSION:
    case GamePhase.CLUES:
    case GamePhase.PASS_DEVICE: return <ClueScreen />;
    case GamePhase.VOTING: return <VotingScreen />;
    case GamePhase.REVEAL: return <RevealScreen />;
    case GamePhase.IMPOSTER_GUESS:
    case GamePhase.HOST_REVIEW: return <ImposterGuessScreen />;
    case GamePhase.SCOREBOARD:
    case GamePhase.WINNER:
    case GamePhase.SETUP: return <ScoreboardScreen />;
    default: return <div className="text-white text-center mt-10">Syncing Game State...</div>;
  }
};

const App: React.FC = () => (
  <GameProvider>
    <Settings />
    <RecoveryOverlay />
    <GameRouter />
  </GameProvider>
);
export default App;
