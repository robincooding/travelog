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
        collection: {
          include: {
            places: { orderBy: { visitedAt: "asc" } },
            profile: true,
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
      collection: {
        title: order.collection.title,
        theme: order.collection.theme,
        description: order.collection.description,
      },
      places: order.collection.places.map((p) => ({
        name: p.name,
        address: p.address,
        city: p.city,
        country: p.country,
        lat: p.lat,
        lng: p.lng,
        category: p.category,
        curatorNote: p.curatorNote,
        mood: p.mood,
        visitedAt: p.visitedAt,
        travelContext: p.travelContext,
        photos: JSON.parse(p.photos || "[]"),
      })),
      aiProfile: order.collection.profile
        ? {
            themeType: order.collection.profile.themeType,
            summary: order.collection.profile.summary,
            recommendations: JSON.parse(
              order.collection.profile.recommendations || "[]",
            ),
          }
        : null,
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
