import { ThemeProvider } from "@/components/grupo 11/theme-provider"
import RoutesConfiguration from "@/routes/RoutesConfiguration"
import { AuthProvider } from "@/contexts/AuthContext"
import { SocketProvider } from "@/contexts/SocketContext"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <SocketProvider>
          <RoutesConfiguration />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
