import { ArrowRight, ChevronRight, DoorClosed, Maximize, Package, PackageX, Play, Video, Volume2 } from 'lucide-react'
import { PageHeader } from '../components/common'
import { getActiveCamera } from '../domain/rules'
import type { Camera, ClipView } from '../domain/types'

const clipIcons: Record<ClipView['kind'], typeof Package> = {
  movement: Package,
  duration: DoorClosed,
  product: PackageX,
}

type Props = {
  cameras: Camera[]
  clips: ClipView[]
  cameraId: string | null
  onSelectCamera: (id: string) => void
}

export default function CctvPage({ cameras, clips, cameraId, onSelectCamera }: Props) {
  const active = getActiveCamera(cameras, cameraId)

  return (
    <>
      <PageHeader title="실시간 CCTV" subtitle="기본 CCTV 연결 상태 및 현장 확인" />
      <div className="page-body">
        {active ? (
          <>
            <section className="player" aria-label={`${active.camera.name} 실시간 영상`}>
              <div className="player__top">
                <span className="player__pill">
                  {active.camera.name} · {active.camera.location}
                </span>
                <span className="player__pill player__pill--live">
                  <span className="dot dot--green" aria-hidden />
                  실시간
                </span>
              </div>
              <div className="player__stage">
                <Video size={34} fill="currentColor" strokeWidth={1.5} aria-hidden />
                <span>CCTV 화면</span>
              </div>
              <div className="player__bar">
                <span className="player__live">
                  <span className="player__rec" aria-hidden />
                  라이브
                </span>
                <span>
                  카메라 {String(active.index + 1).padStart(2, '0')} / {String(cameras.length).padStart(2, '0')}
                </span>
                <span className="player__controls">
                  <button type="button" aria-label="소리">
                    <Volume2 size={16} fill="currentColor" />
                  </button>
                  <button type="button" aria-label="전체 화면">
                    <Maximize size={15} />
                  </button>
                </span>
              </div>
            </section>

            <section className="card">
              <h2>연결된 카메라</h2>
              <ul className="camera-list">
                {cameras.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={item.id === active.camera.id ? 'is-selected' : undefined}
                      aria-pressed={item.id === active.camera.id}
                      onClick={() => onSelectCamera(item.id)}
                    >
                      <Video size={16} fill="currentColor" strokeWidth={1.5} aria-hidden />
                      <strong>{item.name}</strong>
                      <span className="camera-list__location">{item.location}</span>
                      <span className="badge badge--green">
                        <span className="dot dot--green" aria-hidden />
                        연결됨
                      </span>
                      <ChevronRight size={15} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <section className="card empty-card">
            <Video size={30} fill="currentColor" strokeWidth={1.5} aria-hidden />
            <h2>등록된 카메라가 없습니다</h2>
            <p className="caption">카메라를 등록하면 실시간 화면을 볼 수 있어요.</p>
          </section>
        )}

        <section className="card">
          <div className="card__head">
            <h2>주요 감지 클립 돌아보기</h2>
            <button type="button" className="link-button link-button--small">
              전체 보기
              <ArrowRight size={12} strokeWidth={2.2} aria-hidden />
            </button>
          </div>
          <p className="caption">AI가 감지한 주요 상황을 영상으로 바로 확인하세요.</p>
          <ul className="clip-grid">
            {clips.map((clip) => {
              const Icon = clipIcons[clip.kind]
              const clipCamera = cameras.find((item) => item.id === clip.cameraId)
              return (
                <li key={clip.id}>
                  <button type="button" onClick={() => onSelectCamera(clip.cameraId)}>
                    <span className={`clip-thumb clip-thumb--${clip.kind}`}>
                      <Icon size={36} strokeWidth={1.4} fill="currentColor" fillOpacity={0.35} aria-hidden />
                      <span className="clip-thumb__duration">
                        <Play size={8} fill="currentColor" aria-hidden />
                        {clip.duration}
                      </span>
                    </span>
                    <strong>{clip.title}</strong>
                    <span className="caption">
                      오늘 {clip.time} · {clipCamera?.name ?? '삭제된 카메라'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </>
  )
}
