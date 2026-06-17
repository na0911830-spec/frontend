import { useRouter } from "./components/router"
import { Toaster } from "@/components/ui/sonner"
import LandingPage from "./pages/LandingPage"
import ReviewsPage from "./pages/ReviewsPage"
import AppealPage from "./pages/AppealPage"
import AdminPage from "./pages/AdminPage"
import PrivacyPage from "./pages/PrivacyPage"
import TermsPage from "./pages/TermsPage"
import SupportPage from "./pages/SupportPage"

export function App() {
  const currentPath = useRouter()

  const renderPage = () => {
    switch (currentPath) {
      case "/":
        return <LandingPage />
      case "/reviews":
      case "/review":
        return <ReviewsPage />
      case "/appeal":
        return <AppealPage />
      case "/internal/staff/admin":
        return <AdminPage />
      case "/privacy":
        return <PrivacyPage />
      case "/terms":
        return <TermsPage />
      case "/support":
        return <SupportPage />
      default:
        return (
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono">
            404 - Page Not Found
          </div>
        )
    }
  }

  return (
    <>
      {renderPage()}
      <Toaster closeButton position="top-right" />
    </>
  )
}

export default App
