import { BrowserRouter as Router } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarConfigProvider } from '@/contexts/sidebar-context'
import { AuthProvider } from '@/contexts/auth-context'
import { AppRouter } from '@/components/router/app-router'
import { Toaster } from '@/components/ui/sonner'
import { useEffect } from 'react'
import { initGTM } from '@/utils/analytics'

const queryClient = new QueryClient()

const basename = import.meta.env.VITE_BASENAME || ''

function App() {
  useEffect(() => {
    initGTM();
  }, []);

  return (
    <div className="font-sans antialiased" style={{ fontFamily: 'var(--font-inter)' }}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <SidebarConfigProvider>
              <Router basename={basename}>
                <AppRouter />
                <Toaster />
              </Router>
            </SidebarConfigProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </div>
  )
}

export default App
