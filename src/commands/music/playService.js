import { sendMusicEmbed } from '../../lib/discord/embeds.js';
import { validateVoiceChannelMember, validateSearchQuery } from '../../validators/playCommand.js';
import { applyMaxVoiceBitrate } from '../../services/voice/bitrate.js';
import * as status from '../../lib/console/status.js';
import { syncFromQueue } from '../../lib/queue/sync.js';

/**
 * @param {object} ctx
 * @param {import('discord.js').GuildMember} ctx.member
 * @param {import('discord.js').TextChannel} ctx.textChannel
 * @param {string} ctx.query
 * @param {import('discord-player').Player} ctx.player
 * @param {(payload: { content: string, ephemeral?: boolean }) => Promise<void>} ctx.reply
 */
export async function executePlay({ member, textChannel, query, player, reply }) {
    const voiceChannel = member.voice.channel;

    const voiceChannelError = validateVoiceChannelMember(member);
    if (voiceChannelError) {
        return reply({ content: voiceChannelError, ephemeral: true });
    }

    const searchQueryError = validateSearchQuery(query);
    if (searchQueryError) {
        return reply({ content: searchQueryError, ephemeral: true });
    }

    status.setNowPlaying('Uniendo al canal de voz…');
    await applyMaxVoiceBitrate(voiceChannel);

    status.setNowPlaying('Buscando en YouTube…');

    try {
        const result = await player.play(voiceChannel, query, {
            requestedBy: member.user,
            nodeOptions: {
                metadata: {
                    channel: textChannel,
                },
                selfDeaf: true,
                volume: 100,
                resampler: 48000,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 30000,
                leaveOnEnd: true,
                leaveOnEndCooldown: 30000,
            },
        });

        status.setNowPlaying('Iniciando reproducción…');

        if (result?.track) {
            await sendMusicEmbed(textChannel, result.track, member.user);
            syncFromQueue(player.queues.get(textChannel.guild));

            const requester = result.track.requestedBy;
            const requesterTag = requester?.id ? ` · <@${requester.id}>` : '';

            await reply({
                content: `Reproduciendo: **${result.track.title}**${requesterTag}`,
            });
        } else {
            status.idle('Sin reproducción');
            await reply({ content: 'No se pudo iniciar la reproducción.' });
        }
    } catch (error) {
        status.logError('Play', error);
        status.idle('Sin reproducción');

        const isStreamError =
            error?.code === 'ERR_NO_RESULT' ||
            error?.message?.includes('extract stream');

        return reply({
            content: isStreamError
                ? 'Encontré la canción pero no pude obtener el audio. Prueba con un enlace directo de YouTube.'
                : 'No pude reproducir esa canción. Prueba con otra búsqueda o un enlace de YouTube.',
            ephemeral: true,
        });
    }
}
