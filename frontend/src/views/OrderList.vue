<template>
  <div class="page">
    <div class="page-head">
      <p class="page-eyebrow">Orders</p>
      <h1 class="page-title">책 주문</h1>
    </div>

    <div v-if="loading" class="state-block">
      <div class="loading-dots"><span></span><span></span><span></span></div>
    </div>

    <div v-else-if="orders.length === 0" class="state-block">
      <span class="state-icon">◻</span>
      <p>아직 주문이 없어요.</p>
      <p class="state-hint">컬렉션 상세 페이지에서 책으로 주문할 수 있어요.</p>
    </div>

    <div v-else class="orders-list">
      <article v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-main">
          <h2 class="order-title">{{ order.bookTitle }}</h2>
          <p class="order-sub">
            <span v-if="order.collection?.title">{{ order.collection.title }}</span>
            <span v-if="order.collection?.title" class="order-sep">·</span>
            <span>{{ order.size }}</span>
            <template v-if="order.pageCount">
              <span class="order-sep">·</span>
              <span>{{ order.pageCount }}p</span>
            </template>
          </p>
          <p class="order-date">{{ formatDate(order.createdAt) }}</p>
        </div>

        <div class="order-side">
          <span :class="['status-badge', `status-badge--${order.status}`]">
            {{ statusLabel(order.status) }}
          </span>
          <div class="order-actions">
            <button
              v-for="s in nextStatuses(order.status)"
              :key="s"
              class="btn-tiny"
              @click="handleStatusChange(order.id, s)"
            >→ {{ statusLabel(s) }}</button>
            <button class="btn-tiny" @click="handleExport(order.id)">내보내기</button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOrders, updateOrderStatus, exportOrder } from '../api/index.js'

const orders = ref([])
const loading = ref(true)

onMounted(async () => {
  const res = await getOrders()
  orders.value = res.data
  loading.value = false
})

function formatDate(d) {
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function statusLabel(s) {
  return { pending: '대기', processing: '처리중', completed: '완료', cancelled: '취소' }[s] || s
}

function nextStatuses(current) {
  return {
    pending: ['processing', 'cancelled'],
    processing: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  }[current] || []
}

async function handleStatusChange(id, status) {
  await updateOrderStatus(id, status)
  const res = await getOrders()
  orders.value = res.data
}

async function handleExport(orderId) {
  const res = await exportOrder(orderId)
  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `order-${orderId}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.page-head {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--hairline);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: 1.4rem 1.6rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.order-card:hover {
  border-color: var(--hairline-strong);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
}

.order-main {
  flex: 1;
  min-width: 0;
}
.order-title {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 0.4rem;
  letter-spacing: -0.005em;
}
.order-sub {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--muted);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 0.35rem;
}
.order-sep { color: var(--faint); }
.order-date {
  font-family: var(--font-sans);
  font-size: 11.5px;
  color: var(--faint);
  letter-spacing: 0.02em;
}

.order-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.6rem;
  flex-shrink: 0;
}
.order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.state-hint {
  font-size: 12px;
  color: var(--faint);
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

@media (max-width: 600px) {
  .order-card {
    flex-direction: column;
    gap: 1rem;
  }
  .order-side {
    align-items: flex-start;
    width: 100%;
  }
  .order-actions { justify-content: flex-start; }
}
</style>
