<script setup>
import { ref } from 'vue';
import { setToken } from '../api.js';

const emit = defineEmits(['authenticated']);
const tokenInput = ref('');
const error = ref('');

function submit() {
    error.value = '';
    if (!tokenInput.value.trim()) {
        error.value = 'Introduce el token de API';
        return;
    }
    setToken(tokenInput.value.trim());
    emit('authenticated');
}
</script>

<template>
    <div class="auth-page">
        <div class="auth-card card">
            <div class="logo">♫</div>
            <h1>Music Bot</h1>
            <p class="subtitle">Panel CasaOS · introduce tu WEB_API_TOKEN</p>
            <form @submit.prevent="submit">
                <input
                    v-model="tokenInput"
                    type="password"
                    placeholder="WEB_API_TOKEN"
                    autocomplete="off"
                />
                <p v-if="error" class="error">{{ error }}</p>
                <button type="submit" class="btn-primary full">Conectar</button>
            </form>
        </div>
    </div>
</template>

<style scoped>
.auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
}

.auth-card {
    width: 100%;
    max-width: 380px;
    text-align: center;
}

.logo {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    border-radius: 16px;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
}

.auth-card h1 {
    font-size: 1.5rem;
    margin-bottom: 0.35rem;
}

.subtitle {
    color: var(--muted);
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
}

form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-align: left;
}

.full {
    width: 100%;
    margin-top: 0.25rem;
}

.error {
    color: var(--error);
    font-size: 0.85rem;
}
</style>
