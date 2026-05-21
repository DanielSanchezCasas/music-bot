import { Player } from 'discord-player';
import { YoutubeExtractor } from 'discord-player-youtubei';
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

function registerExtractors(player) {
    const options = {
        disablePlayer: false,
        ...(youtubeCookie ? { cookie: youtubeCookie } : {}),
    };

    player.extractors
        .register(YoutubeExtractor, options)
        .then(() => {
            logBus.append(
                'info',
                `YouTube listo (v3${youtubeCookie ? ', con cookies' : ''})`,
                'player'
            );
        })
        .catch((error) => {
            status.logError('No se pudo cargar YouTube', error);
        });
}
