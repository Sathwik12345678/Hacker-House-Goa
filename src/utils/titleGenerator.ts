// Maps common stack/role keywords to a pool of fun Builder Titles.
// The generator picks a matching pool (falling back to a generic pool)
// and returns a random title from it, with a way to force a different
// pick on regenerate.

type TitlePool = {
  keywords: string[];
  titles: string[];
};

const TITLE_POOLS: TitlePool[] = [
  {
    keywords: ['python'],
    titles: ['Python Wizard', 'Snake Charmer', 'Script Sorcerer', 'Pythonic Architect'],
  },
  {
    keywords: ['ai', 'ml', 'machine learning', 'artificial intelligence', 'llm', 'genai'],
    titles: ['AI Architect', 'Model Whisperer', 'Neural Navigator', 'Prompt Alchemist'],
  },
  {
    keywords: ['react', 'nextjs', 'next.js', 'vue', 'frontend', 'front-end', 'front end'],
    titles: ['Interface Builder', 'UI Architect', 'Pixel Perfectionist', 'Component Crafter'],
  },
  {
    keywords: ['full stack', 'fullstack', 'full-stack'],
    titles: ['Full Stack Maverick', 'End-to-End Engineer', 'Stack Shapeshifter'],
  },
  {
    keywords: ['data science', 'data scientist', 'analytics'],
    titles: ['Data Explorer', 'Insight Hunter', 'Pattern Seeker'],
  },
  {
    keywords: ['backend', 'back-end', 'back end', 'node', 'django', 'flask', 'api'],
    titles: ['Backend Builder', 'API Architect', 'Server Whisperer'],
  },
  {
    keywords: ['devops', 'cloud', 'kubernetes', 'docker', 'infra', 'sre'],
    titles: ['Cloud Builder', 'Infra Alchemist', 'Deploy Doctor'],
  },
  {
    keywords: ['java'],
    titles: ['Java Crafter', 'Bytecode Bender'],
  },
  {
    keywords: ['c++', 'c/c++', ' c ', 'systems', 'rust', 'embedded'],
    titles: ['Systems Builder', 'Low-Level Legend', 'Memory Bender'],
  },
  {
    keywords: ['design', 'ux', 'ui/ux', 'product design'],
    titles: ['Experience Architect', 'Design Provocateur'],
  },
  {
    keywords: ['blockchain', 'web3', 'solidity', 'crypto'],
    titles: ['Chain Builder', 'Block Alchemist'],
  },
  {
    keywords: ['mobile', 'android', 'ios', 'flutter', 'swift', 'kotlin'],
    titles: ['App Whisperer', 'Mobile Maker'],
  },
  {
    keywords: ['security', 'cybersecurity', 'hacker', 'pentest'],
    titles: ['Security Sentinel', 'Vuln Hunter'],
  },
  {
    keywords: ['game', 'unity', 'unreal', 'gamedev'],
    titles: ['World Builder', 'Game Conjurer'],
  },
];

const GENERIC_TITLES = [
  'Builder Extraordinaire',
  'Certified Chaos Coder',
  'Goa Deploy Machine',
  'Sleep-Deprived Genius',
  'Idea-to-Ship Specialist',
  'Full Send Engineer',
];

function normalise(value: string): string {
  return ` ${value.toLowerCase()} `;
}

export function getTitlePool(stackOrRole: string): string[] {
  const haystack = normalise(stackOrRole);
  const matches = TITLE_POOLS.filter((pool) =>
    pool.keywords.some((keyword) => haystack.includes(normalise(keyword).trim()))
  );

  if (matches.length === 0) {
    return GENERIC_TITLES;
  }

  const combined = matches.flatMap((pool) => pool.titles);
  return combined.length > 0 ? combined : GENERIC_TITLES;
}

export function generateTitle(stackOrRole: string, avoid?: string): string {
  const pool = getTitlePool(stackOrRole || '');
  const options = pool.length > 1 && avoid ? pool.filter((t) => t !== avoid) : pool;
  const finalPool = options.length > 0 ? options : pool;
  const pick = finalPool[Math.floor(Math.random() * finalPool.length)];
  return pick ?? GENERIC_TITLES[0];
}
