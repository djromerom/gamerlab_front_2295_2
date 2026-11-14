import { ThemeProvider } from "@/components/grupo 11/theme-provider"
import RoutesConfiguration from "@/routes/RoutesConfiguration"
import { AuthProvider } from "@/contexts/AuthContext"
import { SocketProvider } from "@/contexts/SocketContext"
import { JuradosAuthSync } from "@/fetchs/grupo 1/GlobalStateContext"
import { JurorPresenceProvider } from "@/features/jurors/presence/contexts/JurorPresenceContext"
import { JurorPresencePrompt } from "@/features/jurors/presence/components/JurorPresencePrompt"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <JuradosAuthSync />
        <SocketProvider>
          {/* HU-23: "¿Sigues en la feria?" en todas las pantallas del jurado */}
          <JurorPresenceProvider>
            <RoutesConfiguration />
            <JurorPresencePrompt />
          </JurorPresenceProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
