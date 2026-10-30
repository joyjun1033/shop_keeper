// 시안의 예시 데이터. 백엔드를 붙일 때는 이 파일의 값을 API 응답으로 교체한다.
// 화면의 숫자는 여기에 적지 않고 domain/rules.ts에서 계산한다.
import type { AlertItem, Camera, Clip, Inquiry, Period } from '../domain/types'

// 예시 데이터가 기준으로 삼는 현재 시각
export const demoNow = new Date('2026-10-23T15:00:00+09:00')

export const store = {
  name: '우리동네 아이스크림점',
  status: '운영 정상',
}

export const cameras: Camera[] = [
  { id: 'cam-01', name: '카메라 01', location: '매장 입구' },
  { id: 'cam-02', name: '카메라 02', location: '상품 진열대' },
  { id: 'cam-03', name: '카메라 03', location: '냉동고 구역' },
]

const todayAlerts: AlertItem[] = [
  {
    id: 'e1',
    kind: 'movement',
    label: '이상 행동 감지',
    tone: 'red',
    title: '상품 이동 감지',
    occurredAt: '2026-10-23T14:08:00+09:00',
    from: '입구 진열대',
    to: '냉동고 구역',
    cameraId: 'cam-02',
    confirmed: true,
  },
  {
    id: 'e2',
    kind: 'duration',
    label: '주의 행동 감지',
    tone: 'orange',
    title: '냉장고 문 장시간 개방',
    occurredAt: '2026-10-23T11:42:00+09:00',
    progress: 80,
    elapsed: '28분 경과',
    cameraId: 'cam-03',
    confirmed: false,
  },
  {
    id: 'e3',
    kind: 'product',
    label: '이상 행동 감지',
    tone: 'green',
    title: '상품 훼손 의심',
    occurredAt: '2026-10-23T10:32:00+09:00',
    product: '초코 아이스크림 (500ml)',
    cameraId: 'cam-02',
    confirmed: true,
  },
]

// 지난 6일의 처리 완료 이벤트. 리포트 집계에만 쓰인다
const pastAlerts: AlertItem[] = [
  ['e4', '2026-10-17T13:20:00+09:00'],
  ['e5', '2026-10-18T22:10:00+09:00'],
  ['e6', '2026-10-19T09:45:00+09:00'],
  ['e7', '2026-10-20T01:15:00+09:00'],
  ['e8', '2026-10-20T13:05:00+09:00'],
  ['e9', '2026-10-20T19:30:00+09:00'],
  ['e10', '2026-10-20T23:40:00+09:00'],
  ['e11', '2026-10-21T16:25:00+09:00'],
  ['e12', '2026-10-22T20:50:00+09:00'],
].map(([id, occurredAt]) => ({
  id,
  kind: 'duration',
  label: '주의 행동 감지',
  tone: 'orange',
  title: '냉장고 문 장시간 개방',
  occurredAt,
  progress: 100,
  elapsed: '35분 경과',
  cameraId: 'cam-03',
  confirmed: true,
}))

export const alerts: AlertItem[] = [...todayAlerts, ...pastAlerts]

export const clips: Clip[] = [
  { id: 'c1', alertId: 'e1', duration: '00:14' },
  { id: 'c2', alertId: 'e2', duration: '00:22' },
  { id: 'c3', alertId: 'e3', duration: '00:18' },
]

export const inquiries: Inquiry[] = [
  {
    id: 'q1',
    title: '결제 후 상품이 나오지 않아요',
    note: 'AI 상담에서 해결되지 않아 점주에게 전달됨',
    occurredAt: '2026-10-23T14:08:00+09:00',
    status: 'forwarded',
    read: false,
  },
  {
    id: 'q2',
    title: '딸기 아이스크림은 어디 있나요?',
    note: 'AI가 상품 위치 확인 방법을 안내함',
    occurredAt: '2026-10-23T10:32:00+09:00',
    status: 'ai_resolved',
    read: false,
  },
]

export const weeklyPeriod: Period = { start: '2026-10-17', end: '2026-10-23' }

export const weeklyReport = {
  range: '주간',
  recommendation: '냉장고 구역 점검을 권장합니다',
}
