<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    hasVoice: { type: Boolean, default: false },
    hasQueue: { type: Boolean, default: false },
    isPaused: { type: Boolean, default: false },
    voiceError: { type: String, default: null },
    otherGuildsHint: { type: String, default: null },
    configuredGuild: { type: Object, default: null },
    configuredGuildCount: { type: Number, default: 1 },
    loading: { type: Boolean, default: false },
});

const emit = defineEmits(['play', 'pause', 'replay', 'skip', 'stop', 'ping', 'refresh']);

const query = ref('');

const canTransport = computed(() => props.hasQueue && !props.loading);

function onPlay() {
    if (!query.value.trim()) return;
    emit('play', query.value.trim());
}
</script>

<template>
    <div class="player-card card">
        <p v-if="configuredGuild" class="guild-line">
            Servidor activo: <strong>{{ configuredGuild.name }}</strong>
            <span v-if="configuredGuildCount > 1" class="guild-multi">
                ({{ configuredGuildCount }} configurados en GUILD_ID — se elige por voz)
            </span>
            <span class="guild-id">{{ configuredGuild.id }}</span>
        </p>

        <div class="status-row">
            <span v-if="hasVoice" class="badge badge-ok">● En voz</span>
            <span v-else class="badge badge-warn">Sin usuarios en voz</span>
            <span v-if="hasQueue" class="badge badge-live">♫ Reproduciendo</span>
        </div>
        <p v-if="voiceError && !hasVoice" class="hint">{{ voiceError }}</p>
        <p v-if="otherGuildsHint && !hasVoice" class="hint warn">{{ otherGuildsHint }}</p>

        <div class="search-box">
            <input
                v-model="query"
                type="text"
                placeholder="Buscar canción o pegar URL de YouTube"
                :disabled="!hasVoice || loading"
                @keydown.enter="onPlay"
            />
            <button
                class="btn-primary play-btn"
                :disabled="!hasVoice || loading || !query.trim()"
                title="Reproducir"
                @click="onPlay"
            >
                ▶ Play
            </button>
        </div>

        <div class="transport">
            <button
                class="btn-icon"
                :disabled="!canTransport"
                title="Pausar"
                @click="emit('pause')"
            >
                ⏸
            </button>
            <button
                class="btn-icon"
                :class="{ active: isPaused }"
                :disabled="!canTransport"
                title="Reanudar"
                @click="emit('replay')"
            >
                ▶
            </button>
            <button
                class="btn-icon"
                :disabled="!canTransport"
                title="Siguiente"
                @click="emit('skip')"
            >
                ⏭
            </button>
            <button
                class="btn-icon danger"
                :disabled="!canTransport"
                title="Detener y vaciar cola"
                @click="emit('stop')"
            >
                ⏹
            </button>
        </div>

        <p v-if="!hasQueue && hasVoice" class="transport-hint">
            Usa Play para empezar. Los controles de abajo funcionan con música activa.
        </p>

        <div class="footer-actions">
            <button class="btn-ghost" :disabled="loading" @click="emit('refresh')">
                ↻ Actualizar
            </button>
            <button class="btn-ghost" :disabled="loading" @click="emit('ping')">
                Ping
            </button>
        </div>
    </div>
</template>

<style scoped>
.player-card {
    padding: 1.25rem;
}

.status-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.guild-line {
    font-size: 0.85rem;
    color: var(--muted);
    margin-bottom: 0.65rem;
}

.guild-line strong {
    color: var(--text);
}

.guild-id {
    display: block;
    font-size: 0.72rem;
    opacity: 0.7;
    margin-top: 0.15rem;
    font-family: var(--mono);
}

.hint,
.transport-hint {
    color: var(--muted);
    font-size: 0.8rem;
    margin-bottom: 0.75rem;
    line-height: 1.4;
}

.hint.warn {
    color: var(--warn);
}

.search-box {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.search-box input {
    flex: 1;
}

.play-btn {
    white-space: nowrap;
}

.transport {
    display: flex;
    justify-content: center;
    gap: 0.65rem;
    padding: 0.5rem 0;
    margin-bottom: 0.5rem;
}

.footer-actions {
    display: flex;
    justify-content: center;
    gap: 0.25rem;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
}
</style>
