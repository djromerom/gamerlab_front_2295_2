import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

type LikesMap = Record<number, number>;

/**
 * Opens a Socket.IO connection with the backend and listens to the `likes:updated` event.
 * Returns a map { [videogameId]: likeCount } that updates in real time.
 *
 * Design:
 *  - The initial REST snapshot is only applied once (first load).
 *  - WS events always overwrite: never go back to an old value
 *    even if the parent component re-fetches.
 *  - No authentication — likes are public data.
 */
export function useLikesSocket(initialLikes: LikesMap = {}): LikesMap {
  const [likesMap, setLikesMap] = useState<LikesMap>(initialLikes);
  const initialized = useRef(false);

  // Populate the map from the REST snapshot only the first time data arrives
  useEffect(() => {
    if (!initialized.current && Object.keys(initialLikes).length > 0) {
      setLikesMap(initialLikes);
      initialized.current = true;
    }
  }, [initialLikes]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_ENDPOINT_BACKEND as string, {
      transports: ['websocket'],
      withCredentials: false, // public: no cookies
    });

    socket.on(
      'likes:updated',
      (data: { videogameId: number; likeCount: number }) => {
        setLikesMap((prev) => ({
          ...prev,
          [data.videogameId]: data.likeCount,
        }));
      },
    );

    socket.on('connect_error', (err) => {
      console.warn('[useLikesSocket] connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // single connection per component lifecycle

  return likesMap;
}
