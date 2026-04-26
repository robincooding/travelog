const prisma = require("../src/lib/prisma");

async function main() {
  console.log("🌱 데이터 시딩 시작...");

  // 기존 데이터 초기화 (참조 무결성 준수하며 자식 -> 부모 순으로 삭제)
  await prisma.collectionProfile.deleteMany();
  await prisma.order.deleteMany();
  await prisma.place.deleteMany();
  await prisma.collection.deleteMany();

  // 컬렉션 1 - 도쿄 카페 아카이브
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
            mood: "여유",
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
            mood: "설렘",
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
            mood: "감동",
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

  // 컬렉션 2 - 유럽 미술관 순례
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
            mood: "감동",
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
            mood: "설렘",
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
            mood: "감동",
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

  console.log("✅ Seed 완료");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
