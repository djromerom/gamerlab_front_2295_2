import { useState, useEffect } from 'react';

interface UseGameLoaderResult {
    ready: boolean;
    error: string | null;
}

export function useGameLoader(gameId: string, zipUrl: string): UseGameLoaderResult {
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            //registrar el sw de la carpeta public
            const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            await navigator.serviceWorker.ready;

            //buscar el zip en azure con el SAS (zipUrl es un SAS)
            const res = await fetch(zipUrl);
            if (!res.ok) throw new Error('Failed to fetch zip');
            const zipBuffer = await res.arrayBuffer();

            // listener para esperar que el sw termine de descomprimir el zip
            const onMessage = (e: MessageEvent) => {
                if (e.data.type === 'ZIP_READY' && e.data.gameId === gameId && !cancelled) {
                    console.log("zip ready!")
                    setReady(true);
                    navigator.serviceWorker.removeEventListener('message', onMessage);
                }
            };
            navigator.serviceWorker.addEventListener('message', onMessage);

            //logger
            navigator.serviceWorker.addEventListener('message', (e) => {
                console.log('message received in hook:', e.data);
            });

            // cederle el control al SW
            const controller = navigator.serviceWorker.controller;
            if (!controller) {
                console.log("tratando de ceder control al sw")
                // SW is installed but not yet controlling this page — reload to fix
                registration.active?.postMessage({ type: 'CLAIM' });
                window.location.reload();
                return;
            }

            console.log("mandando LOAD_ZIP al worker")
            controller.postMessage({ type: 'LOAD_ZIP', zipBuffer, gameId }, [zipBuffer]);
        };

        load();

        return () => { cancelled = true; };
    }, [gameId, zipUrl]);

    return { ready, error };
}