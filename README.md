# Loci

> **취향대로 큐레이션하는 나만의 장소 아카이브**
> 카페, 전시, 미식, 골목 산책 — 다시 가고 싶은 곳, 잊고 싶지 않은 순간을 컬렉션으로 모으고, 종이책으로 받아볼 수 있는 서비스.

라틴어 *locus*(장소)의 복수형. `[ˈloʊ.saɪ]` (로사이).

---

## 핵심 기능

- **컬렉션 기반 아카이브** — 카페 / 전시 / 미식 같은 테마로 컬렉션을 만들고, 그 안에 좋아하는 장소를 모음
- **장소 큐레이션** — 큐레이터 메모, 가장 기억에 남는 것, 그 순간의 감정을 함께 기록
- **사진 업로드** — 장소별 대표 사진을 AWS S3 에 업로드해 카드에 표시
- **Google Places 자동완성** — 장소 검색 시 Google Maps Places API 로 좌표 / 주소 / 카테고리 자동 채움
- **지도 시각화** — Google Maps + AdvancedMarkerElement 로 컬렉션의 발자취를 한눈에
- **AI 컬렉션 분석** — Gemini API 가 컬렉션의 취향을 분석해 성향 유형 / 요약 / 비슷한 결의 장소 추천 (다른 도시 / 나라 포함) 생성
- **컬렉션북 주문** — 컬렉션 데이터를 구조화된 JSON 으로 export 해 인쇄용 데이터로 활용
- **상세 모달** — 카드 클릭 시 큰 사진 + 모든 콘텐츠를 한눈에 보여주는 디테일 모달

---

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프론트엔드 | Vue 3 (Composition API) · Vue Router · Tailwind CSS v4 · Vite |
| 백엔드 | Node.js · Express 5 · Prisma 7 · better-sqlite3 |
| 데이터 | SQLite (volume mount 로 영속) |
| 외부 API | Google Maps JavaScript API (+ Places) · Gemini 2.5 Flash · AWS S3 |
| 인프라 | Docker Compose · nginx (frontend 서빙 + SPA fallback) |

---

## 빠른 시작 (심사자용)

### 1. 사전 준비

- Docker / Docker Compose 설치
- (선택) Google Maps API Key — 지도 / 장소 검색 사용
- (선택) Gemini API Key — AI 분석 기능 사용
- (선택) AWS S3 자격 증명 — **새 사진 업로드** 시에만 필요. 시드 데이터의 기존 사진은 공개 S3 URL 로 자동 로드되므로 자격 증명 없이도 그대로 보입니다

### 2. 환경 변수 설정

저장소 루트의 `.env.example` 와 `frontend/.env.example` 을 복사해 채워주세요.

```bash
# 루트
cp .env.example .env

# 프론트엔드
cp frontend/.env.example frontend/.env
```

각 키의 의미는 [환경 변수](#환경-변수) 참조.

### 3. 컨테이너 빌드 및 실행

```bash
docker compose up --build -d
```

backend 가 3000 포트, frontend 가 8080 포트에서 뜹니다.

### 4. DB 마이그레이션 및 시드 데이터 적재

처음 실행 시 한 번만:

```bash
# 스키마 적용
docker exec loci_backend_1 npx prisma migrate deploy

# 시드 데이터 (4개 컬렉션 · 15개 장소 · AI 프로필 · 사진 URL 포함)
docker exec loci_backend_1 npm run seed
```

> **참고:** 컨테이너 이름이 `loci-backend-1` (대시) 로 잡히는 환경도 있습니다. `docker ps` 로 정확한 이름을 확인하세요.

### 5. 접속

브라우저에서 http://localhost:8080 으로 접속합니다.

---

## 환경 변수

### 루트 `.env` — 백엔드 / 인프라

| 변수 | 설명 | 필수 여부 |
|---|---|---|
| `DATABASE_URL` | SQLite 파일 경로. 도커 환경에서는 컨테이너 내부 `/app/data/loci.db` | 필수 |
| `BACKEND_PORT` | 백엔드 호스트 포트 (기본 3000) | 선택 |
| `FRONTEND_PORT` | 프론트엔드 호스트 포트 (기본 8080) | 선택 |
| `GEMINI_API_KEY` | Gemini AI 분석 호출용 | AI 기능 사용 시 |
| `AWS_ACCESS_KEY_ID` | S3 업로드용 IAM 액세스 키 | 사진 업로드 사용 시 |
| `AWS_SECRET_ACCESS_KEY` | S3 업로드용 시크릿 | 사진 업로드 사용 시 |
| `AWS_REGION` | S3 버킷 리전 (예: `ap-northeast-2`) | 사진 업로드 사용 시 |
| `AWS_S3_BUCKET` | 업로드 대상 버킷명 | 사진 업로드 사용 시 |

### `frontend/.env` — Vite 빌드타임 변수

| 변수 | 설명 | 필수 여부 |
|---|---|---|
| `VITE_API_URL` | 백엔드 API 베이스 URL (기본 `http://localhost:3000/api`) | 필수 |
| `VITE_GOOGLE_PLACES_API_KEY` | Google Maps JS / Places API 키 | 지도 / 장소 검색 사용 시 |

> Vite 의 `VITE_*` 변수는 **빌드 타임에 JS 에 inline** 됩니다. 따라서 `docker compose build` 이전에 `frontend/.env` 가 채워져 있어야 합니다. 빌드 후 변경하려면 frontend 컨테이너를 다시 빌드해야 합니다.

---

## 프로젝트 구조

```
loci/
├── backend/
│   ├── src/
│   │   ├── index.js                # Express entry
│   │   ├── lib/prisma.js           # Prisma client (better-sqlite3 adapter)
│   │   └── routes/
│   │       ├── collections.js      # 컬렉션 CRUD
│   │       ├── places.js           # 장소 CRUD
│   │       ├── orders.js           # 주문 관리
│   │       ├── upload.js           # S3 이미지 업/다운로드
│   │       ├── ai.js               # Gemini 컬렉션 분석
│   │       └── export.js           # 컬렉션북 데이터 export
│   ├── prisma/
│   │   ├── schema.prisma           # DB 스키마
│   │   ├── migrations/             # 마이그레이션 히스토리
│   │   ├── seed.js                 # 시드 실행 스크립트
│   │   └── seed-data.json          # 시드 데이터 (4 컬렉션 + 사진 URL 포함)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── views/                  # Landing / CollectionList / CollectionDetail / CollectionForm / OrderList
│   │   ├── components/             # MapView · PlaceCard · PlaceModal · PlaceSearch · AiProfile · LociLogo
│   │   ├── api/index.js            # Axios 기반 API 클라이언트
│   │   └── router/                 # Vue Router
│   ├── nginx.conf                  # 프로덕션 서빙 + SPA fallback
│   └── Dockerfile                  # multi-stage (vite build → nginx)
└── docker-compose.yml
```

---

## API 개요

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/collections` | 컬렉션 목록 |
| GET | `/api/collections/:id` | 컬렉션 상세 (places / profile 포함) |
| POST | `/api/collections` | 컬렉션 생성 |
| PUT | `/api/collections/:id` | 컬렉션 수정 |
| DELETE | `/api/collections/:id` | 컬렉션 삭제 |
| POST | `/api/places` | 장소 추가 (사진 URL 포함) |
| PUT | `/api/places/:id` | 장소 수정 |
| DELETE | `/api/places/:id` | 장소 삭제 |
| POST | `/api/upload` | 이미지 S3 업로드 (`multipart/form-data`, field `image`) |
| DELETE | `/api/upload` | 이미지 S3 삭제 (`{ key }`) |
| POST | `/api/ai/profile/:collectionId` | Gemini 로 컬렉션 성향 분석 / 추천 생성 |
| GET | `/api/orders` / `POST` / etc. | 주문 CRUD + 상태 변경 |
| GET | `/api/export/:orderId` | 인쇄용 컬렉션북 JSON export |

---

## 로컬 개발 (선택)

도커 없이 로컬에서 직접 실행하려면:

```bash
# 백엔드
cd backend
npm install
npx prisma migrate deploy
npm run seed
npm run dev          # nodemon — schema / 클라이언트 변경 시 자동 재시작

# 프론트엔드 (다른 터미널)
cd frontend
npm install
npm run dev          # Vite — http://localhost:5173
```

> 백엔드의 nodemon 은 `node_modules/.prisma/client/index.js` 도 watch 하도록 설정되어 있어, `prisma migrate dev` 또는 `prisma generate` 후 자동으로 새 client 를 픽업합니다.

---

## 트러블슈팅

### docker compose up 이 "address already in use" 로 실패

로컬에서 nodemon 등으로 backend dev 서버를 띄워둔 상태일 가능성이 높습니다. 포트 점유 프로세스를 정리해주세요.

```bash
lsof -ti :3000 | xargs kill
```

### Maps `InvalidKey` 또는 deep link 새로고침 시 404

- `frontend/.env` 의 `VITE_GOOGLE_PLACES_API_KEY` 가 비어 있거나 잘못된 경우 → 값 채우고 frontend 재빌드
- deep link (`/collections/1` 등) 새로고침 시 404 → nginx 의 SPA fallback (`try_files $uri $uri/ /index.html`) 이 frontend Dockerfile 에 포함되어 있는지 확인. 캐시 문제면 `docker compose build --no-cache frontend && docker compose up -d --force-recreate frontend`

### Prisma "Exec format error"

`better-sqlite3` 는 네이티브 모듈이라 호스트 OS 와 컨테이너 OS 의 바이너리가 호환되지 않으면 발생합니다. `backend/.dockerignore` 에 `node_modules` 가 포함되어 있는지 확인. 강제 재빌드:

```bash
docker compose build --no-cache backend
docker compose up -d --force-recreate backend
```

### Schema 변경 후 GET 응답에서 새 필드가 빠짐

prisma client 가 갱신되지 않은 채 백엔드가 떠 있는 상태입니다. 재시작:

```bash
docker compose restart backend
```

---

## 라이선스 / 작성자

© 2026 REDBREW. All rights reserved.
