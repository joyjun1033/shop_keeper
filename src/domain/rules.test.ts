import { describe, expect, test } from 'vitest'
import {
  getActiveCamera,
  getDailyTrend,
  getHomeStats,
  getInquiryBadge,
  getInquirySummary,
  getRecentActivities,
  getReportStats,
  getReportSummary,
  getTodayClips,
  getTodaySummary,
  getVisibleAlerts,
} from './rules'
import type { AlertItem, Camera, Inquiry, Period } from './types'

const NOW = new Date('2026-10-23T15:00:00+09:00')
const WEEK: Period = { start: '2026-10-17', end: '2026-10-23' }

function makeAlert(id: string, occurredAt: string, confirmed = false): AlertItem {
  return {
    id,
    kind: 'product',
    product: '초코 아이스크림',
    label: '이상 행동 감지',
    tone: 'red',
    title: `알림 ${id}`,
    occurredAt,
    cameraId: 'cam-01',
    confirmed,
  }
}

function makeInquiry(id: string, overrides: Partial<Inquiry> = {}): Inquiry {
  return {
    id,
    title: `문의 ${id}`,
    note: '',
    occurredAt: '2026-10-23T10:00:00+09:00',
    status: 'forwarded',
    read: false,
    ...overrides,
  }
}

describe('홈 집계', () => {
  test('오늘 감지는 오늘 생긴 알림 수이고 미확인은 확인하지 않은 알림 수다', () => {
    const alerts = [
      makeAlert('a', '2026-10-23T09:00:00+09:00'),
      makeAlert('b', '2026-10-23T10:00:00+09:00', true),
      makeAlert('c', '2026-10-23T11:00:00+09:00', true),
    ]

    expect(getHomeStats(alerts, [], NOW)).toMatchObject({ detected: 3, unconfirmedAlerts: 1 })
  })

  test('알림을 확인하면 미확인만 줄고 오늘 감지는 그대로다', () => {
    const before = [makeAlert('a', '2026-10-23T09:00:00+09:00')]
    const after = [makeAlert('a', '2026-10-23T09:00:00+09:00', true)]

    expect(getHomeStats(before, [], NOW)).toMatchObject({ detected: 1, unconfirmedAlerts: 1 })
    expect(getHomeStats(after, [], NOW)).toMatchObject({ detected: 1, unconfirmedAlerts: 0 })
  })

  test('어제 확인하지 않은 알림은 오늘 감지에서 빠지고 미확인에는 남는다', () => {
    const alerts = [makeAlert('a', '2026-10-22T23:00:00+09:00')]

    expect(getHomeStats(alerts, [], NOW)).toMatchObject({ detected: 0, unconfirmedAlerts: 1 })
  })

  test('오늘의 기준은 UTC가 아니라 한국 시간 자정이다', () => {
    const alerts = [makeAlert('before', '2026-10-22T14:59:59Z'), makeAlert('after', '2026-10-22T15:00:00Z')]

    expect(getHomeStats(alerts, [], NOW).detected).toBe(1)
  })

  test('고객 문의는 점주에게 전달되고 읽지 않은 문의만 센다', () => {
    const inquiries = [
      makeInquiry('unread'),
      makeInquiry('read', { read: true }),
      makeInquiry('ai', { status: 'ai_resolved' }),
    ]

    expect(getHomeStats([], inquiries, NOW).inquiries).toBe(1)
  })
})

describe('오늘의 요약', () => {
  test('미확인 건수를 문구에 그대로 쓴다', () => {
    expect(getTodaySummary(2).headline).toBe('미확인 이벤트 2건이 있습니다.')
  })

  test('미확인이 없으면 확인을 요청하지 않는다', () => {
    const summary = getTodaySummary(0)

    expect(summary.headline).toBe('미확인 이벤트가 없습니다.')
    expect(summary.detail).not.toContain('기록하세요')
  })
})

describe('최근 활동', () => {
  test('알림을 최신순으로 세 건까지 보여준다', () => {
    const alerts = [
      makeAlert('old', '2026-10-23T08:00:00+09:00'),
      makeAlert('newest', '2026-10-23T14:00:00+09:00'),
      makeAlert('middle', '2026-10-23T12:00:00+09:00'),
      makeAlert('second', '2026-10-23T13:00:00+09:00'),
    ]

    expect(getRecentActivities(alerts, NOW).map((item) => item.id)).toEqual(['newest', 'second', 'middle'])
  })

  test('확인 상태를 문구로 표시한다', () => {
    const alerts = [
      makeAlert('done', '2026-10-23T09:00:00+09:00', true),
      makeAlert('todo', '2026-10-23T10:00:00+09:00'),
    ]

    expect(getRecentActivities(alerts, NOW).map((item) => item.status)).toEqual(['확인 필요', '확인 완료'])
  })
})

describe('알림 목록', () => {
  test('오늘 알림과 지난 미확인 알림을 최신순으로 보여주고 지난 확인 알림은 뺀다', () => {
    const alerts = [
      makeAlert('past-done', '2026-10-22T09:00:00+09:00', true),
      makeAlert('past-todo', '2026-10-22T10:00:00+09:00'),
      makeAlert('today-done', '2026-10-23T09:00:00+09:00', true),
    ]

    expect(getVisibleAlerts(alerts, NOW).map((alert) => alert.id)).toEqual(['today-done', 'past-todo'])
  })
})

describe('오늘의 클립', () => {
  test('오늘 알림의 클립만 최신순으로 알림 정보와 묶어 보여준다', () => {
    const alerts = [
      makeAlert('morning', '2026-10-23T09:00:00+09:00'),
      makeAlert('noon', '2026-10-23T12:00:00+09:00'),
      makeAlert('yesterday', '2026-10-22T23:59:00+09:00'),
    ]
    const clips = [
      { id: 'c1', alertId: 'morning', duration: '00:10' },
      { id: 'c2', alertId: 'noon', duration: '00:20' },
      { id: 'c3', alertId: 'yesterday', duration: '00:30' },
    ]

    expect(getTodayClips(clips, alerts, NOW)).toEqual([
      {
        id: 'c2',
        kind: 'product',
        title: '알림 noon',
        time: '12:00',
        cameraId: 'cam-01',
        duration: '00:20',
      },
      {
        id: 'c1',
        kind: 'product',
        title: '알림 morning',
        time: '09:00',
        cameraId: 'cam-01',
        duration: '00:10',
      },
    ])
  })

  test('원본 알림이 없는 클립은 뺀다', () => {
    expect(getTodayClips([{ id: 'c1', alertId: 'gone', duration: '00:10' }], [], NOW)).toEqual([])
  })
})

describe('선택 카메라', () => {
  const cameras: Camera[] = [
    { id: 'one', name: '카메라 01', location: '입구' },
    { id: 'two', name: '카메라 02', location: '진열대' },
  ]

  test('카메라가 없으면 null을 돌려준다', () => {
    expect(getActiveCamera([], null)).toBeNull()
  })

  test('선택한 카메라와 순번을 돌려준다', () => {
    expect(getActiveCamera(cameras, 'two')).toEqual({ camera: cameras[1], index: 1 })
  })

  test('선택한 카메라가 삭제되면 첫 번째 카메라를 돌려준다', () => {
    expect(getActiveCamera(cameras, 'deleted')).toEqual({ camera: cameras[0], index: 0 })
  })
})

describe('문의 집계', () => {
  test('총 문의와 응대 현황은 오늘 기준이고 점주 확인 필요는 지난 문의도 포함한다', () => {
    const inquiries = [
      makeInquiry('today-forwarded'),
      makeInquiry('today-ai', { status: 'ai_resolved' }),
      makeInquiry('past-forwarded', { occurredAt: '2026-10-22T10:00:00+09:00' }),
    ]

    expect(getInquirySummary(inquiries, NOW)).toEqual({
      total: 2,
      needsOwner: 2,
      aiResolved: 1,
      forwarded: 1,
    })
  })

  test('문의 상태에 맞는 배지를 고른다', () => {
    expect(getInquiryBadge(makeInquiry('a')).label).toBe('점주 확인 필요')
    expect(getInquiryBadge(makeInquiry('b', { read: true })).label).toBe('점주 확인 완료')
    expect(getInquiryBadge(makeInquiry('c', { status: 'ai_resolved' })).label).toBe('AI 응대 완료')
  })
})

describe('리포트', () => {
  const alerts = [
    makeAlert('before', '2026-10-16T23:59:00+09:00', true),
    makeAlert('first', '2026-10-17T00:00:00+09:00', true),
    makeAlert('peak-1', '2026-10-20T09:00:00+09:00', true),
    makeAlert('peak-2', '2026-10-20T10:00:00+09:00'),
    makeAlert('last', '2026-10-23T23:59:00+09:00', true),
    makeAlert('after', '2026-10-24T00:00:00+09:00'),
  ]

  test('기간의 첫날과 마지막 날을 포함해 집계한다', () => {
    expect(getReportStats(alerts, WEEK)).toEqual({ detected: 4, resolved: 3, unconfirmed: 1 })
  })

  test('총 이벤트는 처리 완료와 미확인의 합이다', () => {
    const { detected, resolved, unconfirmed } = getReportStats(alerts, WEEK)

    expect(resolved + unconfirmed).toBe(detected)
  })

  test('추이의 합계는 총 이벤트와 같다', () => {
    const total = getDailyTrend(alerts, WEEK).reduce((sum, point) => sum + point.count, 0)

    expect(total).toBe(getReportStats(alerts, WEEK).detected)
  })

  test('이벤트가 없는 날도 0건으로 포함한다', () => {
    const trend = getDailyTrend(alerts, WEEK)

    expect(trend).toHaveLength(7)
    expect(trend[1]).toMatchObject({ date: '2026-10-18', label: '18일', count: 0, ratio: 0 })
  })

  test('가장 많은 날을 기준으로 막대 비율을 계산하고 강조한다', () => {
    const trend = getDailyTrend(alerts, WEEK)

    expect(trend[0]).toMatchObject({ count: 1, ratio: 0.5, isPeak: false })
    expect(trend[3]).toMatchObject({ count: 2, ratio: 1, isPeak: true })
  })

  test('기간 내 이벤트가 하나도 없으면 비율이 0이고 강조하지 않는다', () => {
    const trend = getDailyTrend([], WEEK)

    expect(trend.every((point) => point.ratio === 0 && !point.isPeak)).toBe(true)
  })

  test('요약 문구의 숫자는 집계 결과와 같다', () => {
    expect(getReportSummary({ detected: 12, unconfirmed: 1 }, '점검 권장')).toEqual([
      '이번 주 이상행동 감지 이벤트 12건',
      '미확인 이벤트 1건 확인 필요',
      '점검 권장',
    ])
  })

  test('미확인이 없으면 확인 요청 문구를 쓰지 않는다', () => {
    expect(getReportSummary({ detected: 12, unconfirmed: 0 }, '점검 권장')[1]).toBe('미확인 이벤트 없음')
  })
})
