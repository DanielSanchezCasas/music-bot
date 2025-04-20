export function validateVoiceChannel(message) {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return 'No estás conectado a un canal de voz';
  }
  return null;
}

export function validateSearchQuery(args) {
  const results = args.join(' ');
  if (!results) {
    return 'Ingresa algo para buscar.';
  }
  return null;
}
