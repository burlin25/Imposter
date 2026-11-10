type Role = 'INNOCENT' | 'IMPOSTER';

const TOPICS = [
  { topic: 'The Moon', category: 'Space' },
  { topic: 'Pizza', category: 'Food' },
  { topic: 'Volcano', category: 'Geology' },
  { topic: 'Disco Ball', category: 'Party' },
  { topic: 'The Titanic', category: 'History' },
  { topic: 'Quicksand', category: 'Nature' },
  { topic: 'Coral Reef', category: 'Ocean' },
  { topic: 'Popcorn', category: 'Movies' },
  { topic: 'Compass', category: 'Navigation' },
  { topic: 'Snow Globe', category: 'Collectibles' },
];

const INNOCENT_CLUES: Record<string, string> = {
  'The Moon': 'Night sky',
  Pizza: 'Oven',
  Volcano: 'Lava',
  'Disco Ball': 'Mirrors',
  'The Titanic': 'Iceberg',
  Quicksand: 'Sinking',
  'Coral Reef': 'Underwater',
  Popcorn: 'Movie night',
  Compass: 'Direction',
  'Snow Globe': 'Shaken',
};

const IMPOSTER_CLUES = [
  'Something familiar',
  'It depends on the situation',
  'You might see it every day',
  'There is more to it than you think',
];

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export const generateHostTopic = async (): Promise<{ topic: string; category: string }> =>
  pick(TOPICS);

export const generateGameTopic = async (): Promise<string> =>
  pick(TOPICS).topic;

export const generateClue = async (role: Role, topic: string, category: string): Promise<string> =>
  role === 'INNOCENT'
    ? INNOCENT_CLUES[topic] ?? `Something related to ${category.toLowerCase()}`
    : pick(IMPOSTER_CLUES);

export const generateImposterGuess = async (_category: string, _clues: string[]): Promise<string> =>
  "I'm not sure yet";
