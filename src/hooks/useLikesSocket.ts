import { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';

type LikesMap = Record<number, number>;

/**
 * Observer hook.
 * Subscribes to the global Socket.IO connection and listens to the `likes:updated` event.
 */
export function useLikesSocket(initialLikes: LikesMap = {}): LikesMap {
  const [likesMap, setLikesMap] = useState<LikesMap>(initialLikes);
  const initialized = useRef(false);
  const { socket } = useSocket();

  // Populate the map from the REST snapshot only the first time data arrives
  useEffect(() => {
    if (!initialized.current && Object.keys(initialLikes).length > 0) {
      setLikesMap(initialLikes);
      initialized.current = true;
    }
  }, [initialLikes]);

  useEffect(() => {
    if (!socket) return;

    const handleLikesUpdated = (data: { videogameId: number; likeCount: number }) => {
      setLikesMap((prev) => ({
        ...prev,
        [data.videogameId]: data.likeCount,
      }));
    };

    // Subscription to the room in the backend
    socket.emit('subscribe:likes');
    // Subscription to the event in the client (Observer attach)
    socket.on('likes:updated', handleLikesUpdated);

    // Subscription cleaning (Observer detach)
    return () => {
      socket.off('likes:updated', handleLikesUpdated);
      socket.emit('unsubscribe:likes');
    };
  }, [socket]); // Depends of the global socket instance

  return likesMap;
}
