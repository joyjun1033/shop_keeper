"""관리용 앱 대신 시험 이벤트를 서버로 보낸다. 실제 매장 데이터가 아니므로 개발 중에만 쓴다.

서버가 실행 중일 때 실행한다. 관리용 앱과 똑같은 경로로 보내므로 연동 흐름을 시험할 수 있다.
"""

import json
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

CREDENTIALS_PATH = Path(__file__).resolve().parent / "dev-credentials.local.json"
SERVER_URL = "http://127.0.0.1:8000"
KST = timezone(timedelta(hours=9))


def iso(value: datetime) -> str:
    return value.isoformat(timespec="seconds")


def build_events(now: datetime) -> list[dict]:
    cameras = [
        ("cam-01", "카메라 01", "매장 입구"),
        ("cam-02", "카메라 02", "상품 진열대"),
        ("cam-03", "카메라 03", "냉동고 구역"),
    ]
    events: list[dict] = [
        {
            "eventId": f"sample-{camera_id}",
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
            "eventId": "sample-door",
            "type": "alert.door_open",
            "occurredAt": iso(now - timedelta(minutes=3)),
            "cameraId": "cam-03",
            "openedAt": iso(now - timedelta(minutes=13)),
            "limitMinutes": 35,
        },
        {
            "eventId": "sample-movement",
            "type": "alert.movement",
            "occurredAt": iso(now - timedelta(minutes=2)),
            "cameraId": "cam-02",
            "from": "입구 진열대",
            "to": "냉동고 구역",
            "unpaid": True,
        },
        {
            "eventId": "sample-damage",
            "type": "alert.product_damage",
            "occurredAt": iso(now - timedelta(minutes=1)),
            "cameraId": "cam-02",
            "product": None,
        },
        {
            "eventId": "sample-clip",
            "type": "clip.ready",
            "occurredAt": iso(now),
            "alertEventId": "sample-movement",
            "duration": "00:14",
        },
        {
            "eventId": "sample-inquiry",
            "type": "inquiry.created",
            "occurredAt": iso(now),
            "title": "시험 문의입니다",
            "note": "시험 이벤트로 만든 문의",
            "transcript": ["고객: 시험 문의입니다."],
            "status": "forwarded",
        },
    ]
    return events


def main() -> None:
    device_key = json.loads(CREDENTIALS_PATH.read_text(encoding="utf-8"))["deviceKey"]
    for event in build_events(datetime.now(KST)):
        request = urllib.request.Request(
            f"{SERVER_URL}/ingest/events",
            data=json.dumps(event).encode(),
            headers={"Content-Type": "application/json", "X-Device-Key": device_key},
            method="POST",
        )
        with urllib.request.urlopen(request) as response:
            print(event["type"], json.loads(response.read())["status"])


if __name__ == "__main__":
    main()
