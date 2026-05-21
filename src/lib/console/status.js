import readline from 'readline';
import { EventEmitter } from 'events';
import { Log } from 'discord-player-youtubei';
import * as logBus from '../logging/logBus.js';
import { disableTerminalPanel } from '../../config/env.js';

const MAX_UPCOMING = 5;

let botStatus = 'Conectando…';
let nowPlaying = 'Sin reproducción';
let lastCommand = '—';
let upcoming = [];
let panelLines = 0;
let consoleFiltered = false;
let renderPending = false;

/** @type {import('events').EventEmitter} */
const statusEmitter = new EventEmitter();
statusEmitter.setMaxListeners(50);

function notifyStatusChange() {
    statusEmitter.emit('change', getSnapshot());
}

export function getSnapshot() {
    return {
        botStatus,
        nowPlaying,
        lastCommand,
        upcoming: [...upcoming],
    };
}

/** @param {(snapshot: ReturnType<typeof getSnapshot>) => void} listener */
export function onStatusChange(listener) {
    statusEmitter.on('change', listener);
    return () => statusEmitter.off('change', listener);
}

function clearPanel() {
    if (panelLines <= 0) {
        return;
    }
    readline.moveCursor(process.stdout, 0, -panelLines);
    readline.clearScreenDown(process.stdout);
}

function renderNow() {
    if (disableTerminalPanel) {
        return;
    }

    const nextLines = upcoming.slice(0, MAX_UPCOMING);
    const padding = MAX_UPCOMING - nextLines.length;

    const block = [
        '',
        '── Music Bot ──',
        `Estado: ${botStatus}`,
        `▶ Sonando: ${nowPlaying}`,
        `Último comando: ${lastCommand}`,
        'Siguiente:',
        ...nextLines.map((track, i) => `  ${i + 1}. ${track}`),
        ...Array.from({ length: padding }, () => '  ·'),
        '',
    ];

    clearPanel();
    process.stdout.write(`${block.join('\n')}\n`);
    panelLines = block.length;

    if (disableTerminalPanel) {
        logBus.append(
            'info',
            `${botStatus} · ${nowPlaying} · ${lastCommand}`,
            'panel'
        );
    }
}

function scheduleRender() {
    if (renderPending) {
        return;
    }
    renderPending = true;
    setImmediate(() => {
        renderPending = false;
        renderNow();
    });
}

export function initConsole() {
    if (consoleFiltered) {
        return;
    }
    consoleFiltered = true;

    process.noDeprecation = true;

    Log.setLevel(Log.Level.NONE);

    const originalLog = console.log.bind(console);
    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);

    console.log = (...args) => {
        const text = logBus.formatArgs(args);
        logBus.append('info', text, 'console');
        originalLog(...args);
    };

    console.warn = (...args) => {
        const text = logBus.formatArgs(args);
        if (isYoutubeNoise(text)) {
            return;
        }
        logBus.append('warn', text, 'console');
        originalWarn(...args);
    };

    console.error = (...args) => {
        const text = logBus.formatArgs(args);
        if (isYoutubeNoise(text)) {
            return;
        }
        logBus.append('error', text, 'console');
        originalError(...args);
    };

    process.on('warning', (warning) => {
        if (
            warning.name === 'DeprecationWarning' &&
            String(warning.message).includes('ready')
        ) {
            return;
        }
        const text = warning.stack ?? warning.message;
        logBus.append('warn', text, 'process');
        originalWarn(warning);
    });
}

function isYoutubeNoise(text) {
    return (
        text.includes('[YOUTUBEJS]') ||
        text.includes('InnertubeError') ||
        text.includes('Unable to find matching run for command run')
    );
}

export function setReady(message) {
    botStatus = message ?? 'Listo';
    nowPlaying = 'Sin reproducción';
    lastCommand = '—';
    upcoming = [];
    logBus.append('info', botStatus, 'status');
    scheduleRender();
    notifyStatusChange();
}

export function setLastCommand(command) {
    lastCommand = command;
    logBus.append('info', `Comando: ${command}`, 'command');
    scheduleRender();
    notifyStatusChange();
}

export function setNowPlaying(label) {
    nowPlaying = label;
    logBus.append('info', label, 'status');
    scheduleRender();
    notifyStatusChange();
}

export function idle(label = 'Sin reproducción') {
    nowPlaying = label;
    upcoming = [];
    logBus.append('info', label, 'status');
    scheduleRender();
    notifyStatusChange();
}

export function showQueue(playing, nextTracks = []) {
    nowPlaying = playing;
    upcoming = nextTracks.slice(0, MAX_UPCOMING);
    logBus.append('info', playing, 'status');
    scheduleRender();
    notifyStatusChange();
}

export function logError(context, error) {
    const message = error?.message ?? String(error);
    clearPanel();
    panelLines = 0;
    if (!disableTerminalPanel) {
        process.stdout.write('\n');
    }
    logBus.append('error', `${context}: ${message}`, 'error');
    console.error(`✖ ${context}: ${message}`);
    scheduleRender();
    notifyStatusChange();
}
