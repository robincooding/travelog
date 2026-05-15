const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcrypt");
const prisma = require("../src/lib/prisma");

/**
 * seed-data.json 의 내용을 그대로 DB 에 적재합니다.
 *
 * - 데모 사용자 1명 생성 (이메일/비번은 seed-data.json 의 demoUser 참고)
 * - 모든 시드 컬렉션을 그 데모 사용자 소유로 귀속
 * - 매 실행마다 user / collection / place / profile 을 전부 wipe & reseed
 *
 * 주의: 시드 비밀번호는 학습 / 데모 용도로만 사용. 운영 환경에선 시드 자체를 돌리지 마세요.
 */
async function main() {
  console.log("🌱 데이터 시딩 시작...");

  const dataPath = path.join(__dirname, "seed-data.json");
  const seed = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // 깨끗한 상태에서 시작 (FK 순서 고려)
  await prisma.collectionProfile.deleteMany();
  await prisma.place.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.user.deleteMany();

  // 데모 사용자 — 평문 비번은 절대 저장 X, bcrypt hash 만 저장
  const passwordHash = await bcrypt.hash(seed.demoUser.password, 10);
  const demoUser = await prisma.user.create({
    data: {
      email: seed.demoUser.email,
      displayName: seed.demoUser.displayName ?? null,
      passwordHash,
    },
  });
  console.log(`  ✓ 데모 사용자 — ${demoUser.email}`);

  for (const c of seed.collections) {
    const collection = await prisma.collection.create({
      data: {
        userId: demoUser.id,
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

  console.log("\n✅ 시딩 완료");
  console.log("");
  console.log("   데모 로그인 정보:");
  console.log(`     이메일:   ${seed.demoUser.email}`);
  console.log(`     비밀번호: ${seed.demoUser.password}`);
}

main()
  .catch((e) => {
    console.error("❌ 시딩 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
