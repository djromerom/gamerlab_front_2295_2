/// <reference lib="webworker" />

import JSZip from 'jszip';
import {
    CACHED_GAMES,
    GAME_CACHE_PREFIX,
    mimeType,
    needsGunzip,
    parseGameFileRequest,
} from './features/games/lib/gameFiles';

declare const self: ServiceWorkerGlobalScope;

// Map de archivos (básicamente un diccionario dentro de un diccionario)
// en el Map externo, cada juego es una llave en 'gameFiles', y el valor detrás de esa llave es otro Map
// en el Map interno, cada llave es un camino a un archivo, y cada valor es el archivo como tal (en bytes)
const gameFiles = new Map<string, Map<string, ArrayBuffer>>();

//NOTA: este es el service worker encargado de interfacear con los videojuegos que corren en Arkad.
//si se va a modificar este archivo, es necesario que apagues el front si está en ejecución,
//y corras el siguiente comando: npm exec vite build --config sw.config.ts (y se commitea public/sw.js)
//el archivo 'sw.config.ts' le dice a Vite con qué configuración compilar el sw.
//para funcionar, el sw transpilado tiene que estar en /public

self.addEventListener('activate', (event: ExtendableEvent) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event: PushEvent) => {
    let payload = { title: 'ARKAD', body: '', url: '/' };

    if (event.data) {
        try {
            payload = { ...payload, ...event.data.json() };
        } catch {
            payload.body = event.data.text();
        }
    }

    const url = typeof payload.url === 'string' && payload.url.startsWith('/') ? payload.url : '/';
    event.waitUntil(self.registration.showNotification(payload.title || 'ARKAD', {
        body: payload.body || '',
        data: { url },
        icon: '/arkadLight.svg',
        badge: '/arkadDark.svg',
    }));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close();
    const url = event.notification.data?.url;
    const target = typeof url === 'string' && url.startsWith('/') ? url : '/';

    event.waitUntil((async () => {
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const matching = clientsList.find((client) => new URL(client.url).pathname === target);
        if (matching) {
            await matching.focus();
            return matching.navigate(target);
        }
        return self.clients.openWindow(target);
    })());
});

self.addEventListener('pushsubscriptionchange', (event: ExtendableEvent) => {
    event.waitUntil((async () => {
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        if (clientsList[0]) {
            clientsList[0].postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' });
        }
    })());
});

// ─── Juegos de los equipos (HU-40, ARK-225) ─────────────────────────────────
// La página /play-game descarga el zip y lo manda aquí con LOAD_ZIP. El SW lo descomprime con JSZip y sirve cada
// archivo en /play-game/<clave>/<archivo> al iframe del juego. Qué funciona por motor: docs/arkad (SP-03).

self.addEventListener('message', (event: ExtendableMessageEvent) => {
    if (event.data?.type === 'CLAIM') {
        event.waitUntil(self.clients.claim());
        return;
    }

    if (event.data?.type === 'LOAD_ZIP') {
        const { zipBuffer, gameId, entry } = event.data as { zipBuffer: ArrayBuffer; gameId: string; entry?: string };
        event.waitUntil(loadZip(zipBuffer, gameId, entry ?? '', event.source));
    }
});

async function loadZip(zipBuffer: ArrayBuffer, key: string, entry: string, source: ExtendableMessageEvent['source']) {
    let files: Map<string, ArrayBuffer>;
    try {
        const zip = await JSZip.loadAsync(zipBuffer);
        files = new Map<string, ArrayBuffer>();
        await Promise.all(
            Object.entries(zip.files).map(async ([path, file]) => {
                if (!file.dir) files.set(path, await file.async('arraybuffer'));
            })
        );
        if (files.size === 0) throw new Error('El archivo del juego está vacío.');
        if (entry && !files.has(entry)) {
            throw new Error(`El archivo del juego no tiene ${entry}, que es el que lo abre.`);
        }
    } catch (e) {
        // F4: la página muestra el error en vez de quedarse en «Cargando» para siempre
        console.warn(`No se pudo abrir el zip del juego ${key}:`, e);
        const message = e instanceof Error && e.message.startsWith('El archivo del juego')
            ? e.message
            : 'No se pudo abrir el archivo del juego: el .zip está dañado o no es un zip.';
        source?.postMessage({ type: 'ZIP_ERROR', gameId: key, message });
        return;
    }

    // F6: en memoria solo queda el último juego abierto
    gameFiles.clear();
    gameFiles.set(key, files);
    source?.postMessage({ type: 'ZIP_READY', gameId: key });

    // F5: copia en Cache Storage por si el navegador detiene el SW (y con él la memoria) con el juego abierto
    try {
        await saveGameToCache(key, files);
    } catch (e) {
        console.warn(`No se pudo guardar el juego ${key} en caché:`, e);
    }
}

const cacheName = (key: string) => `${GAME_CACHE_PREFIX}${key}`;
const cacheUrl = (key: string, filePath: string) => `/play-game/${key}/${encodeURIComponent(filePath)}`;

async function saveGameToCache(key: string, files: Map<string, ArrayBuffer>) {
    // se borra y se vuelve a crear para que quede de último en caches.keys() (el orden es el de creación)
    await caches.delete(cacheName(key));
    const cache = await caches.open(cacheName(key));
    await Promise.all([...files].map(([path, buffer]) => cache.put(cacheUrl(key, path), new Response(buffer))));
    // F6: solo se conservan los últimos CACHED_GAMES juegos
    const games = (await caches.keys()).filter((name) => name.startsWith(GAME_CACHE_PREFIX));
    await Promise.all(games.slice(0, -CACHED_GAMES).map((name) => caches.delete(name)));
}

async function readGameFile(key: string, filePath: string): Promise<ArrayBuffer | null> {
    const inMemory = gameFiles.get(key)?.get(filePath);
    if (inMemory) return inMemory;
    const cache = await caches.open(cacheName(key));
    const cached = await cache.match(cacheUrl(key, filePath));
    return cached ? cached.arrayBuffer() : null;
}

// Cada pedido a /play-game/<clave>/<archivo> se responde con el archivo del juego. Las páginas de la app
// (/play-game/12, /play-game/historical/12) no pasan por aquí.
self.addEventListener('fetch', (event: FetchEvent) => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
    const request = parseGameFileRequest(url.pathname);
    if (!request) return;

    event.respondWith(
        serveGameFile(request.key, request.filePath).catch((e) => {
            console.error('No se pudo servir el archivo del juego:', e);
            return new Response('Error del service worker', { status: 500 });
        })
    );
});

async function serveGameFile(key: string, filePath: string): Promise<Response> {
    const file = await readGameFile(key, filePath);
    // F5: un archivo que no está responde 404, no el index.html de ARKAD
    if (!file) return new Response('Archivo no encontrado en el juego', { status: 404 });

    let buffer = file;
    if (needsGunzip(filePath)) {
        try {
            buffer = await decompressGzip(file);
        } catch (e) {
            console.warn(`No se pudo descomprimir ${filePath}:`, e);
        }
    }

    // Unity pide Content-Length y el Content-Type del archivo de adentro (game.wasm.gz → application/wasm).
    // F1: COEP credentialless (antes require-corp) para que pygbag cargue sus archivos del CDN, que no envía CORP.
    return new Response(new Uint8Array(buffer), {
        headers: {
            'Content-Type': mimeType(filePath),
            'Content-Length': buffer.byteLength.toString(),
            'Cross-Origin-Embedder-Policy': 'credentialless',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Resource-Policy': 'same-origin',
        },
    });
}

//utilidad para descomprimir. resulta que el navegador no descomprime archivos si son
//servidos por un service worker. Unity depende de esa funcionalidad, por lo que toca
//descomprimir dentro del SW antes de mandar los archivos al navegador.
async function decompressGzip(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
}
