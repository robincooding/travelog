# Loci

> **취향대로 큐레이션하는 나만의 장소 아카이브**
> 카페, 전시, 미식, 골목 산책 — 다시 가고 싶은 곳, 잊고 싶지 않은 순간을 컬렉션으로 모으는 서비스.

라틴어 *locus*(장소)의 복수형. `[ˈloʊ.saɪ]` (로사이).

---

## 1. 서비스 소개

### LOCI란?
**Loci** 는 좋았던 장소를 테마별 컬렉션으로 큐레이션하고, 그 순간의 감정과 맥락을 함께 남기는 장소 아카이빙 서비스입니다.

### 타겟 사용자
- 여행 / 일상에서 좋았던 장소를 의미 있게 남기고 싶은 사람
- 카페 · 미술관 · 미식 · 골목 산책 등 **나만의 큐레이션 취향**이 또렷한 사람
- 단순 위치 기록을 넘어 **왜 좋았는지, 어떤 감정이었는지**를 함께 남기고 싶은 사람

### 주요 기능
- **사용자 인증** — 이메일 + 비밀번호 회원가입 / 로그인, JWT 를 httpOnly 쿠키로 관리. 사용자별 컬렉션 완전 격리
- **컬렉션 기반 아카이브** — 카페 / 전시 / 미식 같은 테마로 컬렉션을 만들고 좋아하는 장소를 모음
- **장소 큐레이션** — 큐레이터 메모, 가장 기억에 남는 것, 그 순간의 감정을 함께 기록
- **사진 업로드** — 장소별 대표 사진을 AWS S3 에 업로드해 카드 / 모달에 표시
- **Google Places 자동완성** — 장소 검색 시 좌표 / 주소 / 카테고리 자동 채움
- **지도 시각화** — Google Maps + AdvancedMarkerElement 로 컬렉션의 발자취를 한눈에
- **AI 컬렉션 분석** — Gemini API 가 컬렉션의 성향 유형 / 요약 / 비슷한 결의 추천 장소를 생성 (다른 도시 · 나라 포함)
- **장소 디테일 모달** — 카드 클릭 시 큰 사진 + 모든 콘텐츠를 한눈에

---

## 2. 실행 방법 (Docker)

```bash
git clone <repo-url>
cd loci

cp .env.example .env
cp frontend/.env.example frontend/.env
# 필요한 키 채우기 — 아래 "환경 변수" / "키 없이도 동작하는 부분" 참고
# (.env 의 JWT_SECRET 은 반드시 길고 랜덤한 값으로 채워주세요)

docker compose up --build -d

# 최초 1회: DB 마이그레이션 + 시드
docker exec loci_backend_1 npx prisma migrate deploy
docker exec loci_backend_1 npm run seed

# http://localhost:8080
```

### 데모 계정

시드 데이터는 데모 사용자에게 귀속되어 있어요. 별도 가입 없이 바로 둘러보려면:

```
이메일:   demo@loci.dev
비밀번호: loci-demo-2026
```

> `npm run seed` 가 실행되면 콘솔에도 위 정보가 출력됩니다. 운영 환경에선 시드 자체를 돌리지 마세요.

### 환경 변수

`.env` 에 채워야 하는 주요 키:

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | SQLite 파일 경로 (`file:/app/data/loci.db`) |
| `JWT_SECRET` | JWT 서명용 비밀키 — `openssl rand -hex 64` 같은 명령으로 충분히 긴 랜덤값. 노출 시 누구나 위장 토큰 생성 가능 |
| `BACKEND_PORT` / `FRONTEND_PORT` | 호스트 포트 매핑 (기본 3000 / 8080) |
| `GEMINI_API_KEY` | AI 컬렉션 분석 |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_S3_BUCKET` | 사진 업로드 |

`frontend/.env` :

| 변수 | 설명 |
|---|---|
| `VITE_API_URL` | 백엔드 API 베이스 URL (기본 `http://localhost:3000/api`) |
| `VITE_GOOGLE_PLACES_API_KEY` | Google Maps + Places. **빌드 타임에 JS 에 inline 되므로 변경 후 frontend 재빌드 필요** |

### 포트 변경

기본은 backend `3000`, frontend `8080`. `.env` 에서:

```bash
BACKEND_PORT=3001
FRONTEND_PORT=8090
```

`frontend/.env` 의 `VITE_API_URL` 도 일치시킨 후 frontend 재빌드:
```bash
docker compose build frontend && docker compose up -d --force-recreate frontend
```

### 키 없이도 동작하는 부분

| 기능 | 키 필요 여부 |
|---|---|
| 회원가입 / 로그인 / 멀티 테넌시 | 불필요 (JWT_SECRET 만 있으면 OK) |
| 컬렉션 / 장소 CRUD | 불필요 |
| 시드 데이터 사진 표시 | 불필요 (공개 S3 URL) |
| 새 사진 업로드 | AWS S3 키 필요 |
| 장소 자동완성 / 지도 | Google Maps API 키 필요 |
| AI 분석 / 추천 | Gemini API 키 필요 |

---

## 3. 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프론트엔드 | Vue 3 (Composition API) · Vue Router · Tailwind CSS v4 · Vite |
| 백엔드 | Node.js · Express 5 · Prisma 7 · better-sqlite3 |
| 인증 | bcrypt + JSON Web Token (httpOnly 쿠키) |
| 데이터 | SQLite (도커 volume mount 로 영속) |
| 외부 API | Google Maps JavaScript API (+ Places) · Gemini 2.5 Flash · AWS S3 |
| 인프라 | Docker Compose · nginx (SPA fallback + 정적 캐시) |

### 디렉터리 구조

```
loci/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── lib/
│   │   │   ├── prisma.js            # Prisma client (better-sqlite3 adapter)
│   │   │   └── auth.js              # bcrypt / JWT / 쿠키 옵션 유틸
│   │   ├── middleware/
│   │   │   └── requireAuth.js       # 인증 가드 — req.user 주입
│   │   └── routes/
│   │       ├── auth.js              # register / login / logout / me
│   │       ├── collections.js       # 컬렉션 CRUD (소유권 체크)
│   │       ├── places.js            # 장소 CRUD (부모 컬렉션 소유권)
│   │       ├── upload.js            # S3 이미지 업/다운로드
│   │       └── ai.js                # Gemini 컬렉션 분석
│   ├── prisma/
│   │   ├── schema.prisma            # User / Collection / Place / CollectionProfile
│   │   ├── migrations/
│   │   ├── seed.js                  # 데모 사용자 + 시드 데이터 적재
│   │   └── seed-data.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── views/                   # Landing / Login / Register / CollectionList / CollectionDetail / CollectionForm
│   │   ├── components/              # MapView · PlaceCard · PlaceModal · PlaceSearch · AiProfile · LociLogo
│   │   ├── stores/
│   │   │   └── auth.js              # 모듈 스코프 ref 기반 auth composable
│   │   ├── api/index.js             # axios (withCredentials + 401 인터셉터)
│   │   └── router.js                # 라우트 + beforeEach 가드
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

### 데이터 모델

```
User ─< Collection ─┬─< Place (N)              — 큐레이션 콘텐츠
                    └── CollectionProfile (1)  — AI 분석 결과
```

- 모든 Collection 은 User 에 귀속 (소유권 격리)
- Place / Profile 는 Collection cascade
- 사진은 S3 에 저장, DB 에는 `{ url, key }` JSON 만 보관

### 인증 흐름

```
회원가입 / 로그인 → bcrypt 검증 → JWT 발급 → httpOnly 쿠키 (Max-Age 7d)
                                              ↓
모든 후속 요청 → 쿠키 자동 첨부 → requireAuth 미들웨어가 검증 → req.user 주입
                                              ↓
컬렉션 / 장소 라우터 → userId 소유권 체크 (다른 사람 데이터는 404 응답)
```

- JWT 는 `JWT_SECRET` (HMAC SHA-256) 으로 서명
- 쿠키: `httpOnly` (JS 접근 불가 — XSS 방어) + `sameSite=lax` (CSRF 방어) + `secure` (운영 환경 HTTPS)
- 다른 사용자 리소스 접근 시 **403 대신 404** 응답 — 리소스 존재 여부 자체를 노출하지 않음

---

## 4. 로드맵 / 개선 여지

실서비스 관점에서 다음 단계로 고려 중인 작업들:

- **외부 API 비용 통제** — Google Maps / Gemini 사용량 rate-limit + 캐싱 (지금은 호출당 과금 무제한)
- **Google Maps 키 백엔드 프록시** — VITE_* 로 클라이언트에 노출된 키 회수 + GCP referrer 제한
- **이미지 최적화** — 업로드 시 sharp 리사이즈 / WebP 변환, S3 presigned URL 패턴
- **PostgreSQL 이전** — SQLite 의 동시 쓰기 1개 / 수평 확장 불가 한계 해소
- **검색 / 필터 / 페이지네이션** — 컬렉션 100개 넘으면 현재 구조 무너짐
- **EXIF strip** — 업로드 사진의 GPS 위치 자동 제거
- **테스트 / CI** — vitest + supertest + GitHub Actions
- **관측성** — pino 구조화 로그 + Sentry / Datadog
