
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
  | { type: 'SUBMIT_CLUE'; playerId: string; text: string }
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
  syncVersion: 0,
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
const ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:global.stun.twilio.com:3478' }
];

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'offline'>('offline');
  
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  const hostConnRef = useRef<DataConnection | null>(null);
  const previousPhaseRef = useRef<GamePhase>(INITIAL_STATE.phase);
  const expectedRoomRef = useRef<string | null>(null);
  // Peer callbacks outlive React renders. These refs keep their view of the
  // room current instead of closing over the state from the initial render.
  const stateRef = useRef<GameState>(INITIAL_STATE);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
                dispatch({ type: 'SUBMIT_CLUE', playerId: currentPlayer.id, text: clueText });
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
    if (state.phase === GamePhase.HOME || state.phase === GamePhase.LOBBY) {
      audioService.playMusic('lobby');
    } else {
      audioService.playMusic('game');
    }
  }, [state.phase]);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    if (previousPhase !== state.phase) {
      audioService.playSfx(state.phase === GamePhase.REVEAL ? 'reveal' : 'transition');
      previousPhaseRef.current = state.phase;
    }
  }, [state.phase]);

  const broadcastState = (newState: GameState) => {
    connectionsRef.current = connectionsRef.current.filter(conn => conn.open);
    connectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send({ type: 'SYNC_STATE', state: newState });
      }
    });
  };

  const acceptSnapshot = (incoming: GameState) => {
    // DataConnections are reliable, but a reconnect can briefly leave two
    // connections alive. Never let an old snapshot send a client backwards.
    const normalized = { ...incoming, syncVersion: incoming.syncVersion ?? 0 };
    const isExpectedRoom = !expectedRoomRef.current || normalized.gameCode === expectedRoomRef.current;
    const isNewRoom = normalized.gameCode !== stateRef.current.gameCode;
    if (normalized.gameCode && isExpectedRoom && (isNewRoom || normalized.syncVersion >= stateRef.current.syncVersion)) {
      stateRef.current = normalized;
      setState(normalized);
      setConnectionStatus('connected');
    }
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
            // A new identity may enter while the room is forming, but joining
            // a live round would change clue/vote totals without a role reveal.
            if (currentState.phase !== GamePhase.LOBBY) return currentState;
            return { ...currentState, players: [...currentState.players, action.player] };
        
        case 'PLAYER_DISCONNECTED':
            if (!currentState.players.some(p => p.id === action.playerId && !p.isDisconnected)) return currentState;
            return {
                ...currentState,
                disconnectedPlayerId: action.playerId,
                players: currentState.players.map(p => p.id === action.playerId ? { ...p, isDisconnected: true } : p)
            };

        case 'RECOVER_PLAYER': {
            if (action.recoveryAction === 'KICK') {
                const kickedIdx = currentState.players.findIndex(p => p.id === action.playerId);
                if (kickedIdx === -1) return currentState;
                const remainingPlayers = currentState.players.filter(p => p.id !== action.playerId);
                const existingHost = remainingPlayers.find(p => p.id === currentState.currentHostId && !p.isDisconnected);
                const needsReplacementHost = !existingHost && currentState.phase !== GamePhase.LOBBY;
                const replacementHost = needsReplacementHost
                    ? (remainingPlayers.find(p => !p.isDisconnected && !p.isImposter) || remainingPlayers.find(p => !p.isDisconnected))
                    : existingHost;
                const nextHostId = replacementHost?.id || null;
                const remappedPlayers = remainingPlayers.map(p => ({
                    ...p,
                    isHost: p.id === nextHostId,
                    // A replacement moderator must acknowledge role reveal
                    // before the round can continue.
                    isReady: needsReplacementHost && p.id === nextHostId && currentState.phase === GamePhase.ROLE_REVEAL ? false : p.isReady
                }));
                const newState = {
                    ...currentState,
                    disconnectedPlayerId: currentState.disconnectedPlayerId === action.playerId ? null : currentState.disconnectedPlayerId,
                    currentHostId: nextHostId,
                    players: remappedPlayers
                };
                
                // Keep the turn on the same player when someone before them
                // leaves. If the active player leaves, move to the next
                // non-moderator instead of landing on the host index.
                if (remainingPlayers.length > 0 && kickedIdx < currentState.currentTurnIndex) {
                    newState.currentTurnIndex = Math.max(0, currentState.currentTurnIndex - 1);
                }
                if (newState.currentTurnIndex >= remainingPlayers.length) {
                    newState.currentTurnIndex = 0;
                }
                if (remainingPlayers.length > 0) {
                    let attempts = 0;
                    while ((newState.players[newState.currentTurnIndex].isHost || newState.players[newState.currentTurnIndex].isDisconnected) && attempts < remainingPlayers.length) {
                        newState.currentTurnIndex = (newState.currentTurnIndex + 1) % remainingPlayers.length;
                        attempts += 1;
                    }
                }

                // Removing the last unready player can satisfy the ready
                // barrier. Re-run the normal barrier transition immediately
                // so the room does not wait for a click that cannot happen.
                if ((currentState.phase === GamePhase.ROLE_REVEAL || currentState.phase === GamePhase.SCOREBOARD) && newState.players.length > 0) {
                    const readyPlayer = newState.players.find(p => p.isReady || p.isBot || p.isDisconnected);
                    if (readyPlayer && newState.players.every(p => p.isReady || p.isBot || p.isDisconnected)) {
                        return processAction({ type: 'ACK_ROUND_END', playerId: readyPlayer.id }, newState);
                    }
                }
                
                return newState;
            } else {
                return {
                    ...currentState,
                    disconnectedPlayerId: null,
                    players: currentState.players.map(p => p.id === action.playerId ? { ...p, isDisconnected: false, isBot: true } : p)
                };
            }
        }

        case 'UPDATE_CONFIG':
            if (currentState.phase !== GamePhase.LOBBY) return currentState;
            return { ...currentState, config: { ...currentState.config, ...action.config } };
        
        case 'ADD_BOT': {
             if (currentState.phase !== GamePhase.LOBBY) return currentState;
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
            if (currentState.phase !== GamePhase.LOBBY) return currentState;
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
            if (currentState.phase !== GamePhase.TOPIC_SELECTION) return currentState;
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
            if (currentState.phase !== GamePhase.ROUND_STARTER) return currentState;
            return { ...currentState, phase: GamePhase.DISCUSSION };

        case 'START_VOTING':
             if (currentState.phase !== GamePhase.DISCUSSION) return currentState;
             audioService.playSfx('danger');
             return { ...currentState, phase: GamePhase.VOTING };

        case 'SUBMIT_CLUE': {
            if (currentState.phase !== GamePhase.CLUES) return currentState;
            audioService.playSfx('pop');
            const currentPlayer = currentState.players[currentState.currentTurnIndex];
            if (!currentPlayer || currentPlayer.id !== action.playerId || currentPlayer.isHost) return currentState;
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
            if (currentState.phase !== GamePhase.VOTING || currentState.votes[action.voterId]) return currentState;
            const voter = currentState.players.find(p => p.id === action.voterId);
            const candidate = currentState.players.find(p => p.id === action.votedForId);
            if (!voter || voter.isHost || voter.isDisconnected || !candidate || candidate.isHost || candidate.id === voter.id) return currentState;
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
             if (currentState.phase !== GamePhase.REVEAL) return currentState;
             return { ...currentState, phase: GamePhase.IMPOSTER_GUESS };

        case 'SUBMIT_GUESS':
             if (currentState.phase !== GamePhase.IMPOSTER_GUESS) return currentState;
             audioService.playSfx('pop');
             return { ...currentState, imposterGuess: action.guess, phase: GamePhase.HOST_REVIEW };

        case 'JUDGE_GUESS': {
            if (currentState.phase !== GamePhase.HOST_REVIEW) return currentState;
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
             if (currentState.phase !== GamePhase.ROLE_REVEAL && currentState.phase !== GamePhase.SCOREBOARD) return currentState;
             audioService.playSfx('click');
             const updatedPlayers = currentState.players.map(p => (p.id === action.playerId) ? { ...p, isReady: true } : p);
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
             return {
                 ...INITIAL_STATE,
                 gameCode: currentState.gameCode,
                 phase: GamePhase.LOBBY,
                 // Keep the existing PeerJS room and crew connected so
                 // PLAY AGAIN is a real lobby reset instead of an empty room.
                 players: currentState.players.map(p => ({
                     ...p,
                     isHost: false,
                     isImposter: false,
                     isReady: false,
                     isDisconnected: false,
                     score: 0,
                     voteCount: 0
                 }))
             };
        default:
            return currentState;
    }
  };

  const applyHostAction = (action: GameAction) => {
    const processed = processAction(action, stateRef.current);
    // Invalid or duplicate packets are intentionally ignored. This is vital
    // after a browser briefly reconnects and replays a click.
    if (processed === stateRef.current) return;
    const nextState = { ...processed, syncVersion: stateRef.current.syncVersion + 1 };
    stateRef.current = nextState;
    setState(nextState);
    broadcastState(nextState);
  };

  const dispatch = (action: GameAction) => {
    if (isHost) applyHostAction(action);
    else if (hostConnRef.current?.open) hostConnRef.current.send(action);
  };

  const handleHostConnection = (conn: DataConnection) => {
    connectionsRef.current.push(conn);
    conn.on('open', () => conn.send({ type: 'SYNC_STATE', state: stateRef.current }));
    conn.on('data', (data: unknown) => {
      const message = data as { type?: string };
      if (message?.type === 'JOIN_REQUEST' && stateRef.current.phase !== GamePhase.LOBBY) {
        const player = (data as Extract<GameAction, { type: 'JOIN_REQUEST' }>).player;
        if (!stateRef.current.players.some(existing => existing.id === player.id)) {
          conn.send({ type: 'JOIN_REJECTED', message: 'This game is already in progress.' });
          return;
        }
      }
      if (message?.type !== 'SYNC_STATE') applyHostAction(data as GameAction);
    });
    conn.on('close', () => {
      connectionsRef.current = connectionsRef.current.filter(candidate => candidate !== conn);
      const playerId = (conn as any).metadata?.playerId as string | undefined;
      const hasAnotherConnection = playerId && connectionsRef.current.some(candidate => candidate.open && (candidate as any).metadata?.playerId === playerId);
      if (playerId && !hasAnotherConnection) applyHostAction({ type: 'PLAYER_DISCONNECTED', playerId });
    });
  };

  const rememberPlayer = (name: string, avatarUrl?: string) => {
    sessionStorage.setItem('imposter_playerName', name);
    if (avatarUrl) sessionStorage.setItem('imposter_avatarUrl', avatarUrl);
    else sessionStorage.removeItem('imposter_avatarUrl');
  };

  const connectToHost = (code: string, player: Player, onReady?: () => void, onFailure?: (error: Error) => void) => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (peerRef.current) peerRef.current.destroy();
    hostConnRef.current = null;
    expectedRoomRef.current = code.toUpperCase();
    setConnectionStatus('reconnecting');
    const peer = new Peer({ debug: 1, config: { iceServers: ICE_SERVERS } });
    peerRef.current = peer;
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      setConnectionStatus('offline');
      onFailure?.(error);
    };
    const timeout = setTimeout(() => fail(new Error('Game session not found or timed out.')), 20000);
    peer.on('open', () => {
      const conn = peer.connect(PEER_PREFIX + code.toUpperCase(), { reliable: true, metadata: { playerId: player.id } });
      conn.on('open', () => {
        clearTimeout(timeout);
        settled = true;
        hostConnRef.current = conn;
        setIsHost(false);
        setMyPlayerId(player.id);
        setConnectionStatus('connected');
        // Re-registering is what clears the host's disconnected marker and
        // guarantees a fresh snapshot after a reload.
        conn.send({ type: 'JOIN_REQUEST', player });
        onReady?.();
      });
      conn.on('data', (data: unknown) => {
        const message = data as { type?: string; state?: GameState; message?: string };
        if (message?.type === 'SYNC_STATE' && message.state) acceptSnapshot(message.state);
        if (message?.type === 'JOIN_REJECTED') {
          hostConnRef.current = null;
          conn.close();
          expectedRoomRef.current = null;
          stateRef.current = INITIAL_STATE;
          setState(INITIAL_STATE);
          setConnectionStatus('offline');
          onFailure?.(new Error(message.message || 'This game is already in progress.'));
        }
      });
      conn.on('close', () => {
        if (hostConnRef.current !== conn || !stateRef.current.gameCode) return;
        setConnectionStatus('reconnecting');
        reconnectTimerRef.current = setTimeout(() => reconnectGame(code, player.id), 1200);
      });
      conn.on('error', () => fail(new Error('Connection lost.')));
    });
    peer.on('error', (err) => fail(new Error(err.type === 'peer-unavailable' ? "Room doesn't exist." : 'Network error.')));
  };

  const createGame = (name: string, avatarUrl?: string) => {
    audioService.playMusic();
    return new Promise<void>((resolve, reject) => {
      if (peerRef.current) peerRef.current.destroy();
      const code = Math.random().toString(36).substring(2, 7).toUpperCase();
      const playerId = Math.random().toString(36).substr(2, 9);
      const peer = new Peer(PEER_PREFIX + code, { debug: 1, config: { iceServers: ICE_SERVERS } });
      peerRef.current = peer;
      expectedRoomRef.current = code;
      peer.on('open', () => {
        const creatorPlayer: Player = { id: playerId, name, avatarSeed: Math.random().toString(), avatarUrl, isHost: false, isImposter: false, isBot: false, score: 0, voteCount: 0, isReady: false };
        const nextState = { ...INITIAL_STATE, gameCode: code, phase: GamePhase.LOBBY, players: [creatorPlayer] };
        stateRef.current = nextState;
        setState(nextState);
        setIsHost(true);
        setMyPlayerId(playerId);
        setConnectionStatus('connected');
        rememberPlayer(name, avatarUrl);
        resolve();
      });
      peer.on('error', (err) => reject(new Error(err.type === 'unavailable-id' ? 'Room code busy.' : 'Network server error.')));
      peer.on('connection', handleHostConnection);
    });
  };

  const joinGame = (code: string, name: string, avatarUrl?: string) => new Promise<void>((resolve, reject) => {
    audioService.playMusic();
    const playerId = sessionStorage.getItem('imposter_playerId') || Math.random().toString(36).substr(2, 9);
    const player: Player = { id: playerId, name, avatarSeed: Math.random().toString(), avatarUrl, isHost: false, isImposter: false, isBot: false, score: 0, voteCount: 0, isReady: false };
    rememberPlayer(name, avatarUrl);
    connectToHost(code, player, resolve, reject);
  });

  const reconnectGame = (code: string, playerId: string) => {
    audioService.playMusic();
    const player: Player = {
      id: playerId,
      name: sessionStorage.getItem('imposter_playerName') || '',
      avatarSeed: Math.random().toString(),
      avatarUrl: sessionStorage.getItem('imposter_avatarUrl') || undefined,
      isHost: false, isImposter: false, isBot: false, score: 0, voteCount: 0, isReady: false
    };
    connectToHost(code, player);
  };

  const leaveGame = () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (peerRef.current) peerRef.current.destroy();
      hostConnRef.current = null;
      connectionsRef.current = [];
      expectedRoomRef.current = null;
      setIsHost(false);
      setMyPlayerId(null);
      setConnectionStatus('offline');
      stateRef.current = INITIAL_STATE;
      setState(INITIAL_STATE);
      sessionStorage.removeItem('imposter_gameCode');
      sessionStorage.removeItem('imposter_playerId');
      sessionStorage.removeItem('imposter_playerName');
      sessionStorage.removeItem('imposter_avatarUrl');
  };

  const handlePlayerRecovery = (playerId: string, action: 'KICK' | 'AI') => {
      audioService.playSfx('danger');
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
  const submitClue = (text: string) => myPlayerId && dispatch({ type: 'SUBMIT_CLUE', playerId: myPlayerId, text });
  const submitVote = (voterId: string, votedForId: string) => dispatch({ type: 'SUBMIT_VOTE', voterId, votedForId });
  const submitImposterGuess = (guess: string) => dispatch({ type: 'SUBMIT_GUESS', guess });
  const judgeImposterGuess = (isCorrect: boolean) => dispatch({ type: 'JUDGE_GUESS', isCorrect });
  const acknowledgeRoundEnd = (playerId: string) => dispatch({ type: 'ACK_ROUND_END', playerId });
  const resetGame = () => dispatch({ type: 'RESET_GAME' });

  const amIGameHost = !!state.currentHostId && state.currentHostId === myPlayerId;

  return (
    <GameContext.Provider value={{
      state, isHost, isNetworkHost: isHost, connectionStatus, myPlayerId, amIGameHost, createGame, joinGame, reconnectGame, leaveGame, updateConfig, startGame, setTopic, submitClue, submitVote, submitImposterGuess, judgeImposterGuess, acknowledgeRoundEnd, resetGame, addBot, confirmPassDevice,
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
