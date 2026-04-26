<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-800 mb-6">책 주문</h1>

    <div v-if="loading" class="text-center py-20 text-gray-400">불러오는 중...</div>
    <div v-else-if="orders.length === 0" class="text-center py-20 text-gray-400">
      아직 주문이 없어요.
    </div>

    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order.id"
        class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="font-medium text-gray-800">{{ order.bookTitle }}</p>
            <p class="text-sm text-gray-500 mt-0.5">
              {{ order.travel?.title }} · {{ order.size }}
              <span v-if="order.pageCount"> · {{ order.pageCount }}p</span>
            </p>
            <p class="text-xs text-gray-400 mt-1">{{ formatDate(order.createdAt) }}</p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <span :class="statusClass(order.status)"
              class="text-xs px-2 py-1 rounded-full font-medium">
              {{ statusLabel(order.status) }}
            </span>
            <div class="flex gap-1">
              <button v-for="s in nextStatuses(order.status)" :key="s"
                @click="handleStatusChange(order.id, s)"
                class="text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                → {{ statusLabel(s) }}
              </button>
              <button @click="handleExport(order.id)"
                class="text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                📦 익스포트
              </button>
            </div>
          </div>
        </div>
      </div>
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

function statusClass(s) {
  return {
    pending: 'bg-yellow-50 text-yellow-600',
    processing: 'bg-blue-50 text-blue-600',
    completed: 'bg-green-50 text-green-600',
    cancelled: 'bg-gray-100 text-gray-400'
  }[s]
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