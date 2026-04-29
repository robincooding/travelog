const express = require("express");
const { error } = require("node:console");
const router = express.Router();
const prisma = require("../lib/prisma");

// 컬렉션 별 프로필 생성
router.post("/profile/:collectionId", async (req, res) => {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: Number(req.params.collectionId) },
      include: { places: true },
    });
    if (!collection)
      return res.status(404).json({ error: "Collection not found" });

    const placeList = collection.places
      .map(
        (p) =>
          `- ${p.name} (${p.city || ""} ${p.country || ""}) / 카테고리: ${p.category || "미분류"} / 메모: ${p.curatorNote || "없음"} / 감정: ${p.mood || "없음"}`,
      )
      .join("\n");

    const prompt = `다음은 "${collection.title}" 컬렉션의 장소 목록이에요. 테마: ${collection.theme}

${placeList}

위 컬렉션의 취향과 분위기를 분석한 뒤, 큐레이터가 좋아할 만한 새로운 장소를 추천해주세요.

추천 가이드:
- 총 5곳을 추천합니다.
- 컬렉션에 이미 있는 도시 / 나라뿐 아니라, 다른 도시 · 다른 나라의 장소도 함께 포함해주세요. (적어도 2곳 이상은 컬렉션에 없는 다른 지역에서 추천)
- 컬렉션의 무드 / 카테고리 / 큐레이터 메모와 결이 비슷한 장소를 우선합니다.
- 너무 유명한 관광지보다는 분위기와 색깔이 또렷한 장소 위주로 골라주세요.
- 각 장소는 반드시 "장소명 (도시, 나라)" 형식으로 작성합니다. 예: "Blue Bottle Coffee Aoyama (도쿄, 일본)"

아래 JSON 형식으로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "themeType": "이 컬렉션의 여행 성향 유형 (예: 감성 탐험형 / 미식 탐구형 / 문화 몰입형 / 로컬 발견형)",
  "summary": "이 컬렉션의 취향과 성향을 2-3문장으로 요약",
  "recommendations": ["장소명 (도시, 나라)", "장소명 (도시, 나라)", "장소명 (도시, 나라)", "장소명 (도시, 나라)", "장소명 (도시, 나라)"]
}`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: "Gemini 응답 오류" });

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    const profile = await prisma.collectionProfile.upsert({
      where: { collectionId: Number(req.params.collectionId) },
      update: {
        themeType: parsed.themeType,
        summary: parsed.summary,
        recommendations: JSON.stringify(parsed.recommendations),
        generatedAt: new Date(),
      },
      create: {
        collectionId: Number(req.params.collectionId),
        themeType: parsed.themeType,
        summary: parsed.summary,
        recommendations: JSON.stringify(parsed.recommendations),
      },
    });
    res.json(profile);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
