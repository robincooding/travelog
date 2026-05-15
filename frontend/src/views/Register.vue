<template>
  <div class="auth-page">
    <div class="auth-card">
      <RouterLink to="/" class="auth-logo-link" aria-label="Loci 홈으로">
        <LociLogo class="auth-logo" />
      </RouterLink>

      <h1 class="auth-title">처음 오셨군요</h1>
      <p class="auth-sub">간단한 계정으로 컬렉션을 시작해요.</p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div>
          <label class="form-label" for="reg-displayName">표시 이름 <span class="form-label-hint">(선택)</span></label>
          <input
            id="reg-displayName"
            v-model="displayName"
            type="text"
            class="form-input"
            placeholder="컬렉터로 보여질 이름"
            autocomplete="nickname"
            maxlength="40"
            :disabled="loading"
          />
        </div>

        <div>
          <label class="form-label" for="reg-email">이메일</label>
          <input
            id="reg-email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="you@example.com"
            autocomplete="email"
            required
            :disabled="loading"
          />
        </div>

        <div>
          <label class="form-label" for="reg-password">비밀번호 <span class="form-label-hint">(8자 이상)</span></label>
          <input
            id="reg-password"
            v-model="password"
            type="password"
            class="form-input"
            autocomplete="new-password"
            minlength="8"
            required
            :disabled="loading"
          />
        </div>

        <p v-if="errorMessage" class="auth-error" role="alert">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="btn-primary auth-submit"
          :disabled="loading || !canSubmit"
        >
          {{ loading ? '가입 중...' : '계정 만들기' }}
        </button>
      </form>

      <p class="auth-footer">
        이미 계정이 있으신가요?
        <RouterLink to="/login" class="auth-link">로그인</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import LociLogo from '../components/LociLogo.vue'

const router = useRouter()
const { register } = useAuth()

const email = ref('')
const password = ref('')
const displayName = ref('')
const loading = ref(false)
const errorMessage = ref('')

const canSubmit = computed(
  () => email.value && password.value && password.value.length >= 8,
)

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    await register({
      email: email.value,
      password: password.value,
      displayName: displayName.value || undefined,
    })
    router.replace('/collections')
  } catch (err) {
    errorMessage.value =
      err.response?.data?.error || '가입 중 오류가 발생했어요'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 로그인 페이지와 동일한 스타일 — 디자인 일관성 유지 */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.25rem;
  background: var(--bg);
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 18px;
  padding: 2.5rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
}
.auth-logo-link {
  display: flex;
  justify-content: center;
  color: var(--ink);
  text-decoration: none;
  margin-bottom: 1.75rem;
  transition: opacity 0.2s;
}
.auth-logo-link:hover { opacity: 0.7; }
.auth-logo { height: 32px; }

.auth-title {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--ink);
  text-align: center;
  letter-spacing: -0.005em;
  margin-bottom: 0.4rem;
}
.auth-sub {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  text-align: center;
  margin-bottom: 2rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-label-hint {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--faint);
  margin-left: 4px;
}

.auth-error {
  font-family: var(--font-sans);
  font-size: 13px;
  color: #c66;
  background: rgba(220, 100, 100, 0.06);
  border: 1px solid rgba(220, 100, 100, 0.18);
  border-radius: 8px;
  padding: 0.6rem 0.85rem;
  line-height: 1.5;
}

.auth-submit {
  width: 100%;
  padding: 13px 28px;
  font-size: 14px;
  margin-top: 0.25rem;
}

.auth-footer {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  text-align: center;
  margin-top: 1.75rem;
}
.auth-link {
  color: var(--ink);
  text-decoration: none;
  border-bottom: 1px solid var(--hairline-strong);
  padding-bottom: 1px;
  margin-left: 4px;
  transition: border-color 0.15s;
}
.auth-link:hover { border-color: var(--ink); }
</style>
