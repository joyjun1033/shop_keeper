import { useEffect, useRef, useState } from 'react'
import BottomNav from './components/BottomNav'
import { alerts, cameras, clips, demoNow } from './data/mock'
import { getTodayClips } from './domain/rules'
import AlertsPage from './pages/AlertsPage'
import CctvPage from './pages/CctvPage'
import HomePage from './pages/HomePage'
import InquiriesPage from './pages/InquiriesPage'
import ReportPage from './pages/ReportPage'
import { isTabId, type TabId } from './tabs'

function tabFromHash(): TabId {
  const hash = window.location.hash.slice(1)
  return isTabId(hash) ? hash : 'home'
}

export default function App() {
  const [tab, setTab] = useState<TabId>(tabFromHash)
  const [cameraId, setCameraId] = useState(cameras[0]?.id ?? null)
  const screenRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    screenRef.current?.scrollTo(0, 0)
  }, [tab])

  const goToTab = (next: TabId) => {
    setTab(next)
    window.location.hash = next
  }

  const openCamera = (id: string) => {
    setCameraId(id)
    goToTab('cctv')
  }

  return (
    <div className="app">
      <main className="screen" ref={screenRef}>
        {tab === 'home' && <HomePage />}
        {tab === 'cctv' && (
          <CctvPage
            cameras={cameras}
            clips={getTodayClips(clips, alerts, demoNow)}
            cameraId={cameraId}
            onSelectCamera={setCameraId}
          />
        )}
        {tab === 'alerts' && <AlertsPage onOpenCamera={openCamera} />}
        {tab === 'inquiries' && <InquiriesPage />}
        {tab === 'report' && <ReportPage />}
      </main>
      <BottomNav active={tab} onChange={goToTab} />
    </div>
  )
}
