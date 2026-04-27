<template>
  <div class="loci-root">

    <!-- 네비게이션 -->
    <nav class="loci-nav">
      <div class="nav-inner">
        <RouterLink to="/" class="nav-logo-link" aria-label="Loci 홈">
          <LociLogo class="nav-logo" />
        </RouterLink>
        <RouterLink to="/collections" class="nav-link">아카이브 보기 →</RouterLink>
      </div>
    </nav>

    <!-- 히어로 -->
    <section class="hero">
      <div class="hero-grid" aria-hidden="true"></div>

      <div class="floating-tags" aria-hidden="true">
        <span v-for="(tag, i) in floatingTags" :key="tag"
          class="float-tag"
          :style="floatStyle(i)"
        >{{ tag }}</span>
      </div>

      <div class="hero-content">
        <p class="hero-eyebrow">장소 아카이빙 서비스</p>

        <h1 class="hero-title">
          <span class="hero-line-1">좋았던 장소들,</span>
          <span class="hero-line-2">
            <span ref="typedEl" class="typed-text"></span><span
              class="cursor"
              :class="{ blink: doneTyping }"
            >|</span>
          </span>
        </h1>

        <p class="hero-sub">
          카페, 전시, 미식, 성지순례.<br>
          취향대로 큐레이션하는 나만의 장소 아카이브.
        </p>

        <div class="hero-actions">
          <div class="hero-action">
            <RouterLink to="/collections/new" class="btn-primary">+ 컬렉션 만들기</RouterLink>
            <p class="hero-action-help">테마를 정하고 좋았던 장소를 담아요</p>
          </div>
          <div class="hero-action">
            <RouterLink to="/collections" class="btn-ghost">아카이브 보기</RouterLink>
            <p class="hero-action-help">이미 만든 컬렉션 둘러보기</p>
          </div>
        </div>
      </div>

      <div class="scroll-hint">
        <span class="scroll-label">SCROLL</span>
        <div class="scroll-bar"></div>
      </div>
    </section>

    <!-- 브랜드 소개 -->
    <section class="brand-section">
      <div class="brand-inner">
        <p class="brand-eyebrow">About the name</p>

        <div class="brand-mark">
          <LociLogo class="brand-logo" />
        </div>

        <p class="brand-pronunciation">
          <span class="phonetic">[ˈloʊ.saɪ]</span>
          <span class="hangul">로사이</span>
        </p>

        <p class="brand-etymology">
          라틴어 <em>locus</em>(장소)의 복수형.
        </p>

        <p class="brand-statement">
          카페에서 마주친 한 장의 풍경,<br>
          미술관에서 멈춰 섰던 그림 앞,<br>
          여행지에서 우연히 발견한 골목길까지.<br>
          <strong>당신이 머물렀던 모든 장소</strong>를 위한 큐레이션 아카이브.
        </p>
      </div>
    </section>

    <!-- How it works -->
    <section class="how-section">
      <div class="how-inner">
        <p class="section-label">How it works</p>
        <h2 class="section-title">세 단계로 시작하는<br>나만의 장소 큐레이션</h2>

        <div class="features-grid">
          <div v-for="(f, i) in features" :key="f.title" class="feature-card">
            <div class="feature-num">0{{ i + 1 }}</div>
            <div class="feature-icon">{{ f.icon }}</div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>

        <p class="features-aside">
          <span class="aside-tag">Optional</span>
          원하면 컬렉션을 종이책으로 인쇄해 받아볼 수도 있어요.
        </p>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-inner">
        <p class="cta-quote">"기억은 흐려져도,<br>기록은 남습니다"</p>
        <p class="cta-sub">첫 컬렉션을 만들어보세요.</p>
        <RouterLink to="/collections/new" class="btn-primary cta-btn">컬렉션 만들기</RouterLink>
      </div>
    </section>

    <!-- 푸터 -->
    <footer class="loci-footer">
      <LociLogo class="footer-logo" />
      <p class="footer-copy">© 2025 Loci. Curate your collection.</p>
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import LociLogo from '../components/LociLogo.vue'

const typedEl = ref(null)
const doneTyping = ref(false)
let cursorTimer = null

const floatingTags = [
  '카페 아카이브', '전시 · 미술관', '미식 탐구', '골목 산책',
  '야경 컬렉션', '성지순례', '서점 투어', '온천 여행', '편집숍'
]

const features = [
  { icon: '◎', title: '테마를 정하세요', desc: '카페, 전시, 미식 등 나만의 테마로 컬렉션을 만들어요.' },
  { icon: '◈', title: '장소를 모으세요', desc: '여행마다 좋았던 장소를 추가하고 큐레이션 메모를 남겨요.' },
  { icon: '◻', title: '다시 펼쳐보세요', desc: '지도로 발자취를 따라가고, AI가 컬렉션의 성향을 분석해 비슷한 장소를 추천해줘요.' },
]

function floatStyle(i) {
  const positions = [
    { top: '12%', left: '6%' },
    { top: '18%', right: '8%' },
    { top: '32%', left: '3%' },
    { top: '28%', right: '4%' },
    { top: '55%', left: '5%' },
    { top: '60%', right: '6%' },
    { top: '72%', left: '8%' },
    { top: '75%', right: '9%' },
    { top: '44%', left: '2%' },
  ]
  return {
    ...positions[i % positions.length],
    animationDelay: `${i * 0.7}s`,
    animationDuration: `${5 + i * 0.5}s`,
  }
}

onMounted(() => {
  const text = '잊기 전에 남겨두세요'
  let i = 0
  setTimeout(() => {
    function type() {
      if (!typedEl.value) return
      if (i < text.length) {
        typedEl.value.textContent += text[i]
        i++
        setTimeout(type, 75)
      } else {
        doneTyping.value = true
      }
    }
    type()
  }, 800)
})

onUnmounted(() => {
  if (cursorTimer) clearInterval(cursorTimer)
})
</script>

<style scoped>
.loci-root {
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y proximity;
  scroll-behavior: smooth;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-serif);
  scrollbar-width: thin;
}

/* 네비 */
.loci-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 50;
  background: rgba(250, 250, 248, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.nav-inner {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0.9rem 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: var(--ink);
  transition: opacity 0.2s;
}
.nav-logo-link:hover { opacity: 0.7; }
.nav-logo { height: 22px; }

.nav-link {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  text-decoration: none;
  letter-spacing: 0.01em;
  transition: color 0.2s;
}
.nav-link:hover { color: var(--ink); }

/* 히어로 */
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8rem 1.5rem 5rem;
  position: relative;
  overflow: hidden;
  scroll-snap-align: start;
}
.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}
.floating-tags {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.float-tag {
  position: absolute;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(0, 0, 0, 0.16);
  padding: 5px 12px;
  border-radius: 100px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(2px);
  animation: floatUp linear infinite;
}
@keyframes floatUp {
  0%   { transform: translateY(0px); opacity: 0.75; }
  50%  { transform: translateY(-14px); opacity: 1; }
  100% { transform: translateY(0px); opacity: 0.75; }
}
.hero-content {
  position: relative;
  z-index: 1;
  max-width: 640px;
}
.hero-eyebrow {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 2rem;
}
.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(2.2rem, 6vw, 4.2rem);
  font-weight: 500;
  line-height: 1.25;
  color: var(--ink);
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  letter-spacing: -0.01em;
}
.hero-line-1 {
  display: block;
  opacity: 0;
  animation: fadeUp 0.7s ease forwards 0.2s;
}
.hero-line-2 {
  display: block;
  opacity: 0;
  animation: fadeUp 0.7s ease forwards 0.5s;
  min-height: 1.25em;
}
.typed-text { font-family: var(--font-serif); }
.cursor {
  display: inline-block;
  color: var(--ink);
  font-weight: 300;
}
.cursor.blink { animation: blink 0.9s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero-sub {
  font-family: var(--font-sans);
  font-size: 15px;
  color: var(--muted);
  line-height: 1.8;
  margin-bottom: 2.5rem;
  opacity: 0;
  animation: fadeUp 0.7s ease forwards 1.2s;
}
.hero-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  opacity: 0;
  animation: fadeUp 0.7s ease forwards 1.5s;
}
.hero-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.hero-action-help {
  font-family: var(--font-sans);
  font-size: 11.5px;
  color: var(--soft);
  letter-spacing: 0.01em;
  line-height: 1.5;
  max-width: 16ch;
  text-align: center;
}
/* 모바일에서는 떠다니는 태그 숨김 (콘텐츠와 겹침 방지) */
@media (max-width: 720px) {
  .floating-tags { display: none; }
  .hero-sub br { display: none; }
}

/* 스크롤 힌트 */
.scroll-hint {
  position: absolute;
  bottom: 2.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0;
  animation: fadeUp 0.7s ease forwards 2s;
}
.scroll-label {
  font-family: var(--font-sans);
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--faint);
}
.scroll-bar {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, var(--faint), transparent);
  animation: scrollDrop 1.8s ease-in-out infinite;
}
@keyframes scrollDrop {
  0%   { transform: scaleY(0); transform-origin: top; opacity: 1; }
  50%  { transform: scaleY(1); transform-origin: top; opacity: 1; }
  100% { transform: scaleY(1); transform-origin: bottom; opacity: 0; }
}

/* 브랜드 소개 */
.brand-section {
  min-height: 100vh;
  padding: 7rem 1.5rem;
  background: #f3f1ec;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  scroll-snap-align: start;
  position: relative;
}
.brand-section::before,
.brand-section::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 1px;
  height: 48px;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.18));
}
.brand-section::before { top: 0; }
.brand-section::after {
  bottom: 0;
  background: linear-gradient(to top, transparent, rgba(0, 0, 0, 0.18));
}

.brand-inner {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}
.brand-eyebrow {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 1rem;
}
.brand-mark {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
  color: var(--ink);
}
.brand-logo {
  display: inline-block;
  height: clamp(80px, 14vw, 120px);
}
.brand-pronunciation {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  display: flex;
  gap: 10px;
  align-items: baseline;
  letter-spacing: 0.02em;
}
.phonetic {
  font-style: italic;
  color: var(--muted);
}
.hangul {
  color: var(--faint);
  letter-spacing: 0.05em;
}
.brand-etymology {
  font-family: var(--font-sans);
  font-size: 13.5px;
  color: var(--muted);
  letter-spacing: 0.01em;
}
.brand-etymology em {
  font-family: var(--font-serif);
  font-style: italic;
  color: var(--ink);
  font-size: 15px;
  margin: 0 2px;
}
.brand-statement {
  font-family: var(--font-serif);
  font-size: clamp(1rem, 2vw, 1.15rem);
  color: var(--text);
  line-height: 2;
  margin-top: 1.5rem;
  letter-spacing: -0.005em;
}
.brand-statement strong {
  font-weight: 500;
  color: var(--ink);
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
  padding-bottom: 1px;
}

/* How it works */
.how-section {
  min-height: 100vh;
  padding: 7rem 1.5rem;
  background: var(--bg);
  display: flex;
  align-items: center;
  scroll-snap-align: start;
}
.how-inner {
  max-width: 900px;
  margin: 0 auto;
}
.section-title {
  font-family: var(--font-serif);
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 500;
  text-align: center;
  line-height: 1.4;
  color: var(--ink);
  margin-bottom: 4rem;
  letter-spacing: -0.005em;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: rgba(0, 0, 0, 0.07);
  border: 1px solid rgba(0, 0, 0, 0.07);
}
@media (max-width: 720px) {
  .features-grid { grid-template-columns: 1fr; }
}
.feature-card {
  background: var(--bg);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.feature-num {
  font-family: var(--font-sans);
  font-size: 11px;
  color: #ccc;
  letter-spacing: 0.1em;
}
.feature-icon {
  font-size: 1.5rem;
  color: var(--soft);
  line-height: 1;
}
.feature-title {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--ink);
}
.feature-desc {
  font-family: var(--font-sans);
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.7;
}

.features-aside {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  font-family: var(--font-sans);
  font-size: 12.5px;
  color: var(--soft);
  text-align: center;
  letter-spacing: 0.01em;
}
.aside-tag {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--faint);
  border: 1px solid var(--hairline);
  padding: 2px 8px;
  border-radius: 100px;
  margin-right: 8px;
  vertical-align: 1px;
}

/* CTA */
.cta-section {
  min-height: 100vh;
  padding: 8rem 1.5rem;
  background: #111;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: start;
}
.cta-inner {
  max-width: 560px;
  margin: 0 auto;
}
.cta-quote {
  font-family: var(--font-serif);
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 500;
  color: #f5f5f0;
  line-height: 1.4;
  margin-bottom: 1.25rem;
  letter-spacing: -0.005em;
}
.cta-sub {
  font-family: var(--font-sans);
  font-size: 14px;
  color: #aaa;
  margin-bottom: 2.5rem;
}
.cta-btn {
  background: #f5f5f0;
  color: var(--ink);
}
.cta-btn:hover { background: #fff; }

/* 푸터 */
.loci-footer {
  padding: 3rem 1.5rem 2.5rem;
  background: #111;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  scroll-snap-align: end;
}
.footer-logo {
  display: inline-block;
  height: 18px;
  color: rgba(245, 245, 240, 0.55);
}
.footer-copy {
  font-family: var(--font-sans);
  font-size: 11px;
  color: #888;
  letter-spacing: 0.05em;
}
</style>