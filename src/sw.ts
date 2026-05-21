/// <reference lib="webworker" />

import JSZip from 'jszip';

declare const self: ServiceWorkerGlobalScope;

// Map de archivos (básicamente un diccionario dentro de un diccionario)
// en el Map externo, cada juego es una llave en 'gameFiles', y el valor detrás de esa llave es otro Map
// en el Map interno, cada llave es un camino a un archivo, y cada valor es el archivo como tal (en bytes)
const gameFiles = new Map<string, Map<string, ArrayBuffer>>();

//NOTA: este es el service worker encargado de interfacear con los videojuegos que corren en Arkad.
//si se va a modificar este archivo, es necesario que apagues el front si está en ejecución,
//y corras el siguiente comando: npm exec vite build --config sw.config.ts
//el archivo 'sw.config.ts' le dice a Vite con qué configuración compilar el sw.
//para funcionar, el sw transpilado tiene que estar en /public

// magia para adueñarse de la pagina cuando sea necesario
self.addEventListener('install', () => {
    self.skipWaiting();
});
self.addEventListener('activate', (event: ExtendableEvent) => {
    event.waitUntil(self.clients.claim());
});

// listeners para cuando sea hora de adueñarse de la pagina o cuando toque descomprimir el ZIP del juego
self.addEventListener('message', async (event: ExtendableMessageEvent) => {
    if (event.data.type === 'CLAIM') {
        await self.clients.claim();
        return;
    }

    if (event.data.type === 'LOAD_ZIP') {
        const { zipBuffer, gameId } = event.data;
        const zip = await JSZip.loadAsync(zipBuffer);
        const files = new Map<string, ArrayBuffer>();

        await Promise.all(
            Object.entries(zip.files).map(async ([path, entry]) => {
                if (!entry.dir) {
                    files.set(path, await entry.async('arraybuffer'));
                }
            })
        );

        gameFiles.set(gameId, files);
        console.log("gameFiles state: ", gameFiles);
        event.source?.postMessage({ type: 'ZIP_READY', gameId });
    }
});

// intercepcion de fetch: cada vez que en la página corra un fetch, este listener reacciona.
// se filtran los fetches a aquellos que pasen por el path de la pagina en la cual se corren juegos.
// si un fetch pasa por /play-game/, se dice que es un fetch de archivos internos del juego.
// entonces el SW toma la tarea de responder al fetch con la informacion correspondiente, siendo los archivos del juego.
self.addEventListener('fetch', (event: FetchEvent) => {
    //check if detected fetch is for a local game file
    const url = new URL(event.request.url);
    const match = url.pathname.match(/\/play-game\/([^/]+)\/(.*)/);
    if (!match) {
        return
    };

    //if so, try to get it from game file map
    const [, gameId, filePath] = match;
    console.log("gameId: ", gameId, "\nfilePath: ", filePath);
    const files = gameFiles.get(gameId);
    const file = files?.get(filePath);

    if (!file) {
        console.log("file not found! ", file);
        return
    };

    //Unity needs its files uncompressed while pygbag needs them compressed
    //so instead of touching the upload model again (horrible experience, especially frontend)
    //just detect Unity's '/Build/' folder. if the folder exists then attach the Content-Encoding header
    //so that the file gets decompressed. its not a neat solution but...
    const decompress = filePath.includes('Build/') && filePath.endsWith('.gz');
    console.log("should decompress?: ", decompress);

    const debrotli = filePath.includes('.br');
    console.log("should debrotli?: ", debrotli);
    //la solucion ideal sería que se declare con cual motor de videojuegos se hizo el juego al montarlo
    //pero eso queda como ejercicio al lector lol

    event.respondWith(
        (async () => {
            let buffer = file;
            //decidir si descomprimir o no dependiendo del engine
            if (decompress) {
                try {
                    buffer = await decompressGzip(file);
                    console.log('decompressed successfully, size:', buffer.byteLength);
                } catch (e) {
                    console.warn(`Failed to decompress ${filePath}:`, e);
                }
            }

            //armar la respuesta, colocando los headers necesarios.
            //el detalle aca es que Unity es quisquilloso y pide
            //Content-Length además de un Content-Type correcto (mira getMimeType())
            //ademas, cualquier engine va a necesitar un COEP definido para poder embedir sus juegos en un iframe
            console.log('responding with buffer size:', buffer.byteLength);
            const response = new Response(new Uint8Array(buffer), {
                headers: {
                    'Content-Type': getMimeType(filePath),
                    'Cross-Origin-Embedder-Policy': 'require-corp',
                    'Cross-Origin-Opener-Policy': 'same-origin',
                    'Cross-Origin-Resource-Policy': 'same-origin',
                    ...(decompress && {
                        'Content-Length': buffer.byteLength.toString(),
                    }),
                },
            });
            console.log('response constructed:', response, "\nheaders:", [...response.headers.entries()]);
            return response;
        })().catch(e => {
            console.error('respondWith failed:', e);
            return new Response('SW error', { status: 500 });
        })
    );
});

//para pegar a los headers
function getMimeType(path: string): string {
    const ext = path.split('.')
    const tail = ext.pop()?.toLowerCase();
    const legs = ext.pop()?.toLowerCase();

    const types: Record<string, string> = {
        html: 'text/html',
        js: 'application/javascript',
        wasm: 'application/wasm',
        data: 'application/octet-stream',
        json: 'application/json',
        png: 'image/png',
        jpg: 'image/jpeg',
        css: 'text/css',
    };

    //Unity sends stuff like 'file.wasm.gzip' and expects the Mimetype to correspond
    //with the '.wasm' part. so to appease it, check the possible 'legs' of the
    //filepath before falling back to the tail.
    if (types[legs ?? '']) {
        return types[legs ?? ''];
    } else {
        return types[tail ?? ''] ?? 'application/octet-stream';
    }

}

//utilidad para descomprimir. resulta que el navegador no descomprime archivos si son
//servidos por un service worker. Unity depende de esa funcionalidad, por lo que toca
//descomprimir dentro del SW antes de mandar los archivos al navegador.
async function decompressGzip(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(buffer);
    writer.close();

    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return result.buffer;
}