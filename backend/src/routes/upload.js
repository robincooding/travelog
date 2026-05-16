const express = require("express");
const router = express.Router();
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("node:crypto");
const requireAuth = require("../middleware/requireAuth");
const { validate, z } = require("../lib/validate");

router.use(requireAuth);

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const PRESIGN_TTL_SEC = 300; // 5분 — presigned URL 유효 기간

// ── 입력 스키마 ────────────────────────────────
const PresignSchema = z.object({
  contentType: z.enum(ALLOWED_TYPES, {
    message: `허용된 이미지 형식이 아니에요 (${ALLOWED_TYPES.join(", ")})`,
  }),
});

const DeleteSchema = z.object({
  // places/ prefix 검증을 Zod 에서 처리 — 잘못된 키로 다른 객체 삭제 시도 차단
  key: z.string().regex(/^places\//, "허용된 경로가 아니에요").max(200),
});

/**
 * 1단계: 클라이언트가 업로드할 URL 을 발급받는다.
 * - 백엔드는 권한만 발급, 파일 자체는 클라이언트가 S3 에 직접 PUT
 * - presigned URL 은 5분 / 특정 key / 특정 ContentType 만 허용 → 도난해도 다른 객체 못 만듦
 *
 * POST /api/upload/presign  { contentType }
 * → { uploadUrl, key, publicUrl }
 */
router.post("/presign", validate(PresignSchema), async (req, res) => {
  try {
    const { contentType } = req.body;
    const ext = MIME_TO_EXT[contentType];
    const key = `places/${crypto.randomUUID()}${ext}`;

    // ContentType 을 서명에 포함시켜야 클라이언트도 같은 헤더로 PUT 해야 함
    // → 토큰 도용 시 임의 콘텐츠 타입으로 우회하는 것 방지
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: PRESIGN_TTL_SEC,
    });

    // 업로드 후 클라이언트가 표시 / 저장할 공개 URL
    const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ uploadUrl, key, publicUrl, expiresIn: PRESIGN_TTL_SEC });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 이미지 삭제 — presigned 패턴으로 가지 않고 백엔드 경유.
 * (삭제는 가끔 일어나는 작업 + 잘못된 키로 다른 객체 삭제 시도 방지를 위해 백엔드가 통제)
 */
router.delete("/", validate(DeleteSchema), async (req, res) => {
  try {
    const { key } = req.body;

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      }),
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
