const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { error } = require("node:console");
const { route } = require("./travels");

// 특정 여행의 장소 목록
router.get("/travel/:travelId", async (req, res) => {
  try {
    const places = await prisma.place.findMany({
      where: { travelId: Number(req.params.travelId) },
      orderBy: { visitedAt: "asc" },
    });
    res.json(places);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 장소 생성
router.post("/", async (req, res) => {
  try {
    const { travelId, name, lat, lng, memo, visitedAt } = req.body;
    const place = await prisma.place.create({
      data: {
        travelId: Number(travelId),
        name,
        lat,
        lng,
        memo,
        visitedAt: new Date(visitedAt),
        photos: "[]",
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
    const { name, lat, lng, memo, visitedAt } = req.body;
    const place = await prisma.place.update({
      where: { id: Number(req.params.id) },
      data: { name, lat, lng, memo, visitedAt: new Date(visitedAt) },
    });
    res.json(place);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 장소 삭제
router.delete("/:id", async (req, res) => {
  try {
    await prisma.place.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
