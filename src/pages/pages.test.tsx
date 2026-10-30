import { render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import AlertsPage from './AlertsPage'
import HomePage from './HomePage'
import InquiriesPage from './InquiriesPage'
import ReportPage from './ReportPage'

function statValue(label: string) {
  return within(screen.getByText(label).parentElement!).getByRole('strong')
}

describe('홈', () => {
  test('예시 데이터로 계산한 숫자를 보여준다', () => {
    render(<HomePage />)

    expect(statValue('오늘 감지')).toHaveTextContent('03건')
    expect(statValue('미확인 알림')).toHaveTextContent('01건')
    expect(statValue('고객 문의')).toHaveTextContent('01건')
    expect(screen.getByText('미확인 이벤트 1건이 있습니다.')).toBeInTheDocument()
  })

  test('최근 활동에 알림만 나온다', () => {
    render(<HomePage />)

    const items = within(screen.getByRole('list')).getAllByRole('listitem')

    expect(items.map((item) => item.querySelector('strong')?.textContent)).toEqual([
      '상품 이동 감지',
      '냉장고 문 장시간 개방',
      '상품 훼손 의심',
    ])
  })
})

test('알림 화면은 오늘 알림 세 건을 최신순으로 보여준다', () => {
  render(<AlertsPage onOpenCamera={() => {}} />)

  expect(screen.getAllByRole('heading', { level: 2 }).map((title) => title.textContent)).toEqual([
    '상품 이동 감지',
    '냉장고 문 장시간 개방',
    '상품 훼손 의심',
  ])
})

test('문의 화면은 오늘 총 문의와 점주 확인 필요 건수를 보여준다', () => {
  render(<InquiriesPage />)

  expect(screen.getByText('총 2건 · 점주 확인 필요 1건')).toBeInTheDocument()
  expect(screen.getByText('AI 응대 완료 1건 · 점주 전달 1건')).toBeInTheDocument()
})

test('리포트의 통계, 추이, 요약이 같은 숫자를 보여준다', () => {
  render(<ReportPage />)

  expect(statValue('감지 이벤트')).toHaveTextContent('12건')
  expect(statValue('처리 완료')).toHaveTextContent('11건')
  expect(statValue('미확인')).toHaveTextContent('01건')

  const bars = screen.getByRole('list', { name: '일별 이벤트 수' })
  const counts = within(bars)
    .getAllByText(/^\d+건$/)
    .map((label) => parseInt(label.textContent!, 10))

  expect(counts.reduce((sum, count) => sum + count, 0)).toBe(12)
  expect(screen.getByText('이번 주 이상행동 감지 이벤트 12건')).toBeInTheDocument()
  expect(screen.getByText('미확인 이벤트 1건 확인 필요')).toBeInTheDocument()
})
