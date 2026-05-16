<template>
  <div class="auth-page">
    <div class="auth-card">
      <RouterLink to="/" class="auth-logo-link" aria-label="Loci 홈으로">
        <LociLogo class="auth-logo" />
      </RouterLink>

      <h1 class="auth-title">새 비밀번호 설정</h1>
      <p class="auth-sub">앞으로 이 비밀번호로 로그인하실 수 있어요.</p>

      <!-- 토큰이 없거나 잘못된 경우 -->
      <div v-if="!token" class="auth-error" role="alert">
        잘못된 접근이에요. 비밀번호 재설정을 다시 요청해주세요.
      </div>

      <!-- 성공 후 -->
      <div v-else-if="done" class="auth-success" role="status">
        <p class="auth-success-title">✓ 비밀번호가 변경됐어요</p>
        <p class="auth-success-body">새 비밀번호로 로그인해주세요.</p>
        <RouterLink to="/login" class="btn-primary auth-submit auth-success-cta">
          로그인하기
        </RouterLink>
      </div>

      <!-- 폼 -->
      <form v-else class="auth-form" @submit.prevent="handleSubmit">
        <div>
          <label class="form-label" for="reset-pw">새 비밀번호 <span class="form-label-hint">(8자 이상)</span></label>
          <input
            id="reset-pw"
            v-model="password"
            type="password"
            class="form-input"
            autocomplete="new-password"
            minlength="8"
            required
            :disabled="loading"
          />
        </div>

        <div>
          <label class="form-label" for="reset-pw-confirm">비밀번호 확인</label>
          <input
            id="reset-pw-confirm"
            v-model="passwordConfirm"
            type="password"
            class="form-input"
            autocomplete="new-password"
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
          {{ loading ? '변경 중...' : '비밀번호 변경' }}
        </button>
      </form>

      <p v-if="!done" class="auth-footer">
        <RouterLink to="/login" class="auth-link">← 로그인으로 돌아가기</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { resetPassword } from '../api'
import LociLogo from '../components/LociLogo.vue'

const route = useRoute()
const token = computed(() =>
  typeof route.query.token === 'string' ? route.query.token : '',
)

const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)
const done = ref(false)
const errorMessage = ref('')

const canSubmit = computed(
  () => password.value.length >= 8 && password.value === passwordConfirm.value,
)

async function handleSubmit() {
  errorMessage.value = ''
  if (password.value !== passwordConfirm.value) {
    errorMessage.value = '두 비밀번호가 일치하지 않아요'
    return
  }
  loading.value = true
  try {
    await resetPassword(token.value, password.value)
    done.value = true
  } catch (err) {
    errorMessage.value =
      err.response?.data?.error || '비밀번호 변경 중 오류가 발생했어요'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Login / Register / ForgotPassword 와 동일한 카드 레이아웃 */
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
  text-align: center;
  text-decoration: none;
  display: inline-block;
}

.auth-success {
  text-align: center;
  padding: 1.5rem 0;
}
.auth-success-title {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: 0.5rem;
}
.auth-success-body {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
  margin-bottom: 1.25rem;
}
.auth-success-cta {
  margin-top: 0;
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
