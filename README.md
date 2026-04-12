# Replog 🏋️

> 나만의 운동 기록 일지 — 기존 프로젝트(fit-log-laravel)의 구조적 한계를 개선한 리뉴얼 버전

<br/>

## 프로젝트 소개

헬스장에서 했던 운동을 날짜별로 기록하고, 세트/무게/횟수를 추적하며 성장을 시각적으로 확인하는 웹 앱입니다.

기존 프로젝트에서 운동 결과를 JSON 컬럼에 통째로 저장하던 방식을 정규화된 테이블 구조로 개선하여, 세트별 조회/수정/삭제 및 1RM 계산이 가능하도록 재설계했습니다.

<br/>

## 기술 스택

### Backend
| 기술 | 선택 이유 |
|------|----------|
| Laravel 13 | 인증(Sanctum), ORM(Eloquent), 라우팅 등 기본 제공이 풍부해 빠른 개발 가능 |
| MySQL | 정규화된 관계형 데이터 구조에 적합 |
| Laravel Sanctum | SPA 환경에서 쿠키 기반 인증으로 XSS 취약점 최소화 |
| Laravel Sail | Docker 기반 개발 환경 — 환경 차이 없이 일관된 실행 보장 |

### Frontend
| 기술 | 선택 이유 |
|------|----------|
| React + Vite | 컴포넌트 기반 UI, 빠른 개발 서버 |
| MUI (Material UI) | 이미 만들어진 컴포넌트로 개발 속도 확보, 반응형 기본 지원 |
| FullCalendar | 날짜 클릭/이벤트 표시에 특화된 캘린더 라이브러리 |
| Recharts | 신체 기록 추이 그래프 시각화 |
| axios | CSRF 토큰 자동 처리, 인터셉터 활용 |

### 모바일 대응
네이티브 앱(React Native/Flutter) 대신 **반응형 웹**을 선택했습니다.
이 프로젝트의 목적은 REST API 설계와 React 구현 능력을 보여주는 것이며, 기간 내 완성도를 높이기 위해 하나의 코드베이스로 PC/모바일 모두 대응하는 방식을 선택했습니다.

<br/>

## 주요 기능

- 📅 **캘린더 기반 운동 기록** — 운동한 날짜 시각적 표시, 날짜 클릭으로 기록 접근
- 💪 **세트별 기록** — 운동 종목 / 세트 / 무게 / 횟수 개별 관리
- 📋 **운동 템플릿** — 자주 쓰는 루틴을 템플릿으로 저장
- 🏆 **1RM 챌린지** — 벤치프레스 / 스쿼트 / 데드리프트 최대 1RM 추적 (Brzycki 공식)
- 📊 **신체 기록 그래프** — 몸무게 / 근육량 / 체지방률 추이 시각화
- 🔧 **운동 종목 관리** — 기본 제공 32개 종목 + 커스텀 종목 추가

<br/>

## DB 설계

### 원본 → 개선 핵심 변경점

| 항목 | 기존 | 개선 |
|------|------|------|
| 운동 결과 저장 | `workout_results` JSON 컬럼 | `workout_sets` 정규화 테이블 |
| 템플릿 종목 | `routine_contents` JSON 컬럼 | `template_exercises` 정규화 테이블 |
| 신체 기록 | `users` 테이블 컬럼 (1회만 저장) | `body_records` 별도 테이블 (날짜별 누적) |
| 기본 종목 | 유저마다 복사 저장 | `is_default` 플래그로 공유 |

JSON → 정규화 이유: 세트별 조회/수정/삭제 가능, 1RM 계산 시 SQL 한 줄로 처리, 이전 기록 불러오기 용이

### ERD
```
users
├── exercises (user_id nullable)       커스텀 운동 종목
├── workout_logs (user_id)             날짜별 운동 일지
│   └── workout_sets (workout_log_id)  세트별 기록
│       └── exercises (exercise_id)   종목 참조
├── workout_templates (user_id)        루틴 템플릿
│   └── template_exercises             템플릿-종목 연결
│       └── exercises (exercise_id)
└── body_records (user_id)             신체 기록
```

<br/>

## 실행 방법

### 사전 요구사항
- Docker Desktop
- Node.js 18+

### Backend
```bash
cd backend
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate:fresh --seed
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

<br/>

## 프로젝트 구조

```
replog/
├── backend/                  Laravel 13 REST API
│   ├── app/
│   │   ├── Http/Controllers/ 각 도메인별 컨트롤러
│   │   └── Models/           Eloquent 모델 (관계 정의)
│   ├── database/
│   │   ├── migrations/       테이블 정의
│   │   └── seeders/          기본 운동 종목 32개
│   └── routes/api.php        API 엔드포인트
└── frontend/                 React + Vite
    └── src/
        ├── api/              axios 기반 API 호출 함수
        ├── contexts/         전역 상태 (인증)
        ├── components/       공통 컴포넌트
        └── pages/            페이지별 컴포넌트
```

<br/>

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/register | 회원가입 |
| POST | /api/login | 로그인 |
| POST | /api/logout | 로그아웃 |
| GET | /api/exercises | 운동 종목 목록 |
| GET | /api/workout-logs/calendar | 월별 운동 날짜 |
| GET | /api/workout-logs/:date | 날짜별 기록 조회 |
| POST | /api/workout-logs/:id/sets | 세트 추가 |
| GET | /api/templates | 템플릿 목록 |
| GET | /api/body-records | 신체 기록 목록 |
| GET | /api/one-rm | 1RM 챌린지 현황 |

<br/>

## 개선 예정

- [ ] 이전 기록 불러오기 (같은 종목의 직전 세트 자동 표시)
- [ ] 템플릿 적용으로 운동 시작
- [ ] 운동 통계 페이지

<br/>

> 기존 프로젝트: [fit-log-laravel](https://github.com/HSeung03/fit-log-laravel)
