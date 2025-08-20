// =============================================================================
// API 클라이언트 유틸리티
// =============================================================================

// 환경변수에서 백엔드 URL 가져오기
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const BASE_URL = `${BACKEND_URL}/api`;

// 개발 환경에서 URL 확인을 위한 로그
if (import.meta.env.DEV) {
  console.log('API Client 설정:', {
    BACKEND_URL,
    BASE_URL,
    env: import.meta.env.VITE_BACKEND_URL
  });
}

/**
 * API 호출 래퍼 함수 (타임아웃 포함)
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} options - 요청 옵션
 * @returns {Promise<any>} API 응답 데이터
 */
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const timeout = options.timeout || 10000; // 10초 기본 타임아웃
  
  try {
    console.log(`API 호출 시작: ${url}`);
    
    // AbortController로 타임아웃 구현
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal,
      ...options
    });

    clearTimeout(timeoutId);

    console.log(`API 응답 상태: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`API 데이터 수신 완료: ${endpoint}`);
    
    // API 응답이 { data: [...] } 형태인 경우 data 필드 추출
    return data.data || data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`API 호출 타임아웃 (${endpoint}): ${timeout}ms 초과`);
      throw new Error(`API 호출 타임아웃: ${timeout}ms 초과`);
    }
    console.error(`API 호출 실패 (${endpoint}):`, error);
    throw error;
  }
}

/**
 * 채용공고 데이터 가져오기
 * @returns {Promise<Array>} 채용공고 배열
 */
export async function fetchJobData() {
  const tableName = encodeURIComponent('TMP_채용공고');
  return await apiCall(`/hire_info?tableNm=${tableName}`);
}

/**
 * 경쟁률 데이터 가져오기
 * @returns {Promise<Array>} 경쟁률 데이터 배열
 */
export async function fetchCompetitionData() {
  const tableName = encodeURIComponent('TMP_채용경쟁률');
  return await apiCall(`/hire_info?tableNm=${tableName}`);
}

/**
 * 신입채용인원현황 데이터 가져오기
 * @returns {Promise<Array>} 신입채용인원현황 데이터 배열
 */
export async function fetchHiringData() {
  const tableName = encodeURIComponent('TMP_신입채용인원현황');
  return await apiCall(`/hire_info?tableNm=${tableName}`);
}

/**
 * 모든 데이터 한번에 가져오기
 * @returns {Promise<Object>} 모든 데이터를 포함한 객체
 */
export async function fetchAllData() {
  try {
    const [jobs, competition, hiring] = await Promise.all([
      fetchJobData(),
      fetchCompetitionData(),
      fetchHiringData()
    ]);

    return {
      jobs: jobs || [],
      competition: competition || [],
      hiring: hiring || []
    };
  } catch (error) {
    console.error('전체 데이터 로딩 실패:', error);
    // 에러 발생 시 빈 배열 반환
    return {
      jobs: [],
      competition: [],
      hiring: []
    };
  }
}

/**
 * 데이터 캐싱을 위한 단순한 캐시 매니저
 */
class DataCache {
  constructor(ttl = 5 * 60 * 1000) { // 5분 TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

// 전역 캐시 인스턴스
const dataCache = new DataCache();

/**
 * 캐시를 고려한 데이터 가져오기
 * @param {string} tableName - 테이블명
 * @returns {Promise<Array>} 데이터 배열
 */
export async function fetchCachedData(tableName) {
  const cacheKey = `hire_info_${tableName}`;
  
  // 캐시에서 먼저 확인
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) {
    console.log(`캐시에서 데이터 반환: ${tableName}`);
    return cachedData;
  }

  // 캐시에 없으면 API 호출 (한글 인코딩 적용)
  try {
    const encodedTableName = encodeURIComponent(tableName);
    const data = await apiCall(`/hire_info?tableNm=${encodedTableName}`);
    dataCache.set(cacheKey, data);
    return data || [];
  } catch (error) {
    console.error(`데이터 로딩 실패 (${tableName}):`, error);
    return [];
  }
}

/**
 * 캐시를 고려한 전체 데이터 가져오기
 * @returns {Promise<Object>} 모든 데이터를 포함한 객체
 */
export async function fetchAllCachedData() {
  try {
    console.log('API 데이터 로딩 시작...');
    
    // 각 API 호출을 순차적으로 실행하여 디버깅
    console.log('1. 채용공고 데이터 로딩 중...');
    const jobs = await fetchCachedData('TMP_채용공고');
    console.log(`1. 채용공고 데이터 로딩 완료: ${jobs.length}건`);
    
    console.log('2. 경쟁률 데이터 로딩 중...');
    const competition = await fetchCachedData('TMP_채용경쟁률');
    console.log(`2. 경쟁률 데이터 로딩 완료: ${competition.length}건`);
    
    console.log('3. 신입채용인원 데이터 로딩 중...');
    const hiring = await fetchCachedData('TMP_신입채용인원현황');
    console.log(`3. 신입채용인원 데이터 로딩 완료: ${hiring.length}건`);

    console.log('API 데이터 로딩 완료:', {
      jobs: jobs.length,
      competition: competition.length,
      hiring: hiring.length
    });

    return {
      jobs,
      competition,
      hiring
    };
  } catch (error) {
    console.error('전체 데이터 로딩 실패:', error);
    throw error; // 에러를 다시 던져서 상위에서 처리하도록
  }
}

/**
 * 캐시 초기화
 */
export function clearCache() {
  dataCache.clear();
}

/**
 * API 상태 확인
 * @returns {Promise<boolean>} API 서버 상태
 */
export async function checkApiHealth() {
  try {
    console.log('API 상태 확인 중...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
    
    // 간단한 API 엔드포인트로 상태 확인
    const tableName = encodeURIComponent('TMP_채용공고');
    const response = await fetch(`${BASE_URL}/hire_info?tableNm=${tableName}&limit=1`, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log(`API 상태: ${response.ok ? '정상' : '오류'}`);
    return response.ok;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('API 상태 확인 타임아웃');
    } else {
      console.error('API 상태 확인 실패:', error);
    }
    return false;
  }
}