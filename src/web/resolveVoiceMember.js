import { voiceChannelId } from '../config/env.js';

/**
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<{ member: import('discord.js').GuildMember, channel: import('discord.js').VoiceBasedChannel } | { error: string }>}
 */
export async function resolveVoiceMember(guild) {
    const voiceStates = [...guild.voiceStates.cache.values()].filter(
        (vs) =>
            vs.channelId &&
            (!voiceChannelId || vs.channelId === voiceChannelId)
    );

    for (const vs of voiceStates) {
        const user = vs.member?.user ?? guild.client.users.cache.get(vs.id);
        if (user?.bot) {
            continue;
        }

        let member = vs.member;
        if (!member) {
            try {
                member = await guild.members.fetch(vs.id);
            } catch {
                continue;
            }
        }

        let channel = vs.channel;
        if (!channel && vs.channelId) {
            channel = guild.channels.cache.get(vs.channelId);
            if (!channel) {
                try {
                    channel = await guild.channels.fetch(vs.channelId);
                } catch {
                    channel = null;
                }
            }
        }

        if (!channel?.isVoiceBased()) {
            continue;
        }

        return { member, channel };
    }

    const guildLabel = guild.name ? `«${guild.name}»` : 'este servidor';

    if (voiceChannelId) {
        return {
            error: `No hay nadie en el canal de voz configurado en ${guildLabel}`,
        };
    }

    return {
        error: `No hay nadie en un canal de voz en ${guildLabel}`,
    };
}
