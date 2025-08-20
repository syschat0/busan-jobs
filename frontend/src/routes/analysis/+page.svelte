<script>
  import { onMount } from 'svelte';
  import { TrendingUp, BarChart3, PieChart, Users, Calendar, Target, Zap, Activity } from 'lucide-svelte';
  import Chart from '$lib/components/Chart.svelte';
  import ScatterChart from '$lib/components/ScatterChart.svelte';
  import { config } from '$lib/utils/config.js';
  import RadarChart from '$lib/components/RadarChart.svelte';
  import AnalysisFilters from '$lib/components/AnalysisFilters.svelte';
  
  import jobsData from '$lib/data/jobs.json';
  import competitionData from '$lib/data/competition.json';
  import agenciesData from '$lib/data/agencies.json';
  
  let jobs = [];
  let competition = [];
  let agencies = [];
  
  // 필터링된 데이터
  let filteredJobs = [];
  let filteredCompetition = [];
  
  // 필터 상태
  let currentFilters = {
    agencies: [],
    categories: [],
    years: [],
    competitionRange: [0, 100]
  };
  
  // 차트 데이터
  let agencyJobsChart = {};
  let competitionTrendChart = {};
  let categoryDistributionChart = {};
  let hiringTrendChart = {};
  let scatterChart = {};
  let radarChart = {};
  let agencyCategoryChart = {};
  let yearCategoryTrendChart = {};
  
  // 채용규모 차트 전환 상태
  let showTotalHiring = false;
  
  // 기준 년도 선택
  let baseYear = 'all'; // 'all' 또는 특정 연도
  
  // 필터 옵션
  let availableAgencies = [];
  let availableCategories = [];
  let availableYears = [];
  
  onMount(() => {
    jobs = jobsData;
    competition = competitionData;
    agencies = agenciesData;
    
    initializeFilters();
    applyFilters();
  });
  
  function initializeFilters() {
    // 기관 목록 추출
    availableAgencies = [...new Set(jobs.map(job => job.agencyName))];
    
    // 직렬 목록 추출
    const allCategories = new Set();
    jobs.forEach(job => {
      if (job.categories && Array.isArray(job.categories)) {
        job.categories.forEach(category => allCategories.add(category));
      }
    });
    availableCategories = Array.from(allCategories).sort();
    
    // 연도 목록 추출
    const allYears = new Set();
    jobs.forEach(job => {
      const year = new Date(job.startDate).getFullYear();
      allYears.add(year);
    });
    competition.forEach(comp => {
      if (comp.year) allYears.add(comp.year);
    });
    availableYears = Array.from(allYears).sort((a, b) => b - a);
  }
  
  function applyFilters() {
    // 채용공고 필터링
    filteredJobs = jobs.filter(job => {
      // 기준 년도 필터 (가장 먼저 적용)
      if (baseYear !== 'all') {
        const jobYear = new Date(job.startDate).getFullYear();
        if (jobYear !== parseInt(baseYear)) return false;
      }
      
      // 기관 필터
      if (currentFilters.agencies.length > 0 && !currentFilters.agencies.includes(job.agencyName)) {
        return false;
      }
      
      // 직렬 필터
      if (currentFilters.categories.length > 0) {
        const hasMatchingCategory = job.categories && job.categories.some(cat => 
          currentFilters.categories.includes(cat)
        );
        if (!hasMatchingCategory) return false;
      }
      
      // 연도 필터 (기준 년도와는 별개의 추가 필터)
      if (currentFilters.years.length > 0) {
        const jobYear = new Date(job.startDate).getFullYear();
        if (!currentFilters.years.includes(jobYear)) return false;
      }
      
      return true;
    });
    
    // 경쟁률 데이터 필터링
    filteredCompetition = competition.filter(comp => {
      // 기준 년도 필터
      if (baseYear !== 'all') {
        const compYear = comp.year || new Date().getFullYear();
        if (compYear !== parseInt(baseYear)) return false;
      }
      
      // 기관 필터
      if (currentFilters.agencies.length > 0 && !currentFilters.agencies.includes(comp.agencyName)) {
        return false;
      }
      
      // 경쟁률 범위 필터
      let rate;
      if (typeof comp.competitionRate === 'string' && comp.competitionRate.includes(':')) {
        rate = parseFloat(comp.competitionRate.split(':')[0]);
      } else {
        rate = parseFloat(comp.competitionRate);
      }
      
      if (!isNaN(rate) && isFinite(rate)) {
        if (rate < currentFilters.competitionRange[0] || rate > currentFilters.competitionRange[1]) {
          return false;
        }
      }
      
      return true;
    });
    
    generateChartData();
  }
  
  function handleFilterChange(event) {
    currentFilters = event.detail;
    applyFilters();
  }
  
  // 기준 년도 변경 시 자동으로 필터 적용
  $: if (baseYear !== undefined) {
    applyFilters();
  }
  
  function generateChartData() {
    // 1. 기관별 년도별 채용인원 수 (연도별 분리)
    const agencyYearlyRecruitCount = {};
    const availableYearsForChart = new Set();
    
    filteredJobs.forEach(job => {
      const year = new Date(job.startDate).getFullYear();
      const recruitCount = job.requiredCount || 1;
      
      if (!agencyYearlyRecruitCount[job.agencyName]) {
        agencyYearlyRecruitCount[job.agencyName] = {};
      }
      
      if (!agencyYearlyRecruitCount[job.agencyName][year]) {
        agencyYearlyRecruitCount[job.agencyName][year] = 0;
      }
      
      agencyYearlyRecruitCount[job.agencyName][year] += recruitCount;
      availableYearsForChart.add(year);
    });
    
    const sortedYears = Array.from(availableYearsForChart).sort();
    const agencies = Object.keys(agencyYearlyRecruitCount);
    
    // 년도별 데이터셋 생성
    const yearColors = [
      '#3b82f6', '#f97316', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1'
    ];
    
    const datasets = sortedYears.map((year, index) => ({
      label: `${year}년`,
      data: agencies.map(agency => agencyYearlyRecruitCount[agency][year] || 0),
      backgroundColor: yearColors[index % yearColors.length],
      borderRadius: 4,
      borderSkipped: false
    }));
    
    agencyJobsChart = {
      labels: agencies,
      datasets: datasets
    };
    
    // 2. 기관별 연도별 경쟁률 트렌드
    const agencyYearlyCompetition = {};
    const availableYearsForCompetition = new Set();
    
    // 실제 경쟁률 데이터 사용 (필터링된)
    if (filteredCompetition && filteredCompetition.length > 0) {
      filteredCompetition.forEach(comp => {
        const year = comp.year || new Date().getFullYear();
        const agency = comp.agencyName;
        
        if (!agencyYearlyCompetition[agency]) {
          agencyYearlyCompetition[agency] = {};
        }
        if (!agencyYearlyCompetition[agency][year]) {
          agencyYearlyCompetition[agency][year] = { total: 0, count: 0 };
        }
        
        // 경쟁률에서 숫자만 추출 (예: "100.6:1" -> 100.6)
        let rate;
        if (typeof comp.competitionRate === 'string' && comp.competitionRate.includes(':')) {
          rate = parseFloat(comp.competitionRate.split(':')[0]);
        } else {
          rate = parseFloat(comp.competitionRate);
        }
        
        if (!isNaN(rate) && rate > 0 && isFinite(rate)) {
          agencyYearlyCompetition[agency][year].total += rate;
          agencyYearlyCompetition[agency][year].count += 1;
          availableYearsForCompetition.add(year);
        }
      });
      
      console.log('기관별 연도별 경쟁률 데이터:', agencyYearlyCompetition);
    }
    
    // 경쟁률 데이터가 없거나 부족한 경우 채용정보 기반으로 보완
    if (Object.keys(agencyYearlyCompetition).length === 0) {
      console.log('경쟁률 데이터 없음, 추정값 사용');
      filteredJobs.forEach(job => {
        const year = new Date(job.startDate).getFullYear();
        const agency = job.agencyName;
        
        if (!agencyYearlyCompetition[agency]) {
          agencyYearlyCompetition[agency] = {};
        }
        if (!agencyYearlyCompetition[agency][year]) {
          agencyYearlyCompetition[agency][year] = { total: 0, count: 0 };
        }
        
        // 예상 경쟁률 계산
        const estimatedRate = job.requiredCount > 100 ? 25 : 
                             job.requiredCount > 50 ? 45 : 
                             job.requiredCount > 20 ? 65 : 85;
        agencyYearlyCompetition[agency][year].total += estimatedRate;
        agencyYearlyCompetition[agency][year].count += 1;
        availableYearsForCompetition.add(year);
      });
    }
    
    const competitionYears = Array.from(availableYearsForCompetition).sort();
    const agenciesForCompetition = Object.keys(agencyYearlyCompetition);
    
    // 기관별 색상 정의
    const agencyColors = [
      { border: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' },   // 파랑
      { border: '#f97316', background: 'rgba(249, 115, 22, 0.1)' },   // 주황
      { border: '#10b981', background: 'rgba(16, 185, 129, 0.1)' },   // 초록
      { border: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' },   // 노랑
      { border: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' },    // 빨강
      { border: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' },   // 보라
      { border: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' },    // 청록
      { border: '#84cc16', background: 'rgba(132, 204, 22, 0.1)' }     // 라임
    ];
    
    // 기관별 데이터셋 생성
    const competitionDatasets = agenciesForCompetition.map((agency, index) => {
      const color = agencyColors[index % agencyColors.length];
      const data = competitionYears.map(year => {
        if (agencyYearlyCompetition[agency][year] && agencyYearlyCompetition[agency][year].count > 0) {
          const avg = agencyYearlyCompetition[agency][year].total / agencyYearlyCompetition[agency][year].count;
          return Math.round(avg * 10) / 10;
        }
        return null; // 데이터가 없는 경우 null로 표시
      });
      
      return {
        label: agency,
        data: data,
        borderColor: color.border,
        backgroundColor: color.background,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: color.border,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        spanGaps: true // null 값 사이를 연결
      };
    });
    
    competitionTrendChart = {
      labels: competitionYears,
      datasets: competitionDatasets
    };
    
    // 3. 채용규모별 분포 (더 실용적인 정보 제공)
    const sizeCategories = {
      "대규모 (100명 이상)": 0,
      "중규모 (50-99명)": 0, 
      "소규모 (10-49명)": 0,
      "소수정예 (10명 미만)": 0
    };
    
    // 총 채용인원도 함께 계산
    const sizeCategoriesTotal = {
      "대규모 (100명 이상)": 0,
      "중규모 (50-99명)": 0,
      "소규모 (10-49명)": 0, 
      "소수정예 (10명 미만)": 0
    };
    
    filteredJobs.forEach(job => {
      const count = job.requiredCount || 1;
      
      if (count >= 100) {
        sizeCategories["대규모 (100명 이상)"]++;
        sizeCategoriesTotal["대규모 (100명 이상)"] += count;
      } else if (count >= 50) {
        sizeCategories["중규모 (50-99명)"]++;
        sizeCategoriesTotal["중규모 (50-99명)"] += count;
      } else if (count >= 10) {
        sizeCategories["소규모 (10-49명)"]++;
        sizeCategoriesTotal["소규모 (10-49명)"] += count;
      } else {
        sizeCategories["소수정예 (10명 미만)"]++;
        sizeCategoriesTotal["소수정예 (10명 미만)"] += count;
      }
    });
    
    // 채용공고 건수 기준 차트
    categoryDistributionChart = {
      labels: Object.keys(sizeCategories),
      datasets: [{
        label: '채용공고 건수',
        data: Object.values(sizeCategories),
        backgroundColor: [
          '#3b82f6', // 대규모 - 파랑
          '#10b981', // 중규모 - 초록  
          '#f59e0b', // 소규모 - 노랑
          '#ef4444'  // 소수정예 - 빨강
        ],
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
    
    // 총 채용인원 기준 차트도 별도로 생성
    const totalHiringChart = {
      labels: Object.keys(sizeCategoriesTotal),
      datasets: [{
        label: '총 채용인원',
        data: Object.values(sizeCategoriesTotal),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // 대규모
          'rgba(16, 185, 129, 0.8)',   // 중규모
          'rgba(245, 158, 11, 0.8)',   // 소규모  
          'rgba(239, 68, 68, 0.8)'     // 소수정예
        ],
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
    
    // 차트 전환을 위해 저장 (전역 변수 대신 컴포넌트 변수 사용)
    categoryDistributionChart.totalHiringChart = totalHiringChart;
    
    // 4. 기관별 월별 채용 인원 트렌드
    const agencyMonthlyHiring = {};
    
    filteredJobs.forEach(job => {
      const month = new Date(job.startDate).getMonth();
      const agency = job.agencyName;
      const recruitCount = job.requiredCount || 1;
      
      if (!agencyMonthlyHiring[agency]) {
        agencyMonthlyHiring[agency] = Array(12).fill(0);
      }
      
      agencyMonthlyHiring[agency][month] += recruitCount;
    });
    
    const agenciesForMonthly = Object.keys(agencyMonthlyHiring);
    
    // 기관별 월별 데이터셋 생성
    const monthlyDatasets = agenciesForMonthly.map((agency, index) => {
      const color = agencyColors[index % agencyColors.length];
      
      return {
        label: agency,
        data: agencyMonthlyHiring[agency],
        backgroundColor: color.background,
        borderColor: color.border,
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: color.border,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      };
    });
    
    hiringTrendChart = {
      labels: [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
      ],
      datasets: monthlyDatasets
    };
    
    // 5. 산점도 차트 - 채용인원 vs 경쟁률
    const scatterData = [];
    filteredJobs.forEach(job => {
      // 해당 채용공고의 경쟁률 찾기
      const compData = filteredCompetition.find(comp => 
        comp.agencyName === job.agencyName && 
        (comp.category === job.categories?.[0] || comp.jobTitle === job.jobTitle)
      );
      
      if (compData && job.requiredCount) {
        let rate;
        if (typeof compData.competitionRate === 'string' && compData.competitionRate.includes(':')) {
          rate = parseFloat(compData.competitionRate.split(':')[0]);
        } else {
          rate = parseFloat(compData.competitionRate);
        }
        
        if (!isNaN(rate) && isFinite(rate)) {
          scatterData.push({
            x: job.requiredCount,
            y: rate,
            label: `${job.agencyName} - ${job.jobTitle}`
          });
        }
      }
    });
    
    scatterChart = {
      datasets: [{
        label: '채용인원 vs 경쟁률',
        data: scatterData,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    };
    
    // 6. 레이더 차트 - 기관별 특성 비교
    const agencyStats = {};
    availableAgencies.forEach(agency => {
      const agencyJobs = filteredJobs.filter(job => job.agencyName === agency);
      const agencyComp = filteredCompetition.filter(comp => comp.agencyName === agency);
      
      // 각 기관의 특성 계산
      const avgRequiredCount = agencyJobs.length > 0 ? 
        agencyJobs.reduce((sum, job) => sum + (job.requiredCount || 0), 0) / agencyJobs.length : 0;
      
      const avgCompetitionRate = agencyComp.length > 0 ? 
        agencyComp.reduce((sum, comp) => {
          let rate;
          if (typeof comp.competitionRate === 'string' && comp.competitionRate.includes(':')) {
            rate = parseFloat(comp.competitionRate.split(':')[0]);
          } else {
            rate = parseFloat(comp.competitionRate);
          }
          return sum + (isNaN(rate) ? 0 : rate);
        }, 0) / agencyComp.length : 0;
      
      // 카테고리 다양성 (0-100 척도로 정규화)
      const uniqueCategories = new Set();
      agencyJobs.forEach(job => {
        if (job.categories) {
          job.categories.forEach(cat => uniqueCategories.add(cat));
        }
      });
      const categoryDiversity = Math.min((uniqueCategories.size / 10) * 100, 100);
      
      // 총 채용인원 계산
      const totalRecruitCount = agencyJobs.reduce((sum, job) => sum + (job.requiredCount || 1), 0);
      
      agencyStats[agency] = {
        채용규모: Math.min((avgRequiredCount / 100) * 100, 100), // 0-100 척도
        경쟁률: Math.min((avgCompetitionRate / 50) * 100, 100), // 0-100 척도
        직렬다양성: categoryDiversity,
        채용인원: Math.min((totalRecruitCount / 500) * 100, 100) // 0-100 척도 (총 채용인원 기준)
      };
    });
    
    const radarLabels = ['채용규모', '경쟁률', '직렬다양성', '채용인원'];
    const radarDatasets = Object.entries(agencyStats).map(([agency, stats], index) => ({
      label: agency,
      data: radarLabels.map(label => stats[label] || 0),
      backgroundColor: `rgba(${index * 60 + 59}, ${130 + index * 30}, 246, 0.2)`,
      borderColor: `rgba(${index * 60 + 59}, ${130 + index * 30}, 246, 1)`,
      borderWidth: 2
    }));
    
    radarChart = {
      labels: radarLabels,
      datasets: radarDatasets
    };

    // 7. 기관별 직렬별 모집인원 분석 (Stacked Bar Chart)
    const agencyCategoryData = {};
    const allCategoriesForStacked = new Set();
    
    // 기관별 직렬별 모집인원 계산
    filteredJobs.forEach(job => {
      const agency = job.agencyName;
      const recruitCount = job.requiredCount || 1;
      
      if (!agencyCategoryData[agency]) {
        agencyCategoryData[agency] = {};
      }
      
      // 각 채용공고의 직렬들에 대해 균등하게 모집인원 분배
      if (job.categories && Array.isArray(job.categories)) {
        const countPerCategory = recruitCount / job.categories.length;
        
        job.categories.forEach(category => {
          allCategoriesForStacked.add(category);
          
          if (!agencyCategoryData[agency][category]) {
            agencyCategoryData[agency][category] = 0;
          }
          
          agencyCategoryData[agency][category] += countPerCategory;
        });
      }
    });
    
    const sortedCategories = Array.from(allCategoriesForStacked).sort();
    const agenciesForStacked = Object.keys(agencyCategoryData);
    
    // 직렬별 색상 정의 (많이 사용되는 직렬 우선)
    const categoryColors = [
      '#3b82f6', '#f97316', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1',
      '#14b8a6', '#f472b6', '#a855f7', '#eab308', '#22c55e',
      '#f97316', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
    ];
    
    // 직렬별 데이터셋 생성 (스택형 막대차트)
    const stackedDatasets = sortedCategories.map((category, index) => ({
      label: category,
      data: agenciesForStacked.map(agency => 
        Math.round(agencyCategoryData[agency][category] || 0)
      ),
      backgroundColor: categoryColors[index % categoryColors.length],
      borderWidth: 0,
      borderRadius: 2,
      borderSkipped: false
    }));
    
    agencyCategoryChart = {
      labels: agenciesForStacked,
      datasets: stackedDatasets
    };

    // 8. 연도별 직렬별 모집인원 트렌드
    const yearCategoryData = {};
    const availableYearsForCategory = new Set();
    const allCategoriesForTrend = new Set();
    
    filteredJobs.forEach(job => {
      const year = new Date(job.startDate).getFullYear();
      const recruitCount = job.requiredCount || 1;
      
      availableYearsForCategory.add(year);
      
      if (job.categories && Array.isArray(job.categories)) {
        const countPerCategory = recruitCount / job.categories.length;
        
        job.categories.forEach(category => {
          allCategoriesForTrend.add(category);
          
          if (!yearCategoryData[category]) {
            yearCategoryData[category] = {};
          }
          
          if (!yearCategoryData[category][year]) {
            yearCategoryData[category][year] = 0;
          }
          
          yearCategoryData[category][year] += countPerCategory;
        });
      }
    });
    
    const sortedYearsForCategory = Array.from(availableYearsForCategory).sort();
    
    // 인기 직렬 상위 10개만 표시 (데이터가 많은 경우 가독성 향상)
    const topCategoriesForTrend = Object.entries(yearCategoryData)
      .map(([category, yearData]) => ({
        category,
        total: Object.values(yearData).reduce((sum, count) => sum + count, 0)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(item => item.category);
    
    // 연도별 직렬별 데이터셋 생성
    const categoryTrendDatasets = topCategoriesForTrend.map((category, index) => {
      const color = categoryColors[index % categoryColors.length];
      
      return {
        label: category,
        data: sortedYearsForCategory.map(year => 
          Math.round(yearCategoryData[category]?.[year] || 0)
        ),
        borderColor: color,
        backgroundColor: `${color}20`, // 20% 투명도
        fill: false,
        tension: 0.4,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      };
    });
    
    yearCategoryTrendChart = {
      labels: sortedYearsForCategory,
      datasets: categoryTrendDatasets
    };
  }
  
  function getTopCategories() {
    const categoryCount = {};
    filteredJobs.forEach(job => {
      if (job.categories && Array.isArray(job.categories)) {
        job.categories.forEach(category => {
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
      }
    });
    
    // 전체 직렬을 표시하되, 상위 10개만 랭킹으로 표시
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }));
  }
  
  function getCompetitionStats() {
    // 실제 경쟁률 데이터 처리 (필터링된 데이터 사용)
    if (filteredCompetition && filteredCompetition.length > 0) {
      const rates = filteredCompetition.map(comp => {
        let rate;
        if (typeof comp.competitionRate === 'string' && comp.competitionRate.includes(':')) {
          rate = parseFloat(comp.competitionRate.split(':')[0]);
        } else {
          rate = parseFloat(comp.competitionRate);
        }
        return rate;
      }).filter(rate => !isNaN(rate) && rate > 0 && isFinite(rate));
      
      if (rates.length > 0) {
        const min = Math.min(...rates);
        const max = Math.max(...rates);
        const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
        
        console.log('실제 경쟁률 통계:', { min, max, avg, totalData: rates.length });
        
        return {
          min: Math.round(min * 10) / 10,
          max: Math.round(max * 10) / 10,
          avg: Math.round(avg * 10) / 10
        };
      }
    }
    
    console.log('경쟁률 데이터 없음, 예상값 사용');
    
    // 경쟁률 데이터가 없는 경우 예상 경쟁률로 계산
    const estimatedRates = filteredJobs.map(job => {
      // 채용인원에 따른 예상 경쟁률
      const baseRate = job.requiredCount > 100 ? 25 : 
                      job.requiredCount > 50 ? 45 : 
                      job.requiredCount > 20 ? 65 : 85;
      return baseRate;
    }).filter(rate => isFinite(rate));
    
    if (estimatedRates.length > 0) {
      const min = Math.min(...estimatedRates);
      const max = Math.max(...estimatedRates);
      const avg = estimatedRates.reduce((sum, rate) => sum + rate, 0) / estimatedRates.length;
      
      return {
        min: Math.round(min * 10) / 10,
        max: Math.round(max * 10) / 10,
        avg: Math.round(avg * 10) / 10
      };
    }
    
    return { min: 0, max: 0, avg: 0 };
  }
  
  // 안전한 숫자 표시 헬퍼 함수
  function safeNumber(value) {
    if (!isFinite(value) || isNaN(value)) {
      return 0;
    }
    return value;
  }
  
  function formatCompetitionRate(value) {
    const safe = safeNumber(value);
    return safe.toFixed(1);
  }
  
  $: topCategories = getTopCategories();
  $: competitionStats = getCompetitionStats();
</script>

<svelte:head>
  <title>트렌드 분석 - {config.siteName}</title>
  <meta name="description" content="부산시 공사/공단 채용 트렌드와 경쟁률을 분석해보세요" />
</svelte:head>

<div class="space-y-12">
  <!-- 헤더 -->
  <section class="text-center space-y-6">
    <div class="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
      <BarChart3 size={16} class="mr-2" />
      데이터 기반 채용 분석
    </div>
    
    <h1 class="text-heading">채용 트렌드 분석</h1>
    <p class="text-gray-600 max-w-2xl mx-auto">
      부산시 5개 공사/공단의 채용 데이터를 분석하여 
      채용 트렌드와 경쟁률 현황을 한눈에 확인하세요
    </p>
  </section>
  
  <!-- 기준 년도 선택 -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center space-x-4">
      <div class="flex items-center space-x-2">
        <Calendar size={20} class="text-primary-600" />
        <span class="text-sm font-semibold text-gray-900">기준 년도:</span>
      </div>
      <select 
        bind:value={baseYear}
        class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
      >
        <option value="all">전체 년도</option>
        {#each availableYears as year}
          <option value={year}>{year}년</option>
        {/each}
      </select>
    </div>
    
    {#if baseYear !== 'all'}
      <div class="inline-flex items-center px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
        <Calendar size={14} class="mr-1" />
        {baseYear}년 데이터 분석
      </div>
    {/if}
  </div>
  
  <!-- 스마트 필터 -->
  <AnalysisFilters 
    agencies={availableAgencies}
    categories={availableCategories}
    years={availableYears}
    on:filterChange={handleFilterChange}
  />
  
  <!-- 필터링 결과 표시 -->
  {#if baseYear !== 'all' || currentFilters.agencies.length > 0 || currentFilters.categories.length > 0 || currentFilters.years.length > 0}
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div class="flex items-center space-x-2">
        <Zap size={16} class="text-blue-600" />
        <span class="text-sm font-medium text-blue-800">
          {#if baseYear !== 'all'}
            {baseYear}년 기준: 
          {:else}
            전체 기간: 
          {/if}
          {filteredJobs.length}개 채용공고, {filteredJobs.reduce((total, job) => total + (job.requiredCount || 1), 0)}명 채용예정, {filteredCompetition.length}개 경쟁률 데이터
          {#if currentFilters.agencies.length > 0 || currentFilters.categories.length > 0 || currentFilters.years.length > 0}
            (추가 필터 적용됨)
          {/if}
        </span>
      </div>
    </div>
  {/if}
  
  <!-- 핵심 지표 -->
  <section class="grid grid-cols-2 md:grid-cols-4 gap-6">
    <div class="card p-6 text-center bg-gradient-to-br from-blue-50 to-primary-100">
      <div class="w-12 h-12 mx-auto mb-3 bg-primary-500 rounded-xl flex items-center justify-center">
        <Target class="text-white" size={20} />
      </div>
      <div class="text-2xl font-bold text-primary-600">{formatCompetitionRate(competitionStats.avg)}:1</div>
      <div class="text-sm text-gray-600">평균 경쟁률</div>
    </div>
    
    <div class="card p-6 text-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div class="w-12 h-12 mx-auto mb-3 bg-green-500 rounded-xl flex items-center justify-center">
        <TrendingUp class="text-white" size={20} />
      </div>
      <div class="text-2xl font-bold text-green-600">{formatCompetitionRate(competitionStats.min)}:1</div>
      <div class="text-sm text-gray-600">최저 경쟁률</div>
    </div>
    
    <div class="card p-6 text-center bg-gradient-to-br from-red-50 to-rose-100">
      <div class="w-12 h-12 mx-auto mb-3 bg-red-500 rounded-xl flex items-center justify-center">
        <TrendingUp class="text-white" size={20} />
      </div>
      <div class="text-2xl font-bold text-red-600">{formatCompetitionRate(competitionStats.max)}:1</div>
      <div class="text-sm text-gray-600">최고 경쟁률</div>
    </div>
    
    <div class="card p-6 text-center bg-gradient-to-br from-purple-50 to-violet-100">
      <div class="w-12 h-12 mx-auto mb-3 bg-purple-500 rounded-xl flex items-center justify-center">
        <Users class="text-white" size={20} />
      </div>
      <div class="text-2xl font-bold text-purple-600">{topCategories[0]?.category}</div>
      <div class="text-sm text-gray-600">인기 직렬 1위</div>
    </div>
  </section>
  
  <!-- 차트 섹션 -->
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-10">
    <!-- 기관별 채용인원 수 (년도별) -->
    <section class="card p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-lg font-bold text-gray-900">기관별 채용인원 수 (년도별)</h3>
          <p class="text-sm text-gray-600">연도별 기관별 실제 채용 예정 인원 비교</p>
        </div>
        <div class="p-2 bg-primary-100 rounded-lg">
          <BarChart3 size={20} class="text-primary-600" />
        </div>
      </div>
      
      <Chart 
        type="bar"
        data={agencyJobsChart}
        height={300}
        options={{
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                title: function(context) {
                  return context[0].label;
                },
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y}명`;
                }
              }
            }
          },
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            x: {
              title: {
                display: true,
                text: '기관명'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '채용인원 (명)'
              },
              ticks: {
                stepSize: 1
              }
            }
          }
        }}
      />
    </section>
    
    <!-- 기관별 연도별 경쟁률 트렌드 -->
    <section class="card p-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-lg font-bold text-gray-900">기관별 연도별 평균 경쟁률</h3>
          <p class="text-sm text-gray-600">기관별 경쟁률 변화 추이 비교</p>
        </div>
        <div class="p-2 bg-blue-100 rounded-lg">
          <TrendingUp size={20} class="text-blue-600" />
        </div>
      </div>
      
      <Chart 
        type="line"
        data={competitionTrendChart}
        height={300}
        options={{
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 15
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                title: function(context) {
                  return `${context[0].label}년`;
                },
                label: function(context) {
                  if (context.parsed.y === null) {
                    return `${context.dataset.label}: 데이터 없음`;
                  }
                  return `${context.dataset.label}: ${context.parsed.y}:1`;
                }
              }
            }
          },
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            x: {
              title: {
                display: true,
                text: '연도'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '경쟁률 (대 1)'
              },
              ticks: {
                callback: function(value) {
                  return value + ':1';
                }
              }
            }
          }
        }}
      />
    </section>
  </div>
  
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
    <!-- 채용규모별 분포 -->
    <section class="card p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-bold text-gray-900">채용규모별 분포</h3>
          <p class="text-sm text-gray-600">채용인원 규모에 따른 공고 분류</p>
        </div>
        <div class="p-2 bg-green-100 rounded-lg">
          <PieChart size={20} class="text-green-600" />
        </div>
      </div>
      
      <!-- 차트 전환 버튼 -->
      <div class="flex items-center space-x-4 mb-6">
        <button 
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all {showTotalHiring ? 'bg-gray-200 text-gray-600' : 'bg-green-500 text-white'}"
          on:click={() => showTotalHiring = false}
        >
          📊 공고 건수 기준
        </button>
        <button 
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all {showTotalHiring ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}"
          on:click={() => showTotalHiring = true}
        >
          👥 총 채용인원 기준
        </button>
      </div>
      
      <Chart 
        type="doughnut"
        data={showTotalHiring ? categoryDistributionChart.totalHiringChart : categoryDistributionChart}
        height={300}
        options={{
          cutout: '50%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  const unit = showTotalHiring ? '명' : '건';
                  return `${label}: ${value}${unit} (${percentage}%)`;
                }
              }
            }
          }
        }}
      />
      
      <!-- 인사이트 카드 -->
      <div class="mt-6 p-4 bg-green-50 rounded-lg">
        <div class="flex items-start space-x-3">
          <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="text-white text-xs">💡</span>
          </div>
          <div class="text-sm">
            <p class="font-medium text-green-800 mb-1">채용 전략 인사이트</p>
            <p class="text-green-700">
              {#if showTotalHiring}
                대규모 채용은 전체 채용인원의 큰 비중을 차지하지만 경쟁이 치열할 수 있습니다. 
                소수정예 채용은 경쟁률이 상대적으로 낮을 가능성이 있습니다.
              {:else}
                소규모/소수정예 채용공고가 많습니다. 다양한 기회에 지원하여 합격 확률을 높이세요.
              {/if}
            </p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 기관별 월별 채용 트렌드 -->
    <section class="card p-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-lg font-bold text-gray-900">기관별 월별 채용인원 트렌드</h3>
          <p class="text-sm text-gray-600">기관별 월별 채용 패턴 비교</p>
        </div>
        <div class="p-2 bg-orange-100 rounded-lg">
          <Calendar size={20} class="text-orange-600" />
        </div>
      </div>
      
      <Chart 
        type="line"
        data={hiringTrendChart}
        height={300}
        options={{
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 15
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                title: function(context) {
                  return context[0].label;
                },
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y}명`;
                }
              }
            }
          },
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            x: {
              title: {
                display: true,
                text: '월'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '채용인원 (명)'
              },
              ticks: {
                stepSize: 1
              }
            }
          }
        }}
      />
      
      <div class="mt-4 p-3 bg-orange-50 rounded-lg">
        <p class="text-sm text-orange-700">
          💡 <strong>인사이트:</strong> 기관별 채용 시기의 차이를 통해 전략적 지원 계획을 세울 수 있습니다.
        </p>
      </div>
    </section>
  </div>
  
  <!-- 기관별/연도별 직렬별 상세 분석 -->
  <div class="grid grid-cols-1 gap-8">
    <!-- 기관별 직렬별 모집인원 (스택형 막대차트) -->
    <section class="card p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-lg font-bold text-gray-900">기관별 직렬별 모집인원 분포</h3>
          <p class="text-sm text-gray-600">각 기관에서 직렬별로 얼마나 많은 인원을 모집하는지 비교</p>
        </div>
        <div class="p-2 bg-cyan-100 rounded-lg">
          <BarChart3 size={20} class="text-cyan-600" />
        </div>
      </div>
      
      <Chart 
        type="bar"
        data={agencyCategoryChart}
        height={400}
        options={{
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 15,
                boxWidth: 12
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                title: function(context) {
                  return context[0].label;
                },
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y}명`;
                },
                footer: function(tooltipItems) {
                  const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
                  return `총 모집인원: ${total}명`;
                }
              }
            }
          },
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            x: {
              stacked: true,
              title: {
                display: true,
                text: '기관명'
              }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              title: {
                display: true,
                text: '모집인원 (명)'
              },
              ticks: {
                stepSize: 10
              }
            }
          }
        }}
      />
      
      <div class="mt-6 p-4 bg-cyan-50 rounded-lg">
        <div class="flex items-start space-x-3">
          <div class="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="text-white text-xs">💡</span>
          </div>
          <div class="text-sm">
            <p class="font-medium text-cyan-800 mb-1">분석 인사이트</p>
            <p class="text-cyan-700">
              각 기관의 주력 직렬과 모집 규모를 한눈에 비교할 수 있습니다. 
              막대의 높이는 기관의 전체 모집 규모를, 색상별 구간은 직렬별 비중을 나타냅니다.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 연도별 직렬별 모집인원 트렌드 -->
    <section class="card p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-lg font-bold text-gray-900">연도별 인기 직렬 모집인원 트렌드 (TOP 10)</h3>
          <p class="text-sm text-gray-600">년도별로 각 직렬의 모집인원 변화 추이 (인기 직렬 순)</p>
        </div>
        <div class="p-2 bg-emerald-100 rounded-lg">
          <TrendingUp size={20} class="text-emerald-600" />
        </div>
      </div>
      
      <Chart 
        type="line"
        data={yearCategoryTrendChart}
        height={400}
        options={{
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 12,
                boxWidth: 10
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                title: function(context) {
                  return `${context[0].label}년`;
                },
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y}명`;
                },
                footer: function(tooltipItems) {
                  const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
                  return `해당 연도 총합: ${total}명`;
                }
              }
            }
          },
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            x: {
              title: {
                display: true,
                text: '연도'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '모집인원 (명)'
              },
              ticks: {
                stepSize: 10
              }
            }
          }
        }}
      />
      
      <div class="mt-6 p-4 bg-emerald-50 rounded-lg">
        <div class="flex items-start space-x-3">
          <div class="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="text-white text-xs">📈</span>
          </div>
          <div class="text-sm">
            <p class="font-medium text-emerald-800 mb-1">트렌드 분석</p>
            <p class="text-emerald-700">
              시간에 따른 직렬별 수요 변화를 파악하여 향후 채용 전망을 예측할 수 있습니다. 
              상승세인 직렬은 채용 기회가 증가하고 있음을 의미합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- 새로운 고급 분석 차트 -->
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
    <!-- 채용인원 vs 경쟁률 산점도 -->
    <section class="card p-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-lg font-bold text-gray-900">채용인원 vs 경쟁률 분석</h3>
          <p class="text-sm text-gray-600">채용규모와 경쟁률의 상관관계</p>
        </div>
        <div class="p-2 bg-purple-100 rounded-lg">
          <Activity size={20} class="text-purple-600" />
        </div>
      </div>
      
      <ScatterChart 
        data={scatterChart}
        height={350}
        options={{
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: function(context) {
                  return context[0].raw.label || '';
                },
                label: function(context) {
                  return [
                    `채용인원: ${context.parsed.x}명`,
                    `경쟁률: ${context.parsed.y}:1`
                  ];
                }
              }
            }
          }
        }}
      />
      
      <div class="mt-4 p-3 bg-purple-50 rounded-lg">
        <p class="text-sm text-purple-700">
          💡 <strong>인사이트:</strong> 일반적으로 채용인원이 적을수록 경쟁률이 높아지는 경향을 보입니다.
        </p>
      </div>
    </section>
    
    <!-- 기관별 특성 레이더 차트 -->
    <section class="card p-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-lg font-bold text-gray-900">기관별 특성 비교</h3>
          <p class="text-sm text-gray-600">각 기관의 채용 특성을 한눈에 비교</p>
        </div>
        <div class="p-2 bg-indigo-100 rounded-lg">
          <Target size={20} class="text-indigo-600" />
        </div>
      </div>
      
      <RadarChart 
        data={radarChart}
        height={350}
        options={{
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20,
                display: false
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        }}
      />
      
      <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div class="p-2 bg-gray-50 rounded">
          <span class="font-medium">채용규모:</span> 평균 채용인원
        </div>
        <div class="p-2 bg-gray-50 rounded">
          <span class="font-medium">경쟁률:</span> 평균 경쟁률
        </div>
        <div class="p-2 bg-gray-50 rounded">
          <span class="font-medium">직렬다양성:</span> 채용 직렬 종류
        </div>
        <div class="p-2 bg-gray-50 rounded">
          <span class="font-medium">채용인원:</span> 총 채용 예정 인원
        </div>
      </div>
    </section>
  </div>
  
  <!-- 인기 직렬 랭킹 -->
  <section class="card p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-bold text-gray-900">인기 직렬 TOP 10</h3>
        <p class="text-sm text-gray-600">채용공고 수 기준 인기 직렬 순위</p>
      </div>
      <div class="p-2 bg-yellow-100 rounded-lg">
        <Target size={20} class="text-yellow-600" />
      </div>
    </div>
    
    <div class="space-y-4">
      {#each topCategories as { category, count }, index}
        <div class="flex items-center space-x-4">
          <div class="w-8 h-8 rounded-full bg-gradient-to-r 
                      {index === 0 ? 'from-yellow-400 to-yellow-600' : 
                       index === 1 ? 'from-gray-400 to-gray-600' :
                       index === 2 ? 'from-orange-400 to-orange-600' :
                       index === 3 ? 'from-blue-400 to-blue-600' :
                       index === 4 ? 'from-green-400 to-green-600' :
                       index === 5 ? 'from-purple-400 to-purple-600' :
                       index === 6 ? 'from-red-400 to-red-600' :
                       index === 7 ? 'from-pink-400 to-pink-600' :
                       index === 8 ? 'from-indigo-400 to-indigo-600' :
                       'from-gray-300 to-gray-500'}
                      flex items-center justify-center text-white font-bold text-sm">
            {index + 1}
          </div>
          
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="font-medium text-gray-900">{category}</span>
              <span class="text-sm font-semibold text-primary-600">{count}개</span>
            </div>
            
            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                class="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-700"
                style="width: {(count / topCategories[0].count) * 100}%"
              ></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>
  
  <!-- 동적 분석 인사이트 -->
  <section class="space-y-6">
    <!-- 인사이트 헤더 -->
    <div class="card p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
      <div class="flex items-start space-x-4">
        <div class="p-3 bg-primary-500 rounded-xl">
          <TrendingUp class="text-white" size={24} />
        </div>
        
        <div class="flex-1">
          <h3 class="text-lg font-bold text-gray-900 mb-2">🧠 AI 분석 인사이트</h3>
          <p class="text-gray-600 mb-4">현재 필터 조건에 맞는 데이터 기반 인사이트</p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- 인기 직렬 -->
            <div class="bg-white rounded-lg p-4 border border-blue-200">
              <div class="flex items-center space-x-2 mb-2">
                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span class="text-sm font-semibold text-gray-800">인기 직렬</span>
              </div>
              <p class="text-lg font-bold text-blue-600">{topCategories[0]?.category || 'N/A'}</p>
              <p class="text-xs text-gray-600">{topCategories[0]?.count || 0}개 공고</p>
            </div>
            
            <!-- 평균 경쟁률 -->
            <div class="bg-white rounded-lg p-4 border border-orange-200">
              <div class="flex items-center space-x-2 mb-2">
                <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span class="text-sm font-semibold text-gray-800">평균 경쟁률</span>
              </div>
              <p class="text-lg font-bold text-orange-600">{formatCompetitionRate(competitionStats.avg)}:1</p>
              <p class="text-xs text-gray-600">
                {competitionStats.avg > 50 ? '높은 경쟁' : competitionStats.avg > 20 ? '보통 경쟁' : '낮은 경쟁'}
              </p>
            </div>
            
            <!-- 총 채용 인원 -->
            <div class="bg-white rounded-lg p-4 border border-green-200">
              <div class="flex items-center space-x-2 mb-2">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span class="text-sm font-semibold text-gray-800">총 채용인원</span>
              </div>
              <p class="text-lg font-bold text-green-600">
                {filteredJobs.reduce((total, job) => total + (job.requiredCount || 1), 0)}명
              </p>
              <p class="text-xs text-gray-600">예정 채용인원</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 추천 전략 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 지원 전략 추천 -->
      <div class="card p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
        <div class="flex items-center space-x-3 mb-4">
          <div class="p-2 bg-green-500 rounded-lg">
            <Target class="text-white" size={20} />
          </div>
          <h4 class="text-lg font-bold text-green-800">💡 지원 전략 추천</h4>
        </div>
        
        <div class="space-y-3 text-sm">
          {#if competitionStats.avg > 50}
            <div class="flex items-start space-x-2">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
              <p class="text-green-700">높은 경쟁률: 차별화된 자기소개서와 철저한 면접 준비 필요</p>
            </div>
          {:else}
            <div class="flex items-start space-x-2">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
              <p class="text-green-700">적정 경쟁률: 기본기에 충실한 준비로 충분한 경쟁력 확보 가능</p>
            </div>
          {/if}
          
          {#if topCategories.length > 0}
            <div class="flex items-start space-x-2">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
              <p class="text-green-700">인기 직렬 '{topCategories[0]?.category}' 관련 자격증과 경험 어필 권장</p>
            </div>
          {/if}
          
          <div class="flex items-start space-x-2">
            <div class="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
            <p class="text-green-700">다양한 기관 지원으로 합격 확률 높이기</p>
          </div>
        </div>
      </div>
      
      <!-- 시기 분석 -->
      <div class="card p-6 bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
        <div class="flex items-center space-x-3 mb-4">
          <div class="p-2 bg-purple-500 rounded-lg">
            <Calendar class="text-white" size={20} />
          </div>
          <h4 class="text-lg font-bold text-purple-800">📅 채용 시기 분석</h4>
        </div>
        
        <div class="space-y-3 text-sm">
          <div class="flex items-start space-x-2">
            <div class="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
            <p class="text-purple-700">상반기(3-6월)와 하반기(9-11월)에 채용 집중</p>
          </div>
          
          <div class="flex items-start space-x-2">
            <div class="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
            <p class="text-purple-700">각 기관별로 정기 채용 시기가 다르므로 미리 파악 필요</p>
          </div>
          
          <div class="flex items-start space-x-2">
            <div class="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
            <p class="text-purple-700">신입직과 경력직 채용 시기 차이 고려하여 준비</p>
          </div>
          
          {#if filteredJobs.length < jobs.length / 2}
            <div class="flex items-start space-x-2">
              <div class="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
              <p class="text-purple-700">현재 필터 조건에서 기회가 제한적 - 조건 완화 고려</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </section>
</div>