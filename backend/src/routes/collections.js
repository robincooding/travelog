const express = require("express");
const { error } = require("node:console");
const router = express.Router();
const prisma = require("../lib/prisma");

// 전체 컬렉션 목록
router.get("/", async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { places: true } },
        orders: { select: { status: true } },
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
    const collection = await prisma.collection.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        places: { orderBy: { visitedAt: "asc" } },
        orders: true,
        profile: true,
      },
    });
    if (!collection) return res.status(404).json({ error: "Not found" });
    res.json(collection);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 컬렉션 생성
router.post("/", async (req, res) => {
  try {
    const { title, theme, description, coverImage } = req.body;
    const collection = await prisma.collection.create({
      data: { title, theme, description, coverImage },
    });
    res.status(201).json(collection);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 컬렉션 수정
router.put("/:id", async (req, res) => {
  try {
    const { title, theme, description, coverImage } = req.body;
    const collection = await prisma.collection.update({
      where: { id: Number(req.params.id) },
      data: { title, theme, description, coverImage },
    });
    res.json(collection);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 컬렉션 삭제
router.delete("/:id", async (req, res) => {
  try {
    await prisma.collection.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
