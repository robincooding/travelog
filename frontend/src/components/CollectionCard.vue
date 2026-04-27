<template>
  <RouterLink :to="`/collections/${collection.id}`" class="collection-card">
    <div class="card-top">
      <span class="card-theme">{{ collection.theme }}</span>
      <button class="card-delete" aria-label="삭제" @click.prevent="$emit('delete', collection.id)">✕</button>
    </div>

    <h2 class="card-title">{{ collection.title }}</h2>
    <p v-if="collection.description" class="card-desc">{{ collection.description }}</p>

    <div class="card-footer">
      <div class="card-meta">
        <span class="meta-places">
          <span class="meta-dot">◎</span>
          {{ collection._count?.places || 0 }}개 장소
        </span>
        <span v-if="collection.orders?.length" class="meta-orders">
          · {{ collection.orders.length }}건 주문
        </span>
      </div>
      <span class="card-arrow" aria-hidden="true">→</span>
    </div>
  </RouterLink>
</template>

<script setup>
defineProps({ collection: Object })
defineEmits(['delete'])
</script>

<style scoped>
.collection-card {
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: 1.5rem 1.75rem 1.25rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  cursor: pointer;
  min-height: 180px;
}
.collection-card:hover {
  border-color: var(--hairline-strong);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}
.card-theme {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--soft);
  border: 1px solid var(--hairline);
  padding: 3px 10px;
  border-radius: 100px;
  text-transform: uppercase;
}
.card-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #c8c8c8;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s;
}
.card-delete:hover { color: #e57373; }

.card-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 0.5rem;
  line-height: 1.4;
  letter-spacing: -0.005em;
}
.card-desc {
  font-family: var(--font-sans);
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.65;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  margin-top: auto;
  padding-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.card-meta {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--soft);
  display: flex;
  align-items: center;
  gap: 6px;
}
.meta-dot {
  font-size: 10px;
  margin-right: 4px;
  color: var(--faint);
}
.meta-orders { color: var(--faint); }

.card-arrow {
  font-family: var(--font-sans);
  font-size: 15px;
  color: #c0c0c0;
  transition: color 0.2s, transform 0.2s;
}
.collection-card:hover .card-arrow {
  color: var(--ink);
  transform: translateX(3px);
}
</style>
