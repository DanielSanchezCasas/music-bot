import { EmbedBuilder } from 'discord.js';
import { getWaitingTracks } from './sync.js';

const MAX_LINES = 30;
const MAX_TITLE_LENGTH = 55;

function truncate(text, max) {
    if (!text) {
        return 'Sin título';
    }
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatRequester(track) {
    const user = track.requestedBy;
    if (user?.id) {
        return `<@${user.id}>`;
    }
    return 'Desconocido';
}

function getTrackDurationMs(track) {
    if (!track) {
        return 0;
    }
    try {
        const ms = track.durationMS;
        return Number.isFinite(ms) && ms > 0 ? ms : 0;
    } catch {
        return 0;
    }
}

function getCurrentRemainingMs(queue, track) {
    const timestamp = queue.node?.getTimestamp?.();
    if (
        timestamp?.total?.value &&
        timestamp.current?.value != null &&
        timestamp.total.value > timestamp.current.value
    ) {
        return timestamp.total.value - timestamp.current.value;
    }
    return getTrackDurationMs(track);
}

function formatDurationMs(ms) {
    if (!ms || ms <= 0) {
        return '??:??';
    }

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatLine(index, track, isPlaying) {
    const title = truncate(track.title, MAX_TITLE_LENGTH);
    const duration = track.duration ?? '??:??';
    const marker = isPlaying ? '▶' : '·';

    return `**${index}.** ${marker} ${title} · \`${duration}\` · ${formatRequester(track)}`;
}

function buildSummary(total, totalMs) {
    const songsLabel = total === 1 ? 'canción' : 'canciones';
    const durationLabel = formatDurationMs(totalMs);

    return `**${total}** ${songsLabel} · ⏱️ **${durationLabel}** en total`;
}

export function buildQueueListPayload(queue) {
    const current = queue.currentTrack;
    const waiting = getWaitingTracks(queue);
    const total = (current ? 1 : 0) + waiting.length;

    if (total === 0) {
        return {
            content: 'La cola está vacía.',
            embeds: [],
        };
    }

    let totalMs = 0;
    if (current) {
        totalMs += getCurrentRemainingMs(queue, current);
    }
    for (const track of waiting) {
        totalMs += getTrackDurationMs(track);
    }

    const lines = [];
    let index = 1;

    if (current) {
        lines.push(formatLine(index, current, true));
        index += 1;
    }
    for (const track of waiting) {
        lines.push(formatLine(index, track, false));
        index += 1;
    }

    const visible = lines.slice(0, MAX_LINES);
    const hidden = lines.length - visible.length;

    const summary = buildSummary(total, totalMs);
    let description = `${summary}\n\n${visible.join('\n')}`;

    if (hidden > 0) {
        description += `\n*+${hidden} más*`;
    }

    const embed = new EmbedBuilder()
        .setColor(0x1db954)
        .setDescription(description);

    return { embeds: [embed] };
}
