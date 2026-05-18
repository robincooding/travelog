/**
 * E2E 에서 API 직접 호출용 헬퍼.
 *
 * 왜 필요한가:
 *  - frontend(8080) 의 nginx 는 /api/* 를 백엔드로 proxy 하지 않음
 *    (실제 frontend JS 가 직접 http://localhost:3000/api 호출)
 *  - playwright 의 page.request 는 baseURL(8080) 만 따르므로 절대 URL 필요
 *
 * 쿠키:
 *  - page.request 는 BrowserContext 의 쿠키를 공유
 *  - 두 호스트가 같은 host(localhost) 라 cookie 가 자동 첨부됨
 */
const API_URL = "http://localhost:3000/api";

export async function apiPost(page, path, data) {
  const res = await page.request.post(`${API_URL}${path}`, { data });
  if (!res.ok()) {
    throw new Error(
      `POST ${path} failed: ${res.status()} ${await res.text()}`,
    );
  }
  return res.json();
}

export async function apiGet(page, path) {
  const res = await page.request.get(`${API_URL}${path}`);
  if (!res.ok()) {
    throw new Error(
      `GET ${path} failed: ${res.status()} ${await res.text()}`,
    );
  }
  return res.json();
}

export async function apiDelete(page, path) {
  const res = await page.request.delete(`${API_URL}${path}`);
  return res.ok();
}
