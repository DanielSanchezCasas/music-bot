import { buildQueueListPayload } from './formatList.js';

const NO_QUEUE_MESSAGE = 'No hay música en reproducción.';

/**
 * @param {import('discord-player').Player} player
 * @param {string} guildId
 * @returns {{ error: string } | { payload: ReturnType<typeof buildQueueListPayload> }}
 */
export function resolveQueueList(player, guildId) {
    const queue = player.queues.get(guildId);

    if (!queue) {
        return { error: NO_QUEUE_MESSAGE };
    }

    return { payload: buildQueueListPayload(queue) };
}
