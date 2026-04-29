const fs = require("node:fs");
const path = require("node:path");
const prisma = require("../src/lib/prisma");

/**
 * seed-data.json 의 내용을 그대로 DB 에 적재합니다.
 * - collections / places / profiles 모두 한번에 wipe & reseed
 * - photos 필드는 이미 JSON 문자열 형태로 저장돼 있어서 그대로 사용
 *   (URL 은 공개 S3 객체라 누구든 읽을 수 있음)
 */
async function main() {
  console.log("🌱 데이터 시딩 시작...");

  const dataPath = path.join(__dirname, "seed-data.json");
  const seed = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // 깨끗한 상태에서 시작 (FK 순서 고려)
  await prisma.collectionProfile.deleteMany();
  await prisma.order.deleteMany();
  await prisma.place.deleteMany();
  await prisma.collection.deleteMany();

  for (const c of seed.collections) {
    const collection = await prisma.collection.create({
      data: {
        title: c.title,
        theme: c.theme,
        description: c.description ?? null,
        coverImage: c.coverImage ?? null,
        places: {
          create: c.places.map((p) => ({
            name: p.name,
            googlePlaceId: p.googlePlaceId ?? null,
            address: p.address ?? null,
            city: p.city ?? null,
            country: p.country ?? null,
            lat: p.lat,
            lng: p.lng,
            category: p.category ?? null,
            curatorNote: p.curatorNote ?? null,
            highlight: p.highlight ?? null,
            feeling: p.feeling ?? null,
            mood: p.mood ?? null,
            visitedAt: new Date(p.visitedAt),
            travelContext: p.travelContext ?? null,
            photos: p.photos ?? "[]",
          })),
        },
      },
    });

    if (c.profile) {
      await prisma.collectionProfile.create({
        data: {
          collectionId: collection.id,
          themeType: c.profile.themeType,
          summary: c.profile.summary,
          recommendations: c.profile.recommendations,
        },
      });
    }

    console.log(
      `  ✓ ${c.title} — ${c.places.length} places${c.profile ? " + profile" : ""}`,
    );
  }

  console.log("✅ 시딩 완료");
}

main()
  .catch((e) => {
    console.error("❌ 시딩 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
