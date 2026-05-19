import * as status from './status.js';

/**
 * @param {string} command
 * @param {string} [detail]
 */
export function logCommand(command, detail = '') {
    const suffix = detail?.trim() ? ` ${detail.trim()}` : '';
    status.setLastCommand(`${command}${suffix}`);
}
