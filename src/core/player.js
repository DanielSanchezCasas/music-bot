import { Player } from 'discord-player';
import { YoutubeExtractor, getVideoId } from 'discord-player-youtubei';
import youtubeDl from 'youtube-dl-exec';
import * as logBus from '../lib/logging/logBus.js';
import * as status from '../lib/console/status.js';
import { registerPlayerEvents } from './events/player.js';

const youtubeCookie = process.env.YOUTUBE_COOKIE?.trim() || undefined;

export function createPlayer(client) {
    const player = new Player(client, {
        skipFFmpeg: false,
    });

    registerPlayerEvents(player);
    registerExtractors(player);

    return player;
}

function formatDurationSeconds(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
}

async function fixMissingDuration(track, id) {
    if (track.duration && track.duration !== '0:00') return;
    try {
        const info = await youtubeDl(`https://youtu.be/${id}`, {
            dumpSingleJson: true,
            skipDownload: true,
            noWarnings: true,
            noPlaylist: true,
        });
        if (info?.duration) {
            track.duration = formatDurationSeconds(Math.floor(info.duration));
        }
    } catch {}
}

// Streams audio via yt-dlp in a single continuous pipe, avoiding the
// 10MB chunk gaps that AdaptiveStream causes on long videos.
async function createYtdlpStream(track) {
    const id = getVideoId(track.url);

    await fixMissingDuration(track, id);

    const dl = youtubeDl.exec(`https://youtu.be/${id}`, {
        format: 'bestaudio',
        output: '-',
        noWarnings: true,
        noProgress: true,
        ...(youtubeCookie ? { cookies: youtubeCookie } : {}),
    });

    dl.catch(() => {});

    const stream = dl.stdout;
    if (!stream) throw new Error('yt-dlp no devolvió stream');

    const kill = () => {
        if (!dl.killed) {
            stream.removeAllListeners();
            dl.kill();
        }
    };
    stream.on('close', kill);
    stream.on('error', kill);
    stream.on('end', kill);

    return stream;
}

function registerExtractors(player) {
    const options = {
        disablePlayer: false,
        createStream: createYtdlpStream,
        ...(youtubeCookie ? { cookie: youtubeCookie } : {}),
    };

    player.extractors
        .register(YoutubeExtractor, options)
        .then(() => {
            logBus.append(
                'info',
                `YouTube listo (v3, yt-dlp stream${youtubeCookie ? ', con cookies' : ''})`,
                'player'
            );
        })
        .catch((error) => {
            status.logError('No se pudo cargar YouTube', error);
        });
}
