import youtubeDl from 'youtube-dl-exec';

function extractVideoId(url) {
    try {
        const parsed = new URL(url);
        let id = parsed.searchParams.get('v');
        if (!id && parsed.hostname === 'youtu.be') {
            id = parsed.pathname.slice(1);
        }
        return id?.substring(0, 11) ?? null;
    } catch {
        return url.split('/').at(-1)?.split('?')[0]?.substring(0, 11) ?? null;
    }
}

const HQ_AUDIO_FORMAT =
    'bestaudio[abr>=256][ext=m4a]/bestaudio[abr>=256]/bestaudio[ext=m4a]/bestaudio/best';

export function createHighQualityYouTubeStream(track) {
    const videoId = extractVideoId(track.url);
    if (!videoId) {
        return undefined;
    }

    const videoUrl = `https://youtu.be/${videoId}`;
    const format = track.live ? 'best[height<=480]/best' : HQ_AUDIO_FORMAT;

    const process = youtubeDl.exec(videoUrl, {
        format,
        output: '-',
        noWarnings: true,
        noProgress: true,
        preferFreeFormats: false,
    });

    process.catch(() => {});

    const stream = process.stdout;
    if (!stream) {
        return undefined;
    }

    const killProcess = () => {
        if (!process.killed) {
            process.kill();
        }
    };

    stream.on('close', killProcess);
    stream.on('error', killProcess);
    stream.on('end', killProcess);

    return stream;
}
