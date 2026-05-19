import { EmbedBuilder } from 'discord.js';

const COLORS = {
    play: 0x1db954,
    pause: 0xf39c12,
    resume: 0x1db954,
    skip: 0x3498db,
    stop: 0xe74c3c,
};

function formatUserAction(user, action) {
    if (user?.id) {
        return `\n\n${action} por <@${user.id}>`;
    }
    return '';
}

function formatTrackBlock(track, label) {
    if (!track) {
        return '';
    }
    const header = label ? `**${label}:** ${track.title}` : `**${track.title}**`;
    return `${header}\n👤 ${track.author} · \`⏱️ ${track.duration}\``;
}

function withThumbnail(embed, track) {
    if (track?.thumbnail) {
        embed.setThumbnail(track.thumbnail);
    }
    return embed;
}

/**
 * @param {import('discord.js').TextChannel} channel
 * @param {import('discord-player').Track} track
 * @param {import('discord.js').User} [requesterFallback]
 */
export function sendMusicEmbed(channel, track, requesterFallback) {
    const { title, author, duration, url, thumbnail } = track;
    const requester = track.requestedBy ?? requesterFallback;

    let description =
        `👤 Autor: **${author}**\n` +
        `⏱️ Duración: **${duration}**`;

    if (requester?.id) {
        description += `\n🙋 Añadida por <@${requester.id}>`;
    }

    const embed = new EmbedBuilder()
        .setColor(COLORS.play)
        .setTitle(`🎵 ${title}`)
        .setURL(url)
        .setDescription(description);

    if (thumbnail) {
        embed.setThumbnail(thumbnail);
    }

    return channel.send({ embeds: [embed] });
}

/**
 * @param {import('discord-player').Track | null} track
 * @param {import('discord.js').User} user
 */
export function buildPausePayload(track, user) {
    let description = formatTrackBlock(track);
    description += formatUserAction(user, '⏸️ Pausado');

    const embed = withThumbnail(
        new EmbedBuilder()
            .setColor(COLORS.pause)
            .setTitle('⏸️ Música pausada')
            .setDescription(description || 'No hay una canción en reproducción.'),
        track
    );

    return { embeds: [embed] };
}

/**
 * @param {import('discord-player').Track | null} track
 * @param {import('discord.js').User} user
 */
export function buildResumePayload(track, user) {
    let description = formatTrackBlock(track);
    description += formatUserAction(user, '▶️ Reanudado');

    const embed = withThumbnail(
        new EmbedBuilder()
            .setColor(COLORS.resume)
            .setTitle('▶️ Música reanudada')
            .setDescription(description || 'No hay una canción en reproducción.'),
        track
    );

    return { embeds: [embed] };
}

/**
 * @param {import('discord-player').Track | null} skipped
 * @param {import('discord-player').Track | null} next
 * @param {import('discord.js').User} user
 */
export function buildSkipPayload(skipped, next, user) {
    let description = formatTrackBlock(skipped, 'Saltada');

    if (next) {
        description += `\n\n${formatTrackBlock(next, 'Siguiente')}`;
    } else {
        description += '\n\n*No hay más canciones en la cola.*';
    }

    description += formatUserAction(user, '⏭️ Saltada');

    const embed = withThumbnail(
        new EmbedBuilder()
            .setColor(COLORS.skip)
            .setTitle('⏭️ Canción saltada')
            .setDescription(description),
        skipped ?? next
    );

    return { embeds: [embed] };
}

/**
 * @param {number} totalTracks
 * @param {import('discord-player').Track | null} current
 * @param {import('discord.js').User} user
 */
export function buildStopPayload(totalTracks, current, user) {
    const countLabel =
        totalTracks === 1 ? '**1** canción eliminada' : `**${totalTracks}** canciones eliminadas`;

    let description = `🗑️ ${countLabel} de la cola.`;

    if (current) {
        description += `\n\n${formatTrackBlock(current, 'Última en reproducir')}`;
    }

    description += formatUserAction(user, '⏹️ Detenido');

    const embed = withThumbnail(
        new EmbedBuilder()
            .setColor(COLORS.stop)
            .setTitle('⏹️ Reproducción detenida')
            .setDescription(description),
        current
    );

    return { embeds: [embed] };
}
