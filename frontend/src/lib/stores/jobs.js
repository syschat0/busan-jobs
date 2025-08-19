import { writable, derived } from 'svelte/store';
import jobsData from '$lib/data/jobs.json';
import competitionData from '$lib/data/competition.json';
import agenciesData from '$lib/data/agencies.json';

// 기본 데이터 stores
export const jobs = writable(jobsData);
export const competition = writable(competitionData);
export const agencies = writable(agenciesData);

// 필터링 상태
export const filters = writable({
  agency: '',
  category: '',
  status: '',
  dateRange: '',
  searchQuery: '',
  competitionLevel: '', // low, medium, high
  sortBy: 'latest' // latest, deadline, competition, hiring
});

// 즐겨찾기
export const favorites = writable(
  typeof localStorage !== 'undefined' 
    ? JSON.parse(localStorage.getItem('favorites') || '[]')
    : []
);

// 즐겨찾기 localStorage 동기화
if (typeof localStorage !== 'undefined') {
  favorites.subscribe(value => {
    localStorage.setItem('favorites', JSON.stringify(value));
  });
}

// 파생된 상태들
export const filteredJobs = derived(
  [jobs, competition, filters],
  ([$jobs, $competition, $filters]) => {
    let filtered = [...$jobs];
    
    // 기관 필터
    if ($filters.agency) {
      filtered = filtered.filter(job => job.agencyName === $filters.agency);
    }
    
    // 직렬 필터
    if ($filters.category) {
      filtered = filtered.filter(job => 
        job.categories && job.categories.includes($filters.category)
      );
    }
    
    // 상태 필터
    if ($filters.status) {
      filtered = filtered.filter(job => job.status === $filters.status);
    }
    
    // 검색어 필터
    if ($filters.searchQuery) {
      const query = $filters.searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.jobTitle.toLowerCase().includes(query) ||
        job.agencyName.toLowerCase().includes(query) ||
        (job.categories && job.categories.some(cat => 
          cat.toLowerCase().includes(query)
        ))
      );
    }
    
    // 경쟁률 수준 필터
    if ($filters.competitionLevel) {
      filtered = filtered.filter(job => {
        const expectedCompetition = getExpectedCompetition(job.requiredCount);
        if ($filters.competitionLevel === 'low') return expectedCompetition < 30;
        if ($filters.competitionLevel === 'medium') return expectedCompetition >= 30 && expectedCompetition < 60;
        if ($filters.competitionLevel === 'high') return expectedCompetition >= 60;
        return true;
      });
    }
    
    // 정렬
    switch ($filters.sortBy) {
      case 'deadline':
        filtered.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
        break;
      case 'competition':
        filtered.sort((a, b) => 
          getExpectedCompetition(a.requiredCount) - getExpectedCompetition(b.requiredCount)
        );
        break;
      case 'hiring':
        filtered.sort((a, b) => b.requiredCount - a.requiredCount);
        break;
      case 'latest':
      default:
        filtered.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        break;
    }
    
    return filtered;
  }
);

// 통계 정보
export const stats = derived(
  [jobs, competition],
  ([$jobs, $competition]) => {
    const today = new Date();
    
    const activeJobs = $jobs.filter(job => 
      job.status === '접수중' || job.status === '진행중'
    ).length;
    
    const urgentJobs = $jobs.filter(job => {
      const endDate = new Date(job.endDate);
      const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 3 && job.status !== '마감';
    }).length;
    
    const thisMonthJobs = $jobs.filter(job => {
      const startDate = new Date(job.startDate);
      return startDate.getMonth() === today.getMonth() && 
             startDate.getFullYear() === today.getFullYear();
    }).length;
    
    const totalHired = $jobs.reduce((sum, job) => sum + (job.requiredCount || 0), 0);
    
    return {
      totalJobs: $jobs.length,
      activeJobs,
      urgentJobs,
      thisMonthJobs,
      totalHired,
      avgCompetition: '45.2:1' // 실제 계산 로직 추가 필요
    };
  }
);

// 기관별 실제 경쟁률 통계 계산
function getAgencyCompetitionStats(agencyName, competitionData) {
  const agencyCompetitions = competitionData.filter(comp => 
    comp.agencyName === agencyName
  );
  
  if (agencyCompetitions.length === 0) {
    return '계산중';
  }
  
  const rates = agencyCompetitions.map(comp => {
    if (typeof comp.competitionRate === 'string' && comp.competitionRate.includes(':')) {
      return parseFloat(comp.competitionRate.split(':')[0]);
    }
    return parseFloat(comp.competitionRate);
  }).filter(rate => !isNaN(rate) && rate > 0);
  
  if (rates.length === 0) {
    return '계산중';
  }
  
  const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  return `${Math.round(avg * 10) / 10}:1`;
}

// 기관별 통계를 포함한 기관 목록
export const agenciesWithStats = derived(
  [jobs, competition, agencies],
  ([$jobs, $competition, $agencies]) => {
    return $agencies.map(agency => {
      const agencyJobs = $jobs.filter(job => job.agencyName === agency.name);
      const activeJobs = agencyJobs.filter(job => 
        job.status === '접수중' || job.status === '진행중'
      ).length;
      
      // 인기 직렬 계산
      const categoryCount = {};
      agencyJobs.forEach(job => {
        if (job.categories) {
          job.categories.forEach(cat => {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          });
        }
      });
      
      const popularCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);
      
      return {
        ...agency,
        stats: {
          totalJobs: activeJobs,
          avgCompetition: getAgencyCompetitionStats(agency.name, $competition),
          popularCategories
        }
      };
    });
  }
);

// 유니크한 기관 목록 (기존)
export const uniqueAgencies = derived(
  [jobs],
  ([$jobs]) => {
    const agencySet = new Set($jobs.map(job => job.agencyName));
    return Array.from(agencySet).sort();
  }
);

// 유니크한 직렬 목록
export const uniqueCategories = derived(
  [jobs],
  ([$jobs]) => {
    const categorySet = new Set();
    $jobs.forEach(job => {
      if (job.categories) {
        job.categories.forEach(cat => categorySet.add(cat));
      }
    });
    return Array.from(categorySet).sort();
  }
);

// 헬퍼 함수들
function getExpectedCompetition(requiredCount) {
  // 채용인원에 따른 예상 경쟁률 계산
  return requiredCount > 100 ? 25 : 
         requiredCount > 50 ? 45 : 
         requiredCount > 20 ? 65 : 85;
}

// 액션 함수들
export function addToFavorites(jobId) {
  favorites.update(faves => {
    if (!faves.includes(jobId)) {
      return [...faves, jobId];
    }
    return faves;
  });
}

export function removeFromFavorites(jobId) {
  favorites.update(faves => faves.filter(id => id !== jobId));
}

export function toggleFavorite(jobId) {
  favorites.update(faves => {
    if (faves.includes(jobId)) {
      return faves.filter(id => id !== jobId);
    } else {
      return [...faves, jobId];
    }
  });
}

export function updateFilters(newFilters) {
  filters.update(current => ({
    ...current,
    ...newFilters
  }));
}

export function resetFilters() {
  filters.set({
    agency: '',
    category: '',
    status: '',
    dateRange: '',
    searchQuery: '',
    competitionLevel: '',
    sortBy: 'latest'
  });
}

// 즐겨찾기된 채용정보
export const favoriteJobs = derived(
  [jobs, favorites],
  ([$jobs, $favorites]) => {
    return $jobs.filter(job => $favorites.includes(job.id));
  }
);

// 추천 채용정보 (진행중이고 경쟁률이 낮은 것들)
export const recommendedJobs = derived(
  [jobs],
  ([$jobs]) => {
    return $jobs
      .filter(job => job.status === '접수중' || job.status === '진행중')
      .filter(job => job.requiredCount > 50) // 대규모 채용
      .sort((a, b) => b.requiredCount - a.requiredCount)
      .slice(0, 6);
  }
);

// 마감임박 채용정보
export const urgentJobs = derived(
  [jobs],
  ([$jobs]) => {
    const today = new Date();
    return $jobs
      .filter(job => {
        const endDate = new Date(job.endDate);
        const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 5 && job.status !== '마감';
      })
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
      .slice(0, 10);
  }
);