# 🚀 API 연계 가이드 - apiClient.js 활용법

## 📋 개요

본 프로젝트의 `apiClient.js`는 백엔드 API와의 통신을 담당하는 핵심 유틸리티입니다. 
이 가이드는 프로젝트 내에서 API를 효율적으로 활용하는 방법을 제공합니다.

---

## 🏗️ API 클라이언트 구조

### 📊 주요 구성 요소

```javascript
// 기본 구조
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const BASE_URL = `${BACKEND_URL}/api`;
```

### 🔧 핵심 기능들

1. **기본 API 호출**: `apiCall()`
2. **개별 데이터 fetcher**: `fetchJobData()`, `fetchCompetitionData()`, `fetchHiringData()`
3. **통합 데이터 fetcher**: `fetchAllData()`, `fetchAllCachedData()`
4. **캐싱 시스템**: `DataCache` 클래스
5. **상태 확인**: `checkApiHealth()`

---

## 📡 API 엔드포인트 구조

### 🎯 백엔드 API 스키마

```
기본 URL: {BACKEND_URL}/api
```

| 엔드포인트 | 메서드 | 설명 | 테이블명 |
|-----------|-------|------|----------|
| `/hire_info?tableNm=TMP_채용공고` | GET | 채용공고 데이터 | TMP_채용공고 |
| `/hire_info?tableNm=TMP_채용경쟁률` | GET | 경쟁률 데이터 | TMP_채용경쟁률 |
| `/hire_info?tableNm=TMP_신입채용인원현황` | GET | 신입채용인원 데이터 | TMP_신입채용인원현황 |

### 🔒 API 응답 형식

```javascript
// 성공 응답 (표준)
{
  "data": [
    {
      "기관명": "부산교통공사",
      "공고명": "2024년 신입사원 채용",
      "접수시작일": "2024-04-22 00:00:00",
      // ... 기타 필드
    }
  ]
}

// 또는 직접 배열 반환
[
  {
    "기관명": "부산교통공사",
    // ... 데이터
  }
]
```

---

## 🛠️ 실제 사용 방법

### 1️⃣ 개별 데이터 가져오기

```javascript
import { fetchJobData, fetchCompetitionData, fetchHiringData } from '$lib/utils/apiClient.js';

// 채용공고 데이터만 가져오기
async function loadJobs() {
  try {
    const jobs = await fetchJobData();
    console.log('채용공고:', jobs);
    return jobs;
  } catch (error) {
    console.error('채용공고 로딩 실패:', error);
    return [];
  }
}

// 경쟁률 데이터만 가져오기
async function loadCompetition() {
  const competition = await fetchCompetitionData();
  return competition;
}
```

### 2️⃣ 전체 데이터 한번에 가져오기 (권장)

```javascript
import { fetchAllCachedData } from '$lib/utils/apiClient.js';

// 모든 데이터를 한번에 로드 (캐싱 포함)
async function loadAllData() {
  try {
    const data = await fetchAllCachedData();
    
    console.log('전체 데이터:', {
      jobs: data.jobs.length,
      competition: data.competition.length,
      hiring: data.hiring.length
    });
    
    return data;
  } catch (error) {
    console.error('데이터 로딩 실패:', error);
    throw error;
  }
}
```

### 3️⃣ Svelte 컴포넌트에서 사용

```svelte
<script>
  import { onMount } from 'svelte';
  import { fetchAllCachedData, checkApiHealth } from '$lib/utils/apiClient.js';
  
  let data = { jobs: [], competition: [], hiring: [] };
  let isLoading = true;
  let error = null;
  
  // 컴포넌트 마운트 시 데이터 로드
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    isLoading = true;
    error = null;
    
    try {
      // API 상태 먼저 확인
      const isHealthy = await checkApiHealth();
      if (!isHealthy) {
        throw new Error('API 서버에 연결할 수 없습니다');
      }
      
      // 데이터 로드
      data = await fetchAllCachedData();
      
    } catch (err) {
      error = err.message;
      console.error('데이터 로딩 실패:', err);
    } finally {
      isLoading = false;
    }
  }
  
  // 데이터 새로고침
  async function refreshData() {
    await loadData();
  }
</script>

<!-- UI 템플릿 -->
{#if isLoading}
  <div class="loading">데이터 로딩 중...</div>
{:else if error}
  <div class="error">
    <p>오류: {error}</p>
    <button on:click={refreshData}>다시 시도</button>
  </div>
{:else}
  <div class="data-display">
    <h2>채용공고: {data.jobs.length}건</h2>
    <h2>경쟁률 데이터: {data.competition.length}건</h2>
    <h2>신입채용 데이터: {data.hiring.length}건</h2>
  </div>
{/if}
```

### 4️⃣ Svelte Store에서 사용

```javascript
// stores/dataStore.js
import { writable, derived } from 'svelte/store';
import { fetchAllCachedData } from '$lib/utils/apiClient.js';

// 원시 데이터 스토어
export const rawDataStore = writable({
  jobs: [],
  competition: [],
  hiring: [],
  isLoading: false,
  error: null,
  lastUpdated: null
});

// 데이터 로딩 함수
export async function loadStoreData() {
  rawDataStore.update(store => ({
    ...store,
    isLoading: true,
    error: null
  }));
  
  try {
    const data = await fetchAllCachedData();
    
    rawDataStore.update(store => ({
      ...store,
      ...data,
      isLoading: false,
      lastUpdated: new Date()
    }));
    
  } catch (error) {
    rawDataStore.update(store => ({
      ...store,
      isLoading: false,
      error: error.message
    }));
    
    throw error;
  }
}

// 파생 스토어 (필터링된 데이터)
export const filteredJobs = derived(rawDataStore, ($rawData) => {
  return $rawData.jobs.filter(job => {
    // 필터링 로직
    return job.기관명 && job.공고명;
  });
});
```

---

## ⚡ 캐싱 시스템 활용

### 💾 캐시 작동 원리

```javascript
// 캐시 설정 (기본 5분 TTL)
const dataCache = new DataCache(5 * 60 * 1000); // 5분

// 캐시 확인 → API 호출 → 캐시 저장 순서
export async function fetchCachedData(tableName) {
  const cacheKey = `hire_info_${tableName}`;
  
  // 1. 캐시 확인
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) {
    console.log(`캐시에서 데이터 반환: ${tableName}`);
    return cachedData;
  }
  
  // 2. API 호출
  const data = await apiCall(`/hire_info?tableNm=${encodedTableName}`);
  
  // 3. 캐시 저장
  dataCache.set(cacheKey, data);
  return data;
}
```

### 🔄 캐시 관리

```javascript
import { clearCache } from '$lib/utils/apiClient.js';

// 캐시 초기화 (강제 새로고침이 필요한 경우)
async function forceRefresh() {
  clearCache();
  const freshData = await fetchAllCachedData();
  return freshData;
}
```

---

## 🚨 에러 처리 패턴

### 🛡️ 안전한 API 호출

```javascript
async function safeApiCall() {
  try {
    // 1. API 상태 확인
    const isHealthy = await checkApiHealth();
    if (!isHealthy) {
      throw new Error('API 서버 응답 없음');
    }
    
    // 2. 데이터 로드
    const data = await fetchAllCachedData();
    
    // 3. 데이터 유효성 검사
    if (!data.jobs || !Array.isArray(data.jobs)) {
      throw new Error('유효하지 않은 데이터 형식');
    }
    
    return data;
    
  } catch (error) {
    // 4. 에러 타입별 처리
    if (error.message.includes('타임아웃')) {
      console.error('API 타임아웃 발생');
      // 사용자에게 재시도 안내
    } else if (error.message.includes('API 서버')) {
      console.error('API 서버 연결 실패');
      // 로컬 데이터 사용 또는 오프라인 모드
    } else {
      console.error('알 수 없는 오류:', error);
    }
    
    // 기본값 반환 (앱 크래시 방지)
    return {
      jobs: [],
      competition: [],
      hiring: []
    };
  }
}
```

### ⚠️ 타임아웃 설정

```javascript
// 기본 타임아웃: 10초
const data = await fetchAllCachedData();

// 커스텀 타임아웃 (직접 apiCall 사용 시)
const customData = await apiCall('/hire_info?tableNm=TMP_채용공고', {
  timeout: 15000 // 15초
});
```

---

## 📊 실제 프로젝트 사용 사례

### 🎯 사례 1: Analysis 페이지

```javascript
// src/routes/analysis/+page.svelte
import { fetchAllCachedData } from '$lib/utils/apiClient.js';

async function loadDashboardData() {
  try {
    console.log('대시보드 데이터 로딩 시작...');
    const result = await fetchAllCachedData();
    
    rawData = result;
    lastUpdated = new Date();
    
  } catch (err) {
    console.error('대시보드 데이터 로딩 실패:', err);
    error = err.message || '데이터를 불러오는데 실패했습니다.';
  }
}
```

### 🎯 사례 2: Dashboard Store

```javascript
// src/routes/datasheet/stores/dashboard.js
import { fetchAllCachedData } from '$lib/utils/apiClient.js';

export async function initializeDashboard() {
  try {
    // API에서 데이터 가져오기
    const apiData = await fetchAllCachedData();
    
    // 데이터 가공
    const enhanced = dataProcessor.enhanceJobData(
      apiData.jobs,
      apiData.competition,
      apiData.hiring
    );
    
    // 스토어 업데이트
    enhancedDataStore.update(store => ({
      ...store,
      jobs: enhanced,
      isLoading: false,
      lastUpdated: new Date()
    }));
    
  } catch (error) {
    console.error('대시보드 초기화 실패:', error);
    throw error;
  }
}
```

---

## 🔧 환경 설정

### 📝 환경변수 설정

```bash
# .env 파일
VITE_BACKEND_URL=http://localhost:8080
```

```javascript
// config.js에서 확인
export const config = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
};
```

### 🌐 개발/프로덕션 환경 구분

```javascript
// 개발 환경에서만 상세 로그
if (import.meta.env.DEV) {
  console.log('API Client 설정:', {
    BACKEND_URL,
    BASE_URL,
    env: import.meta.env.VITE_BACKEND_URL
  });
}
```

---

## 🎯 Best Practices

### ✅ 권장사항

1. **`fetchAllCachedData()` 사용**: 개별 함수보다 통합 함수 선호
2. **에러 처리 필수**: 항상 try-catch 블록 사용
3. **API 상태 확인**: 중요한 작업 전 `checkApiHealth()` 호출
4. **캐시 활용**: 불필요한 API 호출 방지
5. **타임아웃 고려**: 네트워크 상황을 고려한 적절한 타임아웃 설정

### ❌ 피해야 할 패턴

1. **직접 fetch 사용**: apiClient.js 우회하지 말기
2. **에러 무시**: 에러 발생 시 적절한 처리 없이 무시
3. **과도한 API 호출**: 캐시 무시하고 반복적인 API 호출
4. **하드코딩된 URL**: 환경변수 대신 URL 직접 입력

---

## 🔍 디버깅 가이드

### 📊 로그 확인

```javascript
// 브라우저 콘솔에서 확인할 수 있는 로그들
console.log('API Client 설정:', { BACKEND_URL, BASE_URL });
console.log('API 호출 시작: /api/hire_info?tableNm=TMP_채용공고');
console.log('API 응답 상태: 200 OK');
console.log('캐시에서 데이터 반환: TMP_채용공고');
console.log('API 데이터 로딩 완료: { jobs: 295, competition: 423, hiring: 25 }');
```

### 🚨 일반적인 문제 해결

| 문제 | 원인 | 해결방법 |
|------|------|----------|
| `TypeError: Cannot read properties of undefined` | API 응답 데이터 구조 변경 | 응답 데이터 구조 확인 후 코드 수정 |
| `API 호출 타임아웃` | 네트워크 지연 또는 서버 응답 없음 | 타임아웃 시간 증가 또는 재시도 로직 추가 |
| `404 Not Found` | 백엔드 서버 미실행 또는 URL 오류 | 백엔드 서버 상태 및 URL 확인 |
| `CORS 에러` | 브라우저 CORS 정책 위반 | 백엔드 CORS 설정 확인 |

---

## 🚀 향후 확장 계획

### 📈 추가 기능 개발 예정
1. 없음.
2. 그래도 필요하면 하세요.

---

*이 문서는 본 프로젝트의 API 연계 가이드입니다. 프로젝트 업데이트에 따라 내용이 변경될 수 있습니다.*