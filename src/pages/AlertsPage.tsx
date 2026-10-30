import { Badge, LinkButton, PageHeader } from '../components/common'
import { alerts, demoNow } from '../data/mock'
import { getVisibleAlerts } from '../domain/rules'
import { formatEventTime } from '../domain/time'
import type { AlertItem } from '../domain/types'

function AlertDetail({ alert }: { alert: AlertItem }) {
  switch (alert.kind) {
    case 'movement':
      return (
        <p className="alert-route">
          {alert.from} → {alert.to}
        </p>
      )
    case 'duration':
      return (
        <>
          <div
            className="progress"
            role="progressbar"
            aria-label={alert.title}
            aria-valuenow={alert.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${alert.progress}%` }} />
          </div>
          <p className="caption">{alert.elapsed}</p>
        </>
      )
    case 'product':
      return <p className="alert-product">감지 상품: {alert.product}</p>
  }
}

export default function AlertsPage({ onOpenCamera }: { onOpenCamera: (cameraId: string) => void }) {
  return (
    <>
      <PageHeader title="AI 이상행동 알림" subtitle="매장 내 이상행동을 AI가 실시간으로 알려드립니다" />
      <div className="page-body">
        {getVisibleAlerts(alerts, demoNow).map((alert) => (
          <article className="card notice" key={alert.id}>
            <div className="notice__head">
              <Badge tone={alert.tone}>{alert.label}</Badge>
              <time className="caption">{formatEventTime(alert.occurredAt, demoNow)}</time>
            </div>
            <h2 className="notice__title">{alert.title}</h2>
            <AlertDetail alert={alert} />
            <LinkButton onClick={() => onOpenCamera(alert.cameraId)}>영상 클립 확인</LinkButton>
          </article>
        ))}
      </div>
    </>
  )
}
