import { Badge, LinkButton, PageHeader } from '../components/common'
import { demoNow, inquiries } from '../data/mock'
import { getInquiryBadge, getInquirySummary } from '../domain/rules'
import { formatEventTime } from '../domain/time'

export default function InquiriesPage() {
  const summary = getInquirySummary(inquiries, demoNow)

  return (
    <>
      <PageHeader title="고객 문의 관리" subtitle="AI 상담과 점주 전달 요청을 확인하세요" />
      <div className="page-body">
        <section className="card split-card">
          <div>
            <h2>오늘 고객 문의</h2>
            <p className="caption">
              총 {summary.total}건 · 점주 확인 필요 {summary.needsOwner}건
            </p>
          </div>
          <button type="button" className="pill-button">
            문의 목록
          </button>
        </section>

        {inquiries.map((inquiry) => {
          const badge = getInquiryBadge(inquiry)
          return (
            <article className="card notice" key={inquiry.id}>
              <div className="notice__head">
                <Badge tone={badge.tone}>{badge.label}</Badge>
                <time className="caption">{formatEventTime(inquiry.occurredAt, demoNow)}</time>
              </div>
              <h2 className="notice__title">{inquiry.title}</h2>
              <p className="note-box">{inquiry.note}</p>
              <LinkButton>상담 내용 확인</LinkButton>
            </article>
          )
        })}

        <section className="card">
          <h2>고객 응대 현황</h2>
          <p className="caption">
            AI 응대 완료 {summary.aiResolved}건 · 점주 전달 {summary.forwarded}건
          </p>
        </section>
      </div>
    </>
  )
}
