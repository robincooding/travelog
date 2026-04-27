<template>
  <div class="collections-page">

    <div class="page-header">
      <div class="header-left">
        <p class="header-label">Archive</p>
        <h1 class="header-title">내 아카이브</h1>
      </div>
      <RouterLink to="/collections/new" class="btn-new">+ 새 컬렉션</RouterLink>
    </div>

    <div v-if="loading" class="state-empty">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>

    <div v-else-if="collections.length === 0" class="state-empty">
      <p class="empty-icon">◎</p>
      <p class="empty-title">아직 컬렉션이 없어요</p>
      <p class="empty-sub">좋았던 장소들을 첫 컬렉션에 담아보세요.</p>
      <RouterLink to="/collections/new" class="btn-new">첫 컬렉션 만들기</RouterLink>
    </div>

    <div v-else class="collections-grid">
      <CollectionCard
        v-for="c in collections"
        :key="c.id"
        :collection="c"
        @delete="handleDelete"
      />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCollections, deleteCollection } from '../api/index.js'
import CollectionCard from '../components/CollectionCard.vue'

const collections = ref([])
const loading = ref(true)

onMounted(async () => {
  const res = await getCollections()
  collections.value = res.data
  loading.value = false
})

async function handleDelete(id) {
  if (!confirm('이 컬렉션을 삭제할까요?')) return
  await deleteCollection(id)
  collections.value = collections.value.filter(c => c.id !== id)
}
</script>

<style scoped>
.collections-page {
  max-width: 920px;
  margin: 0 auto;
  padding: 3rem 1.5rem 6rem;
  font-family: var(--font-serif);
}
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
}
.header-label {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 0.5rem;
}
.header-title {
  font-family: var(--font-serif);
  font-size: clamp(1.6rem, 3vw, 2rem);
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.005em;
}
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
.state-empty {
  padding: 6rem 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.empty-icon {
  font-size: 2rem;
  color: #d4d4d0;
  margin-bottom: 0.5rem;
}
.empty-title {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--muted);
}
.empty-sub {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  margin-bottom: 0.75rem;
}
.loading-dots {
  display: flex;
  gap: 6px;
}
.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ccc;
  animation: pulse 1.2s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50%      { opacity: 1;   transform: scale(1); }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>