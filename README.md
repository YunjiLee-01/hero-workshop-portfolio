# 🚢 Hanwha Ocean HERO 2.0 Workshop - 통합 출석 체크 & 실시간 운영 관리 시스템

> **기업 대규모 워크숍 참여자 실시간 출석 체크, 좌석/반/조 확인, 현장 QR 배너 및 관리자 관제 대시보드 풀스택 웹 애플리케이션**

---

## 📌 포트폴리오 데모 프로젝트 안내 (Portfolio Disclaimer)

> ⚠️ **본 프로젝트는 기술 역량 증명 및 취업 포트폴리오 시연용으로 제작된 오픈소스 데모 버전입니다.**
>
> 1. **개인정보 및 회사 기밀 보호**: 실제 임직원의 개인정보(실명, 실제 사번, 연락처 등)나 기업 내부 기밀 데이터는 **일체 포함되어 있지 않으며**, 시스템에 내장된 모든 데이터는 **100% 가상의 샘플 데이터(Mock Data)**입니다.
> 2. **데모 관리자 계정**: 포트폴리오를 검토하시는 분들이 누구나 자유롭게 모든 관리자 기능을 체험해 보실 수 있도록 **공개용 데모 관리자 계정**이 기본 설정되어 있습니다.

---

## 🔑 데모 계정 및 테스트 안내

### 1. 관리자 대시보드 로그인
- **접속 URL**: 앱 실행 후 상단 우측의 관리자 버튼 클릭 또는 URL 파라미터 `?mode=admin`
- **아이디**: `demo-admin`
- **비밀번호**: `demo-admin`
*(로그인 화면에 '데모 계정 자동 입력' 버튼이 제공됩니다.)*

### 2. 참여자 출석 체크 테스트 시나리오
| 테스트 사번 | 성명 (가상) | 소속/조 | 테스트 목적 | 사용 출석코드 |
| :--- | :--- | :--- | :--- | :--- |
| `20260003` | 이한화 | 거제 2반 1조 | **미출석자 출석 성공 테스트** | `맥스` |
| `20260001` | 홍길동 | 거제 1반 1조 | **이미 출석 완료된 사용자 화면 테스트** | - |
| `20260006` | 정디지털 | 서울 단일반 1조 | **서울 워크숍 출석 테스트** | `가드` |
| `20260008` | 윤혁신 | 부산 단일반 1조 | **부산 워크숍 출석 테스트** | `테크` |
| `99999999` | (미등록) | - | **사전 명단에 없는 신규 참가자 현장 즉시 등록 테스트** | 각 지역 코드 |

---

## 🌟 핵심 기능 및 아키텍처

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HERO 2.0 WORKSHOP SYSTEM                        │
├──────────────────────┬──────────────────────────┬──────────────────────┤
│  1. 참여자 모바일 웹  │   2. 현장 대형 QR 배너   │   3. 관리자 대시보드  │
│  (Mobile Responsive) │   (Big Screen Display)   │   (Admin Portal)     │
├──────────────────────┼──────────────────────────┼──────────────────────┤
│ • 사번 본인 인증     │ • 빔프로젝터용 다크 테마 │ • 실시간 출석률 통계 │
│ • 보안 출석코드 검증 │ • 거제/서울/부산 탭 지원 │ • 다차원 필터 & 검색 │
│ • 실시간 좌석/조 확인│ • 실시간 코드/QR 자동생성│ • 수동 출석/취소 제어│
│ • 현장 즉시 등록 지원│ • 시계 및 자동 동기화    │ • CSV 업로드/내보내기│
└──────────────────────┴──────────────────────────┴──────────────────────┘
```

### 1. 참여자 모바일 웹 (`ParticipantView`)
- **2단계 본인 확인 & 보안 출석**: 사번 조회로 신원을 확인한 후 유효한 세션 토큰을 발급받아 운영진이 현장에 안내한 출석코드를 입력해야만 출석 인정
- **중복 출석 방지 및 시도 로그 기록**: 동일 사번의 재출석 시도 감지 및 시도 이력 로깅
- **현장 신규 참가자 즉시 등록 (`Self-Register`)**: 사전 명단에 누락된 참여자도 현장에서 이름, 지역, 반, 조를 입력하여 즉시 등록 및 출석 가능
- **인터랙티브 피드백**: 성공 시 폭죽 애니메이션(`canvas-confetti`) 및 조/좌석/반 정보 즉시 카드 팝업

### 2. 현장 대형 디스플레이 QR 배너 모드 (`QRBannerView`)
- **행사장 스크린 전용 뷰**: 빔프로젝터 및 대형 모니터에 최적화된 반응형 다크 테마 배너
- **동적 QR 코드 생성**: 해당 지역 워크숍 모바일 출석 링크가 담긴 QR 코드 자동 렌더링
- **지역별 출석코드 표출**: 거제, 서울, 부산 탭별 현재 활성화된 당일 출석코드 실시간 노출

### 3. 관리자 통합 관제 대시보드 (`AdminView`)
- **실시간 요약 통계**: 총 인원, 출석 완료, 미출석 인원 및 출석률(%) 실시간 계산 및 시각화
- **다차원 필터링 & 검색**: 일자, 장소(거제/서울/부산), 차수(1차~38차), 반, 조, 출석상태별 즉시 필터링
- **개별 관리 기능**: 수동 출석 처리, 출석 기록 취소(되돌리기), 참가자 정보 수정 및 개별/전체 삭제
- **출석 시도 이력 추적 (`Attempt Logs`)**: 참여자가 언제 어떤 방식으로 출석을 시도했는지 타임스탬프와 로그 모달 제공
- **출석코드 관리 (`Attendance Codes`)**: 일자별/장소별 출석코드 신규 생성, 활성화/비활성화, 시간제한(Time-limit) 설정
- **대량 명단 CSV 업로드 & 엑셀 내보내기**:
  - 기존 명단 초기화 후 등록 또는 기존 명단 유지 병합(추가/덮어쓰기) 모드 지원
  - 컬럼 자동 매핑 (사번, 이름, 차수, 일자, 장소, 반, 조)
  - 필터링된 현재 목록을 엑셀 호환 CSV로 즉시 다운로드

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
- **Framework & Language**: React 18, TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **Animation**: Motion (`motion/react`), Canvas Confetti
- **Icons**: Lucide React
- **Build Tool**: Vite

### Backend & Storage
- **Runtime & Server**: Node.js, Express, TypeScript (`tsx` / `esbuild`)
- **Data Persistence**: In-Memory DB + Local File Storage Engine (`workshop_data.json`)
- **API Architecture**: RESTful API (`/api/attendance/*`, `/api/admin/*`)

---

## 🚀 로컬 실행 방법 (Getting Started)

### 1. 요구 사항
- Node.js (v18 이상 권장)
- npm 또는 yarn / pnpm

### 2. 패키지 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

---

## 📂 프로젝트 구조 (Directory Structure)

```text
├── src/
│   ├── components/
│   │   ├── AdminView.tsx            # 관리자 대시보드 메인 컴포넌트
│   │   ├── ParticipantView.tsx      # 참여자 출석 체크 메인 컴포넌트
│   │   ├── QRBannerView.tsx         # 현장 대형 디스플레이 QR 배너
│   │   ├── CsvUploadModal.tsx       # 명단 CSV 대량 업로드 모달
│   │   ├── ExportModal.tsx          # 엑셀/CSV 데이터 내보내기 모달
│   │   ├── AttendanceCodeModal.tsx  # 출석코드 생성 및 수정 모달
│   │   ├── AttemptHistoryModal.tsx  # 출석 시도 이력 조회 모달
│   │   ├── ParticipantModal.tsx     # 참가자 정보 등록/수정 모달
│   │   ├── HeaderLogo.tsx           # 로고 및 뱃지 컴포넌트
│   │   ├── HeroTrioImage.tsx        # 워크숍 비주얼 캐릭터 컴포넌트
│   │   └── DecorativeBackground.tsx # 배경 그래픽 컴포넌트
│   ├── App.tsx                      # 뷰 라우팅 및 전역 상태 제어
│   ├── types.ts                     # TypeScript 데이터 모델 타입 정의
│   ├── main.tsx                     # React 엔트리포인트
│   └── index.css                    # Tailwind CSS 스타일 엔트리
├── server.ts                        # Express API 서버 & Vite 미들웨어
├── workshop_data.json               # 가상 데모 샘플 데이터 저장소
├── .env.example                     # 환경 변수 예시
└── README.md                        # 포트폴리오 문서
```

---

## 📡 REST API 명세 (Summary)

### 참여자 API (`/api/attendance`)
- `GET /api/attendance/info`: 서버 시간 및 기본 운영 정보 조회
- `POST /api/attendance/verify-employee`: 사번 유효성 검증 및 세션 토큰 발급
- `POST /api/attendance/check-in`: 출석코드 인증 및 출석 처리
- `POST /api/attendance/self-register`: 현장 신규 참가자 즉시 등록

### 관리자 API (`/api/admin`)
- `POST /api/admin/login`: 관리자 로그인 및 토큰 발급
- `GET /api/admin/overview`: 출석 통계 요약 조회
- `GET /api/admin/participants`: 참가자 목록 검색 및 다차원 필터링
- `POST /api/admin/participants`: 신규 참가자 단건 등록
- `POST /api/admin/participants/csv-upload`: CSV 파일 대량 명단 업로드
- `POST /api/admin/attendance/manual`: 수동 출석 체크
- `POST /api/admin/attendance/cancel`: 출석 기록 취소
- `GET /api/admin/attendance-codes`: 출석코드 목록 조회
- `POST /api/admin/attendance-codes`: 출석코드 등록/수정
- `DELETE /api/admin/attendance-codes/:id`: 출석코드 삭제
