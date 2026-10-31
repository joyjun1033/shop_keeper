import { useEffect, useRef, useState } from 'react'
import BottomNav from './components/BottomNav'
import { alerts as initialAlerts, cameras, clips, demoNow, inquiries as initialInquiries } from './data/mock'
import { confirmAlert, getClipView, getTodayClips, markInquiryRead } from './domain/rules'
import { useNow } from './hooks/useNow'
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
  const now = useNow(demoNow)
  const [tab, setTab] = useState<TabId>(tabFromHash)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [inquiries, setInquiries] = useState(initialInquiries)
  const [cameraId, setCameraId] = useState(cameras[0]?.id ?? null)
  const [clipId, setClipId] = useState<string | null>(null)
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

  const selectCamera = (id: string) => {
    setCameraId(id)
    setClipId(null)
  }

  const playClip = (id: string) => {
    const view = getClipView(clips.find((clip) => clip.id === id)!, alerts, now)
    setCameraId(view?.cameraId ?? cameraId)
    setClipId(id)
  }

  const openAlertClip = (alertId: string) => {
    playClip(clips.find((clip) => clip.alertId === alertId)!.id)
    goToTab('cctv')
  }

  const activeClip = clips.find((clip) => clip.id === clipId)

  return (
    <div className="app">
      <main className="screen" ref={screenRef}>
        {tab === 'home' && <HomePage alerts={alerts} inquiries={inquiries} now={now} />}
        {tab === 'cctv' && (
          <CctvPage
            cameras={cameras}
            clips={getTodayClips(clips, alerts, now)}
            cameraId={cameraId}
            activeClip={activeClip ? getClipView(activeClip, alerts, now) : null}
            onSelectCamera={selectCamera}
            onPlayClip={playClip}
            onBackToLive={() => setClipId(null)}
          />
        )}
        {tab === 'alerts' && (
          <AlertsPage
            alerts={alerts}
            clips={clips}
            now={now}
            onConfirm={(id) => setAlerts((current) => confirmAlert(current, id))}
            onOpenClip={openAlertClip}
          />
        )}
        {tab === 'inquiries' && (
          <InquiriesPage
            inquiries={inquiries}
            now={now}
            onRead={(id) => setInquiries((current) => markInquiryRead(current, id))}
          />
        )}
        {tab === 'report' && <ReportPage alerts={alerts} now={now} />}
      </main>
      <BottomNav active={tab} onChange={goToTab} />
    </div>
  )
}
