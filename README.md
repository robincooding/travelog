# Loci

> **취향대로 큐레이션하는 나만의 장소 아카이브**
> 카페, 전시, 미식, 골목 산책 — 다시 가고 싶은 곳, 잊고 싶지 않은 순간을 컬렉션으로 모으고, 종이책으로 받아볼 수 있는 서비스.

라틴어 *locus*(장소)의 복수형. `[ˈloʊ.saɪ]` (로사이).

---

## 1. 서비스 소개

### LOCI란?
**Loci** 는 좋았던 장소를 테마별 컬렉션으로 큐레이션하고, 그 컬렉션을 한 권의 책으로 주문할 수 있는 장소 아카이빙 서비스입니다.

### 타겟 사용자
- 여행 / 일상에서 좋았던 장소를 의미 있게 남기고 싶은 사람
- 카페 · 미술관 · 미식 · 골목 산책 등 **나만의 큐레이션 취향**이 또렷한 사람
- 단순 위치 기록을 넘어 **왜 좋았는지, 어떤 감정이었는지**를 함께 남기고 싶은 사람
- 디지털 기록을 **종이책 형태로 소장**하고 싶은 사람

### 주요 기능
- **컬렉션 기반 아카이브** — 카페 / 전시 / 미식 같은 테마로 컬렉션을 만들고 좋아하는 장소를 모음
- **장소 큐레이션** — 큐레이터 메모, 가장 기억에 남는 것, 그 순간의 감정을 함께 기록
- **사진 업로드** — 장소별 대표 사진을 AWS S3 에 업로드해 카드 / 모달에 표시
- **Google Places 자동완성** — 장소 검색 시 좌표 / 주소 / 카테고리 자동 채움
- **지도 시각화** — Google Maps + AdvancedMarkerElement 로 컬렉션의 발자취를 한눈에
- **AI 컬렉션 분석** — Gemini API 가 컬렉션의 성향 유형 / 요약 / 비슷한 결의 추천 장소를 생성 (다른 도시·나라 포함)
- **컬렉션북 주문** — 주문 생성 / 상태 관리 (pending → processing → completed → cancelled)
- **주문 데이터 export** — 주문 1건의 모든 콘텐츠 + 메타데이터를 구조화된 JSON 으로 추출 (인쇄 파트너 전달용)
- **장소 디테일 모달** — 카드 클릭 시 큰 사진 + 모든 콘텐츠를 한눈에

---

## 2. 실행 방법 (Docker)

```bash
# 1) 저장소 클론
git clone <repo-url>
cd loci

# 2) 환경 변수 준비
cp .env.example .env
cp frontend/.env.example frontend/.env
# 필요한 키 채우기 (선택 — 아래 "키 없이도 동작하는 부분" 참고)

# 3) 컨테이너 빌드 & 실행
docker compose up --build -d

# 4) DB 마이그레이션 + 시드 데이터 적재 (최초 1회)
docker exec loci_backend_1 npx prisma migrate deploy
docker exec loci_backend_1 npm run seed

# 5) 접속
# http://localhost:8080
```

> 컨테이너 이름이 `loci-backend-1` (대시) 로 잡히는 환경도 있습니다. `docker ps` 로 확인 후 그에 맞춰 실행하세요.

### 포트 변경

기본은 backend `3000`, frontend `8080`. 충돌 시 `.env` 에서 바꿀 수 있습니다:

```bash
# .env
BACKEND_PORT=3001
FRONTEND_PORT=8090
```

이후 `docker compose up -d --force-recreate` 로 재생성. 프론트엔드가 백엔드를 호출하는 URL 도 같이 바꿔야 하므로 `frontend/.env` 의 `VITE_API_URL` 도 일치시켜 주세요:

```bash
# frontend/.env
VITE_API_URL=http://localhost:3001/api
```

`VITE_*` 는 빌드 타임에 inline 되므로 변경 후 frontend 재빌드 필요:
```bash
docker compose build frontend && docker compose up -d --force-recreate frontend
```

### 키 없이도 동작하는 부분

외부 API 키가 모두 없어도 **Lv1 / Lv2 / Lv3 평가 항목은 시드 데이터로 정상 확인 가능**합니다:

| 기능 | 키 필요 여부 |
|---|---|
| 컬렉션 / 장소 / 주문 CRUD | 불필요 |
| 주문 export (Lv3 핵심) | 불필요 |
| 시드 데이터 사진 표시 | 불필요 (공개 S3 URL) |
| 새 사진 업로드 | AWS S3 키 필요 |
| 장소 자동완성 / 지도 | Google Maps API 키 필요 |
| AI 분석 / 추천 | Gemini API 키 필요 |

---

## 3. 완성한 레벨

세 레벨 모두 구현했습니다.

### Lv1 — 서비스 구현 ✓

콘텐츠 서비스의 핵심 플로우인 **컬렉션 → 장소 큐레이션 → 시각화** 가 전부 동작합니다.

- **Collection CRUD** — 테마별 컬렉션 생성 / 조회 / 수정 / 삭제 (`/api/collections`)
- **Place CRUD** — 컬렉션 안에 장소 추가 / 수정 / 삭제, 사진 업로드 / 교체 / 삭제 (`/api/places`, `/api/upload`)
- **풍부한 메타데이터** — `curatorNote`(왜 좋았는지) / `highlight`(가장 기억에 남는 것) / `feeling`(그 순간의 감정) / `mood` / `category` / `travelContext` / `visitedAt`
- **Google Places 자동완성** — 입력 시 장소명 / 좌표 / 주소 / 도시 / 나라 / 카테고리 자동 채움
- **Google Maps 시각화** — AdvancedMarkerElement 기반 인터랙티브 마커, 카테고리별 핀 색상
- **AI 컬렉션 분석** — Gemini 2.5 Flash 가 컬렉션을 분석해 성향 유형 / 요약 / 비슷한 결의 추천 장소 5곳 (다른 도시·나라 포함) 생성
- **상세 모달** — 카드 클릭 시 큰 사진 + 메타 그리드 + 섹션별 본문, 모달 안에서 바로 수정·삭제 진입

### Lv2 — 자체 주문 기능 ✓

컬렉션을 책으로 주문하는 흐름과 상태 관리가 작동합니다.

- **주문 생성** — CollectionDetail 의 "책 주문" 버튼으로 책 제목 / 사이즈와 함께 주문 (`POST /api/orders`)
- **주문 목록** — `/orders` 페이지에서 모든 주문 조회 (컬렉션 정보 join)
- **상태 관리** — `pending → processing → completed → cancelled` 4단계 (`PATCH /api/orders/:id/status`)
- **주문 삭제** — 잘못 만든 주문 정리 가능

### Lv3 — 주문 데이터 익스포트 ✓

주문 1건에 필요한 콘텐츠와 메타데이터를 한 번에 구조화 JSON 으로 추출합니다.

- **엔드포인트:** `GET /api/export/:orderId`
- **응답 형식:** `Content-Disposition: attachment; filename="order-{id}.json"` 으로 다운로드
- **포함 데이터:**
  - 주문 메타 (id / bookTitle / size / status / createdAt)
  - 컬렉션 정보 (title / theme / description)
  - 모든 장소 (이름 / 주소 / 좌표 / 카테고리 / 큐레이터 메모 / 하이라이트 / 감정 / 무드 / 방문일 / 여행 맥락 / **사진 URL 배열**)
  - AI 프로필 (성향 유형 / 요약 / 추천 장소)
- **사진은 공개 S3 URL** 로 export 되어 인쇄 파트너가 그대로 다운로드 가능 (별도 인증 / 변환 불필요)

예시 호출:
```bash
curl http://localhost:3000/api/export/1 -o order-1.json
```

---

## 4. 기술 스택 및 아키텍처

### 사용 스택

| 영역 | 사용 기술 |
|---|---|
| 프론트엔드 | Vue 3 (Composition API) · Vue Router · Tailwind CSS v4 · Vite |
| 백엔드 | Node.js · Express 5 · Prisma 7 · better-sqlite3 |
| 데이터 | SQLite (도커 volume mount 로 영속) |
| 외부 API | Google Maps JavaScript API (+ Places) · Gemini 2.5 Flash · AWS S3 |
| 인프라 | Docker Compose · nginx (frontend 서빙 + SPA fallback + 정적 캐시) |

### 왜 이 스택을 선택했나

- **Vue 3 + Vite** — Composition API 의 컴포지션 단위가 작은 컴포넌트를 빠르게 묶고 분리하기 좋음. Vite 의 HMR 이 압도적으로 빨라 vibe coding 의 짧은 사이클에 잘 맞음. 무엇보다 평소 프로젝트 진행할 때 프론트엔드 프레임워크로 써 본 경험이 있어서 선택했음.
- **Tailwind CSS v4** — 디자인 토큰 기반 변수 + utility 합성으로 디자인 시스템을 별도 파일 없이 한 곳에서 관리. 빠른 프로토타이핑에 유리.
- **Express + Prisma + SQLite** — **외부 DB 데몬 없이 단일 파일로 영속화** 가능 → 도커 볼륨 한 줄로 끝남, 심사자 환경 재현이 쉬움. Prisma 의 type-safe client + 마이그레이션 히스토리가 스키마 변경 → 새 client → seed 흐름을 짧게 잡아줌.
- **better-sqlite3 (adapter)** — 동기 API 라 라우터 코드가 단순. 추가 데몬 / 컨테이너 불필요.
- **AWS S3** — 사진 바이너리는 DB 외부 저장소가 자연스러움. 공개 URL 로 export 시 인쇄 파트너에 그대로 전달 가능.
- **Google Maps + Places** — 장소 자동완성 / 지도 시각화의 사실상 표준. 사용자가 자연스럽게 "장소를 검색해서 추가" 할 수 있게 됨.
- **Gemini 2.5 Flash** — JSON 응답 안정성 / 비용 효율 / 한국어 이해도 모두 무난. 컬렉션 분석에 적절한 맥락 길이.

한 줄 요약: **외부 인프라 의존을 최소화하면서, 빠른 반복(vibe coding)에 가장 잘 맞는 가벼운 스택**.

### 디렉터리 구조

```
loci/
├── backend/
│   ├── src/
│   │   ├── index.js                # Express entry
│   │   ├── lib/prisma.js           # Prisma client (better-sqlite3 adapter)
│   │   └── routes/
│   │       ├── collections.js      # 컬렉션 CRUD
│   │       ├── places.js           # 장소 CRUD
│   │       ├── orders.js           # 주문 + 상태 관리 (Lv2)
│   │       ├── upload.js           # S3 이미지 업/다운로드
│   │       ├── ai.js               # Gemini 컬렉션 분석
│   │       └── export.js           # 주문 데이터 export (Lv3)
│   ├── prisma/
│   │   ├── schema.prisma           # DB 스키마 (Collection / Place / Order / CollectionProfile)
│   │   ├── migrations/             # 마이그레이션 히스토리
│   │   ├── seed.js                 # 데이터 드리븐 시드 실행 스크립트
│   │   └── seed-data.json          # 시드 데이터 (4 컬렉션 + 사진 URL 포함)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── views/                  # Landing / CollectionList / CollectionDetail / CollectionForm / OrderList
│   │   ├── components/             # MapView · PlaceCard · PlaceModal · PlaceSearch · AiProfile · LociLogo
│   │   ├── api/index.js            # Axios 기반 API 클라이언트
│   │   └── router/                 # Vue Router (history mode)
│   ├── nginx.conf                  # 프로덕션 서빙 + SPA fallback + 캐시 정책
│   └── Dockerfile                  # multi-stage (vite build → nginx)
└── docker-compose.yml
```

### 데이터 모델

```
Collection ─┬─< Place (N)        — 큐레이션 콘텐츠
            ├─< Order (N)        — 책 주문 (Lv2)
            └── CollectionProfile (1)  — AI 분석 결과
```

---

## 5. AI 도구 사용 내역

| AI 도구 | 활용 내용 |
|---|---|
| **Claude Code** | **[기획 과정 및 콘텐츠 구성]**<br>• 서비스 기획 과정에서 기획 초안을 기반으로 기능과 콘텐츠 구성을 정리 및 체계화<br>**[도메인 모델링 및 백엔드 구축]**<br>• Collection, Place, Order 등 핵심 도메인 설계 및 전체 API 라우터 구현<br>• DB와 JSON 간의 시드 데이터 동기화 파이프라인(seed.js) 자동화<br>**[프론트엔드 및 AI 로직 최적화]**<br>• Vue 3 고급 컴포넌트(Teleport, Scroll-lock) 및 Tailwind v4 디자인 시스템 구축<br>• Gemini 프롬프트 엔지니어링을 통한 맞춤형 장소 추천 및 데이터 포맷팅<br>**[인프라 설정 및 트러블슈팅]**<br>• Docker Multi-stage 빌드 및 Nginx 배포 환경(SPA fallback 포함) 구성<br>• Prisma client, native module 도커 호환성 및 Google Maps API 등 기술 부채 해결 |
| **ChatGPT** | 콘텐츠 구성에 대한 브레인스토밍 |
| **Gemini** (런타임) | 서비스 자체의 AI 분석 기능 — 컬렉션 성향 / 추천 장소 생성 |

> 자세한 디버깅 / 의사결정 흐름은 git commit history 에서 확인할 수 있습니다 (커밋 메시지에 fix / feat 단위로 정리).

---

## 6. 설계 의도

### 왜 이 서비스 아이디어를 선택했는가

여행을 마치고 시간이 지나면 어디서 무엇이 좋았는지 흐릿해지는데, 일반 지도 앱의 "저장한 장소" 는 위치 정보일 뿐 **그 순간의 감정과 맥락**을 담지 못합니다. Loci 는 단순한 위치 기록이 아니라 **"왜 좋았는지 / 가장 기억에 남는 한 장면 / 그 순간의 감정"** 까지 같이 큐레이션해서, 시간이 지나도 그 장소의 결을 그대로 다시 펼쳐볼 수 있게 만드는 데 초점을 두었습니다.

### 사업적 가능성

- **B2C 인쇄 서비스** — 컬렉션북 주문이 자연스럽게 부가 매출로 연결됨. 기존 포토북 서비스 대비 "큐레이션 메타데이터"가 더해진 차별점.
- **여행 / 라이프스타일 콘텐츠 IP** — 사용자별 큐레이션 데이터 자체가 자산. 인기 컬렉션을 출판하거나 큐레이터 마켓플레이스로 확장 가능.
- **AI 추천 기반 발견 채널** — Gemini 분석으로 비슷한 결의 장소를 추천하는 메커니즘은 그 자체로 여행 / 외식 발견 서비스 가치.
- **인쇄 API와의 자연스러운 결합** — 사용자가 모은 데이터가 곧 인쇄 가능한 콘텐츠. export JSON 구조가 그대로 인쇄 파이프라인에 연결됨.

### 더 시간이 있었다면 추가했을 기능

- **사용자 인증 / 다중 사용자** — 현재는 단일 유저 가정. JWT 기반 회원 가입 + 컬렉션 소유권
- **컬렉션 공유 / 팔로우** — 특정 큐레이터의 컬렉션을 follow, 비슷한 취향 발견
- **인쇄 미리보기 PDF** — export JSON 을 받아 실제 인쇄 레이아웃을 클라이언트 사이드로 미리 렌더
- **모바일 PWA** — 여행지에서 즉시 추가할 수 있는 경량 앱 경험
- **AI 추천 → 컬렉션에 직접 추가 플로우** — 현재는 추천 결과가 텍스트만. Google Places 검색과 연결해 원클릭 추가
- **사진 다중 업로드 + 갤러리** — 장소당 1장이 아니라 N장
- **고급 검색 / 필터** — 카테고리 / 무드 / 도시 / 방문 시기 cross-filter
- **다크 모드** — 디자인 토큰 시스템에 다크 변수 추가
- **API rate limiting + audit log** — 운영을 위한 기본 가드
- **비정형 장소 데이터 등록 및 개인화 큐레이션 고도화** - 지도에 없는 골목이나 나만 아는 비밀 장소 등의 비정형 장소 추가 기능

---

## 부록 — 트러블슈팅

### `docker compose up` 이 "address already in use" 로 실패

로컬에서 dev 서버(nodemon 등)를 띄워둔 상태일 가능성. 포트 점유 프로세스 정리:
```bash
lsof -ti :3000 | xargs kill
```

### Maps `InvalidKey` 또는 deep link 새로고침 시 404

- `frontend/.env` 의 `VITE_GOOGLE_PLACES_API_KEY` 가 비어있다면 채우고 frontend 재빌드
- deep link (`/collections/1` 등) 새로고침 시 404 → nginx SPA fallback 이 적용됐는지 확인. 캐시 문제면:
  ```bash
  docker compose build --no-cache frontend
  docker compose up -d --force-recreate frontend
  ```

### Prisma "Exec format error"

`better-sqlite3` 는 네이티브 모듈이라 호스트 / 컨테이너 OS 바이너리가 호환되지 않으면 발생. `backend/.dockerignore` 의 `node_modules` 가 적용되었는지 확인 후:
```bash
docker compose build --no-cache backend
docker compose up -d --force-recreate backend
```

### Schema 변경 후 GET 응답에서 새 필드가 빠짐

prisma client 가 갱신되지 않은 채 백엔드가 떠 있는 상태:
```bash
docker compose restart backend
```

---

## 라이선스 / 작성자

© 2026 REDBREW. All rights Reserved.
