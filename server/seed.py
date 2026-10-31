"""개발용 매장과 예시 이벤트를 만든다. 계정 정보는 dev-credentials.local.json에 저장된다.

실제 운영 데이터가 있는 DB에는 실행하지 않는다.
"""

import json
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

from pydantic import TypeAdapter

from keeper import repository
from keeper.db import connect, init_db
from keeper.main import DEFAULT_DB_PATH
from keeper.schemas import IngestEvent

CREDENTIALS_PATH = Path(__file__).resolve().parent / "dev-credentials.local.json"
KST = timezone(timedelta(hours=9))
EMAIL = "owner@keeper.test"


def iso(value: datetime) -> str:
    return value.isoformat(timespec="seconds")


def build_events(now: datetime) -> list[dict]:
    def today(hour: int, minute: int) -> datetime:
        # 이른 시간에 실행해도 미래 이벤트가 생기지 않게 지금 시각을 넘지 않도록 한다
        return min(now.replace(hour=hour, minute=minute, second=0, microsecond=0), now)

    cameras = [
        ("cam-01", "카메라 01", "매장 입구"),
        ("cam-02", "카메라 02", "상품 진열대"),
        ("cam-03", "카메라 03", "냉동고 구역"),
    ]
    events: list[dict] = [
        {
            "eventId": f"seed-{camera_id}",
            "type": "camera.status",
            "occurredAt": iso(now),
            "cameraId": camera_id,
            "name": name,
            "location": location,
            "status": "connected",
        }
        for camera_id, name, location in cameras
    ]

    events += [
        {
            "eventId": "seed-door",
            "type": "alert.door_open",
            "occurredAt": iso(now - timedelta(minutes=18)),
            "cameraId": "cam-03",
            "openedAt": iso(now - timedelta(minutes=28)),
            "limitMinutes": 35,
        },
        {
            "eventId": "seed-movement",
            "type": "alert.movement",
            "occurredAt": iso(today(14, 8)),
            "cameraId": "cam-02",
            "from": "입구 진열대",
            "to": "냉동고 구역",
            "unpaid": True,
        },
        {
            "eventId": "seed-damage",
            "type": "alert.product_damage",
            "occurredAt": iso(today(10, 32)),
            "cameraId": "cam-02",
            "product": "초코 아이스크림 (500ml)",
        },
    ]
    events += [
        {"eventId": f"seed-clip-{index}", "type": "clip.ready", "occurredAt": iso(now), "alertEventId": alert_id, "duration": duration}
        for index, (alert_id, duration) in enumerate(
            [("seed-door", "00:22"), ("seed-movement", "00:14"), ("seed-damage", "00:18")]
        )
    ]
    events += [
        {
            "eventId": "seed-inquiry-forwarded",
            "type": "inquiry.created",
            "occurredAt": iso(today(14, 8)),
            "title": "결제 후 상품이 나오지 않아요",
            "note": "AI 상담에서 해결되지 않아 점주에게 전달됨",
            "transcript": ["고객: 결제했는데 상품이 나오지 않아요.", "AI: 해결하지 못해 점주님께 전달했습니다."],
            "status": "forwarded",
        },
        {
            "eventId": "seed-inquiry-ai",
            "type": "inquiry.created",
            "occurredAt": iso(today(10, 32)),
            "title": "딸기 아이스크림은 어디 있나요?",
            "note": "AI가 상품 위치 확인 방법을 안내함",
            "transcript": ["고객: 딸기 아이스크림은 어디 있나요?", "AI: 키오스크의 상품 찾기에서 확인할 수 있어요."],
            "status": "ai_resolved",
        },
    ]

    # 지난 며칠의 이벤트. 리포트가 비어 보이지 않게 넣는다
    past = [(1, 20, "door"), (2, 23, "movement"), (3, 13, "door"), (3, 19, "door"), (3, 1, "movement"), (4, 9, "damage"), (5, 22, "door"), (6, 13, "movement")]
    for index, (days_ago, hour, kind) in enumerate(past):
        occurred = (now - timedelta(days=days_ago)).replace(hour=hour, minute=10, second=0, microsecond=0)
        base = {"eventId": f"seed-past-{index}", "occurredAt": iso(occurred), "cameraId": "cam-03"}
        if kind == "door":
            events.append({**base, "type": "alert.door_open", "openedAt": iso(occurred), "limitMinutes": 35})
            events.append(
                {
                    "eventId": f"seed-past-{index}-closed",
                    "type": "door.closed",
                    "occurredAt": iso(occurred + timedelta(minutes=5)),
                    "alertEventId": f"seed-past-{index}",
                }
            )
        elif kind == "movement":
            events.append({**base, "type": "alert.movement", "from": "입구 진열대", "to": "매장 입구", "unpaid": True})
        else:
            events.append({**base, "type": "alert.product_damage", "product": "딸기 아이스크림"})
    return events


def main() -> None:
    init_db(DEFAULT_DB_PATH)
    conn = connect(DEFAULT_DB_PATH)
    try:
        if conn.execute("SELECT 1 FROM owners WHERE email = ?", (EMAIL,)).fetchone():
            print(f"{EMAIL} 계정이 이미 있습니다. 다시 만들려면 keeper.db를 지우고 실행하세요.")
            return
        password = secrets.token_urlsafe(16)
        store_id, device_key = repository.create_store(conn, "우리동네 아이스크림점", EMAIL, password)
        now = datetime.now(KST)
        adapter = TypeAdapter(IngestEvent)
        for raw in build_events(now):
            repository.ingest_event(conn, store_id, adapter.validate_python(raw))
        # 지금 진행 중인 냉장고 문 알림 하나만 미확인으로 남긴다
        conn.execute(
            "UPDATE alerts SET confirmed = 1 WHERE store_id = ? AND id != 'seed-door'",
            (store_id,),
        )
        CREDENTIALS_PATH.write_text(
            json.dumps({"email": EMAIL, "password": password, "deviceKey": device_key}, indent=2),
            encoding="utf-8",
        )
        print(f"개발용 매장을 만들었습니다. 계정 정보: {CREDENTIALS_PATH.name}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
