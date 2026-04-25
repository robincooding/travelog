const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { error } = require("node:console");

// 전체 여행 목록
router.get("/", async (req, res) => {
  try {
    const travels = await prisma.travel.findMany({
      orderBy: { startDate: "desc" },
      include: { _count: { select: { places: true } } },
    });
    res.json(travels);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 단일 여행 조회
router.get("/:id", async (req, res) => {
  try {
    const travel = await prisma.travel.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        places: { orderBy: { visitedAt: "asc" } },
        aiEssay: true,
        orders: true,
      },
    });
    if (!travel) return res.status(404).json({ error: "Not found" });
    res.json(travel);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 여행 생성
router.post("/", async (req, res) => {
  try {
    const { title, country, city, startDate, endDate, companions, coverImage } =
      req.body;
    const travel = await prisma.travel.create({
      data: {
        title,
        country,
        city,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        companions,
        coverImage,
      },
    });
    res.status(201).json(travel);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 여행 수정
router.put("/:id", async (req, res) => {
  try {
    const { title, country, city, startDate, endDate, companions, coverImage } =
      req.body;
    const travel = await prisma.travel.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        country,
        city,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        companions,
        coverImage,
      },
    });
    res.json(travel);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 여행 삭제
router.delete("/:id", async (req, res) => {
  try {
    await prisma.travel.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
