import imageCompression from "browser-image-compression";

/**
 * 업로드 전 이미지 최적화.
 *
 * 1) 리사이즈 — 가장 긴 변이 maxWidthOrHeight 를 넘지 않도록 (사진 카드에 충분한 해상도)
 * 2) WebP 변환 — 같은 품질에 JPEG 대비 25~35% 용량 절감
 * 3) EXIF 자동 strip — Canvas 가 메타데이터를 재생성하므로 GPS / 카메라 정보 등 자연 제거
 *    → 사진에 박힌 위치 정보 유출 차단 (사진 + Google Maps URL 조합 시 사용자 위치 노출 위험)
 *
 * 결과는 File 객체 (원본 file 의 name 유지) — 그대로 fetch PUT 가능.
 */
const DEFAULT_OPTIONS = {
  maxSizeMB: 1.0,               // 압축 목표 — 카드 표시에 충분
  maxWidthOrHeight: 1920,       // FHD 이상 불필요
  fileType: "image/webp",
  useWebWorker: true,           // 메인 스레드 블로킹 방지
  initialQuality: 0.85,
};

/**
 * @param {File} file - input[type=file] 에서 받은 원본
 * @param {object} [options] - DEFAULT_OPTIONS 를 부분 덮어쓰기
 * @returns {Promise<File>} - 최적화된 File (image/webp)
 */
export async function compressImage(file, options = {}) {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const compressed = await imageCompression(file, merged);

  // imageCompression 이 Blob 을 반환할 때가 있어 File 로 감싸기 (이름 유지 + S3 일관성)
  if (compressed instanceof File) return compressed;
  return new File([compressed], file.name.replace(/\.\w+$/, ".webp"), {
    type: merged.fileType,
    lastModified: Date.now(),
  });
}
