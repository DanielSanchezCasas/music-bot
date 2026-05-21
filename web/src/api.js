const TOKEN_KEY = 'music-bot-token';

export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
}

export function setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
    const token = getToken();
    const headers = { ...(options.headers ?? {}) };
    const method = options.method ?? 'GET';
    let body = options.body;

    if (method !== 'GET' && method !== 'HEAD' && body === undefined) {
        body = '{}';
    }

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        if (typeof body !== 'string') {
            body = JSON.stringify(body);
        }
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`/api${path}`, { ...options, method, headers, body });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const detail = data.messages?.[0]?.content;
        throw new Error(data.message ?? data.error ?? detail ?? res.statusText);
    }
    if (data.ok === false) {
        throw new Error(data.error ?? 'La operación falló');
    }
    return data;
}

export async function waitForApi(maxAttempts = 60, intervalMs = 500) {
    for (let i = 0; i < maxAttempts; i += 1) {
        try {
            await fetch('/api/health');
            return true;
        } catch {
            await new Promise((r) => setTimeout(r, intervalMs));
        }
    }
    return false;
}

export const api = {
    health: () => request('/health'),
    status: () => request('/status'),
    ping: () => request('/commands/ping'),
    play: (query) =>
        request('/commands/play', {
            method: 'POST',
            body: JSON.stringify({ query }),
        }),
    pause: () => request('/commands/pause', { method: 'POST' }),
    replay: () => request('/commands/replay', { method: 'POST' }),
    skip: () => request('/commands/skip', { method: 'POST' }),
    stop: () => request('/commands/stop', { method: 'POST' }),
    list: () => request('/commands/list'),
    help: () => request('/commands/help'),
};

export function logsWebSocket(onMessage) {
    const token = getToken();
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
        `${protocol}//${location.host}/api/logs?token=${encodeURIComponent(token)}`
    );

    ws.onmessage = (event) => {
        try {
            onMessage(JSON.parse(event.data));
        } catch {
            /* ignore */
        }
    };

    return ws;
}

export function eventsWebSocket(onMessage) {
    const token = getToken();
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
        `${protocol}//${location.host}/api/events?token=${encodeURIComponent(token)}`
    );

    ws.onmessage = (event) => {
        try {
            onMessage(JSON.parse(event.data));
        } catch {
            /* ignore */
        }
    };

    return ws;
}
