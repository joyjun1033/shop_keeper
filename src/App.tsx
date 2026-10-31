import { useCallback, useMemo, useState } from 'react'
import { createHttpApi } from './api/httpApi'
import { createMockApi } from './api/mockApi'
import { clearToken, readToken, saveToken } from './api/session'
import { demoNow } from './data/mock'
import OwnerApp from './OwnerApp'
import LoginPage from './pages/LoginPage'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''
const POLL_MS = 10_000

function MockApp() {
  const [api] = useState(createMockApi)
  return <OwnerApp api={api} startAt={demoNow} pollMs={0} />
}

function ServerApp() {
  const [token, setToken] = useState(readToken)
  const [startAt] = useState(() => new Date())
  const api = useMemo(() => (token ? createHttpApi(API_BASE_URL, token) : null), [token])

  const signOut = useCallback(() => {
    clearToken()
    setToken(null)
  }, [])

  if (!api) {
    return (
      <LoginPage
        baseUrl={API_BASE_URL}
        onLogin={(next) => {
          saveToken(next)
          setToken(next)
        }}
      />
    )
  }

  const logout = () => {
    api.logout().catch(() => {})
    signOut()
  }

  return <OwnerApp api={api} startAt={startAt} pollMs={POLL_MS} onUnauthorized={signOut} onLogout={logout} />
}

export default function App({ dataSource = import.meta.env.VITE_DATA_SOURCE }: { dataSource?: string }) {
  return dataSource === 'api' ? <ServerApp /> : <MockApp />
}
