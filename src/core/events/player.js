import * as status from '../../lib/console/status.js';
import { syncFromQueue } from '../../lib/queue/sync.js';

export function registerPlayerEvents(player) {
    player.events.on('error', (_queue, error) => {
        status.logError('Error del reproductor', error);
    });

    player.events.on('playerError', (queue, error, track) => {
        status.logError(`Error al reproducir: ${track?.title ?? 'canción'}`, error);
        if (queue && !queue.deleted) {
            syncFromQueue(queue);
        }
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
        if (queue?.node?.isPlaying()) {
            return;
        }
        syncFromQueue(queue);
    });

    player.events.on('emptyQueue', (queue) => {
        if (queue?.node?.isPlaying()) {
            return;
        }
        syncFromQueue(queue);
    });

    player.events.on('disconnect', (queue) => {
        if (queue && !queue.deleted) {
            status.logError('Voz', new Error('Desconectado del canal de voz'));
        }
    });
}
