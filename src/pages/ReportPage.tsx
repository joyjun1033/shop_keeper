import type { CSSProperties } from 'react'
import { PageHeader, StatRow } from '../components/common'
import { alerts, weeklyPeriod, weeklyReport } from '../data/mock'
import { getDailyTrend, getReportStats, getReportSummary } from '../domain/rules'
import { formatPeriod } from '../domain/time'

export default function ReportPage() {
  const stats = getReportStats(alerts, weeklyPeriod)
  const trend = getDailyTrend(alerts, weeklyPeriod)
  const summary = getReportSummary(stats, weeklyReport.recommendation)

  return (
    <>
      <PageHeader title="AI 매장 점검 리포트" subtitle="일주일의 주요 상황을 정리했어요" />
      <div className="page-body">
        <section className="card split-card">
          <strong className="period">{formatPeriod(weeklyPeriod)}</strong>
          <span className="pill-button">{weeklyReport.range}</span>
        </section>

        <StatRow
          items={[
            { label: '감지 이벤트', value: stats.detected, tone: 'blue' },
            { label: '처리 완료', value: stats.resolved, tone: 'blue' },
            { label: '미확인', value: stats.unconfirmed, tone: 'red' },
          ]}
        />

        <section className="card">
          <h2>알림 이벤트 발생 추이</h2>
          <ol className="bar-chart" aria-label="일별 이벤트 수">
            {trend.map((point) => (
              <li key={point.date}>
                <span className="bar-chart__value">{point.count}건</span>
                <span
                  className={point.isPeak ? 'bar-chart__bar is-highlight' : 'bar-chart__bar'}
                  style={{ '--ratio': point.ratio } as CSSProperties}
                />
                <span className="bar-chart__day">{point.label}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card">
          <h2>AI 점검 요약</h2>
          <ul className="summary-list">
            {summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
