import { textChannelId } from '../config/env.js';

/**
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<import('discord.js').TextChannel | import('discord.js').NewsChannel | import('discord.js').ThreadChannel | null>}
 */
export async function resolveTextChannel(guild) {
    if (textChannelId) {
        let channel = guild.channels.cache.get(textChannelId);
        if (!channel) {
            try {
                channel = await guild.channels.fetch(textChannelId);
            } catch {
                channel = null;
            }
        }
        if (channel?.isTextBased()) {
            return channel;
        }
    }

    if (guild.systemChannel?.isTextBased()) {
        const me = guild.members.me;
        if (
            !me ||
            guild.systemChannel.permissionsFor(me)?.has('SendMessages')
        ) {
            return guild.systemChannel;
        }
    }

    const me = guild.members.me;
    for (const channel of guild.channels.cache.values()) {
        if (!channel.isTextBased()) {
            continue;
        }
        if (!me || channel.permissionsFor(me)?.has('SendMessages')) {
            return channel;
        }
    }

    return null;
}
