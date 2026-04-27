<template>
  <section class="ai-profile">
    <header class="ai-head">
      <div>
        <p class="ai-eyebrow">AI Insight</p>
        <h2 class="ai-title">컬렉션 성향 분석</h2>
      </div>
      <button
        class="btn-secondary"
        :disabled="loading"
        @click="handleGenerate"
      >
        {{ loading ? '분석 중…' : profile ? '재분석' : '분석하기' }}
      </button>
    </header>

    <div v-if="profile" class="ai-body">
      <span class="ai-theme tag">{{ profile.themeType }}</span>
      <p class="ai-summary">{{ profile.summary }}</p>

      <div v-if="recommendations.length" class="ai-recos">
        <p class="ai-recos-label">추천 장소</p>
        <div class="chip-group">
          <span v-for="r in recommendations" :key="r" class="tag">◎ {{ r }}</span>
        </div>
      </div>
    </div>

    <p v-else class="ai-empty">
      장소가 3개 이상 쌓이면 AI가 이 컬렉션의 성향을 분석하고 비슷한 결의 장소를 추천해드려요.
    </p>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { generateProfile } from '../api/index.js'

const props = defineProps({ collectionId: Number, initialProfile: Object })
const profile = ref(props.initialProfile || null)
const loading = ref(false)

const recommendations = computed(() => {
  if (!profile.value?.recommendations) return []
  try { return JSON.parse(profile.value.recommendations) } catch { return [] }
})

async function handleGenerate() {
  loading.value = true
  try {
    const res = await generateProfile(props.collectionId)
    profile.value = res.data
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ai-profile {
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: 1.75rem 1.75rem 1.5rem;
}
.ai-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.ai-eyebrow {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 0.4rem;
}
.ai-title {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.005em;
}
.ai-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.ai-theme {
  align-self: flex-start;
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}
.ai-summary {
  font-family: var(--font-serif);
  font-size: 14.5px;
  color: var(--text);
  line-height: 1.75;
}
.ai-recos {
  padding-top: 0.5rem;
  border-top: 1px dashed var(--hairline);
}
.ai-recos-label {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--soft);
  margin-bottom: 0.65rem;
}
.ai-empty {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  line-height: 1.7;
}
</style>
