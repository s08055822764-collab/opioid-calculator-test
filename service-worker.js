const CACHE_NAME = "opioid-calculator-test-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// 新しいキャッシュを作成
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

// 古いキャッシュを削除して新しいバージョンを有効化
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(cacheName) {
              return cacheName !== CACHE_NAME;
            })
            .map(function(cacheName) {
              return caches.delete(cacheName);
            })
        );
      })
      .then(function() {
        return self.clients.claim();
      })
  );
});

// オンラインでは最新版を優先し、オフラインでは保存済み画面を使用
self.addEventListener("fetch", function(event) {
  var request = event.request;

  if (request.method !== "GET") {
    return;
  }

  // 別のサイトへの通信は処理しない
  if (new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(function(response) {
        if (response && response.ok) {
          var responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(request, responseToCache);
            })
            .catch(function(error) {
              console.log("キャッシュ保存失敗:", error);
            });
        }

        return response;
      })
      .catch(function() {
        return caches.match(request).then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }

          // ページを開く操作がオフラインだった場合
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }

          return Response.error();
        });
      })
  );
});
