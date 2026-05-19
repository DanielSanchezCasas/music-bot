import readline from 'readline';
import { Log } from 'discord-player-youtubei';

const MAX_UPCOMING = 5;

let botStatus = 'Conectando…';
let nowPlaying = 'Sin reproducción';
let lastCommand = '—';
let upcoming = [];
let panelLines = 0;
let consoleFiltered = false;
let renderPending = false;

function clearPanel() {
    if (panelLines <= 0) {
        return;
    }
    readline.moveCursor(process.stdout, 0, -panelLines);
    readline.clearScreenDown(process.stdout);
}

function renderNow() {
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

    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);

    console.warn = (...args) => {
        const text = args.map(String).join(' ');
        if (isYoutubeNoise(text)) {
            return;
        }
        originalWarn(...args);
    };

    console.error = (...args) => {
        const text = args.map(String).join(' ');
        if (isYoutubeNoise(text)) {
            return;
        }
        originalError(...args);
    };

    process.on('warning', (warning) => {
        if (
            warning.name === 'DeprecationWarning' &&
            String(warning.message).includes('ready')
        ) {
            return;
        }
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
    scheduleRender();
}

export function setLastCommand(command) {
    lastCommand = command;
    scheduleRender();
}

export function setNowPlaying(label) {
    nowPlaying = label;
    scheduleRender();
}

export function idle(label = 'Sin reproducción') {
    nowPlaying = label;
    upcoming = [];
    scheduleRender();
}

export function showQueue(playing, nextTracks = []) {
    nowPlaying = playing;
    upcoming = nextTracks.slice(0, MAX_UPCOMING);
    scheduleRender();
}

export function logError(context, error) {
    const message = error?.message ?? String(error);
    clearPanel();
    panelLines = 0;
    process.stdout.write('\n');
    console.error(`✖ ${context}: ${message}`);
    scheduleRender();
}
