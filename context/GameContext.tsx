
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { GamePhase, GameState, Player, GameConfig, GameContextType } from '../types';
import Peer, { DataConnection } from 'peerjs';
import { audioService } from '../services/audioService';
import { generateClue, generateHostTopic, generateImposterGuess } from '../services/geminiService';

type GameAction = 
  | { type: 'SYNC_STATE'; state: GameState }
  | { type: 'JOIN_REQUEST'; player: Player }
  | { type: 'UPDATE_CONFIG'; config: Partial<GameConfig> }
  | { type: 'START_GAME' }
  | { type: 'SET_TOPIC'; topic: string; category: string; image?: string; manualImposterIds?: string[] }
  | { type: 'SUBMIT_CLUE'; text: string }
  | { type: 'SUBMIT_VOTE'; voterId: string; votedForId: string }
  | { type: 'START_VOTING' }
  | { type: 'CONFIRM_STARTER' }
  | { type: 'START_IMPOSTER_GUESS' }
  | { type: 'SUBMIT_GUESS'; guess: string }
  | { type: 'JUDGE_GUESS'; isCorrect: boolean }
  | { type: 'ACK_ROUND_END'; playerId: string }
  | { type: 'RESET_GAME' }
  | { type: 'ADD_BOT' }
  | { type: 'PLAYER_DISCONNECTED'; playerId: string }
  | { type: 'RECOVER_PLAYER'; playerId: string; recoveryAction: 'KICK' | 'AI' };

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_STATE: GameState = {
  gameCode: '',
  phase: GamePhase.HOME,
  players: [],
  config: { mode: 'IN_PERSON', imposterCount: 1, cycles: 1 },
  currentTurnIndex: 0,
  clueRound: 1,
  currentHostId: null,
  hostIndex: 0,
  pastHostIds: [],
  currentCycle: 1,
  topic: '',
  category: '',
  clues: [],
  votes: {},
  imposterGuess: null,
  imposterGuessCorrect: null,
  winningPlayerId: null,
  nextPlayerTurnId: null,
  disconnectedPlayerId: null,
};

const PEER_PREFIX = 'imposter-deduction-v3-stable-';

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  const hostConnRef = useRef<DataConnection | null>(null);

  // BOT AUTO-INTELLIGENCE Logic
  useEffect(() => {
    if (!isHost) return;

    // AI Host: Automated Topic Selection
    if (state.phase === GamePhase.TOPIC_SELECTION) {
        const currentHost = state.players.find(p => p.id === state.currentHostId);
        if (currentHost?.isBot) {
            const timer = setTimeout(async () => {
                const { topic, category } = await generateHostTopic();
                dispatch({ type: 'SET_TOPIC', topic, category });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }

    // Role Reveal: Bots ready up instantly
    if (state.phase === GamePhase.ROLE_REVEAL) {
        const botsToReady = state.players.filter(p => p.isBot && !p.isReady);
        if (botsToReady.length > 0) {
            const timer = setTimeout(() => {
                botsToReady.forEach(bot => dispatch({ type: 'ACK_ROUND_END', playerId: bot.id }));
            }, 2000);
            return () => clearTimeout(timer);
        }
    }

    // Clues: Bots provide AI-generated clues
    if (state.phase === GamePhase.CLUES) {
        const currentPlayer = state.players[state.currentTurnIndex];
        if (currentPlayer && currentPlayer.isBot) {
            const timer = setTimeout(async () => {
                const role = currentPlayer.isImposter ? 'IMPOSTER' : 'INNOCENT';
                const clueText = await generateClue(role, state.topic, state.category);
                dispatch({ type: 'SUBMIT_CLUE', text: clueText });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }

    // Voting: Bots cast votes automatically
    if (state.phase === GamePhase.VOTING) {
        const botsToVote = state.players.filter(p => p.isBot && !p.isHost && !state.votes[p.id]);
        if (botsToVote.length > 0) {
            const timer = setTimeout(() => {
                // Bots pick one by one to feel more natural
                const bot = botsToVote[0];
                const candidates = state.players.filter(p => !p.isHost && p.id !== bot.id);
                if (candidates.length > 0) {
                    const target = candidates[Math.floor(Math.random() * candidates.length)];
                    dispatch({ type: 'SUBMIT_VOTE', voterId: bot.id, votedForId: target.id });
                }
            }, 2000 + (Math.random() * 3000));
            return () => clearTimeout(timer);
        }
    }

    // Reveal Phase: Bot host needs to auto-transition after animation (8-10 seconds)
    if (state.phase === GamePhase.REVEAL) {
        const currentHost = state.players.find(p => p.id === state.currentHostId);
        if (currentHost?.isBot) {
            const timer = setTimeout(() => {
                dispatch({ type: 'START_IMPOSTER_GUESS' });
            }, 10000);
            return () => clearTimeout(timer);
        }
    }

    // Imposter Guess: AI attempts to guess topic
    if (state.phase === GamePhase.IMPOSTER_GUESS) {
        const imposter = state.players.find(p => p.isImposter);
        if (imposter?.isBot) {
            const timer = setTimeout(async () => {
                const clues = state.clues.map(c => c.text);
                const guess = await generateImposterGuess(state.category, clues);
                dispatch({ type: 'SUBMIT_GUESS', guess });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }

    // Review Phase: Automated judgment for bot imposter
    if (state.phase === GamePhase.HOST_REVIEW) {
        const imposter = state.players.find(p => p.isImposter);
        const host = state.players.find(p => p.id === state.currentHostId);
        if (host?.isBot || imposter?.isBot) {
            const timer = setTimeout(() => {
                const isCorrect = Math.random() < 0.2;
                dispatch({ type: 'JUDGE_GUESS', isCorrect });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }

    if (state.phase === GamePhase.SCOREBOARD) {
        const botsToReady = state.players.filter(p => p.isBot && !p.isReady);
        if (botsToReady.length > 0) {
            const timer = setTimeout(() => {
                botsToReady.forEach(bot => dispatch({ type: 'ACK_ROUND_END', playerId: bot.id }));
            }, 1500);
            return () => clearTimeout(timer);
        }
    }
  }, [state.phase, state.currentTurnIndex, isHost, state.players, state.currentHostId, state.votes]);

  useEffect(() => {
    const storedId = sessionStorage.getItem('imposter_playerId');
    if (storedId) setMyPlayerId(storedId);
  }, []);

  useEffect(() => {
    if (myPlayerId) sessionStorage.setItem('imposter_playerId', myPlayerId);
    if (state.gameCode) sessionStorage.setItem('imposter_gameCode', state.gameCode);
  }, [myPlayerId, state.gameCode]);

  useEffect(() => {
    if (state.phase !== GamePhase.HOME) {
        audioService.playMusic();
    }
  }, [state.phase]);

  const broadcastState = (newState: GameState) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send({ type: 'SYNC_STATE', state: newState });
      }
    });
  };

  const processAction = (action: GameAction, currentState: GameState): GameState => {
    switch (action.type) {
        case 'JOIN_REQUEST':
            const existingIdx = currentState.players.findIndex(p => p.id === action.player.id);
            if (existingIdx !== -1) {
                const updatedPlayers = [...currentState.players];
                updatedPlayers[existingIdx] = {
                    ...updatedPlayers[existingIdx],
                    name: action.player.name || updatedPlayers[existingIdx].name,
                    avatarUrl: action.player.avatarUrl || updatedPlayers[existingIdx].avatarUrl,
                    isDisconnected: false
                };
                return { ...currentState, players: updatedPlayers, disconnectedPlayerId: currentState.disconnectedPlayerId === action.player.id ? null : currentState.disconnectedPlayerId };
            }
            return { ...currentState, players: [...currentState.players, action.player] };
        
        case 'PLAYER_DISCONNECTED':
            return {
                ...currentState,
                disconnectedPlayerId: action.playerId,
                players: currentState.players.map(p => p.id === action.playerId ? { ...p, isDisconnected: true } : p)
            };

        case 'RECOVER_PLAYER': {
            if (action.recoveryAction === 'KICK') {
                return {
                    ...currentState,
                    disconnectedPlayerId: null,
                    players: currentState.players.filter(p => p.id !== action.playerId)
                };
            } else {
                return {
                    ...currentState,
                    disconnectedPlayerId: null,
                    players: currentState.players.map(p => p.id === action.playerId ? { ...p, isDisconnected: false, isBot: true } : p)
                };
            }
        }

        case 'UPDATE_CONFIG':
            return { ...currentState, config: { ...currentState.config, ...action.config } };
        
        case 'ADD_BOT': {
             audioService.playSfx('pop');
             const names = ["Unit-X", "Spark", "Gizmo", "Chip", "Bolt", "Nexus", "Circuit", "Pixel", "Droid", "Robo"];
             const botPlayer: Player = {
                id: "BOT-" + Math.random().toString(36).substr(2, 9),
                name: names[Math.floor(Math.random() * names.length)],
                avatarSeed: Math.random().toString(),
                isHost: false,
                isImposter: false,
                isBot: true,
                score: 0,
                voteCount: 0,
                isReady: false
             };
             return { ...currentState, players: [...currentState.players, botPlayer] };
        }

        case 'START_GAME': {
            audioService.playSfx('success');
            if (currentState.players.length < 4) return currentState;
            const randHostIdx = Math.floor(Math.random() * currentState.players.length);
            const hostId = currentState.players[randHostIdx].id;
            return {
                ...currentState,
                players: currentState.players.map(p => ({
                    ...p, isHost: p.id === hostId, isImposter: false, voteCount: 0, isReady: false, score: 0
                })),
                currentHostId: hostId,
                pastHostIds: [hostId],
                currentCycle: 1,
                phase: GamePhase.TOPIC_SELECTION,
                clues: [],
                votes: {},
                topic: '',
            };
        }

        case 'SET_TOPIC': {
            audioService.playSfx('pop');
            const hostId = currentState.currentHostId;
            const manualImposterIds = action.manualImposterIds || [];
            const players = [...currentState.players];
            const imposterIndices = new Set<number>();
            
            if (manualImposterIds.length > 0) {
                 manualImposterIds.forEach(id => {
                     const idx = players.findIndex(p => p.id === id);
                     if (idx !== -1) imposterIndices.add(idx);
                 });
            } else {
                 while (imposterIndices.size < currentState.config.imposterCount) {
                    const idx = Math.floor(Math.random() * players.length);
                    if (players[idx].id !== hostId && !imposterIndices.has(idx)) {
                        imposterIndices.add(idx);
                    }
                }
            }

            const newPlayers = players.map((p, idx) => ({
                ...p,
                isHost: p.id === hostId,
                isImposter: imposterIndices.has(idx),
                isReady: false
            }));

            const eligibleStarters = newPlayers.filter(p => !p.isHost);
            const tickets: number[] = [];
            eligibleStarters.forEach(p => {
                const count = p.isImposter ? 1 : 4; 
                const idx = players.findIndex(orig => orig.id === p.id);
                for (let i = 0; i < count; i++) tickets.push(idx);
            });
            const randomStarterIndex = tickets[Math.floor(Math.random() * tickets.length)];

            return {
                ...currentState,
                players: newPlayers,
                currentTurnIndex: randomStarterIndex,
                topic: action.topic,
                category: action.category,
                topicImage: action.image,
                phase: GamePhase.ROLE_REVEAL,
                imposterGuess: null,
                imposterGuessCorrect: null,
            };
        }
        
        case 'CONFIRM_STARTER':
            return { ...currentState, phase: GamePhase.DISCUSSION };

        case 'START_VOTING':
             audioService.playSfx('danger');
             return { ...currentState, phase: GamePhase.VOTING };

        case 'SUBMIT_CLUE': {
            audioService.playSfx('pop');
            const currentPlayer = currentState.players[currentState.currentTurnIndex];
            const newClues = [...currentState.clues, { playerId: currentPlayer.id, text: action.text, timestamp: Date.now() }];
            const activePlayerCount = currentState.players.length - 1;
            const totalCluesNeeded = activePlayerCount * 2;
            let nIdx = (currentState.currentTurnIndex + 1) % currentState.players.length;
            let nRound = currentState.clueRound;
            if (currentState.players[nIdx].isHost) nIdx = (nIdx + 1) % currentState.players.length;
            if (newClues.length >= totalCluesNeeded) return { ...currentState, clues: newClues, phase: GamePhase.VOTING };
            if (newClues.length >= activePlayerCount) nRound = 2;
            return { ...currentState, clues: newClues, currentTurnIndex: nIdx, clueRound: nRound, phase: GamePhase.CLUES };
        }

        case 'SUBMIT_VOTE': {
            audioService.playSfx('vote');
            const newVotes = { ...currentState.votes, [action.voterId]: action.votedForId };
            const playersWhoMustVote = currentState.players.filter(p => !p.isHost && !p.isDisconnected);
            const everyoneVoted = playersWhoMustVote.every(p => newVotes[p.id]);

            if (everyoneVoted) {
                const updatedPlayers = currentState.players.map(p => {
                    const votesReceived = Object.values(newVotes).filter(id => id === p.id).length;
                    return { ...p, voteCount: votesReceived };
                });
                return { ...currentState, players: updatedPlayers, votes: newVotes, phase: GamePhase.REVEAL };
            }
            return { ...currentState, votes: newVotes };
        }
        
        case 'START_IMPOSTER_GUESS':
             return { ...currentState, phase: GamePhase.IMPOSTER_GUESS };

        case 'SUBMIT_GUESS':
             audioService.playSfx('pop');
             return { ...currentState, imposterGuess: action.guess, phase: GamePhase.HOST_REVIEW };

        case 'JUDGE_GUESS': {
            if (action.isCorrect) audioService.playSfx('success');
            else audioService.playSfx('danger');
            const imposter = currentState.players.find(p => p.isImposter);
            if (!imposter) return currentState;

            const totalVotingPlayers = currentState.players.filter(p => !p.isHost).length;
            const majorityVotedForImposter = imposter.voteCount > (totalVotingPlayers / 2);

            const newPlayers = currentState.players.map(p => {
                let roundPoints = 0;
                if (p.isHost) return p;
                if (p.isImposter) {
                    if (!majorityVotedForImposter) roundPoints += 2;
                    if (action.isCorrect) roundPoints += 1;
                } else {
                    const theirVote = currentState.votes[p.id];
                    if (theirVote === imposter.id) roundPoints += 1;
                }
                return { ...p, score: p.score + roundPoints, isReady: false };
            });
            return { ...currentState, players: newPlayers, imposterGuessCorrect: action.isCorrect, phase: GamePhase.SCOREBOARD };
        }

        case 'ACK_ROUND_END': {
             audioService.playSfx('click');
             const updatedPlayers = currentState.players.map(p => (p.id === action.playerId) ? { ...p, isReady: !p.isReady } : p);
             const readyPlayers = updatedPlayers.filter(p => p.isReady || p.isBot || p.isDisconnected);
             if (readyPlayers.length === updatedPlayers.length) {
                if (currentState.phase === GamePhase.ROLE_REVEAL) {
                    return { ...currentState, players: updatedPlayers.map(p => ({ ...p, isReady: false })), phase: currentState.config.mode === 'IN_PERSON' ? GamePhase.ROUND_STARTER : GamePhase.CLUES };
                }
                let nextPastHosts = [...currentState.pastHostIds];
                let nextCycle = currentState.currentCycle;
                let availableHosts = currentState.players.filter(p => !nextPastHosts.includes(p.id));
                if (availableHosts.length === 0) {
                    if (nextCycle < currentState.config.cycles) {
                        nextCycle += 1;
                        nextPastHosts = [];
                        availableHosts = [...currentState.players];
                    } else {
                        const sorted = [...updatedPlayers].sort((a,b) => b.score - a.score);
                        return { ...currentState, players: updatedPlayers, winningPlayerId: sorted[0].id, phase: GamePhase.WINNER };
                    }
                }
                const nextHost = availableHosts[Math.floor(Math.random() * availableHosts.length)];
                return { ...currentState, players: updatedPlayers.map(p => ({ ...p, isHost: p.id === nextHost.id, isImposter: false, isReady: false, voteCount: 0 })), currentHostId: nextHost.id, pastHostIds: [...nextPastHosts, nextHost.id], currentCycle: nextCycle, phase: GamePhase.TOPIC_SELECTION, clues: [], votes: {}, topic: '', imposterGuess: null, imposterGuessCorrect: null };
             }
             return { ...currentState, players: updatedPlayers };
        }
        
        case 'RESET_GAME':
             return { ...INITIAL_STATE, gameCode: currentState.gameCode, phase: GamePhase.LOBBY, players: [] };
        default:
            return currentState;
    }
  };

  const dispatch = (action: GameAction) => {
    if (isHost) {
        const newState = processAction(action, state);
        setState(newState);
        broadcastState(newState);
    } else if (hostConnRef.current && hostConnRef.current.open) {
        hostConnRef.current.send(action);
    }
  };

  const createGame = (name: string, avatarUrl?: string) => {
    audioService.playMusic();
    return new Promise<void>((resolve, reject) => {
        if (peerRef.current) peerRef.current.destroy();
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        const playerId = Math.random().toString(36).substr(2, 9);
        const peer = new Peer(PEER_PREFIX + code, { debug: 1, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } });
        peer.on('open', () => {
            setIsHost(true);
            setMyPlayerId(playerId);
            const creatorPlayer: Player = { id: playerId, name, avatarSeed: Math.random().toString(), avatarUrl, isHost: false, isImposter: false, isBot: false, score: 0, voteCount: 0, isReady: false };
            setState({ ...INITIAL_STATE, gameCode: code, phase: GamePhase.LOBBY, players: [creatorPlayer] });
            peerRef.current = peer;
            resolve();
        });
        peer.on('error', (err) => reject(new Error(err.type === 'unavailable-id' ? "Room code busy." : "Network server error.")));
        peer.on('connection', (conn) => {
            connectionsRef.current.push(conn);
            conn.on('open', () => conn.send({ type: 'SYNC_STATE', state: state }));
            conn.on('data', (data: any) => {
                setState(current => {
                    const updated = processAction(data as GameAction, current);
                    connectionsRef.current.forEach(c => { if (c.open) c.send({ type: 'SYNC_STATE', state: updated }); });
                    return updated;
                });
            });
            conn.on('close', () => {
                connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
                // Mark player as disconnected in the state
                const playerMeta = (conn as any).metadata?.playerId;
                if (playerMeta) {
                    dispatch({ type: 'PLAYER_DISCONNECTED', playerId: playerMeta });
                }
            });
        });
    });
  };

  const joinGame = (code: string, name: string, avatarUrl?: string) => {
    audioService.playMusic();
    return new Promise<void>((resolve, reject) => {
        if (peerRef.current) peerRef.current.destroy();
        const playerId = sessionStorage.getItem('imposter_playerId') || Math.random().toString(36).substr(2, 9);
        const peer = new Peer({ debug: 1, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } }); 
        const timeout = setTimeout(() => { peer.destroy(); reject(new Error("Game session not found or timed out.")); }, 120000);
        peer.on('open', () => {
            const conn = peer.connect(PEER_PREFIX + code.toUpperCase(), { 
                reliable: true,
                metadata: { playerId }
            });
            conn.on('open', () => {
                clearTimeout(timeout);
                hostConnRef.current = conn;
                setIsHost(false);
                setMyPlayerId(playerId);
                peerRef.current = peer;
                const player: Player = { id: playerId, name, avatarSeed: Math.random().toString(), avatarUrl: avatarUrl, isHost: false, isImposter: false, isBot: false, score: 0, voteCount: 0, isReady: false };
                conn.send({ type: 'JOIN_REQUEST', player });
                resolve();
            });
            conn.on('data', (data: any) => { if (data.type === 'SYNC_STATE') setState(data.state); });
            conn.on('error', (err) => { clearTimeout(timeout); reject(new Error("Connection lost.")); });
        });
        peer.on('error', (err) => { clearTimeout(timeout); reject(new Error(err.type === 'peer-unavailable' ? "Room doesn't exist." : "Network error.")); });
    });
  };

  const reconnectGame = (code: string, playerId: string) => {
      audioService.playMusic();
      if (peerRef.current) peerRef.current.destroy();
      const peer = new Peer({ debug: 1, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } });
      peer.on('open', () => {
          const conn = peer.connect(PEER_PREFIX + code.toUpperCase(), { 
              reliable: true,
              metadata: { playerId }
          });
          conn.on('open', () => {
              hostConnRef.current = conn;
              setIsHost(false);
              setMyPlayerId(playerId);
              peerRef.current = peer;
              conn.on('data', (data: any) => { if (data.type === 'SYNC_STATE') setState(data.state); });
          });
      });
  };

  const leaveGame = () => {
      if (peerRef.current) peerRef.current.destroy();
      hostConnRef.current = null;
      connectionsRef.current = [];
      setIsHost(false);
      setMyPlayerId(null);
      setState(INITIAL_STATE);
      sessionStorage.removeItem('imposter_gameCode');
      sessionStorage.removeItem('imposter_playerId');
  };

  const handlePlayerRecovery = (playerId: string, action: 'KICK' | 'AI') => {
      dispatch({ type: 'RECOVER_PLAYER', playerId, recoveryAction: action });
  };

  const updateConfig = (config: Partial<GameConfig>) => dispatch({ type: 'UPDATE_CONFIG', config });
  const startGame = () => dispatch({ type: 'START_GAME' });
  const addBot = () => dispatch({ type: 'ADD_BOT' });
  const setTopic = (topic: string, category: string, image?: string, manualImposterIds?: string[]) => dispatch({ type: 'SET_TOPIC', topic, category, image, manualImposterIds });
  const finishRoleReveal = () => myPlayerId && dispatch({ type: 'ACK_ROUND_END', playerId: myPlayerId });
  const confirmStarter = () => dispatch({ type: 'CONFIRM_STARTER' });
  const startVoting = () => dispatch({ type: 'START_VOTING' });
  const confirmPassDevice = () => { };
  const startImposterGuess = () => dispatch({ type: 'START_IMPOSTER_GUESS' });
  const submitClue = (text: string) => dispatch({ type: 'SUBMIT_CLUE', text });
  const submitVote = (voterId: string, votedForId: string) => dispatch({ type: 'SUBMIT_VOTE', voterId, votedForId });
  const submitImposterGuess = (guess: string) => dispatch({ type: 'SUBMIT_GUESS', guess });
  const judgeImposterGuess = (isCorrect: boolean) => dispatch({ type: 'JUDGE_GUESS', isCorrect });
  const acknowledgeRoundEnd = (playerId: string) => dispatch({ type: 'ACK_ROUND_END', playerId });
  const resetGame = () => dispatch({ type: 'RESET_GAME' });

  const amIGameHost = !!state.currentHostId && state.currentHostId === myPlayerId;

  return (
    <GameContext.Provider value={{
      state, isHost, isNetworkHost: isHost, myPlayerId, amIGameHost, createGame, joinGame, reconnectGame, leaveGame, updateConfig, startGame, setTopic, submitClue, submitVote, submitImposterGuess, judgeImposterGuess, acknowledgeRoundEnd, resetGame, addBot, confirmPassDevice,
      finishRoleReveal, startVoting, confirmStarter, startImposterGuess, handlePlayerRecovery
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};
