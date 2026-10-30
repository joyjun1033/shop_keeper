export type Tone = 'red' | 'orange' | 'green' | 'blue'

export type AlertItem = {
  id: string
  label: string
  tone: Tone
  title: string
  occurredAt: string
  cameraId: string
  confirmed: boolean
} & (
  | { kind: 'movement'; from: string; to: string }
  | { kind: 'duration'; progress: number; elapsed: string }
  | { kind: 'product'; product: string }
)

export type Camera = {
  id: string
  name: string
  location: string
}

export type Clip = {
  id: string
  alertId: string
  duration: string
}

export type ClipView = {
  id: string
  kind: AlertItem['kind']
  title: string
  time: string
  cameraId: string
  duration: string
}

export type Inquiry = {
  id: string
  title: string
  note: string
  occurredAt: string
  status: 'forwarded' | 'ai_resolved'
  read: boolean
}

// 날짜는 한국 시간 기준 YYYY-MM-DD 문자열
export type Period = {
  start: string
  end: string
}
