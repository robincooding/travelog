const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { error } = require("node:console");

// 특정 주문의 데이터를 구조화하여 반환
router.get("/:orderId", async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.orderId) },
      include: {
        travel: {
          include: {
            places: { orderBy: { visitedAt: "asc" } },
            aiEssay: true,
          },
        },
      },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const exportData = {
      exportedAt: new Date().toISOString(),
      order: {
        id: order.id,
        bookTitle: order.bookTitle,
        size: order.size,
        pageCount: order.pageCount,
        status: order.status,
        createdAt: order.createdAt,
      },
      travelMeta: {
        title: order.travel.title,
        country: order.travel.country,
        city: order.travel.city,
        startDate: order.travel.startDate,
        endDate: order.travel.endDate,
        companions: order.travel.companions,
      },
      places: order.travel.places.map((p) => ({
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        memo: p.memo,
        visitedAt: p.visitedAt,
        photos: JSON.parse(p.photos || "[]"),
      })),
      aiEssay: order.travel.aiEssay?.content || null,
    };

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="order-${order.id}.json"`,
    );
    res.json(exportData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
