<template>
  <div class="page">
    <RouterLink to="/collections" class="page-back">← 아카이브</RouterLink>

    <header class="page-head">
      <p class="page-eyebrow">Account</p>
      <h1 class="page-title">계정 설정</h1>
      <p class="page-meta">{{ user?.email }}</p>
    </header>

    <!-- 표시 이름 -->
    <section class="card">
      <h2 class="card-title">표시 이름</h2>
      <p class="card-help">컬렉터로 보여질 이름이에요.</p>

      <form class="form" @submit.prevent="handleDisplayName">
        <input
          v-model="displayName"
          class="form-input"
          maxlength="40"
          placeholder="이름"
          :disabled="loading.name"
        />
        <button
          class="btn-primary"
          type="submit"
          :disabled="loading.name || !canSubmitName"
        >
          {{ loading.name ? '저장 중…' : '저장' }}
        </button>
      </form>
      <p v-if="errors.name" class="msg msg--error">{{ errors.name }}</p>
      <p v-if="successes.name" class="msg msg--ok">{{ successes.name }}</p>
    </section>

    <!-- 비밀번호 변경 -->
    <section class="card">
      <h2 class="card-title">비밀번호 변경</h2>
      <p class="card-help">변경 후 다른 기기는 로그아웃되지 않지만, 비밀번호 재설정 링크는 모두 무효화돼요.</p>

      <form class="form form--column" @submit.prevent="handlePassword">
        <div class="form-row">
          <label class="form-label">현재 비밀번호</label>
          <input
            v-model="pw.current"
            type="password"
            class="form-input"
            autocomplete="current-password"
            :disabled="loading.pw"
          />
        </div>
        <div class="form-row">
          <label class="form-label">새 비밀번호 <span class="form-label-hint">(8자 이상)</span></label>
          <input
            v-model="pw.next"
            type="password"
            class="form-input"
            autocomplete="new-password"
            minlength="8"
            :disabled="loading.pw"
          />
        </div>
        <div class="form-actions">
          <button
            class="btn-primary"
            type="submit"
            :disabled="loading.pw || !canSubmitPw"
          >
            {{ loading.pw ? '변경 중…' : '비밀번호 변경' }}
          </button>
        </div>
      </form>
      <p v-if="errors.pw" class="msg msg--error">{{ errors.pw }}</p>
      <p v-if="successes.pw" class="msg msg--ok">{{ successes.pw }}</p>
    </section>

    <!-- 위험 영역 -->
    <section class="card card--danger">
      <h2 class="card-title">계정 삭제</h2>
      <p class="card-help">
        모든 컬렉션 / 장소 / 사진 메타데이터가 함께 삭제돼요. 되돌릴 수 없어요.
      </p>

      <form class="form" @submit.prevent="handleDelete">
        <input
          v-model="delPw"
          type="password"
          class="form-input"
          placeholder="비밀번호 재확인"
          autocomplete="current-password"
          :disabled="loading.del"
        />
        <button
          class="btn-danger"
          type="submit"
          :disabled="loading.del || !delPw"
        >
          {{ loading.del ? '삭제 중…' : '계정 영구 삭제' }}
        </button>
      </form>
      <p v-if="errors.del" class="msg msg--error">{{ errors.del }}</p>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'

const router = useRouter()
const { user, updateDisplayName, changePassword, deleteAccount } = useAuth()

const displayName = ref(user.value?.displayName || '')
const pw = reactive({ current: '', next: '' })
const delPw = ref('')

const loading = reactive({ name: false, pw: false, del: false })
const errors = reactive({ name: '', pw: '', del: '' })
const successes = reactive({ name: '', pw: '' })

const canSubmitName = computed(
  () => displayName.value.trim().length > 0 && displayName.value !== user.value?.displayName,
)
const canSubmitPw = computed(() => pw.current && pw.next.length >= 8)

function clearMessages() {
  errors.name = errors.pw = errors.del = ''
  successes.name = successes.pw = ''
}

async function handleDisplayName() {
  clearMessages()
  loading.name = true
  try {
    await updateDisplayName(displayName.value.trim())
    successes.name = '저장됐어요'
  } catch (err) {
    errors.name = err.response?.data?.error || '변경 실패'
  } finally {
    loading.name = false
  }
}

async function handlePassword() {
  clearMessages()
  loading.pw = true
  try {
    await changePassword(pw.current, pw.next)
    successes.pw = '비밀번호가 변경됐어요'
    pw.current = ''
    pw.next = ''
  } catch (err) {
    errors.pw = err.response?.data?.error || '변경 실패'
  } finally {
    loading.pw = false
  }
}

async function handleDelete() {
  clearMessages()
  if (!confirm('정말 계정을 삭제하시겠어요? 되돌릴 수 없어요.')) return
  loading.del = true
  try {
    await deleteAccount(delPw.value)
    // 탈퇴 성공 — Landing 으로
    router.replace('/')
  } catch (err) {
    errors.del = err.response?.data?.error || '삭제 실패'
  } finally {
    loading.del = false
  }
}
</script>

<style scoped>
.page-head {
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

.card {
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: 1.5rem 1.5rem 1.25rem;
  margin-bottom: 1.25rem;
}
.card--danger {
  border-color: rgba(220, 100, 100, 0.25);
  background: rgba(220, 100, 100, 0.02);
}
.card-title {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 0.4rem;
}
.card-help {
  font-family: var(--font-sans);
  font-size: 12.5px;
  color: var(--soft);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.form {
  display: flex;
  gap: 0.6rem;
  align-items: stretch;
}
.form--column { flex-direction: column; }
.form-row { display: flex; flex-direction: column; gap: 0.4rem; }
.form-actions { display: flex; justify-content: flex-end; }
.form-label-hint {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--faint);
  margin-left: 4px;
}

.btn-danger {
  font-family: var(--font-sans);
  font-size: 13px;
  background: transparent;
  color: #c66;
  padding: 9px 18px;
  border-radius: 100px;
  border: 1px solid #f0d0d0;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  white-space: nowrap;
}
.btn-danger:hover:not(:disabled) {
  color: #b04848;
  border-color: #e0a8a8;
  background: rgba(220, 100, 100, 0.04);
}
.btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }

.msg {
  font-family: var(--font-sans);
  font-size: 12.5px;
  margin-top: 0.75rem;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  line-height: 1.5;
}
.msg--error {
  color: #c66;
  background: rgba(220, 100, 100, 0.06);
  border: 1px solid rgba(220, 100, 100, 0.18);
}
.msg--ok {
  color: #2d8a4f;
  background: rgba(45, 138, 79, 0.06);
  border: 1px solid rgba(45, 138, 79, 0.18);
}
</style>
