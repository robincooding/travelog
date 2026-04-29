const prisma = require("../src/lib/prisma");

async function main() {
  console.log("🌱 데이터 시딩 시작...");

  await prisma.collectionProfile.deleteMany();
  await prisma.order.deleteMany();
  await prisma.place.deleteMany();
  await prisma.collection.deleteMany();

  // 컬렉션 1 — 도쿄 카페 아카이브
  const cafeCollection = await prisma.collection.create({
    data: {
      title: "도쿄 카페 아카이브",
      theme: "카페",
      description: "도쿄 골목골목에서 발견한 작은 카페들의 기록",
      places: {
        create: [
          {
            name: "蔦屋書店 代官山",
            address: "도쿄 시부야구 다이칸야마",
            city: "도쿄",
            country: "일본",
            lat: 35.6484,
            lng: 139.7031,
            category: "카페",
            curatorNote: "책과 커피가 공존하는 공간. 오래 머물고 싶어지는 곳.",
            highlight: "통유리 너머로 보이는 숲과 책장이 이어지는 풍경",
            feeling: "고요하고 충만한",
            visitedAt: new Date("2025-03-29"),
            travelContext: "2025 도쿄 봄 여행",
          },
          {
            name: "About Life Coffee Brewers",
            address: "도쿄 시부야구 도겐자카",
            city: "도쿄",
            country: "일본",
            lat: 35.6572,
            lng: 139.6988,
            category: "카페",
            curatorNote:
              "스탠딩 바 형식의 작은 스페셜티 카페. 에스프레소가 진하다.",
            highlight: "바리스타가 직접 설명해준 원두 이야기",
            feeling: "집중되고 선명한",
            visitedAt: new Date("2025-03-30"),
            travelContext: "2025 도쿄 봄 여행",
          },
          {
            name: "Fuglen Tokyo",
            address: "도쿄 시부야구 도미가야",
            city: "도쿄",
            country: "일본",
            lat: 35.6707,
            lng: 139.6891,
            category: "카페",
            curatorNote: "노르웨이 감성의 빈티지 카페. 낮에는 커피, 밤에는 바.",
            highlight: "60년대 북유럽 빈티지 가구들 사이에서 마신 플랫화이트",
            feeling: "낯설고 포근한",
            visitedAt: new Date("2025-04-01"),
            travelContext: "2025 도쿄 봄 여행",
          },
        ],
      },
      orders: {
        create: {
          bookTitle: "나의 도쿄 카페 아카이브 2025",
          size: "A5",
          pageCount: 36,
          status: "completed",
        },
      },
    },
  });

  // 컬렉션 2 — 유럽 미술관 순례
  const artCollection = await prisma.collection.create({
    data: {
      title: "유럽 미술관 순례",
      theme: "전시·미술관",
      description: "파리와 암스테르담에서 다닌 미술관들의 아카이브",
      places: {
        create: [
          {
            name: "루브르 박물관",
            address: "파리 1구 리볼리가",
            city: "파리",
            country: "프랑스",
            lat: 48.8606,
            lng: 2.3376,
            category: "미술관",
            curatorNote:
              "모나리자는 생각보다 작지만, 나머지 컬렉션이 압도적. 하루로는 부족하다.",
            highlight: "사모트라케의 니케 앞에서 멈춰 선 순간",
            feeling: "압도되고 겸손해지는",
            visitedAt: new Date("2024-08-11"),
            travelContext: "2024 파리 여름 여행",
          },
          {
            name: "오르세 미술관",
            address: "파리 7구 레지옹 도뇌르 광장",
            city: "파리",
            country: "프랑스",
            lat: 48.86,
            lng: 2.3266,
            category: "미술관",
            curatorNote:
              "인상파 컬렉션이 압도적. 모네와 르누아르를 실제로 보는 감동.",
            highlight: "모네의 수련 연작 앞에서 한참을 앉아있던 시간",
            feeling: "몽롱하고 따뜻한",
            visitedAt: new Date("2024-08-12"),
            travelContext: "2024 파리 여름 여행",
          },
          {
            name: "반 고흐 미술관",
            address: "암스테르담 뮤지엄 플레인 6",
            city: "암스테르담",
            country: "네덜란드",
            lat: 52.3584,
            lng: 4.8811,
            category: "미술관",
            curatorNote:
              "고흐의 생애를 시간순으로 따라가는 구성이 인상적. 편지 전시가 특히 좋았다.",
            highlight: "동생 테오에게 쓴 편지들을 읽으며 느낀 먹먹함",
            feeling: "슬프고 경이로운",
            visitedAt: new Date("2024-08-15"),
            travelContext: "2024 암스테르담 여행",
          },
        ],
      },
      orders: {
        create: {
          bookTitle: "유럽 미술관 순례기",
          size: "A4",
          status: "pending",
        },
      },
    },
  });

  // 컬렉션 3 — 홍콩 건축물 여행
  const archCollection = await prisma.collection.create({
    data: {
      title: "홍콩 건축 산책",
      theme: "건축",
      description: "식민지 시대의 흔적과 현대 마천루가 공존하는 홍콩의 건축들",
      places: {
        create: [
          {
            name: "홍콩 국제상업센터 (ICC)",
            address: "홍콩 구룡 서부 Austin Road West 1",
            city: "홍콩",
            country: "중국",
            lat: 22.3033,
            lng: 114.1601,
            category: "건축",
            curatorNote:
              "홍콩에서 가장 높은 빌딩. 108층에서 내려다본 야경이 압권이다.",
            highlight:
              "구름 위로 솟아오른 꼭대기와 발아래로 펼쳐지는 항구의 빛",
            feeling: "아찔하고 경이로운",
            visitedAt: new Date("2024-12-22"),
            travelContext: "2024 홍콩 겨울 여행",
          },
          {
            name: "청마교 (Tsing Ma Bridge)",
            address: "홍콩 마완",
            city: "홍콩",
            country: "중국",
            lat: 22.3477,
            lng: 114.0604,
            category: "건축",
            curatorNote:
              "세계에서 가장 긴 현수교 중 하나. 석양 무렵 빛을 받은 케이블이 특히 아름답다.",
            highlight: "석양빛에 물든 케이블이 바다 위로 드리우는 그림자",
            feeling: "장엄하고 고요한",
            visitedAt: new Date("2024-12-23"),
            travelContext: "2024 홍콩 겨울 여행",
          },
          {
            name: "홍콩상하이은행 본사 (HSBC Building)",
            address: "홍콩 센트럴 퀸스로드 1",
            city: "홍콩",
            country: "중국",
            lat: 22.2797,
            lng: 114.1588,
            category: "건축",
            curatorNote:
              "노먼 포스터가 설계한 하이테크 건축의 걸작. 건물 아래로 사람들이 자유롭게 오간다.",
            highlight: "건물 하부 광장에서 올려다본 복잡한 구조물의 실루엣",
            feeling: "미래적이고 낯선",
            visitedAt: new Date("2024-12-24"),
            travelContext: "2024 홍콩 겨울 여행",
          },
          {
            name: "중환 미드레벨 에스컬레이터",
            address: "홍콩 센트럴 미드레벨",
            city: "홍콩",
            country: "중국",
            lat: 22.2838,
            lng: 114.1519,
            category: "건축",
            curatorNote:
              "세계에서 가장 긴 야외 에스컬레이터 시스템. 주변 골목의 일상과 함께 타는 경험이 독특하다.",
            highlight:
              "에스컬레이터를 타며 스쳐 지나간 시장 골목의 냄새와 소음",
            feeling: "생동감 넘치고 이국적인",
            visitedAt: new Date("2024-12-24"),
            travelContext: "2024 홍콩 겨울 여행",
          },
        ],
      },
      orders: {
        create: {
          bookTitle: "홍콩 건축 산책 2024",
          size: "A4",
          status: "processing",
        },
      },
    },
  });

  // AI 프로필 — 카페 컬렉션
  await prisma.collectionProfile.create({
    data: {
      collectionId: cafeCollection.id,
      themeType: "감성 탐험형",
      summary:
        "유명 체인보다 골목의 작은 스페셜티 카페를 선호하는 취향. 공간의 분위기와 스토리를 중시함.",
      recommendations: JSON.stringify([
        "京都 % Arabica",
        "Onibus Coffee 나카메구로",
        "Bear Pond Espresso",
      ]),
    },
  });

  // AI 프로필 — 건축 컬렉션
  await prisma.collectionProfile.create({
    data: {
      collectionId: archCollection.id,
      themeType: "공간 탐구형",
      summary:
        "인간이 만든 구조물에서 역사와 철학을 읽어내는 여행자. 거대한 스케일과 디테일 모두에 반응함.",
      recommendations: JSON.stringify([
        "싱가포르 마리나 베이 샌즈",
        "도쿄 국립 신미술관",
        "상하이 외탄 건축군",
      ]),
    },
  });

  console.log("✅ Seed 완료");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
