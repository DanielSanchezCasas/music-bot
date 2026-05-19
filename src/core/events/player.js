import * as status from '../../lib/console/status.js';
import { syncFromQueue } from '../../lib/queue/sync.js';

export function registerPlayerEvents(player) {
    player.events.on('error', (_queue, error) => {
        status.logError('Error del reproductor', error);
    });

    player.events.on('playerError', (_queue, error, track) => {
        status.logError(`Error al reproducir: ${track?.title ?? 'canción'}`, error);
    });

    player.events.on('playerStart', (queue) => {
        syncFromQueue(queue);
    });

    player.events.on('audioTrackAdd', (queue) => {
        syncFromQueue(queue);
    });

    player.events.on('playerSkip', (queue) => {
        syncFromQueue(queue);
    });

    player.events.on('playerFinish', (queue) => {
        syncFromQueue(queue);
    });

    player.events.on('emptyQueue', () => {
        status.idle('Sin reproducción');
    });
}
