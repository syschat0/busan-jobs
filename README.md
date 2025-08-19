# 🚀 부산Job - 스마트 채용정보 통합 플랫폼

부산시 산하 5개 공사/공단의 채용정보를 통합하여 구직자에게는 편리한 정보 접근을, 채용담당자에게는 효율적인 채용 홍보를 제공하는 지능형 웹서비스입니다.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.0.1-green.svg)
![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwind-css&logoColor=white)

## 📖 프로젝트 소개

**"5개 기관, 하나의 플랫폼 - 부산 청년의 취업 성공을 위한 원스톱 솔루션"**

### 🎯 핵심 가치 제안
- 🔍 **통합 검색**: 5개 기관의 채용정보를 한 곳에서 검색
- 📊 **데이터 시각화**: 경쟁률, 채용 트렌드를 직관적 차트로 제공
- 🎨 **사용자 친화적 UI**: 모바일 최적화된 반응형 디자인
- ⚡ **실시간 통계**: 진행중인 채용, 마감임박 공고 실시간 업데이트

### 📊 서비스 현황
- **채용정보**: 295건
- **경쟁률 데이터**: 423건 
- **참여기관**: 5개 (부산교통공사, 부산환경공단 등)
- **신규채용현황**: 25건

## 🏗️ 기술 스택

### Frontend
- **Framework**: SvelteKit 2.0
- **Styling**: Tailwind CSS 3.3
- **Charts**: Chart.js 4.4
- **Icons**: Lucide Svelte
- **Build Tool**: Vite 5.0
- **Language**: TypeScript

### 개발 환경
- **Node.js**: 18+ 권장
- **Package Manager**: npm
- **Deployment**: Vercel/Netlify 호환

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/yourusername/busan-job.git
cd busan-job
```

### 2. 의존성 설치
```bash
cd frontend
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 4. 빌드
```bash
npm run build
```

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/          # UI 컴포넌트
│   │   │   ├── ui/             # 기본 UI 컴포넌트
│   │   │   ├── JobCard.svelte  # 채용공고 카드
│   │   │   ├── Chart.svelte    # 차트 컴포넌트
│   │   │   └── ...
│   │   ├── data/               # 정적 데이터
│   │   │   ├── jobs.json       # 채용정보 (295건)
│   │   │   ├── competition.json # 경쟁률 (423건)
│   │   │   ├── hiring.json     # 신규채용 (25건)
│   │   │   └── agencies.json   # 기관 정보
│   │   ├── stores/             # 상태 관리
│   │   │   ├── jobs.js         # 채용정보 스토어
│   │   │   └── ui.js           # UI 상태 스토어
│   │   └── utils/              # 유틸리티 함수
│   │       ├── dataProcessor.js
│   │       ├── dateUtils.js
│   │       └── config.js
│   └── routes/                 # 페이지 라우팅
│       ├── +layout.svelte      # 공통 레이아웃
│       ├── +page.svelte        # 메인 페이지
│       ├── search/             # 검색 페이지
│       ├── analysis/           # 분석 페이지
│       └── calendar/           # 캘린더 페이지
├── static/                     # 정적 파일
├── package.json
└── ...
```

## 🎨 주요 기능

### 📊 메인 대시보드
- 실시간 채용 현황 통계
- 참여기관별 채용 현황
- 추천 채용정보
- 마감임박 & 경쟁률 낮은 채용 정보

### 🔍 통합 검색
- 기관별, 직렬별, 날짜별 필터링
- 실시간 검색 결과
- 정렬 및 페이지네이션

### 📈 분석 도구
- 경쟁률 트렌드 차트
- 기관별 채용 비교 분석
- 레이더 차트 기반 종합 분석
- 산점도 차트 (채용인원 vs 경쟁률)

### 📅 채용 캘린더
- 월별 채용 일정 시각화
- 접수기간, 시험일정 관리

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

### 데이터 구조
```javascript
// 채용정보 (jobs.json)
{
  "id": "1",
  "agencyName": "부산교통공사",
  "jobTitle": "2024년 신입사원 공개채용",
  "startDate": "2024-04-09",
  "endDate": "2024-04-29",
  "categories": ["운영직", "기술직"],
  "requiredCount": 127,
  "applicationUrl": "https://example.com"
}
```

### 스타일 가이드
- **Colors**: 부산의 바다(Blue)와 석양(Orange) 테마
- **Typography**: Pretendard 폰트 사용
- **Components**: 카드 기반 레이아웃
- **Animations**: Smooth transitions 적용

## 📊 데이터 소스

이 프로젝트는 부산시 산하 공공기관의 실제 채용 데이터를 기반으로 합니다:

### 포함된 기관
1. **부산교통공사** - 지하철 및 버스 운영
2. **부산환경공단** - 환경 관리 서비스
3. **부산도시공사** - 도시개발 및 주택 공급
4. **부산관광공사** - 관광 마케팅 및 컨벤션
5. **부산정보산업진흥원** - IT 산업 진흥

### 데이터 특징
- **시간 범위**: 2020년~2024년
- **채용정보**: 295건의 상세 공고
- **경쟁률**: 423건의 경쟁률 데이터
- **채용현황**: 5년간 신규채용 통계

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

버그를 발견하셨나요? [Issues](https://github.com/yourusername/busan-job/issues)에서 다음 정보와 함께 제보해 주세요:

- 🖥️ 사용 환경 (OS, 브라우저)
- 📝 재현 단계
- 🎯 기대했던 결과
- 📷 스크린샷 (선택사항)

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조해 주세요.

## 👥 팀

- **개발자**: [Your Name](https://github.com/yourusername)
- **디자인**: 부산 테마 기반 현대적 UI/UX
- **데이터**: 부산시 산하 5개 공공기관 공식 데이터

## 📞 연락처

- **Project Link**: [https://github.com/yourusername/busan-job](https://github.com/yourusername/busan-job)
- **Email**: your.email@example.com

## 🙏 감사의 말

- 부산시 및 산하 공공기관의 공개 데이터 제공
- SvelteKit 커뮤니티의 지속적인 지원
- Chart.js 및 Tailwind CSS 팀의 훌륭한 도구들

---

**부산 청년들의 성공적인 취업을 응원합니다! 🚀**

[![부산Job](https://img.shields.io/badge/부산Job-스마트%20채용정보%20플랫폼-blue?style=for-the-badge)](#)