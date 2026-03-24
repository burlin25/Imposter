
export enum GamePhase {
  HOME = 'HOME',
  LOBBY = 'LOBBY',
  SETUP = 'SETUP', 
  TOPIC_SELECTION = 'TOPIC_SELECTION',
  ROLE_REVEAL = 'ROLE_REVEAL', 
  ROUND_STARTER = 'ROUND_STARTER', 
  DISCUSSION = 'DISCUSSION', 
  PASS_DEVICE = 'PASS_DEVICE', 
  CLUES = 'CLUES',
  VOTING = 'VOTING',
  REVEAL = 'REVEAL',
  IMPOSTER_GUESS = 'IMPOSTER_GUESS',
  HOST_REVIEW = 'HOST_REVIEW',
  SCOREBOARD = 'SCOREBOARD',
  WINNER = 'WINNER'
}

export interface Player {
  id: string;
  name: string;
  avatarSeed: string; 
  avatarUrl?: string; 
  isHost: boolean;
  isImposter: boolean;
  isBot: boolean; 
  score: number;
  voteCount: number;
  isReady: boolean; 
  isDisconnected?: boolean;
}

export interface Clue {
  playerId: string;
  text: string;
  timestamp: number;
}

export interface GameConfig {
  mode: 'IN_PERSON' | 'PHONE';
  imposterCount: number;
  cycles: number; 
}

export interface GameState {
  gameCode: string;
  phase: GamePhase;
  players: Player[];
  config: GameConfig;
  
  currentTurnIndex: number;
  clueRound: number; 
  
  currentHostId: string | null; 
  hostIndex: number; 
  pastHostIds: string[]; 
  currentCycle: number;

  topic: string;
  category: string; 
  topicImage?: string; 
  
  clues: Clue[];
  votes: Record<string, string>; 
  imposterGuess: string | null;
  imposterGuessCorrect: boolean | null;
  winningPlayerId: string | null;
  
  nextPlayerTurnId: string | null; 
  disconnectedPlayerId: string | null;
}

export interface GameContextType {
  state: GameState;
  isHost: boolean; 
  isNetworkHost: boolean; 
  myPlayerId: string | null;
  amIGameHost: boolean; 
  createGame: (name: string, avatarUrl?: string) => void;
  joinGame: (code: string, name: string, avatarUrl?: string) => void;
  reconnectGame: (code: string, playerId: string) => void; 
  leaveGame: () => void;
  updateConfig: (config: Partial<GameConfig>) => void;
  startGame: () => void;
  setTopic: (topic: string, category: string, image?: string, manualImposterIds?: string[]) => void;
  submitClue: (text: string) => void;
  submitVote: (voterId: string, votedForId: string) => void;
  submitImposterGuess: (guess: string) => void;
  judgeImposterGuess: (isCorrect: boolean) => void;
  acknowledgeRoundEnd: (playerId: string) => void;
  resetGame: () => void;
  addBot: () => void;
  confirmPassDevice: () => void;
  finishRoleReveal: () => void;
  startVoting: () => void;
  confirmStarter: () => void;
  startImposterGuess: () => void;
  handlePlayerRecovery: (playerId: string, action: 'KICK' | 'AI') => void;
}
