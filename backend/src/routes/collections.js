const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/requireAuth");

// 모든 라우트에 인증 필수 — 한 줄로 일괄 적용
router.use(requireAuth);

/**
 * 소유권 체크 헬퍼.
 * - 컬렉션이 없으면 404
 * - 다른 사람의 컬렉션이어도 404 로 응답 (존재 여부 노출 방지)
 */
async function findOwnedOrRespond(req, res, collectionId, options = {}) {
  const collection = await prisma.collection.findUnique({
    where: { id: Number(collectionId) },
    ...options,
  });
  if (!collection || collection.userId !== req.user.id) {
    res.status(404).json({ error: "컬렉션을 찾을 수 없어요" });
    return null;
  }
  return collection;
}

// 전체 컬렉션 목록 — 본인 것만
router.get("/", async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { places: true } },
      },
    });
    res.json(collections);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 단일 컬렉션 조회
router.get("/:id", async (req, res) => {
  try {
    const collection = await findOwnedOrRespond(req, res, req.params.id, {
      include: {
        places: { orderBy: { visitedAt: "asc" } },
        profile: true,
      },
    });
    if (!collection) return; // 응답은 헬퍼가 이미 보냄
    res.json(collection);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 컬렉션 생성 — userId 는 서버가 강제로 주입 (클라이언트 입력 무시)
router.post("/", async (req, res) => {
  try {
    const { title, theme, description, coverImage } = req.body;
    if (!title || !theme) {
      return res.status(400).json({ error: "title 과 theme 은 필수입니다" });
    }
    const collection = await prisma.collection.create({
      data: {
        title,
        theme,
        description,
        coverImage,
        userId: req.user.id,
      },
    });
    res.status(201).json(collection);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 컬렉션 수정 — 본인 것만
router.put("/:id", async (req, res) => {
  try {
    const owned = await findOwnedOrRespond(req, res, req.params.id);
    if (!owned) return;

    const { title, theme, description, coverImage } = req.body;
    const collection = await prisma.collection.update({
      where: { id: owned.id },
      data: { title, theme, description, coverImage },
    });
    res.json(collection);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 컬렉션 삭제 — 본인 것만
router.delete("/:id", async (req, res) => {
  try {
    const owned = await findOwnedOrRespond(req, res, req.params.id);
    if (!owned) return;
    await prisma.collection.delete({ where: { id: owned.id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
