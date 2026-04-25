const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { error } = require("node:console");

// AI 회고 에세이 생성
router.post("/essay/:travelId", async (req, res) => {
  try {
    const travel = await prisma.travel.findUnique({
      where: { id: Number(req.params.travelId) },
      include: { places: { orderBy: { visitedAt: "asc" } } },
    });
    if (!travel) return res.status(404).json({ error: "Travel not found" });

    const placeSummary = travel.places
      .map(
        (p) =>
          `- ${p.visitedAt.toISOString().slice(0, 10)} ${p.name}: ${p.memo || "메모 없음"}`,
      )
      .join("\n");

    const prompt = `다음은 "${travel.title}" 여행 기록이에요.
여행지: ${travel.country} ${travel.city}
기간: ${travel.startDate.toISOString().slice(0, 10)} ~ ${travel.endDate.toISOString().slice(0, 10)}
동행: ${travel.companions || "혼자"}

방문 장소:
${placeSummary}

이 여행을 바탕으로 따뜻하고 감성적인 여행 회고 에세이를 300~400자 분량으로 한국어로 작성해주세요. 
날짜나 장소 나열보다 여행의 감정과 분위기를 담아주세요.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return res.status(500).json({ error: "Gemini 응답 오류" });

    const essay = await prisma.aiEssay.upsert({
      where: { travelId: Number(req.params.travelId) },
      update: { content, generatedAt: new Date() },
      create: { travelId: Number(req.params.travelId), content },
    });
    res.json(essay);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
