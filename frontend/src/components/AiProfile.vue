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
        <p class="ai-recos-label">
          추천 장소
          <span class="ai-recos-hint">— 클릭하면 위시리스트에 추가돼요</span>
        </p>
        <div class="chip-group">
          <button
            v-for="r in recommendations"
            :key="r"
            type="button"
            class="tag tag-rec"
            :class="{ 'is-wished': wishedNames.has(r) }"
            :disabled="addingName === r || wishedNames.has(r)"
            :title="wishedNames.has(r) ? '위시리스트에 있어요' : `${r} 위시리스트에 추가`"
            @click="handleAdd(r)"
          >
            <span class="rec-text">◎ {{ r }}</span>
            <span class="rec-state" aria-hidden="true">{{ stateIcon(r) }}</span>
          </button>
        </div>
        <p v-if="errorMsg" class="ai-recos-error" role="alert">{{ errorMsg }}</p>
      </div>
    </div>

    <p v-else class="ai-empty">
      장소가 3개 이상 쌓이면 AI가 이 컬렉션의 성향을 분석하고 비슷한 결의 장소를 추천해드려요.
    </p>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { generateProfile, addToWishlist, getWishlist } from '../api/index.js'

const props = defineProps({ collectionId: Number, initialProfile: Object })
const profile = ref(props.initialProfile || null)
const loading = ref(false)

// 추가 중인 chip 이름 / 이미 위시 추가된 이름들 / 에러 메시지
const addingName = ref(null)
const wishedNames = ref(new Set())
const errorMsg = ref('')

const recommendations = computed(() => {
  if (!profile.value?.recommendations) return []
  try { return JSON.parse(profile.value.recommendations) } catch { return [] }
})

// 페이지 진입 시 본인 위시리스트 한 번 로드 — 이미 있는 항목엔 ✓ 표시
onMounted(async () => {
  try {
    const { data } = await getWishlist()
    wishedNames.value = new Set(data.items.map((it) => it.name))
  } catch {
    // 비로그인 등은 무시 (이 컴포넌트는 인증된 페이지에서만 쓰임)
  }
})

function stateIcon(name) {
  if (wishedNames.value.has(name)) return '✓'
  if (addingName.value === name) return '…'
  return '+'
}

async function handleAdd(name) {
  if (wishedNames.value.has(name) || addingName.value) return
  errorMsg.value = ''
  addingName.value = name
  try {
    // "장소명 (도시, 나라)" 형식이면 city / country parse
    const match = name.match(/^(.+?)\s*\((.+?),\s*(.+?)\)\s*$/)
    const payload = {
      name,
      city: match ? match[2].trim() : null,
      country: match ? match[3].trim() : null,
      sourceCollectionId: props.collectionId,
    }
    await addToWishlist(payload)
    wishedNames.value.add(name)
  } catch (err) {
    if (err.response?.status === 409) {
      // 이미 있음 — 다른 브라우저 등에서 추가된 경우, 그냥 표시만 갱신
      wishedNames.value.add(name)
    } else {
      errorMsg.value = err.response?.data?.error || '추가 중 오류가 발생했어요'
    }
  } finally {
    addingName.value = null
  }
}

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
.ai-recos-hint {
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: none;
  color: var(--faint);
}
.ai-recos-error {
  margin-top: 0.6rem;
  font-family: var(--font-sans);
  font-size: 12px;
  color: #c66;
}

/* 추천 chip — button 으로 변환 */
.tag-rec {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 11.5px;
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: 100px;
  padding: 4px 10px 4px 12px;
  color: var(--muted);
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.tag-rec:hover:not(:disabled) {
  border-color: var(--ink);
  color: var(--ink);
  background: rgba(0, 0, 0, 0.02);
}
.tag-rec:disabled {
  cursor: default;
}
.tag-rec .rec-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--hairline);
  color: var(--soft);
  font-size: 11px;
  line-height: 1;
  transition: background 0.15s, color 0.15s;
}
.tag-rec:hover:not(:disabled) .rec-state {
  background: var(--ink);
  color: #fff;
}
/* 이미 위시에 추가된 chip — 살짝 강조 + 체크 표시 */
.tag-rec.is-wished {
  border-color: rgba(45, 138, 79, 0.35);
  color: #2d8a4f;
  background: rgba(45, 138, 79, 0.04);
}
.tag-rec.is-wished .rec-state {
  background: #2d8a4f;
  color: #fff;
}

.ai-empty {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  line-height: 1.7;
}
</style>
