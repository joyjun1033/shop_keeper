import type { AlertItem, Camera, Clip, Inquiry, Period, Store } from '../domain/types'

export type Dashboard = {
  store: Store
  cameras: Camera[]
  alerts: AlertItem[]
  clips: Clip[]
  inquiries: Inquiry[]
}

export interface KeeperApi {
  getDashboard(since: string): Promise<Dashboard>
  getAlerts(period: Period): Promise<AlertItem[]>
  confirmAlert(id: string): Promise<void>
  markInquiryRead(id: string): Promise<void>
}
