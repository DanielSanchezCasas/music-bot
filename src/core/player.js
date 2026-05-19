import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { createHighQualityYouTubeStream } from '../services/youtube/stream.js';
import * as status from '../lib/console/status.js';
import { registerPlayerEvents } from './events/player.js';

export function createPlayer(client) {
    const player = new Player(client, {
        skipFFmpeg: false,
    });

    registerPlayerEvents(player);
    registerExtractors(player);

    return player;
}

function registerExtractors(player) {
    player.extractors
        .register(YoutubeiExtractor, {
            createStream: (track) => createHighQualityYouTubeStream(track),
            disablePlayer: true,
            logLevel: 'NONE',
            streamOptions: {
                useClient: 'IOS',
                highWaterMark: 1 << 20,
            },
            overrideDownloadOptions: {
                type: 'audio',
                quality: 'best',
                format: 'm4a',
            },
        })
        .catch((error) => {
            status.logError('No se pudo cargar YouTube', error);
        });
}
