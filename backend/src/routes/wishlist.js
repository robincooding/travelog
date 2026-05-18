const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/requireAuth");
const { validate, z } = require("../lib/validate");

router.use(requireAuth);

// ── 입력 스키마 ────────────────────────────────
const CreateWishSchema = z.object({
  name: z.string().trim().min(1, "이름은 필수예요").max(200),
  city: z.string().trim().max(100).nullish(),
  country: z.string().trim().max(100).nullish(),
  sourceCollectionId: z.coerce.number().int().positive().nullish(),
});

// ── 목록 ──────────────────────────────────────
// GET /api/wishlist  본인 것만, 최신순
router.get("/", async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 추가 ──────────────────────────────────────
// POST /api/wishlist  { name, city?, country?, sourceCollectionId? }
// 동일한 name 이 있으면 409 — 중복 방지 (unique constraint)
router.post("/", validate(CreateWishSchema), async (req, res) => {
  try {
    const { name, city, country, sourceCollectionId } = req.body;

    // sourceCollectionId 가 명시되었으면 본인 소유인지 검증 (다른 사람 ID 주입 차단)
    if (sourceCollectionId) {
      const col = await prisma.collection.findUnique({
        where: { id: sourceCollectionId },
        select: { userId: true },
      });
      if (!col || col.userId !== req.user.id) {
        return res.status(404).json({ error: "컬렉션을 찾을 수 없어요" });
      }
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId: req.user.id,
        name,
        city: city ?? null,
        country: country ?? null,
        sourceCollectionId: sourceCollectionId ?? null,
      },
    });
    res.status(201).json(item);
  } catch (e) {
    // Prisma unique constraint (userId, name)
    if (e.code === "P2002") {
      return res.status(409).json({ error: "이미 위시리스트에 있어요" });
    }
    res.status(500).json({ error: e.message });
  }
});

// ── 제거 ──────────────────────────────────────
// DELETE /api/wishlist/:id  본인 것만 — 다른 사람 id 면 404
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).json({ error: "찾을 수 없어요" });
    }
    const item = await prisma.wishlistItem.findUnique({ where: { id } });
    if (!item || item.userId !== req.user.id) {
      return res.status(404).json({ error: "찾을 수 없어요" });
    }
    await prisma.wishlistItem.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
