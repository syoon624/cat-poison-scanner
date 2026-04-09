/**
 * ============================================
 * Service Worker - 오프라인 캐싱 & PWA 지원
 * ============================================
 * 정적 에셋을 캐시하여 오프라인에서도 앱 셸을 표시합니다.
 */

const CACHE_NAME = 'purrfectscan-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

/* install: 정적 에셋 사전 캐시 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* activate: 이전 버전 캐시 제거 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* fetch: 네트워크 우선, 실패 시 캐시 폴백 */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
