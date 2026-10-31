# shop_keeper
경기미래창업

무인매장 점주용 앱 #Keeper입니다. 점주 앱(React)과 서버(FastAPI)로 구성되고, 무인 매장의 관리용 앱이 서버로 이벤트를 보냅니다.

## 실행

먼저 프로젝트 폴더에서 패키지를 설치합니다.

```bash
npm install
```

### 화면만 보기

서버 없이 연동 전 빈 화면을 봅니다. 지어낸 데이터는 표시하지 않습니다.

```bash
npm run dev:preview
```

### 서버와 함께 실행

Python 3.12 이상이 필요합니다. 처음 한 번 `server` 폴더에서 설치와 개발용 매장 생성을 합니다.

```bash
python -m venv .venv
```

```bash
.venv/Scripts/python -m pip install -r requirements-dev.txt
```

```bash
.venv/Scripts/python seed.py
```

`seed.py`는 매장과 계정만 만들고 이벤트는 만들지 않습니다. 계정과 관리용 앱 키는 `server/dev-credentials.local.json`에 저장되며, 이 파일은 저장소에 올라가지 않습니다.

그다음 터미널 두 개를 열어 `server` 폴더에서 서버를, 프로젝트 폴더에서 앱을 실행합니다.

```bash
.venv/Scripts/python -m uvicorn asgi:app --port 8000
```

```bash
npm run dev
```

### 시뮬레이터

관리용 앱이 아직 없을 때는 `server` 폴더에서 시뮬레이터로 연동 흐름을 시험합니다. 실제 관리용 앱과 같은 경로로 이상행동, 문의, 카메라 끊김과 복구, 재전송을 약 1분에 걸쳐 보냅니다. 실제 매장 데이터가 아니므로 개발 중에만 씁니다.

```bash
.venv/Scripts/python simulator.py
```

`--speed 5`로 빠르게 실행하고, `--stay`로 끝난 뒤에도 연결을 유지할 수 있습니다. 시험 데이터를 지우고 연동 전 상태로 돌아가려면 아래 명령을 실행합니다. 매장과 계정은 남습니다.

```bash
.venv/Scripts/python clear_dev_data.py
```

## 테스트

```bash
npm test
```

```bash
npm run test:coverage
```

`server` 폴더에서 서버 테스트를 실행합니다.

```bash
.venv/Scripts/python -m pytest
```

## 구조

- `contract/`: 서버와 앱이 함께 지키는 데이터 형식. 양쪽 테스트가 모두 이 파일로 검증합니다.
- `server/keeper/`: 서버. 데이터는 매장별로 분리됩니다.
- `src/pages/`: 화면
- `src/components/`: 하단 탭과 공통 요소
- `src/domain/`: 집계와 상태 규칙. 화면의 숫자는 모두 여기서 계산합니다.
- `src/api/`: 서버 연결(`httpApi.ts`)과 서버 없는 빈 화면(`previewApi.ts`)
- `src/test/fixtures.ts`: 테스트 전용 예시 데이터. 앱 코드에서는 쓸 수 없습니다.
- `src/styles.css`: 색상과 전체 스타일

## 관리용 앱 연동

관리용 앱은 `POST /ingest/events`로 이벤트를 보내고, `X-Device-Key` 헤더에 매장별 키를 넣습니다. 형식은 `contract/keeper.schema.json`, 종류별 예시는 `contract/examples/events.json`에 있습니다.

- 이벤트가 없어도 1분마다 `POST /ingest/heartbeat`를 보냅니다. 5분 동안 신호가 없으면 점주 앱에 연결이 끊겼다고 표시됩니다. 한 번도 연결된 적 없는 매장은 연동 대기로 표시됩니다.
- 이벤트마다 고유한 `eventId`를 넣습니다. 같은 `eventId`를 다시 보내면 한 번만 반영되므로, 응답을 받지 못했을 때 안심하고 재전송할 수 있습니다.
- 카메라는 `camera.status` 이벤트를 처음 보낼 때 등록되고, 이후에는 상태가 갱신됩니다.
- `door.closed`와 `clip.ready`가 원본 알림보다 먼저 도착하면 404를 받습니다. 원본 알림을 보낸 뒤 다시 보내면 됩니다.

서버가 실행 중이면 `http://127.0.0.1:8000/docs`에서 API 전체를 볼 수 있습니다.
