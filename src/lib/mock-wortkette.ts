// Fake data backing the "Wortkette" (word chain) feature surface: admin
// status/controls, the shared dictionary, and curated special-word response
// lines. Same globalThis-singleton pattern as src/lib/mock-store.ts and
// src/lib/mock-discord.ts, kept in its own file/key so this domain's seed
// work never touches either of those files.

export interface WortketteAdminState {
  currentTheme: string | null;
  themeExpiresAt: string | null;
  currentStreak: number;
  highScore: number;
  lastWord: string | null;
  usedWordCount: number;
  themes: string[];
}

export interface DictionaryWord {
  word: string;
  topics: string[];
}

export interface DictionarySearchResult {
  words: DictionaryWord[];
  total: number;
  page: number;
  pages: number;
}

export interface SpecialLine {
  id: string;
  word: string;
  lines: string[];
  enabled: boolean;
}

export interface PagedSpecialLines {
  items: SpecialLine[];
  total: number;
  page: number;
  pages: number;
}

// Next.js bundles each route handler and page into its own server-side chunk;
// a plain module-level singleton gets a separate copy baked into every chunk
// instead of one instance shared per process. Attaching the state to
// globalThis is the standard workaround (the same pattern Prisma Client's
// Next.js docs recommend) so every chunk reads and writes the same object.
interface WortketteStoreState {
  currentTheme: string | null;
  themeExpiresAt: string | null;
  currentStreak: number;
  highScore: number;
  lastWord: string | null;
  usedWords: Set<string>;
  themes: string[];
  dictionary: DictionaryWord[];
  specialLines: Map<string, SpecialLine>;
}

function genId(): string {
  return crypto.randomUUID();
}

// Copy of mock-store.ts's paginate() helper — duplicated intentionally so
// this file stays fully decoupled from the other mock-data modules.
function paginate<T>(items: T[], page: number, pageSize = 25): { data: T[]; total: number; page: number; pages: number } {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const clamped = Math.min(Math.max(1, page), pages);
  const start = (clamped - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total, page: clamped, pages };
}

const PAGE_SIZE = 25;

const THEMES = ['Tiere', 'Essen & Trinken', 'Natur', 'Technik', 'Sport', 'Musik'];

function buildDictionary(): DictionaryWord[] {
  const entries: Array<[string, string[]]> = [
    // Tiere
    ['Elefant', ['Tiere']],
    ['Tiger', ['Tiere']],
    ['Giraffe', ['Tiere']],
    ['Pinguin', ['Tiere']],
    ['Delfin', ['Tiere']],
    ['Wolf', ['Tiere']],
    ['Adler', ['Tiere']],
    ['Igel', ['Tiere']],
    ['Fuchs', ['Tiere']],
    ['Biber', ['Tiere']],
    // Essen & Trinken
    ['Apfel', ['Essen & Trinken', 'Natur']],
    ['Banane', ['Essen & Trinken']],
    ['Kartoffel', ['Essen & Trinken']],
    ['Tomate', ['Essen & Trinken']],
    ['Schokolade', ['Essen & Trinken']],
    ['Kaffee', ['Essen & Trinken']],
    ['Brezel', ['Essen & Trinken']],
    ['Kuchen', ['Essen & Trinken']],
    ['Nudel', ['Essen & Trinken']],
    ['Suppe', ['Essen & Trinken']],
    // Natur
    ['Baum', ['Natur']],
    ['Berg', ['Natur']],
    ['Fluss', ['Natur']],
    ['Wald', ['Natur']],
    ['Wiese', ['Natur']],
    ['Blume', ['Natur']],
    ['Wolke', ['Natur']],
    ['Regen', ['Natur']],
    ['Schnee', ['Natur']],
    ['Sonne', ['Natur']],
    // Technik
    ['Computer', ['Technik']],
    ['Roboter', ['Technik']],
    ['Satellit', ['Technik']],
    ['Drucker', ['Technik']],
    ['Kabel', ['Technik']],
    ['Prozessor', ['Technik']],
    ['Bildschirm', ['Technik']],
    ['Router', ['Technik']],
    ['Akku', ['Technik']],
    ['Sensor', ['Technik']],
    // Sport
    ['Fußball', ['Sport']],
    ['Tennis', ['Sport']],
    ['Schwimmen', ['Sport']],
    ['Boxen', ['Sport']],
    ['Handball', ['Sport']],
    ['Volleyball', ['Sport']],
    ['Marathon', ['Sport']],
    ['Skifahren', ['Sport']],
    ['Klettern', ['Sport']],
    ['Turnen', ['Sport']],
    // Musik
    ['Gitarre', ['Musik']],
    ['Klavier', ['Musik']],
    ['Trommel', ['Musik']],
    ['Geige', ['Musik']],
    ['Flöte', ['Musik']],
    ['Schlagzeug', ['Musik']],
    ['Mikrofon', ['Musik']],
    ['Lautsprecher', ['Musik']],
    ['Konzert', ['Musik']],
    ['Melodie', ['Musik']],
  ];
  return entries.map(([word, topics]) => ({ word, topics }));
}

function buildSpecialLines(): Map<string, SpecialLine> {
  const seed: Array<[string, string[], boolean]> = [
    ['kaktus', ['Autsch. Vorsichtig mit dem hier.', 'Stachelig, aber die Kette hält.'], true],
    ['pizza', ['Mmmh, jetzt hab ich Hunger.', 'Klassiker unter den Wörtern.'], true],
    ['giraffe', ['Langer Hals, kurze Rundenzeit.'], true],
    ['affe', ['Kein schlechtes Wort für Montagmorgen.', 'Wer hat hier "Affe" gesagt?'], true],
    ['wurst', ['Ist doch eh alles Wurst, oder?'], true],
    ['kartoffel', ['Deutscher als dieses Wort geht es kaum.', 'Couch-Potato-Modus aktiviert.'], true],
    ['elefant', ['Der vergisst diese Kette nie.'], true],
    ['schokolade', ['Süße Verlängerung der Streak!'], true],
    ['traktor', ['Tuckert gemütlich weiter zum nächsten Wort.'], false],
    ['flamingo', ['Steht nur auf einem Bein, die Kette auf beiden.'], true],
    ['waffel', ['Extra Punkte, extra Sirup.'], true],
    ['dinosaurier', ['Uralt, aber immer noch spielbar.', 'Rawr — nächstes Wort bitte.'], false],
    ['schnitzel', ['Paniert und trotzdem am Ball.'], true],
  ];
  const map = new Map<string, SpecialLine>();
  for (const [word, lines, enabled] of seed) {
    const id = genId();
    map.set(id, { id, word, lines, enabled });
  }
  return map;
}

function createInitialState(): WortketteStoreState {
  const dictionary = buildDictionary();
  const usedWords = new Set<string>(['Nudel', 'Schnee', 'Kabel', 'Konzert', 'Turnen', 'Banane', 'Wolke', 'Akku']);

  return {
    currentTheme: 'Tiere',
    themeExpiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    currentStreak: 12,
    highScore: 47,
    lastWord: 'Elefant',
    usedWords,
    themes: THEMES,
    dictionary,
    specialLines: buildSpecialLines(),
  };
}

const globalForWortkette = globalThis as unknown as { __mockWortketteStore?: WortketteStoreState };
const state: WortketteStoreState =
  globalForWortkette.__mockWortketteStore ?? (globalForWortkette.__mockWortketteStore = createInitialState());

// --- Admin ---
export function getWortketteAdminState(): WortketteAdminState {
  return {
    currentTheme: state.currentTheme,
    themeExpiresAt: state.themeExpiresAt,
    currentStreak: state.currentStreak,
    highScore: state.highScore,
    lastWord: state.lastWord,
    usedWordCount: state.usedWords.size,
    themes: state.themes,
  };
}

export function resetUsedWords(): WortketteAdminState {
  state.usedWords.clear();
  return getWortketteAdminState();
}

export function resetWortketteChain(): WortketteAdminState {
  state.usedWords.clear();
  state.currentStreak = 0;
  state.lastWord = null;
  return getWortketteAdminState();
}

export function setWortketteTheme(theme: string | null, expiresAt: string | null): WortketteAdminState {
  state.currentTheme = theme;
  state.themeExpiresAt = expiresAt;
  return getWortketteAdminState();
}

// --- Dictionary ---
export function listDictionaryTopics(): string[] {
  const topics = new Set<string>();
  for (const entry of state.dictionary) {
    for (const t of entry.topics) topics.add(t);
  }
  return Array.from(topics).sort((a, b) => a.localeCompare(b, 'de'));
}

export function searchDictionary(query: string, topic: string, page: number): DictionarySearchResult {
  let results = state.dictionary;
  if (query) {
    const needle = query.toLowerCase();
    results = results.filter((w) => w.word.toLowerCase().startsWith(needle));
  }
  if (topic) {
    results = results.filter((w) => w.topics.includes(topic));
  }
  results = [...results].sort((a, b) => a.word.localeCompare(b.word, 'de'));
  const { data, total, page: clamped, pages } = paginate(results, page, PAGE_SIZE);
  return { words: data, total, page: clamped, pages };
}

// --- Special lines ---
export function listSpecialLines(page: number): PagedSpecialLines {
  const all = Array.from(state.specialLines.values()).sort((a, b) => a.word.localeCompare(b.word, 'de'));
  const { data, total, page: clamped, pages } = paginate(all, page, PAGE_SIZE);
  return { items: data, total, page: clamped, pages };
}

export function addSpecialLine(word: string, lines: string[]): SpecialLine {
  const entry: SpecialLine = { id: genId(), word, lines, enabled: true };
  state.specialLines.set(entry.id, entry);
  return entry;
}

export function updateSpecialLine(id: string, patch: { lines?: string[]; enabled?: boolean }): SpecialLine | null {
  const existing = state.specialLines.get(id);
  if (!existing) return null;
  const updated: SpecialLine = { ...existing, ...patch, id: existing.id, word: existing.word };
  state.specialLines.set(id, updated);
  return updated;
}

export function deleteSpecialLine(id: string): boolean {
  return state.specialLines.delete(id);
}
