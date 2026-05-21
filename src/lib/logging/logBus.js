import { EventEmitter } from 'events';

const MAX_ENTRIES = 5000;

/** @type {import('events').EventEmitter} */
const emitter = new EventEmitter();
emitter.setMaxListeners(50);

/** @type {{ ts: number, level: string, message: string, source?: string }[]} */
const buffer = [];

let lastAppend = { message: '', ts: 0 };

/**
 * @param {string} level
 * @param {string} message
 * @param {string} [source]
 */
export function append(level, message, source) {
    const now = Date.now();
    if (
        message === lastAppend.message &&
        now - lastAppend.ts < 2000
    ) {
        return;
    }
    lastAppend = { message, ts: now };

    const entry = {
        ts: Date.now(),
        level,
        message: String(message),
        ...(source ? { source } : {}),
    };

    buffer.push(entry);
    if (buffer.length > MAX_ENTRIES) {
        buffer.splice(0, buffer.length - MAX_ENTRIES);
    }

    emitter.emit('append', entry);
}

export function getHistory() {
    return [...buffer];
}

/** @param {(entry: { ts: number, level: string, message: string, source?: string }) => void} listener */
export function onAppend(listener) {
    emitter.on('append', listener);
    return () => emitter.off('append', listener);
}

export function formatArgs(args) {
    return args
        .map((arg) => {
            if (arg instanceof Error) {
                return arg.stack ?? arg.message;
            }
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch {
                    return String(arg);
                }
            }
            return String(arg);
        })
        .join(' ');
}
