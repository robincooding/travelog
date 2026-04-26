<template>
  <div class="bg-gray-50 rounded-xl p-5">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-medium text-gray-700">🤖 AI 성향 분석</h2>
      <button @click="handleGenerate" :disabled="loading"
        class="text-sm px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
        {{ loading ? '분석 중...' : profile ? '재분석' : '분석하기' }}
      </button>
    </div>

    <div v-if="profile">
      <div class="flex items-center gap-2 mb-3">
        <span class="bg-gray-800 text-white text-xs px-3 py-1 rounded-full">{{ profile.themeType }}</span>
      </div>
      <p class="text-sm text-gray-600 leading-relaxed mb-4">{{ profile.summary }}</p>
      <div v-if="recommendations.length">
        <p class="text-xs text-gray-400 mb-2">추천 장소</p>
        <div class="flex flex-wrap gap-2">
          <span v-for="r in recommendations" :key="r"
            class="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-600">
            📍 {{ r }}
          </span>
        </div>
      </div>
    </div>
    <p v-else class="text-sm text-gray-400">
      장소가 3개 이상 쌓이면 AI가 이 컬렉션의 성향을 분석하고 유사한 장소를 추천해드려요.
    </p>
  </div>
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