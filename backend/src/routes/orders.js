const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { error } = require("node:console");

const VALID_STATUSES = ["pending", "processing", "completed", "cancelled"];

// 전체 주문 목록
router.get("/", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        collection: { select: { title: true, theme: true } },
      },
    });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 단일 주문 조회
router.get("/:id", async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { collection: true },
    });
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 주문 생성
router.post("/", async (req, res) => {
  try {
    const { collectionId, bookTitle, size, pageCount } = req.body;
    const order = await prisma.order.create({
      data: {
        collectionId: Number(collectionId),
        bookTitle,
        size: size || "A5",
        pageCount: pageCount ? Number(pageCount) : null,
      },
    });
    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 주문 상태 변경
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status },
    });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 주문 삭제
router.delete("/:id", async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
