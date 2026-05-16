<template>
  <div class="auth-page">
    <div class="auth-card">
      <RouterLink to="/" class="auth-logo-link" aria-label="Loci 홈으로">
        <LociLogo class="auth-logo" />
      </RouterLink>

      <h1 class="auth-title">비밀번호를 잊으셨나요?</h1>
      <p class="auth-sub">가입하신 이메일로 재설정 링크를 보내드려요.</p>

      <form v-if="!sent" class="auth-form" @submit.prevent="handleSubmit">
        <div>
          <label class="form-label" for="forgot-email">이메일</label>
          <input
            id="forgot-email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="you@example.com"
            autocomplete="email"
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
          :disabled="loading || !email"
        >
          {{ loading ? '발송 중...' : '재설정 링크 받기' }}
        </button>
      </form>

      <div v-else class="auth-success" role="status">
        <p class="auth-success-title">✓ 메일을 확인해주세요</p>
        <p class="auth-success-body">
          가입된 이메일이면 1시간 동안 유효한 재설정 링크가 도착해요.<br>
          (학습 환경: 백엔드 콘솔에 출력됩니다)
        </p>
      </div>

      <p class="auth-footer">
        <RouterLink to="/login" class="auth-link">← 로그인으로 돌아가기</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { forgotPassword } from '../api'
import LociLogo from '../components/LociLogo.vue'

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    await forgotPassword(email.value)
    sent.value = true
  } catch (err) {
    errorMessage.value =
      err.response?.data?.error || '요청 처리 중 오류가 발생했어요'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Login.vue / Register.vue 와 동일한 카드 레이아웃 */
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

.auth-form { display: flex; flex-direction: column; gap: 1.25rem; }

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

.auth-success {
  text-align: center;
  padding: 1.5rem 0;
}
.auth-success-title {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: 0.75rem;
}
.auth-success-body {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
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
  transition: border-color 0.15s;
}
.auth-link:hover { border-color: var(--ink); }
</style>
