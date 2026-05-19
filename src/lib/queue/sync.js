import * as status from '../console/status.js';

const MAX_UPCOMING = 5;

function truncate(title, max = 48) {
    if (!title) {
        return 'Sin título';
    }
    return title.length > max ? `${title.slice(0, max - 1)}…` : title;
}

export function getWaitingTracks(queue) {
    const tracks = queue.tracks;

    if (typeof tracks.toArray === 'function') {
        return tracks.toArray();
    }
    if (tracks?.store) {
        return tracks.store;
    }
    if (tracks?.data) {
        return tracks.data;
    }
    if (Array.isArray(tracks)) {
        return tracks;
    }

    return [...tracks];
}

export function syncFromQueue(queue) {
    if (!queue || queue.deleted) {
        status.idle('Sin reproducción');
        return;
    }

    const current = queue.currentTrack;
    const waiting = getWaitingTracks(queue);
    const isPaused = queue.node.isPaused();

    const nextTitles = waiting.slice(0, MAX_UPCOMING).map((track) => truncate(track.title));

    const extra = waiting.length - nextTitles.length;
    if (extra > 0) {
        nextTitles.push(`… y ${extra} más`);
    }

    if (current) {
        const prefix = isPaused ? '⏸️ Pausado' : 'Sonando';
        status.showQueue(`${prefix}: ${truncate(current.title)}`, nextTitles);
        return;
    }

    if (waiting.length > 0) {
        status.showQueue('Preparando reproducción…', nextTitles);
        return;
    }

    status.idle('Sin reproducción');
}
