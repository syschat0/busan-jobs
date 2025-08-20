/**
 * 데이터 필터링 유틸리티 함수들
 */

/**
 * 채용공고 데이터 필터링
 * @param {Array} jobs - 채용공고 배열
 * @param {Object} filters - 필터 조건 (다중 선택 배열)
 * @returns {Array} 필터링된 채용공고 배열
 */
export function filterJobs(jobs, filters) {
  return jobs.filter(job => {
    // 년도 필터 (다중 선택)
    if (filters.years && filters.years.length > 0) {
      const jobYear = job.공고시작일 ? new Date(job.공고시작일).getFullYear() : null;
      const selectedYears = filters.years.map(y => typeof y === 'string' ? parseInt(y.replace('년', '')) : parseInt(y));
      if (!selectedYears.includes(jobYear)) {
        return false;
      }
    }

    // 기관 필터 (다중 선택)
    if (filters.agencies && filters.agencies.length > 0) {
      if (!filters.agencies.includes(job.기관명)) {
        return false;
      }
    }

    // 직렬 필터 (다중 선택)
    if (filters.categories && filters.categories.length > 0) {
      const jobCategories = job.일반전형 ? job.일반전형.split(',').map(c => c.trim()) : [];
      const hasMatchingCategory = filters.categories.some(filterCategory => 
        jobCategories.includes(filterCategory)
      );
      if (!hasMatchingCategory) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 경쟁률 데이터 필터링
 * @param {Array} competition - 경쟁률 배열
 * @param {Object} filters - 필터 조건 (다중 선택 배열)
 * @returns {Array} 필터링된 경쟁률 배열
 */
export function filterCompetition(competition, filters) {
  return competition.filter(comp => {
    // 년도 필터 (다중 선택)
    if (filters.years && filters.years.length > 0) {
      const selectedYears = filters.years.map(y => typeof y === 'string' ? parseInt(y.replace('년', '')) : parseInt(y));
      const compYear = parseInt(comp.연도);
      if (!selectedYears.includes(compYear)) {
        return false;
      }
    }

    // 기관 필터 (다중 선택)
    if (filters.agencies && filters.agencies.length > 0) {
      if (!filters.agencies.includes(comp.기관명)) {
        return false;
      }
    }

    // 직렬 필터 (다중 선택)
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(comp.직렬)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 채용인원 데이터 필터링
 * @param {Array} hiring - 채용인원 배열
 * @param {Object} filters - 필터 조건 (다중 선택 배열)
 * @returns {Array} 필터링된 채용인원 배열
 */
export function filterHiring(hiring, filters) {
  return hiring.filter(hire => {
    // 년도 필터 (다중 선택) - 실제 API 데이터 구조 사용
    if (filters.years && filters.years.length > 0) {
      const selectedYears = filters.years.map(y => typeof y === 'string' ? parseInt(y.replace('년', '')) : parseInt(y));
      const hireYear = hire.연도 ? new Date(hire.연도).getFullYear() : null;
      if (!selectedYears.includes(hireYear)) {
        return false;
      }
    }

    // 기관 필터 (다중 선택) - 실제 API 데이터 구조 사용
    if (filters.agencies && filters.agencies.length > 0) {
      if (!filters.agencies.includes(hire.기관명)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 모든 데이터 필터링
 * @param {Object} data - 전체 데이터 객체
 * @param {Object} filters - 필터 조건
 * @returns {Object} 필터링된 데이터 객체
 */
export function filterAllData(data, filters) {
  return {
    jobs: filterJobs(data.jobs, filters),
    competition: filterCompetition(data.competition, filters),
    hiring: filterHiring(data.hiring, filters)
  };
}

/**
 * 필터 조건이 기본값(빈 배열)인지 확인
 * @param {Object} filters - 필터 조건 (다중 선택 배열)
 * @returns {boolean} 모든 필터가 기본값인지 여부
 */
export function isDefaultFilters(filters) {
  return (filters.years?.length === 0 || !filters.years) &&
         (filters.categories?.length === 0 || !filters.categories) &&
         (filters.agencies?.length === 0 || !filters.agencies);
}

/**
 * 활성화된 필터 개수 계산
 * @param {Object} filters - 필터 조건 (다중 선택 배열)
 * @returns {number} 활성화된 필터 개수
 */
export function getActiveFiltersCount(filters) {
  return (filters.years?.length || 0) + 
         (filters.categories?.length || 0) + 
         (filters.agencies?.length || 0);
}