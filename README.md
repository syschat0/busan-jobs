# 🚀 부산Job - 스마트 채용정보 통합 플랫폼

> **"5개 기관, 하나의 플랫폼 - 부산 청년의 취업 성공을 위한 원스톱 솔루션"**

부산시 산하 5개 공사/공단의 채용정보를 통합하여 구직자에게는 편리한 정보 접근을, 채용담당자에게는 효율적인 채용 홍보를 제공하는 지능형 웹서비스입니다.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwind-css&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?logo=chartdotjs&logoColor=white)

## 📖 프로젝트 소개

### 🎯 핵심 가치 제안
- 🔍 **통합 검색**: 5개 기관의 채용정보를 한 곳에서 검색
- 📊 **데이터 시각화**: 경쟁률, 채용 트렌드를 직관적 차트로 제공
- 🎨 **사용자 친화적 UI**: 모바일 최적화된 반응형 디자인
- ⚡ **실시간 통계**: 진행중인 채용, 마감임박 공고 실시간 업데이트

### 📊 실제 데이터 기반 서비스
- **채용정보**: 280건의 실제 공고 데이터
- **경쟁률 분석**: 316건의 상세 경쟁률 데이터
- **채용 통계**: 26건의 신규채용 현황
- **참여기관**: 5개 부산시 산하 공공기관
  - 부산교통공사, 부산환경공단, 부산도시공사
  - 부산관광공사, 부산정보산업진흥원

## 🏗️ 기술 스택

### Frontend
- **Framework**: SvelteKit 5.0 - 최신 컴파일러 기반 고성능 프레임워크
- **Styling**: Tailwind CSS 3.3 - 유틸리티 우선 CSS 프레임워크
- **Charts**: Chart.js 4.4 - 인터랙티브 데이터 시각화
- **Icons**: Lucide Svelte - 일관된 SVG 아이콘 시스템
- **Date**: date-fns 3.0 - 날짜 처리 라이브러리
- **Build Tool**: Vite 5.0 - 빠른 개발 및 빌드 환경
- **Language**: JavaScript (ES2022+)

### 개발 환경
- **Node.js**: 18+ 권장
- **Package Manager**: npm
- **Deployment**: Vercel/Netlify 호환

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/yourusername/WithBusan.git
cd WithBusan
```

### 2. 의존성 설치
```bash
cd frontend
npm install
```

### 3. 환경변수 설정
```bash
# .env 파일 생성 (.env.example을 참고)
cp .env.example .env
```

`.env` 파일 설정:
```env
# 사이트 기본 설정
VITE_SITE_NAME="WITH.B"
VITE_SITE_DESCRIPTION="부산 청년의 취업 성공을 위한 원스톱 솔루션"
VITE_SITE_VERSION="1.0.0"

# API 설정
VITE_API_URL="http://localhost:3000"
VITE_BACKEND_URL="http://remote.jobbench.net:8080"

# 기타 설정
VITE_ENABLE_ANALYTICS=false
```

### 4. 개발 서버 실행
```bash
npm run dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 5. 빌드 및 미리보기
```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 📁 프로젝트 구조

```
WithBusan/
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/          # 재사용 컴포넌트
│   │   │   │   ├── ui/             # 기본 UI 컴포넌트
│   │   │   │   │   ├── Button.svelte
│   │   │   │   │   ├── Input.svelte
│   │   │   │   │   ├── Modal.svelte
│   │   │   │   │   ├── Select.svelte
│   │   │   │   │   └── Toast.svelte
│   │   │   │   ├── JobCard.svelte    # 채용공고 카드
│   │   │   │   ├── Chart.svelte      # 기본 차트
│   │   │   │   ├── RadarChart.svelte # 레이더 차트
│   │   │   │   ├── ScatterChart.svelte # 산점도 차트
│   │   │   │   └── AnalysisFilters.svelte
│   │   │   ├── data/               # 실제 공공데이터 JSON
│   │   │   │   ├── jobs.json       # 채용정보 (280건)
│   │   │   │   ├── competition.json # 경쟁률 (316건)
│   │   │   │   ├── hiring.json     # 신규채용 (26건)
│   │   │   │   └── agencies.json   # 기관 메타데이터
│   │   │   ├── stores/             # Svelte 스토어
│   │   │   │   ├── jobs.js         # 채용정보 상태관리
│   │   │   │   └── ui.js           # UI 상태관리
│   │   │   └── utils/              # 유틸리티 함수
│   │   │       ├── dataProcessor.js # 데이터 처리
│   │   │       ├── dataFilters.js  # 필터링 로직
│   │   │       ├── dateUtils.js    # 날짜 처리
│   │   │       ├── apiClient.js    # API 클라이언트
│   │   │       └── config.js       # 설정 관리
│   │   └── routes/                 # SvelteKit 페이지
│   │       ├── +layout.svelte      # 공통 레이아웃
│   │       ├── +page.svelte        # 메인 대시보드
│   │       ├── search/             # 통합 검색
│   │       ├── analysis/           # 데이터 분석
│   │       │   └── components/     # 분석 전용 컴포넌트
│   │       ├── calendar/           # 채용 캘린더
│   │       └── datasheet/          # 개인화 대시보드
│   │           ├── components/     # 위젯 시스템
│   │           └── stores/         # 대시보드 상태
│   ├── static/                     # 정적 파일
│   ├── .env                        # 환경변수 설정
│   ├── package.json               # 의존성 관리
│   ├── svelte.config.js           # SvelteKit 설정
│   ├── tailwind.config.js         # Tailwind 설정
│   └── vite.config.js             # Vite 빌드 설정
└── README.md                      # 이 파일
```

## 🎨 주요 기능

### 📊 메인 대시보드
- **실시간 통계**: 총 280건 채용정보 기반 현황 요약
- **기관별 현황**: 5개 기관별 채용 동향 및 특성 분석  
- **스마트 추천**: 개인 관심사 기반 맞춤 채용정보
- **긴급 알림**: 마감임박(D-3) & 경쟁률 낮은 기회 하이라이트

### 🔍 통합 검색 & 필터링
- **다중 필터**: 기관/직렬/채용시기/경쟁률 범위별 검색
- **실시간 결과**: 타이핑과 동시에 즉시 반영되는 검색 결과
- **고급 정렬**: 마감일순/경쟁률순/채용인원순 정렬
- **검색 히스토리**: 최근 검색어 및 필터 조건 저장

### 📈 고급 데이터 분석
- **트렌드 분석**: 연도별/월별 채용 및 경쟁률 변화 추이
- **기관 비교**: 5개 기관의 채용 특성 벤치마킹 (레이더 차트)
- **상관관계 분석**: 채용인원 vs 경쟁률 산점도 시각화
- **예측 모델링**: 과거 데이터 기반 경쟁률 예측

### 📅 스마트 채용 캘린더
- **월별 뷰**: 채용공고/접수마감/시험일정 통합 달력
- **일정 알림**: 중요 마일스톤 자동 리마인더
- **iCal 연동**: 개인 캘린더 앱과 동기화

### 🎯 개인화 대시보드 (datasheet)
- **커스텀 위젯**: 드래그앤드롭으로 개인 맞춤 레이아웃
- **관심 추적**: 즐겨찾기 및 지원 현황 관리
- **성과 분석**: 개인 지원 이력 및 성공률 통계

## ⚙️ 환경변수 설정 가이드

### 필수 환경변수

| 변수명 | 설명 | 기본값 | 예시 |
|--------|------|--------|------|
| `VITE_SITE_NAME` | 사이트 이름 | "부산Job" | "WITH.B" |
| `VITE_SITE_DESCRIPTION` | 사이트 설명 | "부산 청년의 취업 성공..." | 사이트 메타 설명 |
| `VITE_SITE_VERSION` | 버전 정보 | "1.0.0" | "1.0.0" |

### API 관련 환경변수

| 변수명 | 설명 | 기본값 | 예시 |
|--------|------|--------|------|
| `VITE_API_URL` | 로컬 API URL | "http://localhost:3000" | 프론트용 주소 |
| `VITE_BACKEND_URL` | 백엔드 서버 URL | "http://localhost:3000" | 백엔드 주소 |

### 선택적 환경변수

| 변수명 | 설명 | 기본값 | 예시 |
|--------|------|--------|------|
| `VITE_ENABLE_ANALYTICS` | 분석 도구 활성화 | false | true/false |

### 환경별 설정

#### 개발 환경
```env
VITE_SITE_NAME="WITH.B (개발)"
VITE_API_URL="http://localhost:3000"
VITE_ENABLE_ANALYTICS=false
```

#### 프로덕션 환경
```env
VITE_SITE_NAME="WITH.B"
VITE_API_URL="https://api.withbusan.com"
VITE_ENABLE_ANALYTICS=true
```

## 🛠️ 개발 가이드

### 컴포넌트 개발 패턴
```svelte
<script>
  import { stores } from '$lib/stores/jobs.js';
  import { config } from '$lib/utils/config.js';
  
  // 컴포넌트 로직
</script>

<!-- 템플릿 -->
<div class="card p-6 hover:shadow-xl transition-all">
  <!-- 내용 -->
</div>

<style>
  /* 컴포넌트별 스타일 */
</style>
```

### 실제 데이터 구조 (부산시 공공데이터 기반)

#### 1. 채용정보 (jobs.json - 280건)
```javascript
{
  "id": "1",
  "agencyName": "부산교통공사",
  "jobTitle": "2020년 부산교통공사 신입사원 공개채용 공고",
  "startDate": "2020-01-17",
  "endDate": "2020-02-06",
  "applicationStart": "2020-01-31",
  "applicationEnd": "2020-02-06",
  "applicationMethod": "온라인 접수",
  "applicationUrl": "https://busan.saramin.co.kr",
  "category": "운영직, 운전직, 토목직, 건축직, 기계직, 전기직",
  "requiredCount": 127,
  "selectionMethod": "NCS기반 직무능력중심 채용"
}
```

#### 2. 경쟁률 데이터 (competition.json - 316건)
```javascript
{
  "id": "comp_1",
  "agencyName": "부산교통공사",
  "year": 2020,
  "category": "2020년 신입사원 공개채용(운영)",
  "jobCategory": "운영직",
  "selectedCount": 167,
  "applicantCount": 16800,
  "passingScore": 74.7,
  "competitionRate": "100.6:1"
}
```

#### 3. 신규채용 현황 (hiring.json - 26건)
```javascript
{
  "id": "hire_1", 
  "agencyName": "부산교통공사",
  "year": 2020,
  "regularGeneral": 630,    // 정규직(일반)
  "regularDisabled": 40,    // 정규직(장애인)
  "publicWorker": 11,       // 공무직
  "internGeneral": 0,       // 인턴(일반)
  "internDisabled": 0       // 인턴(장애인)
}
```

### 디자인 시스템
- **컬러 팔레트**: 부산의 바다(Primary Blue) & 석양(Secondary Orange) 테마
- **타이포그래피**: Pretendard Variable 폰트로 한글 최적화
- **컴포넌트**: 글래스모피즘 + 뉴모피즘 믹스 카드 디자인
- **애니메이션**: 60fps 부드러운 트랜지션 & 마이크로인터랙션
- **반응형**: Mobile-First 접근법으로 모든 기기 최적화

## 📊 데이터 소스

이 프로젝트는 부산시 산하 공공기관의 실제 채용 데이터를 기반으로 합니다:

### 포함된 기관
1. **부산교통공사** - 지하철 및 버스 운영
2. **부산환경공단** - 환경 관리 서비스
3. **부산도시공사** - 도시개발 및 주택 공급
4. **부산관광공사** - 관광 마케팅 및 컨벤션
5. **부산정보산업진흥원** - IT 산업 진흥

### 데이터 특징 및 활용도
- **시간 범위**: 2020년~2024년 (5개년 트렌드 분석 가능)
- **채용정보**: 280건의 실제 공고 (접수URL, 선발방법 등 상세 정보)
- **경쟁률**: 316건의 세밀한 경쟁률 데이터 (합격선, 지원자수 포함)
- **채용현황**: 26건의 연도별 신규채용 통계 (정규직/공무직/인턴 분류)
- **신뢰성**: 부산시 공식 공개 데이터로 100% 검증된 정보

## 🌐 배포

이 프로젝트는 SvelteKit의 `adapter-auto`를 사용하여 다양한 플랫폼에 배포할 수 있습니다.

### 빌드
```bash
npm run build
```

### 배포 옵션
- **Vercel**: GitHub 연동을 통한 자동 배포
- **Netlify**: 빌드된 파일 업로드 또는 GitHub 연동
- **기타**: Node.js 호스팅 서비스 (Railway, Render 등)

### 환경변수 설정 (배포시)
배포 플랫폼에서 다음 환경변수들을 설정하세요:
```bash
VITE_SITE_NAME=WITH.B
VITE_SITE_DESCRIPTION=부산 청년의 취업 성공을 위한 원스톱 솔루션
VITE_SITE_VERSION=1.0.0
VITE_API_URL=https://your-api-domain.com
VITE_BACKEND_URL=https://your-backend-domain.com
VITE_ENABLE_ANALYTICS=true
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 개발 가이드라인
- **Code Style**: Prettier + ESLint 준수
- **Commit**: Conventional Commits 사용
- **Testing**: 주요 기능에 대한 테스트 코드 작성
- **Documentation**: 새로운 기능은 문서 업데이트 필수

## 🐛 이슈 리포팅

버그를 발견하셨나요? [Issues](https://github.com/yourusername/WithBusan/issues)에서 다음 정보와 함께 제보해 주세요:

- 🖥️ 사용 환경 (OS, 브라우저)
- 📝 재현 단계
- 🎯 기대했던 결과
- 📷 스크린샷 (선택사항)

## 👥 팀

- **개발자**: [Your Name](https://github.com/yourusername)
- **디자인**: 부산 테마 기반 현대적 UI/UX
- **데이터**: 부산시 산하 5개 공공기관 공식 데이터

## 📊 성능 및 기술적 특징

### ⚡ 성능 최적화
- **빌드 크기**: Svelte 컴파일러로 최소화된 번들 사이즈
- **로딩 속도**: 정적 JSON 데이터로 빠른 초기 로딩
- **메모리 효율**: 클라이언트 사이드 필터링으로 서버 부하 없음
- **캐싱 전략**: 브라우저 캐시 활용한 데이터 지속성

### 🔧 확장성 설계
- **모듈화**: 컴포넌트 기반 아키텍처로 기능 추가 용이
- **타입 안전성**: JSDoc 기반 타입 힌팅
- **API 준비**: 향후 실시간 API 연동을 위한 apiClient 구조
- **다국어**: i18n 지원 준비 (한국어 우선)

## 📞 프로젝트 정보

- **Repository**: [https://github.com/yourusername/WithBusan](https://github.com/yourusername/WithBusan)  
- **Live Demo**: [배포 URL 예정]
- **Contact**: 프로젝트 관련 문의는 Issues를 통해 남겨주세요

## 🚀 향후 계획

### Phase 2: 고도화 (1개월)
- **🤖 AI 기능**: OpenAI API 연동으로 자기소개서 작성 도우미
- **📱 PWA**: 모바일 앱 수준의 사용자 경험
- **🔔 알림**: 웹 푸시 알림으로 실시간 채용정보 업데이트
- **📈 예측**: 머신러닝 기반 경쟁률 예측 모델

### Phase 3: 확장 (3개월)  
- **🌐 실시간 데이터**: 각 기관 사이트 크롤링 자동화
- **👥 커뮤니티**: 구직자간 정보 공유 및 후기 시스템
- **📊 고급 분석**: 합격자 프로필 분석 및 성공 패턴 도출

## 🙏 감사의 말

- **부산시** 및 산하 공공기관의 투명한 공개 데이터 제공
- **SvelteKit** 커뮤니티의 혁신적인 프레임워크 개발
- **Chart.js & Tailwind CSS** 팀의 개발자 친화적 도구 제공
- **부산 청년들**의 더 나은 취업 기회를 위한 지속적인 관심

---

<div align="center">

### 🌊 **부산 청년들의 성공적인 취업을 응원합니다!** ⚓

[![부산Job](https://img.shields.io/badge/부산Job-스마트%20채용정보%20플랫폼-0066CC?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDhMMTIgMTNMMy0xVjE3SDE3VjEwTDIxIDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)](#)
[![Made with ❤️ in Busan](https://img.shields.io/badge/Made%20with%20❤️%20in-Busan-FF6B35?style=for-the-badge)](#)

</div>