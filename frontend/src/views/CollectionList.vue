<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-gray-800">내 아카이브</h1>
      <RouterLink
        to="/collections/new"
        class="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        + 새 컬렉션
      </RouterLink>
    </div>

    <div v-if="loading" class="text-center py-20 text-gray-400">불러오는 중...</div>

    <div v-else-if="collections.length === 0" class="text-center py-20 text-gray-400">
      아직 컬렉션이 없어요.<br>
      <RouterLink to="/collections/new" class="text-gray-600 underline mt-2 inline-block">첫 컬렉션 만들기</RouterLink>
    </div>

    <div v-else class="grid gap-4">
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