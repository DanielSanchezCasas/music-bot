import ping from './test/ping.js';
import play from './music/play.js';
import stop from './music/stop.js';
import replay from './music/replay.js';
import pause from './music/pause.js';
import skip from './music/skip.js';
import list from './music/list.js';
import help from './general/help.js';

const commands = {
    ping,
    play,
    stop,
    replay,
    pause,
    skip,
    list,
    help,
};

export default commands;
