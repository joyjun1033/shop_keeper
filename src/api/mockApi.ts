import { alerts as initialAlerts, cameras, clips, inquiries as initialInquiries, store } from '../data/mock'
import { confirmAlert, markInquiryRead } from '../domain/rules'
import type { KeeperApi } from './types'

// 서버 없이 화면을 볼 때 쓰는 구현. 변경 내용은 새로고침하면 사라진다
export function createMockApi(): KeeperApi {
  let alerts = initialAlerts
  let inquiries = initialInquiries

  return {
    getDashboard: async () => ({ store, cameras, alerts, clips, inquiries }),
    getAlerts: async () => alerts,
    confirmAlert: async (id) => {
      alerts = confirmAlert(alerts, id)
    },
    markInquiryRead: async (id) => {
      inquiries = markInquiryRead(inquiries, id)
    },
  }
}
