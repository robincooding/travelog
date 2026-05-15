const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);

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
router.post("/", async (req, res) => {
  try {
    const {
      collectionId,
      name,
      googlePlaceId,
      address,
      city,
      country,
      lat,
      lng,
      category,
      curatorNote,
      highlight,
      feeling,
      mood,
      visitedAt,
      travelContext,
      photos,
    } = req.body;

    if (!(await assertCollectionOwnership(req, res, collectionId))) return;

    const place = await prisma.place.create({
      data: {
        collectionId: Number(collectionId),
        name,
        googlePlaceId,
        address,
        city,
        country,
        lat: Number(lat),
        lng: Number(lng),
        category,
        curatorNote,
        highlight,
        feeling,
        mood,
        visitedAt: new Date(visitedAt),
        travelContext,
        photos: photos ?? "[]",
      },
    });
    res.status(201).json(place);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 장소 수정
router.put("/:id", async (req, res) => {
  try {
    const owned = await findOwnedPlaceOrRespond(req, res, req.params.id);
    if (!owned) return;

    const {
      name,
      address,
      city,
      country,
      lat,
      lng,
      category,
      curatorNote,
      highlight,
      feeling,
      mood,
      visitedAt,
      travelContext,
      photos,
    } = req.body;
    const place = await prisma.place.update({
      where: { id: owned.id },
      data: {
        name,
        address,
        city,
        country,
        lat: Number(lat),
        lng: Number(lng),
        category,
        curatorNote,
        highlight,
        feeling,
        mood,
        visitedAt: new Date(visitedAt),
        travelContext,
        ...(photos !== undefined ? { photos } : {}),
      },
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
