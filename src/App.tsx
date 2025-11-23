import { ThemeProvider } from "@/components/grupo 11/theme-provider"
import RoutesConfiguration from "@/routes/RoutesConfiguration"
import { AuthProvider } from "@/contexts/AuthContext"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <RoutesConfiguration />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
