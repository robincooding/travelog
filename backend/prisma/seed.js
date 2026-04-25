const prisma = require("../src/lib/prisma");

async function main() {
  console.log("🌱 데이터 시딩 시작...");

  // 기존 데이터 초기화 (참조 무결성 준수하며 자식 -> 부모 순으로 삭제)
  await prisma.aiEssay.deleteMany();
  await prisma.order.deleteMany();
  await prisma.place.deleteMany();
  await prisma.travel.deleteMany();

  // 여행 1 - 도쿄
  const tokyo = await prisma.travel.create({
    data: {
      title: "도쿄 벚꽃 여행",
      country: "일본",
      city: "도쿄",
      startDate: new Date("2025-03-28"),
      endDate: new Date("2025-04-02"),
      coverImage: null,
      companions: "친구",
      places: {
        create: [
          {
            name: "신주쿠 교엔",
            lat: 35.6851,
            lng: 139.71,
            memo: "벚꽃이 만개해서 너무 아름다웠다. 돗자리 펴고 한참 있었음.",
            visitedAt: new Date("2025-03-29"),
            photos: "[]",
          },
          {
            name: "아사쿠사 센소지",
            lat: 35.7148,
            lng: 139.7967,
            memo: "나리타로 입국 후 첫 방문. 인파가 어마어마했지만 분위기 좋았다.",
            visitedAt: new Date("2025-03-28"),
            photos: "[]",
          },
          {
            name: "시부야 스카이",
            lat: 35.658,
            lng: 139.7016,
            memo: "야경이 압도적. 예약 필수.",
            visitedAt: new Date("2025-03-30"),
            photos: "[]",
          },
        ],
      },
      aiEssay: {
        create: {
          content: `3월 말, 벚꽃이 절정을 향해 달려가던 도쿄에서 나는 처음으로 봄의 의미를 몸으로 이해했다. 아사쿠사의 인파 속에서 느꼈던 설렘, 신주쿠 교엔의 돗자리 위에서 올려다본 분홍빛 하늘, 그리고 시부야 스카이에서 내려다본 도시의 야경. 이 여행은 단순한 관광이 아니라, 일상의 속도를 잠시 내려놓고 지금 이 순간에 집중하는 연습이었다. 봄은 짧기 때문에 아름답다는 말을 이제는 안다.`,
          generatedAt: new Date(),
        },
      },
    },
  });

  // 여행2
  const paris = await prisma.travel.create({
    data: {
      title: "첫 유럽 여행에서의 파리",
      country: "프랑스",
      city: "파리",
      startDate: new Date("2024-08-10"),
      endDate: new Date("2024-08-15"),
      coverImage: null,
      companions: "혼자",
      places: {
        create: [
          {
            name: "에펠탑",
            lat: 48.8584,
            lng: 2.2945,
            memo: "생각보다 훨씬 크다. 밤에 반짝이는 조명 쇼가 압권이었다.",
            visitedAt: new Date("2024-08-10"),
            photos: "[]",
          },
          {
            name: "루브르 박물관",
            lat: 48.8606,
            lng: 2.3376,
            memo: "모나리자는 생각보다 작았지만, 나머지 컬렉션이 압도적. 하루로는 턱없이 부족하다.",
            visitedAt: new Date("2024-08-11"),
            photos: "[]",
          },
          {
            name: "몽마르트 언덕",
            lat: 48.8867,
            lng: 2.3431,
            memo: "사크레쾨르 성당 앞에서 도시 전체를 내려다봤다. 버스킹 소리와 함께 한참 앉아있었다.",
            visitedAt: new Date("2024-08-12"),
            photos: "[]",
          },
        ],
      },
    },
  });

  // 주문 — 도쿄 여행 책으로 만들기
  await prisma.order.create({
    data: {
      travelId: tokyo.id,
      status: "completed",
      bookTitle: "벚꽃 도쿄, 2025봄",
      size: "A5",
      pageCount: 48,
    },
  });

  // 주문 — 파리 여행 pending
  await prisma.order.create({
    data: {
      travelId: paris.id,
      status: "pending",
      bookTitle: "파리의 여름, 2024",
      size: "A4",
      pageCount: null,
    },
  });

  console.log("✅ Seed 완료");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
