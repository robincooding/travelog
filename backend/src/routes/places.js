const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { error } = require("node:console");

// 특정 컬렉션의 장소 목록
router.get("/collection/:collectionId", async (req, res) => {
  try {
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
    } = req.body;
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
    } = req.body;
    const place = await prisma.place.update({
      where: { id: Number(req.params.id) },
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
    await prisma.place.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
