import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import type { Camera, ClipView } from '../domain/types'
import CctvPage from './CctvPage'

const cameras: Camera[] = [
  { id: 'one', name: '카메라 01', location: '매장 입구' },
  { id: 'two', name: '카메라 02', location: '상품 진열대' },
]

const clip: ClipView = {
  id: 'c1',
  kind: 'movement',
  title: '상품 이동 감지',
  time: '14:08',
  cameraId: 'two',
  duration: '00:14',
}

function renderPage(props: Partial<Parameters<typeof CctvPage>[0]> = {}) {
  const onSelectCamera = vi.fn()
  render(<CctvPage cameras={cameras} clips={[clip]} cameraId="one" onSelectCamera={onSelectCamera} {...props} />)
  return onSelectCamera
}

test('선택한 카메라의 정보와 순번을 보여준다', () => {
  renderPage({ cameraId: 'two' })

  expect(screen.getByText('카메라 02 · 상품 진열대')).toBeInTheDocument()
  expect(screen.getByText('카메라 02 / 02')).toBeInTheDocument()
})

test('카메라가 없으면 안내를 보여주고 클립은 그대로 보여준다', () => {
  renderPage({ cameras: [], cameraId: null })

  expect(screen.getByText('등록된 카메라가 없습니다')).toBeInTheDocument()
  expect(screen.queryByText('연결된 카메라')).not.toBeInTheDocument()
  expect(screen.getByText('상품 이동 감지')).toBeInTheDocument()
})

test('선택한 카메라가 삭제되면 첫 번째 카메라를 보여준다', () => {
  renderPage({ cameraId: 'deleted' })

  expect(screen.getByText('카메라 01 · 매장 입구')).toBeInTheDocument()
})

test('클립의 카메라가 삭제되어도 화면이 유지된다', () => {
  renderPage({ cameras: [cameras[0]] })

  expect(screen.getByText('오늘 14:08 · 삭제된 카메라')).toBeInTheDocument()
})

test('카메라 행을 누르면 해당 카메라를 선택한다', async () => {
  const onSelectCamera = renderPage()

  await userEvent.click(screen.getByRole('button', { name: /카메라 02/, pressed: false }))

  expect(onSelectCamera).toHaveBeenCalledWith('two')
})
