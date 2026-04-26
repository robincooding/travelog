<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-semibold text-gray-800 mb-6">
      {{ isEdit ? '컬렉션 수정' : '새 컬렉션' }}
    </h1>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm text-gray-600 mb-1">컬렉션 이름</label>
        <input v-model="form.title" type="text" required placeholder="도쿄 카페 아카이브"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">테마</label>
        <div class="flex flex-wrap gap-2 mb-2">
          <button
            v-for="t in themeOptions" :key="t" type="button"
            @click="form.theme = t"
            :class="form.theme === t
              ? 'bg-gray-800 text-white'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'"
            class="text-xs px-3 py-1.5 rounded-full transition-colors"
          >{{ t }}</button>
        </div>
        <input v-model="form.theme" type="text" placeholder="직접 입력"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">설명 (선택)</label>
        <textarea v-model="form.description" rows="3" placeholder="이 컬렉션에 대한 간단한 소개"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
      </div>

      <div class="flex gap-3 pt-2">
        <button type="submit"
          class="bg-gray-800 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          {{ isEdit ? '수정하기' : '만들기' }}
        </button>
        <RouterLink :to="isEdit ? `/collections/${route.params.id}` : '/collections'"
          class="text-sm px-5 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          취소
        </RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCollection, createCollection, updateCollection } from '../api/index.js'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const themeOptions = ['카페', '전시·미술관', '미식', '애니 성지순례', '골목 산책', '야경', '서점', '온천']

const form = ref({ title: '', theme: '', description: '' })

onMounted(async () => {
  if (isEdit.value) {
    const res = await getCollection(route.params.id)
    const c = res.data
    form.value = { title: c.title, theme: c.theme, description: c.description || '' }
  }
})

async function handleSubmit() {
  if (isEdit.value) {
    await updateCollection(route.params.id, form.value)
    router.push(`/collections/${route.params.id}`)
  } else {
    const res = await createCollection(form.value)
    router.push(`/collections/${res.data.id}`)
  }
}
</script>