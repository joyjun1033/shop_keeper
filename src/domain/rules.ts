import { formatEventTime, kstDay, listDays } from './time'
import type { AlertItem, Camera, Clip, ClipView, Inquiry, Period, Tone } from './types'

function newestFirst<T extends { occurredAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
}

function isToday(value: string, now: Date): boolean {
  return kstDay(value) === kstDay(now)
}

function needsOwner(inquiry: Inquiry): boolean {
  return inquiry.status === 'forwarded' && !inquiry.read
}

function inPeriod(alert: AlertItem, { start, end }: Period): boolean {
  const day = kstDay(alert.occurredAt)
  return start <= day && day <= end
}

export function getHomeStats(alerts: AlertItem[], inquiries: Inquiry[], now: Date) {
  return {
    detected: alerts.filter((alert) => isToday(alert.occurredAt, now)).length,
    unconfirmedAlerts: alerts.filter((alert) => !alert.confirmed).length,
    inquiries: inquiries.filter(needsOwner).length,
  }
}

export function getTodaySummary(unconfirmedAlerts: number) {
  if (unconfirmedAlerts === 0) {
    return {
      headline: '미확인 이벤트가 없습니다.',
      detail: '감지된 이벤트를 모두 확인했어요.',
    }
  }
  return {
    headline: `미확인 이벤트 ${unconfirmedAlerts}건이 있습니다.`,
    detail: '영상 클립을 확인하고 처리 상태를 기록하세요.',
  }
}

export function getRecentActivities(alerts: AlertItem[], now: Date, limit = 3) {
  return newestFirst(alerts)
    .slice(0, limit)
    .map((alert) => ({
      id: alert.id,
      title: alert.title,
      status: alert.confirmed ? '확인 완료' : '확인 필요',
      time: formatEventTime(alert.occurredAt, now),
      tone: alert.tone,
    }))
}

// 지난 알림은 확인 전까지 목록에 남는다
export function getVisibleAlerts(alerts: AlertItem[], now: Date): AlertItem[] {
  return newestFirst(alerts.filter((alert) => !alert.confirmed || isToday(alert.occurredAt, now)))
}

export function getTodayClips(clips: Clip[], alerts: AlertItem[], now: Date): ClipView[] {
  const views: (ClipView & { occurredAt: string })[] = []
  for (const clip of clips) {
    const alert = alerts.find((item) => item.id === clip.alertId)
    if (!alert || !isToday(alert.occurredAt, now)) continue
    views.push({
      id: clip.id,
      kind: alert.kind,
      title: alert.title,
      time: formatEventTime(alert.occurredAt, now),
      cameraId: alert.cameraId,
      duration: clip.duration,
      occurredAt: alert.occurredAt,
    })
  }
  return newestFirst(views).map(({ occurredAt: _occurredAt, ...view }) => view)
}

// 선택했던 카메라가 사라지면 첫 번째 카메라를 보여준다
export function getActiveCamera(cameras: Camera[], cameraId: string | null) {
  if (cameras.length === 0) return null
  const index = Math.max(
    cameras.findIndex((camera) => camera.id === cameraId),
    0,
  )
  return { camera: cameras[index], index }
}

export function getInquirySummary(inquiries: Inquiry[], now: Date) {
  const today = inquiries.filter((inquiry) => isToday(inquiry.occurredAt, now))
  return {
    total: today.length,
    needsOwner: inquiries.filter(needsOwner).length,
    aiResolved: today.filter((inquiry) => inquiry.status === 'ai_resolved').length,
    forwarded: today.filter((inquiry) => inquiry.status === 'forwarded').length,
  }
}

export function getInquiryBadge(inquiry: Inquiry): { label: string; tone: Tone } {
  if (inquiry.status === 'ai_resolved') return { label: 'AI 응대 완료', tone: 'green' }
  if (inquiry.read) return { label: '점주 확인 완료', tone: 'blue' }
  return { label: '점주 확인 필요', tone: 'orange' }
}

export function getReportStats(alerts: AlertItem[], period: Period) {
  const events = alerts.filter((alert) => inPeriod(alert, period))
  const resolved = events.filter((alert) => alert.confirmed).length
  return {
    detected: events.length,
    resolved,
    unconfirmed: events.length - resolved,
  }
}

export function getDailyTrend(alerts: AlertItem[], period: Period) {
  const days = listDays(period)
  const counts = days.map((day) => alerts.filter((alert) => kstDay(alert.occurredAt) === day).length)
  const max = Math.max(0, ...counts)
  return days.map((day, index) => ({
    date: day,
    label: `${Number(day.slice(8))}일`,
    count: counts[index],
    ratio: max === 0 ? 0 : counts[index] / max,
    isPeak: max > 0 && counts[index] === max,
  }))
}

export function getReportSummary(
  stats: { detected: number; unconfirmed: number },
  recommendation: string,
): string[] {
  return [
    `이번 주 이상행동 감지 이벤트 ${stats.detected}건`,
    stats.unconfirmed > 0 ? `미확인 이벤트 ${stats.unconfirmed}건 확인 필요` : '미확인 이벤트 없음',
    recommendation,
  ]
}
