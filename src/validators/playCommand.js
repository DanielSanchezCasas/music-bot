export function getVoiceChannel(member) {
    return member?.voice?.channel ?? null;
}

export function validateVoiceChannelMember(member) {
    if (!getVoiceChannel(member)) {
        return 'No estás conectado a un canal de voz';
    }
    return null;
}

export function validateSearchQuery(query) {
    if (!query?.trim()) {
        return 'Ingresa algo para buscar.';
    }
    return null;
}
