import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Singleton pattern for the global WS connection
    const socketInstance = io(import.meta.env.VITE_ENDPOINT_BACKEND as string, {
      transports: ["websocket"],
      withCredentials: false, // Change to true in the future if other routes (ej. chat) need cookies
    });

    socketInstance.on("connect", () => setIsConnected(true));
    socketInstance.on("disconnect", () => setIsConnected(false));
    socketInstance.on("connect_error", (err) => {
      console.warn("[SocketContext] connection error:", err.message);
    });

    setSocket(socketInstance);

    // Disconnect only when the application closes/reloads
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
