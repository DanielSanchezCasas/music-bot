export async function applyMaxVoiceBitrate(voiceChannel) {
    if (!voiceChannel?.manageable) {
        return;
    }

    const bitrates = [384000, 256000, 128000, 96000];

    for (const bitrate of bitrates) {
        if (voiceChannel.bitrate >= bitrate) {
            return;
        }
        try {
            await voiceChannel.setBitrate(bitrate);
            return;
        } catch {
        }
    }
}
