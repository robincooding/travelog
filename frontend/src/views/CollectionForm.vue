<template>
  <div class="page page--narrow">
    <RouterLink :to="isEdit ? `/collections/${route.params.id}` : '/collections'" class="page-back">
      ← 돌아가기
    </RouterLink>

    <p class="page-eyebrow">{{ isEdit ? 'Edit collection' : 'New collection' }}</p>
    <h1 class="page-title">{{ isEdit ? '컬렉션 수정' : '새 컬렉션' }}</h1>

    <form @submit.prevent="handleSubmit" class="form-stack form-block">
      <div>
        <label class="form-label">컬렉션 이름</label>
        <input
          v-model="form.title"
          type="text"
          required
          placeholder="도쿄 카페 아카이브"
          class="form-input"
        />
      </div>

      <div>
        <label class="form-label">테마</label>
        <div class="chip-group" style="margin-bottom: 0.75rem;">
          <button
            v-for="t in themeOptions"
            :key="t"
            type="button"
            class="chip"
            :class="{ 'is-active': form.theme === t }"
            @click="form.theme = t"
          >{{ t }}</button>
        </div>
        <input
          v-model="form.theme"
          type="text"
          placeholder="직접 입력"
          class="form-input"
        />
      </div>

      <div>
        <label class="form-label">설명 (선택)</label>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="이 컬렉션에 대한 간단한 소개"
          class="form-textarea"
        />
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary">
          {{ isEdit ? '수정하기' : '만들기' }}
        </button>
        <RouterLink
          :to="isEdit ? `/collections/${route.params.id}` : '/collections'"
          class="btn-secondary"
        >
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

<style scoped>
.form-block {
  margin-top: 2.5rem;
}
.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 0.5rem;
}
</style>
