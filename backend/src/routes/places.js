const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/requireAuth");
const { validate, z } = require("../lib/validate");

router.use(requireAuth);

// ── 입력 스키마 ────────────────────────────────
// coerce.number(): 폼에서 문자열로 와도 자동 변환 ("12.5" → 12.5)
// coerce.date():   ISO 문자열 → Date 객체 자동 변환
const PlaceCreateSchema = z.object({
  collectionId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1, "장소명은 필수예요").max(200),
  googlePlaceId: z.string().max(200).nullish(),
  address: z.string().max(500).nullish(),
  city: z.string().max(100).nullish(),
  country: z.string().max(100).nullish(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  category: z.string().max(50).nullish(),
  curatorNote: z.string().max(2000).nullish(),
  highlight: z.string().max(2000).nullish(),
  feeling: z.string().max(200).nullish(),
  mood: z.string().max(50).nullish(),
  visitedAt: z.coerce.date(),
  travelContext: z.string().max(200).nullish(),
  photos: z.string().max(10000).optional(), // photos JSON 문자열
});
// Update: collectionId 는 못 바꿈 + 모든 필드 optional
const PlaceUpdateSchema = PlaceCreateSchema.omit({
  collectionId: true,
}).partial();

/**
 * Place 의 소유권 체크 — 부모 Collection 의 userId 가 요청자와 같은지.
 * - place 가 없거나 다른 사람 컬렉션 소속이면 404 응답 후 null 반환
 */
async function findOwnedPlaceOrRespond(req, res, placeId) {
  const place = await prisma.place.findUnique({
    where: { id: Number(placeId) },
    include: { collection: { select: { userId: true } } },
  });
  if (!place || place.collection.userId !== req.user.id) {
    res.status(404).json({ error: "장소를 찾을 수 없어요" });
    return null;
  }
  return place;
}

/**
 * 컬렉션 소유권 체크 — POST 시 collectionId 가 본인 것인지.
 */
async function assertCollectionOwnership(req, res, collectionId) {
  const c = await prisma.collection.findUnique({
    where: { id: Number(collectionId) },
    select: { userId: true },
  });
  if (!c || c.userId !== req.user.id) {
    res.status(404).json({ error: "컬렉션을 찾을 수 없어요" });
    return false;
  }
  return true;
}

// 특정 컬렉션의 장소 목록
router.get("/collection/:collectionId", async (req, res) => {
  try {
    if (!(await assertCollectionOwnership(req, res, req.params.collectionId))) return;
    const places = await prisma.place.findMany({
      where: { collectionId: Number(req.params.collectionId) },
      orderBy: { visitedAt: "asc" },
    });
    res.json(places);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 장소 추가
router.post("/", validate(PlaceCreateSchema), async (req, res) => {
  try {
    // Zod 가 이미 coerce + 검증 + 변환 처리 → req.body 는 깨끗한 값
    const { collectionId, photos, ...rest } = req.body;

    if (!(await assertCollectionOwnership(req, res, collectionId))) return;

    const place = await prisma.place.create({
      data: {
        ...rest,
        collectionId,
        photos: photos ?? "[]",
      },
    });
    res.status(201).json(place);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 장소 수정
router.put("/:id", validate(PlaceUpdateSchema), async (req, res) => {
  try {
    const owned = await findOwnedPlaceOrRespond(req, res, req.params.id);
    if (!owned) return;

    // partial 스키마 → req.body 는 명시 전달된 필드만 포함 (Zod 가 unknown 키 제거)
    const place = await prisma.place.update({
      where: { id: owned.id },
      data: req.body,
    });
    res.json(place);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 장소 삭제
router.delete("/:id", async (req, res) => {
  try {
    const owned = await findOwnedPlaceOrRespond(req, res, req.params.id);
    if (!owned) return;
    await prisma.place.delete({ where: { id: owned.id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
