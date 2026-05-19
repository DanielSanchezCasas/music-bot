import {
    buildPausePayload,
    buildResumePayload,
    buildSkipPayload,
    buildStopPayload,
} from '../../lib/discord/embeds.js';
import { validateVoiceChannelMember } from '../../validators/playCommand.js';
import { getWaitingTracks } from '../../lib/queue/sync.js';
import * as status from '../../lib/console/status.js';
import { syncFromQueue } from '../../lib/queue/sync.js';

const NO_QUEUE = 'No hay música en reproducción.';

/**
 * @param {import('discord.js').GuildMember} member
 * @param {string} guildId
 * @param {import('discord-player').Player} player
 */
function getQueue(member, guildId, player) {
    const voiceError = validateVoiceChannelMember(member);
    if (voiceError) {
        return { error: voiceError };
    }

    const queue = player.queues.get(guildId);
    if (!queue) {
        return { error: NO_QUEUE };
    }

    return { queue };
}

/**
 * @param {(payload: { content?: string, embeds?: import('discord.js').APIEmbed[], ephemeral?: boolean }) => Promise<unknown>} reply
 */
export async function executePause({ member, guildId, player, reply }) {
    const result = getQueue(member, guildId, player);
    if (result.error) {
        return reply({ content: result.error, ephemeral: true });
    }

    const { queue } = result;

    if (queue.node.isPaused()) {
        return reply({ content: 'La música ya está pausada.', ephemeral: true });
    }

    const track = queue.currentTrack;
    queue.node.pause();
    syncFromQueue(queue);

    return reply(buildPausePayload(track, member.user));
}

/**
 * @param {(payload: { content?: string, embeds?: import('discord.js').APIEmbed[], ephemeral?: boolean }) => Promise<unknown>} reply
 */
export async function executeResume({ member, guildId, player, reply }) {
    const result = getQueue(member, guildId, player);
    if (result.error) {
        return reply({ content: result.error, ephemeral: true });
    }

    const { queue } = result;

    if (!queue.node.isPaused()) {
        return reply({ content: 'La música ya se está reproduciendo.', ephemeral: true });
    }

    const track = queue.currentTrack;
    queue.node.resume();
    syncFromQueue(queue);

    return reply(buildResumePayload(track, member.user));
}

/**
 * @param {(payload: { content?: string, embeds?: import('discord.js').APIEmbed[], ephemeral?: boolean }) => Promise<unknown>} reply
 */
export async function executeSkip({ member, guildId, player, reply }) {
    const result = getQueue(member, guildId, player);
    if (result.error) {
        return reply({ content: result.error, ephemeral: true });
    }

    const { queue } = result;
    const skipped = queue.currentTrack;
    const waiting = getWaitingTracks(queue);
    const next = waiting[0] ?? null;

    queue.node.skip();
    syncFromQueue(queue);

    return reply(buildSkipPayload(skipped, next, member.user));
}

/**
 * @param {(payload: { content?: string, embeds?: import('discord.js').APIEmbed[], ephemeral?: boolean }) => Promise<unknown>} reply
 */
export async function executeStop({ member, guildId, player, reply }) {
    const result = getQueue(member, guildId, player);
    if (result.error) {
        return reply({ content: result.error, ephemeral: true });
    }

    const { queue } = result;
    const current = queue.currentTrack;
    const waiting = getWaitingTracks(queue);
    const total = (current ? 1 : 0) + waiting.length;

    queue.delete();
    status.idle('Sin reproducción');

    return reply(buildStopPayload(total, current, member.user));
}
