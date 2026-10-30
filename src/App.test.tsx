import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import App from './App'

vi.mock('./data/mock', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./data/mock')>()),
  cameras: [],
}))

test('카메라가 한 대도 없어도 앱이 열리고 CCTV 탭에서 안내가 보인다', async () => {
  render(<App />)

  await userEvent.click(screen.getByRole('button', { name: 'CCTV' }))

  expect(screen.getByText('등록된 카메라가 없습니다')).toBeInTheDocument()
})
