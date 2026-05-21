<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: { type: Object, required: true },
});

const trackTitle = computed(() => {
    const t = props.status.currentTrack?.title;
    if (t) return t;
    const np = props.status.nowPlaying ?? '';
    const match = np.match(/Sonando:\s*(.+)/i) || np.match(/Pausado:\s*(.+)/i);
    return match?.[1] ?? (np && np !== 'Sin reproducción' ? np : null);
});

const statusLabel = computed(() => {
    if (props.status.isPaused) return 'Pausado';
    if (props.status.hasQueue) return 'En reproducción';
    return 'En espera';
});
</script>

<template>
    <div class="now-card card">
        <p class="card-title">Ahora suena</p>

        <div class="artwork">
            <span class="art-icon">{{ status.isPaused ? '⏸' : '♫' }}</span>
        </div>

        <p class="track-title">
            {{ trackTitle ?? 'Nada en reproducción' }}
        </p>
        <p class="track-meta">
            <span class="badge" :class="status.hasQueue ? 'badge-live' : 'badge-warn'">
                {{ statusLabel }}
            </span>
            <span v-if="status.currentTrack?.duration" class="duration">
                {{ status.currentTrack.duration }}
            </span>
        </p>

        <p v-if="status.voiceUser" class="voice-line">
            👤 {{ status.voiceUser.tag }} · {{ status.voiceUser.channel }}
        </p>

        <p class="bot-line">{{ status.botStatus }}</p>

        <ul v-if="status.upcoming?.length" class="upcoming">
            <li v-for="(t, i) in status.upcoming" :key="i">{{ t }}</li>
        </ul>
    </div>
</template>

<style scoped>
.now-card {
    text-align: center;
}

.artwork {
    width: 120px;
    height: 120px;
    margin: 0 auto 1rem;
    border-radius: var(--radius);
    background: linear-gradient(135deg, var(--accent-soft), var(--surface-hover));
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
}

.art-icon {
    font-size: 2.5rem;
    opacity: 0.9;
}

.track-title {
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.35;
    margin-bottom: 0.5rem;
    word-break: break-word;
}

.track-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.duration {
    color: var(--muted);
    font-size: 0.85rem;
}

.voice-line,
.bot-line {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 0.35rem;
}

.upcoming {
    text-align: left;
    margin-top: 1rem;
    padding: 0.75rem;
    background: var(--bg-elevated);
    border-radius: var(--radius-sm);
    list-style: none;
    font-size: 0.8rem;
    color: var(--muted);
}

.upcoming li {
    padding: 0.2rem 0;
}
</style>
