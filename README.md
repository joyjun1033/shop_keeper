# shop_keeper
경기미래창업

무인매장 점주용 앱 #Keeper의 프론트엔드입니다. 홈, CCTV, 알림, 문의, 리포트 다섯 화면으로 구성됩니다.

## 실행

```bash
npm install
npm run dev
```

## 테스트

```bash
npm test
npm run test:coverage
```

## 구조

- `src/pages/`: 다섯 화면
- `src/components/`: 하단 탭과 공통 요소
- `src/domain/`: 집계와 상태 규칙. 화면의 숫자는 모두 여기서 계산합니다.
- `src/data/mock.ts`: 모든 화면의 예시 데이터. 백엔드를 붙일 때 API 응답으로 교체합니다.
- `src/styles.css`: 색상과 전체 스타일
