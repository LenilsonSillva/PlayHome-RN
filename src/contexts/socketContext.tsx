import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// URL do seu servidor no Render
const SOCKET_URL = "https://playhome-backend.onrender.com";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Inicializa a conexão uma única vez
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      forceNew: true
    });

    setSocket(newSocket);

    // Logs de debug para você ver no terminal do VS Code
    newSocket.on("connect", () => {
      console.log("✅ Conectado ao servidor:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Desconectado do servidor");
    });

    // Limpeza ao fechar o app
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

// Hook customizado para usar o socket em qualquer lugar
export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};
