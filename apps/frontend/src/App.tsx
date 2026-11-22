import AdminPage from './pages/AdminPage'
import BookPage from './pages/BookPage'
import BookTypePage from './pages/BookTypePage'
import LandingPage from './pages/LandingPage'
import UpcomingPage from './pages/UpcomingPage'

export default function App() {
  if (window.location.pathname === '/admin') {
    return <AdminPage />
  }

  if (window.location.pathname === '/book') {
    return <BookPage />
  }

  const typeId = window.location.pathname.match(/^\/book\/([^/]+)$/)?.[1]
  if (typeId) {
    return <BookTypePage id={decodeURIComponent(typeId)} />
  }

  if (window.location.pathname === '/upcoming') {
    return <UpcomingPage />
  }

  return <LandingPage />
}
