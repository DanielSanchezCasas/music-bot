export function sendMusicEmbed(channel, track) {
    const { title, author, duration, url, thumbnail } = track;

    channel.send({
        embeds: [
            {
                title: `🎵 Añadiendo: ${title}`,
                description: `👤 Autor: **${author}**\n⏱️ Duración: **${duration}**`,
                url: url,
                thumbnail: { url: thumbnail },
                color: 0x1DB954,
            }
        ]
    });
}
