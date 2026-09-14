/**
 * Drop-in replacement for `console.log/warn/error` for server-side code
 * (route handlers, auth, lib). In production it emits one structured JSON
 * line per call instead of a plain string, with any `[Module]` prefix on the
 * first argument lifted into its own field, so log aggregators (Dokploy) can
 * filter/query by module and level instead of grepping strings. Mirrors
 * apps/bot/src/infra/logger.ts.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const isProd = process.env.NODE_ENV === 'production';

function resolveLevel(): Level {
  const raw = process.env.LOG_LEVEL;
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw;
  return isProd ? 'info' : 'debug';
}

const activeLevel = resolveLevel();

function shouldLog(level: Level): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[activeLevel];
}

const MODULE_PREFIX = /^\[([^\]]+)\]\s?/;

function serializeError(err: Error): { name: string; message: string; stack?: string } {
  return { name: err.name, message: err.message, stack: err.stack };
}

function stringifyPart(part: unknown): string {
  if (typeof part === 'string') return part;
  if (part instanceof Error) return part.message;
  try {
    return JSON.stringify(part);
  } catch {
    return String(part);
  }
}

function emitStructured(consoleFn: (line: string) => void, level: Level, args: unknown[]): void {
  const [first, ...rest] = args;
  const firstStr = typeof first === 'string' ? first : undefined;
  const moduleMatch = firstStr?.match(MODULE_PREFIX);
  const module = moduleMatch?.[1];
  const messageArgs = firstStr !== undefined
    ? [moduleMatch ? firstStr.slice(moduleMatch[0].length) : firstStr, ...rest]
    : args;

  const errIdx = messageArgs.findIndex((a) => a instanceof Error);
  const err = errIdx >= 0 ? (messageArgs[errIdx] as Error) : undefined;
  const msg = messageArgs
    .filter((_, i) => i !== errIdx)
    .map(stringifyPart)
    .join(' ')
    .trim();

  consoleFn(JSON.stringify({
    level,
    time: new Date().toISOString(),
    ...(module ? { module } : {}),
    msg,
    ...(err ? { err: serializeError(err) } : {}),
  }));
}

function makeLevel(level: Level, consoleMethod: 'log' | 'warn' | 'error') {
  return (...args: unknown[]): void => {
    if (!shouldLog(level)) return;
    const consoleFn = console[consoleMethod].bind(console);
    if (isProd) {
      emitStructured(consoleFn, level, args);
    } else {
      consoleFn(...args);
    }
  };
}

export const logger = {
  debug: makeLevel('debug', 'log'),
  info: makeLevel('info', 'log'),
  warn: makeLevel('warn', 'warn'),
  error: makeLevel('error', 'error'),
};
