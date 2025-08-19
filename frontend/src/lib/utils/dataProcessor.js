/**
 * 데이터 처리 및 변환 유틸리티
 */

/**
 * 채용정보와 경쟁률 데이터 조인
 */
export function joinJobsWithCompetition(jobs, competitionData) {
  return jobs.map(job => {
    // 같은 기관의 비슷한 직렬 경쟁률 찾기
    const matchingCompetition = competitionData.find(comp => 
      comp.agencyName === job.agencyName && 
      job.categories && job.categories.some(cat => 
        comp.category && comp.category.includes(cat.slice(0, 2))
      )
    );
    
    return {
      ...job,
      competitionRate: matchingCompetition?.rate || null,
      historicalData: matchingCompetition || null,
      expectedCompetition: calculateExpectedCompetition(job)
    };
  });
}

/**
 * 예상 경쟁률 계산
 */
export function calculateExpectedCompetition(job) {
  // 채용인원, 기관, 직렬에 따른 예상 경쟁률
  let baseRate = 45; // 기본 경쟁률
  
  // 채용인원에 따른 조정
  if (job.requiredCount > 100) baseRate *= 0.6;
  else if (job.requiredCount > 50) baseRate *= 0.8;
  else if (job.requiredCount < 10) baseRate *= 1.5;
  
  // 기관별 조정
  switch (job.agencyName) {
    case '부산교통공사':
      baseRate *= 1.2; // 인기 기관
      break;
    case '부산도시공사':
      baseRate *= 0.9;
      break;
    case '부산항만공사':
      baseRate *= 1.1;
      break;
  }
  
  // 직렬별 조정
  if (job.categories) {
    if (job.categories.some(cat => cat.includes('운전'))) baseRate *= 0.8;
    if (job.categories.some(cat => cat.includes('기술') || cat.includes('전기') || cat.includes('기계'))) baseRate *= 1.3;
    if (job.categories.some(cat => cat.includes('행정'))) baseRate *= 1.4;
  }
  
  return Math.round(baseRate * 10) / 10; // 소수점 1자리
}

/**
 * 경쟁률 레벨 계산
 */
export function getCompetitionLevel(rate) {
  if (rate < 30) return { level: 'low', label: '낮음', color: 'green' };
  if (rate < 60) return { level: 'medium', label: '보통', color: 'amber' };
  return { level: 'high', label: '높음', color: 'red' };
}

/**
 * 채용정보 통계 계산
 */
export function calculateJobStats(jobs) {
  const total = jobs.length;
  
  const byAgency = jobs.reduce((acc, job) => {
    acc[job.agencyName] = (acc[job.agencyName] || 0) + 1;
    return acc;
  }, {});
  
  const byCategory = jobs.reduce((acc, job) => {
    if (job.categories) {
      job.categories.forEach(cat => {
        acc[cat] = (acc[cat] || 0) + 1;
      });
    }
    return acc;
  }, {});
  
  const byStatus = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});
  
  const totalHiring = jobs.reduce((sum, job) => sum + (job.requiredCount || 0), 0);
  
  return {
    total,
    byAgency,
    byCategory,
    byStatus,
    totalHiring,
    averageHiring: total > 0 ? Math.round(totalHiring / total) : 0
  };
}

/**
 * 트렌드 데이터 생성
 */
export function generateTrendData(jobs, timeframe = 'monthly') {
  const trends = {};
  
  jobs.forEach(job => {
    const date = new Date(job.startDate);
    let key;
    
    switch (timeframe) {
      case 'yearly':
        key = date.getFullYear().toString();
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'weekly':
        const week = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${week}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!trends[key]) {
      trends[key] = {
        period: key,
        count: 0,
        totalHiring: 0,
        agencies: new Set(),
        categories: new Set()
      };
    }
    
    trends[key].count++;
    trends[key].totalHiring += job.requiredCount || 0;
    trends[key].agencies.add(job.agencyName);
    if (job.categories) {
      job.categories.forEach(cat => trends[key].categories.add(cat));
    }
  });
  
  // Set을 배열로 변환
  return Object.values(trends).map(trend => ({
    ...trend,
    agencies: Array.from(trend.agencies),
    categories: Array.from(trend.categories),
    agencyCount: trend.agencies.length,
    categoryCount: trend.categories.length
  })).sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * 검색 결과 하이라이팅
 */
export function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

/**
 * 필터 조건에 맞는 채용정보 검색
 */
export function filterJobs(jobs, filters) {
  return jobs.filter(job => {
    // 기관 필터
    if (filters.agency && job.agencyName !== filters.agency) {
      return false;
    }
    
    // 직렬 필터
    if (filters.category && (!job.categories || !job.categories.includes(filters.category))) {
      return false;
    }
    
    // 상태 필터
    if (filters.status && job.status !== filters.status) {
      return false;
    }
    
    // 검색어 필터
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchTitle = job.jobTitle.toLowerCase().includes(query);
      const matchAgency = job.agencyName.toLowerCase().includes(query);
      const matchCategory = job.categories && job.categories.some(cat => 
        cat.toLowerCase().includes(query)
      );
      
      if (!matchTitle && !matchAgency && !matchCategory) {
        return false;
      }
    }
    
    // 날짜 범위 필터
    if (filters.dateFrom || filters.dateTo) {
      const jobDate = new Date(job.startDate);
      if (filters.dateFrom && jobDate < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && jobDate > new Date(filters.dateTo)) return false;
    }
    
    return true;
  });
}

/**
 * 정렬 함수
 */
export function sortJobs(jobs, sortBy, sortOrder = 'desc') {
  const sorted = [...jobs].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.startDate) - new Date(b.startDate);
        break;
      case 'deadline':
        comparison = new Date(a.endDate) - new Date(b.endDate);
        break;
      case 'agency':
        comparison = a.agencyName.localeCompare(b.agencyName);
        break;
      case 'hiring':
        comparison = a.requiredCount - b.requiredCount;
        break;
      case 'competition':
        const aComp = a.expectedCompetition || calculateExpectedCompetition(a);
        const bComp = b.expectedCompetition || calculateExpectedCompetition(b);
        comparison = aComp - bComp;
        break;
      default:
        comparison = new Date(a.startDate) - new Date(b.startDate);
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

/**
 * 추천 점수 계산
 */
export function calculateRecommendationScore(job, userPreferences = {}) {
  let score = 0;
  
  // 기본 점수
  score += 50;
  
  // 경쟁률이 낮을수록 높은 점수
  const competition = job.expectedCompetition || calculateExpectedCompetition(job);
  score += Math.max(0, 100 - competition);
  
  // 채용인원이 많을수록 높은 점수
  score += Math.min(50, job.requiredCount * 2);
  
  // 마감일이 멀수록 높은 점수 (준비 시간)
  const today = new Date();
  const deadline = new Date(job.endDate);
  const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  if (daysLeft > 7) score += 20;
  else if (daysLeft > 3) score += 10;
  
  // 사용자 선호도 반영
  if (userPreferences.preferredAgencies?.includes(job.agencyName)) {
    score += 30;
  }
  
  if (userPreferences.preferredCategories?.some(cat => 
    job.categories?.includes(cat)
  )) {
    score += 25;
  }
  
  return Math.min(100, Math.max(0, score));
}