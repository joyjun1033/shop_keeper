import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, test } from 'vitest'
import examples from '../contract/examples/events.json'
import schema from '../contract/keeper.schema.json'
import { createMockApi } from './api/mockApi'
import { getPresetPeriod } from './domain/rules'
import { demoNow } from './data/mock'

const ajv = new Ajv2020({ strict: false, allErrors: true })
ajv.addSchema(schema)

function validator(definition: string) {
  return ajv.getSchema(`${schema.$id}#/$defs/${definition}`)!
}

describe('공유 데이터 계약', () => {
  test('화면이 쓰는 데이터 형식은 서버 응답 형식과 같다', async () => {
    const dashboard = await createMockApi().getDashboard('2026-10-23T00:00:00+09:00')
    const validate = validator('Dashboard')

    expect(validate(dashboard), JSON.stringify(validate.errors)).toBe(true)
  })

  test('리포트 데이터도 같은 알림 형식이다', async () => {
    const alerts = await createMockApi().getAlerts(getPresetPeriod(7, demoNow))
    const validate = validator('Alert')

    for (const alert of alerts) {
      expect(validate(alert), JSON.stringify(validate.errors)).toBe(true)
    }
  })

  test('형식이 틀린 알림은 계약을 통과하지 못한다', () => {
    const validate = validator('Alert')

    expect(validate({ id: 'a', kind: 'movement' })).toBe(false)
  })

  test('관리용 앱 예시 이벤트는 계약을 통과한다', () => {
    const validate = validator('IngestEvent')

    for (const event of examples) {
      expect(validate(event), JSON.stringify(validate.errors)).toBe(true)
    }
  })
})
