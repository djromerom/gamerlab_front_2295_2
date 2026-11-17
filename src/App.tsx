import { ThemeProvider } from "@/components/ThemeProvider"
import RoutesConfiguration from "@/routes/RoutesConfiguration"
import { AuthProvider } from "@/contexts/AuthContext"
import { SocketProvider } from "@/contexts/SocketContext"
import { GlobalDataAuthSync } from "@/contexts/GlobalStateContext"
import { JurorPresenceProvider } from "@/features/jurors/presence/contexts/JurorPresenceContext"
import { JurorPresencePrompt } from "@/features/jurors/presence/components/JurorPresencePrompt"
import { SubstituteNoticesProvider } from "@/features/jurors/substitutes/contexts/SubstituteNoticesContext"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <GlobalDataAuthSync />
        <SocketProvider>
          {/* HU-23: "¿Sigues en la feria?" en todas las pantallas del jurado */}
          <JurorPresenceProvider>
            {/* HU-22: aviso "Te asignaron grupos" y explicación para el suplente */}
            <SubstituteNoticesProvider>
              <RoutesConfiguration />
              <JurorPresencePrompt />
            </SubstituteNoticesProvider>
          </JurorPresenceProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
