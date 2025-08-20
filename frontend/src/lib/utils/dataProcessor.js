/**
 * 데이터 처리 및 변환 유틸리티 (개인화 대시보드용 고도화)
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

// =============================================================================
// 개인화 대시보드용 고급 데이터 처리 시스템
// =============================================================================

// 1. 직렬명 정규화 매핑 테이블
export const categoryNormalizer = {
  normalizeCategory: (rawCategory) => {
    const categoryMappings = {
      // 행정직 계열
      '행정직': { base: '행정직', type: '일반', specialty: null },
      '행정직_장애인': { base: '행정직', type: '장애인', specialty: null },
      '행정직(경력)': { base: '행정직', type: '경력', specialty: null },
      '행정직_기록물관리': { base: '행정직', type: '일반', specialty: '기록물관리' },
      '일반직(행정)': { base: '행정직', type: '일반', specialty: null },
      '경력직(행정)': { base: '행정직', type: '경력', specialty: null },
      '장애인(행정)': { base: '행정직', type: '장애인', specialty: null },
      
      // 기계직 계열  
      '기계직': { base: '기계직', type: '일반', specialty: null },
      '일반직(기계)': { base: '기계직', type: '일반', specialty: null },
      '경력직(기계)': { base: '기계직', type: '경력', specialty: null },
      '일반직(기계_안전)': { base: '기계직', type: '일반', specialty: '안전' },
      '일반직(기계_에너지관리)': { base: '기계직', type: '일반', specialty: '에너지관리' },
      '장애인(기계)': { base: '기계직', type: '장애인', specialty: null },
      
      // 전기직 계열
      '전기직': { base: '전기직', type: '일반', specialty: null },
      '일반직(전기)': { base: '전기직', type: '일반', specialty: null },
      '경력직(전기)': { base: '전기직', type: '경력', specialty: null },
      '일반직(전기)_고졸': { base: '전기직', type: '일반', specialty: '고졸' },
      '장애인(전기)': { base: '전기직', type: '장애인', specialty: null },
      
      // 공무직 계열
      '공무직(차량중정비)': { base: '기계직', type: '공무직', specialty: '차량중정비' },
      '공무직(전기설비 유지보수)': { base: '전기직', type: '공무직', specialty: '전기설비' },
      '공무직(시설관리)': { base: '시설관리직', type: '공무직', specialty: null },
      
      // 기타 직렬
      '운영직': { base: '운영직', type: '일반', specialty: null },
      '운전직': { base: '운전직', type: '일반', specialty: null },
      '토목직': { base: '토목직', type: '일반', specialty: null },
      '건축직': { base: '건축직', type: '일반', specialty: null },
      '신호직': { base: '신호직', type: '일반', specialty: null },
      '통신직': { base: '통신직', type: '일반', specialty: null },
      '환경직': { base: '환경직', type: '일반', specialty: null },
      '체험형 인턴': { base: '인턴직', type: '체험형', specialty: null },
      
      // 물류/항만 계열
      '물류직': { base: '물류직', type: '일반', specialty: null },
      '항만직': { base: '항만직', type: '일반', specialty: null },
      '해양직': { base: '해양직', type: '일반', specialty: null }
    };
    
    return categoryMappings[rawCategory] || { 
      base: rawCategory, 
      type: '일반', 
      specialty: null 
    };
  },
  
  // 직렬별 그룹핑
  groupByBase: (categories) => {
    const grouped = {};
    categories.forEach(cat => {
      const normalized = categoryNormalizer.normalizeCategory(cat);
      if (!grouped[normalized.base]) {
        grouped[normalized.base] = [];
      }
      grouped[normalized.base].push(normalized);
    });
    return grouped;
  },
  
  // 검색용 태그 생성
  generateSearchTags: (category) => {
    const normalized = categoryNormalizer.normalizeCategory(category);
    const tags = [normalized.base];
    
    if (normalized.type !== '일반') tags.push(normalized.type);
    if (normalized.specialty) tags.push(normalized.specialty);
    
    return tags;
  }
};

// 2. 채용 유형 분류 시스템
export const jobTypeClassifier = {
  classifyJobType: (job) => {
    const title = job.jobTitle.toLowerCase();
    const categories = job.categories ? job.categories.join(' ').toLowerCase() : '';
    
    // 인턴십 판별
    if (title.includes('인턴') || categories.includes('인턴')) {
      return {
        employmentType: '인턴',
        isRegular: false,
        duration: '체험형',
        priority: 1 // 경험 우선
      };
    }
    
    // 공무직 판별
    if (categories.includes('공무직')) {
      return {
        employmentType: '공무직',
        isRegular: false,
        duration: '계약직',
        priority: 2
      };
    }
    
    // 정규직 판별 (기본값)
    return {
      employmentType: '정규직',
      isRegular: true,
      duration: '무기한',
      priority: 3
    };
  },
  
  // 시험 유형 분류
  classifyExamType: (categories) => {
    const categoryStr = categories ? categories.join(' ') : '';
    
    if (categoryStr.includes('장애인')) return '장애인';
    if (categoryStr.includes('경력')) return '경력';
    if (categoryStr.includes('보훈')) return '보훈';
    return '일반';
  }
};

// 3. 경쟁난이도 계산 시스템
export const competitionAnalyzer = {
  calculateDifficultyIndex: (job, competitionData = []) => {
    let difficultyScore = 0;
    let factors = [];
    
    // 1. 경쟁률 기반 점수 (40점)
    const competition = competitionData.find(comp => 
      comp.agencyName === job.agencyName && 
      job.categories && job.categories.some(cat => 
        comp.category && comp.category.includes(cat)
      )
    );
    
    if (competition) {
      let rate;
      if (typeof competition.competitionRate === 'string' && competition.competitionRate.includes(':')) {
        rate = parseFloat(competition.competitionRate.split(':')[0]);
      } else {
        rate = parseFloat(competition.competitionRate);
      }
      
      if (!isNaN(rate) && isFinite(rate)) {
        if (rate <= 10) {
          difficultyScore += 10;
          factors.push({ factor: '낮은 경쟁률', score: 10, color: 'green' });
        } else if (rate <= 30) {
          difficultyScore += 20;
          factors.push({ factor: '보통 경쟁률', score: 20, color: 'yellow' });
        } else if (rate <= 60) {
          difficultyScore += 30;
          factors.push({ factor: '높은 경쟁률', score: 30, color: 'orange' });
        } else {
          difficultyScore += 40;
          factors.push({ factor: '매우 높은 경쟁률', score: 40, color: 'red' });
        }
      }
    } else {
      // 경쟁률 데이터가 없으면 예상 경쟁률로 계산
      const estimatedRate = job.requiredCount > 100 ? 25 : 
                           job.requiredCount > 50 ? 45 : 
                           job.requiredCount > 20 ? 65 : 85;
      
      if (estimatedRate <= 30) {
        difficultyScore += 20;
        factors.push({ factor: '예상 보통 경쟁률', score: 20, color: 'yellow' });
      } else if (estimatedRate <= 60) {
        difficultyScore += 30;
        factors.push({ factor: '예상 높은 경쟁률', score: 30, color: 'orange' });
      } else {
        difficultyScore += 35;
        factors.push({ factor: '예상 매우 높은 경쟁률', score: 35, color: 'red' });
      }
    }
    
    // 2. 채용 규모 기반 점수 (30점)
    if (job.requiredCount >= 100) {
      difficultyScore += 5;
      factors.push({ factor: '대규모 채용', score: 5, color: 'green' });
    } else if (job.requiredCount >= 20) {
      difficultyScore += 15;
      factors.push({ factor: '중규모 채용', score: 15, color: 'yellow' });
    } else if (job.requiredCount >= 5) {
      difficultyScore += 25;
      factors.push({ factor: '소규모 채용', score: 25, color: 'orange' });
    } else {
      difficultyScore += 30;
      factors.push({ factor: '소수정예 채용', score: 30, color: 'red' });
    }
    
    // 3. 시험 유형 기반 점수 (20점)
    const examType = jobTypeClassifier.classifyExamType(job.categories);
    switch(examType) {
      case '경력':
        difficultyScore += 5;
        factors.push({ factor: '경력직 우대', score: 5, color: 'green' });
        break;
      case '장애인':
        difficultyScore += 3;
        factors.push({ factor: '장애인 전형', score: 3, color: 'green' });
        break;
      case '보훈':
        difficultyScore += 7;
        factors.push({ factor: '보훈대상자 우대', score: 7, color: 'green' });
        break;
      default:
        difficultyScore += 15;
        factors.push({ factor: '일반 전형', score: 15, color: 'yellow' });
    }
    
    // 4. 기관별 선호도 점수 (10점)
    const popularAgencies = ['부산교통공사', '부산항만공사'];
    if (popularAgencies.includes(job.agencyName)) {
      difficultyScore += 10;
      factors.push({ factor: '인기 기관', score: 10, color: 'orange' });
    } else {
      difficultyScore += 5;
      factors.push({ factor: '일반 기관', score: 5, color: 'yellow' });
    }
    
    return {
      totalScore: difficultyScore,
      level: getDifficultyLevel(difficultyScore),
      factors: factors,
      recommendation: generateRecommendation(difficultyScore)
    };
  }
};

function getDifficultyLevel(score) {
  if (score <= 30) return { level: '쉬움', color: 'green', icon: '😊' };
  if (score <= 50) return { level: '보통', color: 'yellow', icon: '😐' };
  if (score <= 70) return { level: '어려움', color: 'orange', icon: '😅' };
  return { level: '매우 어려움', color: 'red', icon: '😰' };
}

function generateRecommendation(score) {
  if (score <= 30) {
    return '지원 추천! 합격 가능성이 높은 공고입니다.';
  } else if (score <= 50) {
    return '도전해볼만한 공고입니다. 충실한 준비가 필요합니다.';
  } else if (score <= 70) {
    return '높은 경쟁률이 예상됩니다. 차별화된 준비가 중요합니다.';
  } else {
    return '매우 높은 경쟁률이 예상됩니다. 신중한 지원 결정이 필요합니다.';
  }
}

// 4. 시간 기반 분석 시스템
export const timeAnalyzer = {
  // 날짜 정규화
  normalizeDate: (dateString) => {
    if (!dateString) return null;
    return new Date(dateString.split(' ')[0]);
  },
  
  // 채용 시기 패턴 분석
  analyzeRecruitmentPatterns: (jobs) => {
    const patterns = {
      seasonal: { spring: 0, summer: 0, fall: 0, winter: 0 },
      monthly: Array(12).fill(0),
      duration: { short: 0, medium: 0, long: 0 },
      agencies: {}
    };
    
    jobs.forEach(job => {
      const startDate = timeAnalyzer.normalizeDate(job.startDate);
      const endDate = timeAnalyzer.normalizeDate(job.endDate);
      
      if (startDate && endDate) {
        patterns.monthly[startDate.getMonth()]++;
        
        const season = getSeason(startDate.getMonth());
        patterns.seasonal[season]++;
        
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (duration <= 14) patterns.duration.short++;
        else if (duration <= 30) patterns.duration.medium++;
        else patterns.duration.long++;
        
        if (!patterns.agencies[job.agencyName]) {
          patterns.agencies[job.agencyName] = { months: Array(12).fill(0), avgDuration: 0 };
        }
        patterns.agencies[job.agencyName].months[startDate.getMonth()]++;
      }
    });
    
    return patterns;
  },
  
  // 개인 맞춤 일정 추천
  generatePersonalSchedule: (jobs, userPreferences = {}) => {
    const relevantJobs = jobs.filter(job => 
      userPreferences.interestedAgencies?.includes(job.agencyName) ||
      (job.categories && userPreferences.targetCategories?.some(cat => 
        job.categories.includes(cat)
      ))
    );
    
    return relevantJobs.map(job => ({
      ...job,
      timeline: {
        announcement: timeAnalyzer.normalizeDate(job.startDate),
        applicationOpen: timeAnalyzer.normalizeDate(job.applicationStart),
        applicationClose: timeAnalyzer.normalizeDate(job.applicationEnd),
        appointment: timeAnalyzer.normalizeDate(job.appointmentDate),
        preparationDays: calculatePreparationDays(job),
        urgencyLevel: getUrgencyLevel(job)
      }
    }));
  }
};

function getSeason(month) {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

function calculatePreparationDays(job) {
  const today = new Date();
  const applicationStart = timeAnalyzer.normalizeDate(job.applicationStart);
  
  if (applicationStart && applicationStart > today) {
    return Math.ceil((applicationStart - today) / (1000 * 60 * 60 * 24));
  }
  
  const applicationEnd = timeAnalyzer.normalizeDate(job.applicationEnd);
  if (applicationEnd && applicationEnd > today) {
    return Math.ceil((applicationEnd - today) / (1000 * 60 * 60 * 24));
  }
  
  return 0;
}

function getUrgencyLevel(job) {
  const preparationDays = calculatePreparationDays(job);
  
  if (preparationDays <= 3) return { level: 'urgent', color: 'red' };
  if (preparationDays <= 7) return { level: 'high', color: 'orange' };
  if (preparationDays <= 30) return { level: 'medium', color: 'yellow' };
  return { level: 'low', color: 'green' };
}

// 5. 통합 데이터 가공 파이프라인
export const dataProcessor = {
  enhanceJobData: (rawJobs, competitionData = [], hiringData = []) => {
    return rawJobs.map(job => {
      // 1. 직렬 정규화
      const normalizedCategories = job.categories?.map(cat => 
        categoryNormalizer.normalizeCategory(cat)
      ) || [];
      
      // 2. 채용 유형 분류
      const jobClassification = jobTypeClassifier.classifyJobType(job);
      
      // 3. 경쟁 난이도 계산
      const difficultyAnalysis = competitionAnalyzer.calculateDifficultyIndex(job, competitionData);
      
      // 4. 시간 정보 가공
      const timelineInfo = {
        announcement: timeAnalyzer.normalizeDate(job.startDate),
        applicationOpen: timeAnalyzer.normalizeDate(job.applicationStart),
        applicationClose: timeAnalyzer.normalizeDate(job.applicationEnd),
        appointment: timeAnalyzer.normalizeDate(job.appointmentDate),
        preparationDays: calculatePreparationDays(job),
        urgencyLevel: getUrgencyLevel(job)
      };
      
      // 5. 검색 태그 생성
      const searchTags = [
        ...(job.categories?.flatMap(cat => categoryNormalizer.generateSearchTags(cat)) || []),
        job.agencyName,
        jobClassification.employmentType,
        difficultyAnalysis.level.level
      ];
      
      return {
        ...job,
        // 정규화된 데이터 추가
        normalizedCategories,
        jobClassification,
        difficultyAnalysis,
        timelineInfo,
        searchTags,
        
        // 계산된 메타데이터
        metadata: {
          popularityScore: calculatePopularityScore(job, competitionData),
          opportunityScore: calculateOpportunityScore(job, difficultyAnalysis),
          timeToDeadline: calculateTimeToDeadline(job),
          matchScore: 0 // 개인화 시 계산
        }
      };
    });
  }
};

// 헬퍼 함수들
function calculatePopularityScore(job, competitionData) {
  const baseScore = job.requiredCount > 100 ? 80 : 
                   job.requiredCount > 50 ? 60 : 
                   job.requiredCount > 20 ? 40 : 20;
  
  const popularAgencies = ['부산교통공사', '부산항만공사'];
  const popularityBonus = popularAgencies.includes(job.agencyName) ? 20 : 0;
  
  return Math.min(baseScore + popularityBonus, 100);
}

function calculateOpportunityScore(job, difficultyAnalysis) {
  const sizeScore = job.requiredCount > 100 ? 90 : 
                   job.requiredCount > 50 ? 70 : 
                   job.requiredCount > 20 ? 50 : 30;
  
  const difficultyPenalty = difficultyAnalysis.totalScore > 70 ? -20 : 
                           difficultyAnalysis.totalScore > 50 ? -10 : 0;
  
  return Math.max(sizeScore + difficultyPenalty, 0);
}

function calculateTimeToDeadline(job) {
  const today = new Date();
  const endDate = timeAnalyzer.normalizeDate(job.applicationEnd || job.endDate);
  
  if (endDate && endDate > today) {
    return Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  }
  
  return -1; // 마감됨
}

// 개인화 매칭 스코어 계산
export function calculatePersonalMatchScore(job, userProfile) {
  if (!userProfile || !userProfile.preferences) return 0;
  
  let score = 0;
  const prefs = userProfile.preferences;
  
  // 1. 관심 기관 매칭 (30점)
  if (prefs.interestedAgencies?.includes(job.agencyName)) {
    score += 30;
  }
  
  // 2. 희망 직렬 매칭 (25점)
  if (job.categories && prefs.targetCategories) {
    const matchingCategories = job.categories.filter(cat => 
      prefs.targetCategories.includes(cat)
    );
    score += (matchingCategories.length / job.categories.length) * 25;
  }
  
  // 3. 경쟁률 선호도 (20점)
  if (job.difficultyAnalysis && prefs.competitionThreshold) {
    const difficulty = job.difficultyAnalysis.totalScore;
    if (difficulty <= prefs.competitionThreshold) {
      score += 20;
    } else if (difficulty <= prefs.competitionThreshold * 1.5) {
      score += 10;
    }
  }
  
  // 4. 채용규모 선호도 (15점)
  if (prefs.minHiringSize && job.requiredCount >= prefs.minHiringSize) {
    score += 15;
  }
  
  // 5. 시험 유형 선호도 (10점)
  if (job.jobClassification && prefs.preferredExamTypes?.includes(job.jobClassification.examType)) {
    score += 10;
  }
  
  return Math.min(score, 100); // 최대 100점
}