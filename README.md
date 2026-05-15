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
# 필요한 키 채우기 — 아래 "키 없이도 동작하는 부분" 참고

docker compose up --build -d

# 최초 1회: DB 마이그레이션 + 시드
docker exec loci_backend_1 npx prisma migrate deploy
docker exec loci_backend_1 npm run seed

# http://localhost:8080
```

### 포트 변경

기본은 backend `3000`, frontend `8080`. `.env` 에서 바꿀 수 있습니다:

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
| 데이터 | SQLite (도커 volume mount 로 영속) |
| 외부 API | Google Maps JavaScript API (+ Places) · Gemini 2.5 Flash · AWS S3 |
| 인프라 | Docker Compose · nginx (SPA fallback + 정적 캐시) |

### 디렉터리 구조

```
loci/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── lib/prisma.js
│   │   └── routes/
│   │       ├── collections.js      # 컬렉션 CRUD
│   │       ├── places.js           # 장소 CRUD
│   │       ├── upload.js           # S3 이미지 업/다운로드
│   │       └── ai.js               # Gemini 컬렉션 분석
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   ├── seed.js
│   │   └── seed-data.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── views/                  # Landing / CollectionList / CollectionDetail / CollectionForm
│   │   ├── components/             # MapView · PlaceCard · PlaceModal · PlaceSearch · AiProfile · LociLogo
│   │   ├── api/index.js
│   │   └── router.js
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

### 데이터 모델

```
Collection ─┬─< Place (N)              — 큐레이션 콘텐츠
            └── CollectionProfile (1)  — AI 분석 결과
```

---

## 4. 로드맵 / TODO

다음 단계로 고려 중인 작업들 — `## 5. 실서비스 관점의 개선 과제` 참고.
