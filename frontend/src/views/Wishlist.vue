<template>
  <div class="page">
    <header class="wishlist-head">
      <div>
        <p class="page-eyebrow">Wishlist</p>
        <h1 class="page-title">가보고 싶은 곳</h1>
        <p class="page-meta">{{ items.length }}개</p>
      </div>
    </header>

    <div v-if="loading" class="state-block">
      <div class="loading-dots"><span></span><span></span><span></span></div>
    </div>

    <div v-else-if="items.length === 0" class="state-block">
      <span class="state-icon">◎</span>
      <p class="empty-title">아직 위시리스트가 비어있어요</p>
      <p class="empty-sub">컬렉션의 AI 추천에서 마음에 드는 장소를 담아보세요.</p>
    </div>

    <ul v-else class="wishlist">
      <li v-for="it in items" :key="it.id" class="wish-item">
        <div class="wish-main">
          <p class="wish-name">{{ displayName(it) }}</p>
          <p v-if="it.city || it.country" class="wish-loc">
            <span class="wish-loc-dot">◎</span>
            {{ [it.city, it.country].filter(Boolean).join(', ') }}
          </p>
          <p class="wish-meta">담은 날: {{ formatDate(it.createdAt) }}</p>
        </div>
        <button
          class="wish-remove"
          aria-label="제거"
          :disabled="removing === it.id"
          @click="handleRemove(it)"
        >
          {{ removing === it.id ? '…' : '✕' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getWishlist, removeFromWishlist } from '../api/index.js'

const items = ref([])
const loading = ref(true)
const removing = ref(null)

onMounted(async () => {
  try {
    const { data } = await getWishlist()
    items.value = data.items
  } finally {
    loading.value = false
  }
})

// "Blue Bottle (도쿄, 일본)" → city/country 가 별도 컬럼이라 이름만 깔끔히
function displayName(it) {
  if (!it.city && !it.country) return it.name
  // name 에 "(...)" 가 있으면 제거 (cleaner UI, 위치는 별도 줄에 표시)
  return it.name.replace(/\s*\([^)]*\)\s*$/, '').trim() || it.name
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

async function handleRemove(it) {
  if (!confirm(`"${displayName(it)}" 를 위시리스트에서 제거할까요?`)) return
  removing.value = it.id
  try {
    await removeFromWishlist(it.id)
    items.value = items.value.filter((x) => x.id !== it.id)
  } finally {
    removing.value = null
  }
}
</script>

<style scoped>
.wishlist-head {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--hairline);
}
.page-meta {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  margin-top: 0.5rem;
}

.wishlist {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.wish-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  transition: border-color 0.15s;
}
.wish-item:hover {
  border-color: var(--hairline-strong);
}
.wish-main {
  flex: 1;
  min-width: 0;
}
.wish-name {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 0.35rem;
}
.wish-loc {
  font-family: var(--font-sans);
  font-size: 12.5px;
  color: var(--soft);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 0.3rem;
}
.wish-loc-dot {
  font-size: 9px;
  color: var(--faint);
}
.wish-meta {
  font-family: var(--font-sans);
  font-size: 11.5px;
  color: var(--faint);
}

.wish-remove {
  background: none;
  border: 1px solid var(--hairline);
  border-radius: 100px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--soft);
  font-size: 12px;
  line-height: 1;
  transition: color 0.15s, border-color 0.15s;
}
.wish-remove:hover:not(:disabled) {
  color: #e57373;
  border-color: #e57373;
}
.wish-remove:disabled { opacity: 0.4; cursor: default; }

.empty-title {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  color: var(--muted);
  margin-top: 0.5rem;
}
.empty-sub {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
}
</style>
