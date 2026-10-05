const ADJECTIVES = [
  'Static', 'Rapid', 'Lo-Fi', 'Neon', 'Hidden', 'Velvet', 'Midnight', 'Feral', 'Analog', 'Cosmic',
  'Basement', 'Glitchy', 'Silent', 'Toxic', 'Frozen', 'Electric', 'Shadow', 'Pixel', 'Bass', 'Rogue',
];

const NOUNS = [
  'Ninja', 'Phantom', 'Raccoon', 'Crate Digger', 'Moth', 'Signal', 'Cassette', 'Goblin', 'Panda', 'Comet',
  'Vinyl', 'Wolf', 'Echo', 'Cyborg', 'Ghost', 'Bandit', 'Owl', 'Fox', 'Robot', 'Specter',
];

export const AVATARS = ['🎧', '👽', '🦊', '🐸', '💀', '🤖', '👻', '🐼', '🦝', '🐙', '🦉', '🐺', '🛸', '🍄', '🌚', '🧃'];

export const AVATAR_COLORS = [
  '#B8FF3C', '#4FD8FF', '#FFD84A', '#FF5FD2', '#FF7A45', '#7CFFB2', '#A9B8FF', '#FF6B6B',
];

export function randomName(random: () => number = Math.random): string {
  const a = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(random() * NOUNS.length)];
  return `${a} ${n}`;
}

export function randomAvatar(random: () => number = Math.random): number {
  return Math.floor(random() * AVATARS.length);
}

export function avatarEmoji(index: number): string {
  return AVATARS[((index % AVATARS.length) + AVATARS.length) % AVATARS.length];
}

export function avatarColor(index: number): string {
  return AVATAR_COLORS[((index % AVATAR_COLORS.length) + AVATAR_COLORS.length) % AVATAR_COLORS.length];
}

/** Turns an ISO 3166-1 alpha-2 code like "US" into its flag emoji. */
export function flagEmoji(country: string | null | undefined): string {
  if (!country || !/^[A-Za-z]{2}$/.test(country)) return '🌍';
  return String.fromCodePoint(...country.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, 24);
}
