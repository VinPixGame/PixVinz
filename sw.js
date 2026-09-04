const CACHE_NAME = "pixvinz-v1";

const FILES_TO_CACHE = [
    "/PixVinz/",
    "/PixVinz/index.html",
    "/PixVinz/auth.html",
    "/PixVinz/auth.css",
    "/PixVinz/auth.js",
    "/PixVinz/manifest.json",
    "/PixVinz/image/vinz.png",
    "/PixVinz/image/icon-192.png",
    "/PixVinz/image/icon-512.png"
];


// ==========================================
// INSTALL
// ==========================================

self.addEventListener("install", (event) => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then((cache) => {

                console.log("PixVinz: Caching app files");

                return cache.addAll(FILES_TO_CACHE);

            })
            .then(() => {

                return self.skipWaiting();

            })

    );

});


// ==========================================
// ACTIVATE
// ==========================================

self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys()
            .then((cacheNames) => {

                return Promise.all(

                    cacheNames
                        .filter(
                            (name) => name !== CACHE_NAME
                        )
                        .map(
                            (name) => caches.delete(name)
                        )

                );

            })
            .then(() => {

                return self.clients.claim();

            })

    );

});


// ==========================================
// FETCH
// ==========================================

self.addEventListener("fetch", (event) => {

    // Only handle GET requests
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(

        caches.match(event.request)
            .then((cachedResponse) => {

                // Use cached file if available
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise load from the internet
                return fetch(event.request);

            })

    );

});
