<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
    <div class="flex items-start justify-between">
      <RouterLink :to="`/collections/${collection.id}`" class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs border border-gray-200 rounded-full px-2 py-0.5 text-gray-500">{{ collection.theme }}</span>
        </div>
        <h2 class="text-lg font-medium text-gray-800 mb-1">{{ collection.title }}</h2>
        <p v-if="collection.description" class="text-sm text-gray-400 mb-2">{{ collection.description }}</p>
        <p class="text-xs text-gray-400">
          📍 {{ collection._count?.places || 0 }}개 장소
          <span v-if="collection.orders?.length" class="ml-2">
            · 📚 {{ collection.orders.length }}건 주문
          </span>
        </p>
      </RouterLink>
      <button @click="$emit('delete', collection.id)"
        class="text-gray-300 hover:text-red-400 transition-colors ml-4 text-lg">✕</button>
    </div>
  </div>
</template>

<script setup>
defineProps({ collection: Object })
defineEmits(['delete'])
</script>