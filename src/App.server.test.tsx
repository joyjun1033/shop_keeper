import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import App from './App'
import { alerts, cameras, clips, demoNow, inquiries, store } from './data/mock'
import { confirmAlert } from './domain/rules'

const TOKEN = 'test-token'
const TOKEN_KEY = 'keeper.token'

type Call = { method: string; url: string }

// 실제 서버와 같은 경로와 상태 코드로 답하는 가짜 서버
function createFakeServer() {
  const state = { alerts, inquiries, status: 200, offline: false, calls: [] as Call[] }

  const respond = (body: unknown, status = 200) =>
    new Response(status === 204 ? null : JSON.stringify(body), { status })

  const fetchMock = vi.fn(async (input: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET'
    state.calls.push({ method, url: input })
    if (state.offline) throw new TypeError('Failed to fetch')

    if (input === '/api/auth/login') {
      const { password } = JSON.parse(init.body as string)
      return password === 'right' ? respond({ token: TOKEN }) : respond({}, 401)
    }
    if ((init.headers as Record<string, string>)?.Authorization !== `Bearer ${TOKEN}`) return respond({}, 401)
    if (state.status !== 200) return respond({}, state.status)

    if (input.startsWith('/api/dashboard')) {
      return respond({ store, cameras, clips, alerts: state.alerts, inquiries: state.inquiries })
    }
    if (input.startsWith('/api/alerts?')) return respond(state.alerts)
    const confirm = input.match(/^\/api\/alerts\/(.+)\/confirm$/)
    if (confirm) {
      state.alerts = confirmAlert(state.alerts, confirm[1])
      return respond(null, 204)
    }
    if (input === '/api/auth/logout') return respond(null, 204)
    return respond({}, 404)
  })

  vi.stubGlobal('fetch', fetchMock)
  return state
}

function statValue(label: string) {
  return within(screen.getByText(label).parentElement!).getByRole('strong')
}

function signedIn() {
  window.localStorage.setItem(TOKEN_KEY, TOKEN)
}

async function login(password: string) {
  await userEvent.type(screen.getByLabelText('이메일'), 'owner@keeper.test')
  await userEvent.type(screen.getByLabelText('비밀번호'), password)
  await userEvent.click(screen.getByRole('button', { name: '로그인' }))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: demoNow })
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('로그인', () => {
  test('로그인 전에는 로그인 화면만 보이고 서버에 데이터를 요청하지 않는다', () => {
    const server = createFakeServer()

    render(<App dataSource="api" />)

    expect(screen.getByRole('heading', { name: '점주 로그인' })).toBeInTheDocument()
    expect(server.calls).toEqual([])
  })

  test('로그인하면 토큰을 저장하고 서버 데이터로 홈을 보여준다', async () => {
    createFakeServer()
    render(<App dataSource="api" />)

    await login('right')

    expect(await screen.findByText('매장 대시보드')).toBeInTheDocument()
    expect(statValue('미확인 알림')).toHaveTextContent('01건')
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe(TOKEN)
  })

  test('비밀번호가 틀리면 안내하고 토큰을 저장하지 않는다', async () => {
    createFakeServer()
    render(<App dataSource="api" />)

    await login('wrong')

    expect(await screen.findByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 올바르지 않습니다.')
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  test('서버에 연결할 수 없으면 비밀번호 오류와 구분해서 안내한다', async () => {
    createFakeServer().offline = true
    render(<App dataSource="api" />)

    await login('right')

    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 연결할 수 없습니다.')
  })

  test('저장된 토큰이 있으면 바로 홈을 연다', async () => {
    createFakeServer()
    signedIn()

    render(<App dataSource="api" />)

    expect(await screen.findByText('매장 대시보드')).toBeInTheDocument()
  })

  test('토큰이 만료되었으면 지우고 로그인 화면으로 돌아간다', async () => {
    createFakeServer()
    window.localStorage.setItem(TOKEN_KEY, 'expired-token')

    render(<App dataSource="api" />)

    expect(await screen.findByRole('heading', { name: '점주 로그인' })).toBeInTheDocument()
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  test('로그아웃하면 서버에 알리고 로그인 화면으로 돌아간다', async () => {
    const server = createFakeServer()
    signedIn()
    render(<App dataSource="api" />)

    await userEvent.click(await screen.findByRole('button', { name: '로그아웃' }))

    expect(screen.getByRole('heading', { name: '점주 로그인' })).toBeInTheDocument()
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(server.calls).toContainEqual({ method: 'POST', url: '/api/auth/logout' })
  })
})

describe('서버 데이터', () => {
  test('오늘 자정을 기준 시각으로 대시보드를 요청한다', async () => {
    const server = createFakeServer()
    signedIn()

    render(<App dataSource="api" />)
    await screen.findByText('매장 대시보드')

    expect(server.calls[0].url).toBe('/api/dashboard?since=2026-10-23T00%3A00%3A00%2B09%3A00')
  })

  test('알림을 확인하면 서버에 저장한다', async () => {
    const server = createFakeServer()
    signedIn()
    render(<App dataSource="api" />)
    await screen.findByText('매장 대시보드')

    await userEvent.click(screen.getByRole('button', { name: '알림' }))
    await userEvent.click(screen.getByRole('button', { name: '냉장고 문 장시간 개방 확인 완료' }))

    expect(server.calls).toContainEqual({ method: 'POST', url: '/api/alerts/e1/confirm' })
    expect(server.alerts.find((alert) => alert.id === 'e1')?.confirmed).toBe(true)
  })

  test('저장에 실패하면 버튼을 되돌리고 연결 안내를 보여준다', async () => {
    const server = createFakeServer()
    signedIn()
    render(<App dataSource="api" />)
    await screen.findByText('매장 대시보드')
    await userEvent.click(screen.getByRole('button', { name: '알림' }))

    server.status = 500
    await userEvent.click(screen.getByRole('button', { name: '냉장고 문 장시간 개방 확인 완료' }))

    expect(await screen.findByRole('status')).toHaveTextContent('서버에 연결할 수 없습니다.')
    expect(screen.getByRole('button', { name: '냉장고 문 장시간 개방 확인 완료' })).toBeInTheDocument()
  })

  test('리포트는 선택한 기간을 서버에 요청한다', async () => {
    const server = createFakeServer()
    signedIn()
    render(<App dataSource="api" />)
    await screen.findByText('매장 대시보드')

    await userEvent.click(screen.getByRole('button', { name: '리포트' }))
    await screen.findByText('감지 이벤트')

    expect(server.calls).toContainEqual({ method: 'GET', url: '/api/alerts?start=2026-10-17&end=2026-10-23' })
  })

  test('처음 연결에 실패하면 안내하고 다시 시도할 수 있다', async () => {
    const server = createFakeServer()
    server.offline = true
    signedIn()
    render(<App dataSource="api" />)

    await userEvent.click(await screen.findByRole('button', { name: '다시 시도' }))
    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument()

    server.offline = false
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(await screen.findByText('매장 대시보드')).toBeInTheDocument()
  })
})

describe('주기적 갱신', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.useFakeTimers({ now: demoNow })
  })

  async function tick(ms: number) {
    await act(() => vi.advanceTimersByTimeAsync(ms))
  }

  test('새 이벤트가 들어오면 10초 안에 화면에 나타난다', async () => {
    const server = createFakeServer()
    signedIn()
    render(<App dataSource="api" />)
    await tick(0)
    expect(statValue('미확인 알림')).toHaveTextContent('01건')

    server.alerts = [{ ...alerts[1], id: 'new', confirmed: false }, ...server.alerts]
    await tick(10_000)

    expect(statValue('미확인 알림')).toHaveTextContent('02건')
  })

  test('연결이 끊기면 마지막 내용을 유지하고 복구되면 안내가 사라진다', async () => {
    const server = createFakeServer()
    signedIn()
    render(<App dataSource="api" />)
    await tick(0)

    server.offline = true
    await tick(10_000)

    expect(screen.getByRole('status')).toHaveTextContent('마지막으로 받은 내용')
    expect(statValue('미확인 알림')).toHaveTextContent('01건')

    server.offline = false
    await tick(10_000)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  test('화면이 사라지면 갱신을 멈춘다', async () => {
    const server = createFakeServer()
    signedIn()
    const { unmount } = render(<App dataSource="api" />)
    await tick(0)

    unmount()
    const before = server.calls.length
    await tick(30_000)

    expect(server.calls).toHaveLength(before)
  })
})
