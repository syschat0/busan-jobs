<script>
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import { 
    BarChart3, 
    Users, 
    TrendingUp, 
    Clock, 
    Target, 
    MapPin,
    Calendar,
    RefreshCw,
    AlertCircle
  } from 'lucide-svelte';
  import { fetchAllCachedData, checkApiHealth } from '$lib/utils/apiClient.js';
  import { config } from '$lib/utils/config.js';
  import { filterAllData } from '$lib/utils/dataFilters.js';
  
  // 컴포넌트 임포트
  import SummaryCard from './components/SummaryCard.svelte';
  import JobsOverview from './components/JobsOverview.svelte';
  import CompetitionChart from './components/CompetitionChart.svelte';
  import TrendChart from './components/TrendChart.svelte';
  import AgencyComparison from './components/AgencyComparison.svelte';
  import HiringTrends from './components/HiringTrends.svelte';
  import MonthlyTrends from './components/MonthlyTrends.svelte';
  import GlobalFilters from './components/GlobalFilters.svelte';
  import FilterStatusDisplay from './components/FilterStatusDisplay.svelte';

  // 데이터 상태
  let rawData = {
    jobs: [],
    competition: [],
    hiring: []
  };
  let isLoading = false;
  let error = null;
  let lastUpdated = null;

  // 전역 필터 상태
  let filters = {
    years: [],
    categories: [],
    agencies: []
  };

  // 선택된 년도 상태 (월별 트렌드 표시용)
  let selectedYear = null;
  let defaultYear = null; // 기본 년도 (최신 년도)


  // 필터링된 데이터
  $: data = filterAllData(rawData, filters);

  // 계산된 통계
  let stats = {
    totalJobs: 0,
    activeJobs: 0,
    endingSoon: 0,
    lowCompetition: 0,
    avgCompetition: 0,
    totalAgencies: 0,
    totalHiring: 0
  };

  // 2024년 공고 수
  let recent2024Jobs = 0;


  // 데이터 로드
  async function loadDashboardData() {
    isLoading = true;
    error = null;
    
    try {
      console.log('대시보드 데이터 로딩 시작...');
      const result = await fetchAllCachedData();
      
      rawData = result;
      lastUpdated = new Date();
      
      console.log('대시보드 데이터 로딩 완료:', {
        jobs: data.jobs.length,
        competition: data.competition.length,
        hiring: data.hiring.length
      });
      
    } catch (err) {
      console.error('대시보드 데이터 로딩 실패:', err);
      error = err.message || '데이터를 불러오는데 실패했습니다.';
    } finally {
      isLoading = false;
    }
  }

  // 통계 자동 재계산 (필터링된 데이터가 변경될 때마다)
  $: {
    const { jobs, competition, hiring } = data;
    
    // 기본 통계
    stats.totalJobs = jobs.length;
    stats.totalAgencies = new Set(jobs.map(job => job.기관명)).size;
    
    // 현재는 모두 과거 데이터이므로 실제 진행중인 공고는 0
    const now = new Date();
    stats.activeJobs = jobs.filter(job => {
      const endDate = job.접수마감일 ? new Date(job.접수마감일) : null;
      return endDate && endDate > now; // 실제 마감일이 현재보다 미래인 경우만
    }).length;
    
    // 최근 공고 (2024년 공고를 "최근"으로 간주)
    recent2024Jobs = jobs.filter(job => {
      const jobYear = job.접수시작일 ? new Date(job.접수시작일).getFullYear() : null;
      return jobYear === 2024;
    }).length;
    
    // 마감임박 - 실제로는 모두 과거 데이터이므로 0
    stats.endingSoon = 0;
    
    // 경쟁률 관련 통계
    const competitionRates = competition
      .map(c => parseFloat(c.경쟁률 || '0'))
      .filter(rate => rate > 0);
    
    if (competitionRates.length > 0) {
      stats.avgCompetition = competitionRates.reduce((sum, rate) => sum + rate, 0) / competitionRates.length;
      stats.lowCompetition = competitionRates.filter(rate => rate < 10).length;
    } else {
      stats.avgCompetition = 0;
      stats.lowCompetition = 0;
    }

    // 채용인원 통계 (최근 5년간) - 실제 API 데이터 구조 사용
    stats.totalHiring = hiring.reduce((sum, hire) => {
      const regular = parseInt(hire.정규직_일반 || 0);
      const disabled = parseInt(hire.정규직_장애 || 0);
      const contract = parseInt(hire.공무직 || 0);
      const internGeneral = parseInt(hire.인턴_일반 === '데이터 없음' ? 0 : hire.인턴_일반 || 0);
      const internDisabled = parseInt(hire.인턴_장애인 === '데이터 없음' ? 0 : hire.인턴_장애인 || 0);
      
      return sum + regular + disabled + contract + internGeneral + internDisabled;
    }, 0);
  }

  // 새로고침
  async function refresh() {
    // 캐시 초기화하여 강제 새로고침
    const { clearCache } = await import('$lib/utils/apiClient.js');
    clearCache();
    await loadDashboardData();
  }

  // 년도 선택 핸들러
  function handleYearSelect(year) {
    selectedYear = selectedYear === year ? null : year;
  }


  // 최신 년도 설정 (TrendChart에서 호출)
  function setDefaultYear(year) {
    defaultYear = year;
    // 처음에만 기본값으로 설정 (사용자가 선택하지 않은 경우)
    if (selectedYear === null) {
      selectedYear = year;
    }
  }

  // 실제 표시할 년도 계산
  $: displayYear = selectedYear || defaultYear;


  // 초기 데이터 로드
  onMount(async () => {
    await loadDashboardData();
  });
</script>

<svelte:head>
  <title>대시보드 - {config.siteName}</title>
  <meta name="description" content="부산 공공기관 채용정보 통합 대시보드" />
</svelte:head>

<div class="space-y-6">
  <!-- 헤더 -->
  <section class="flex items-center justify-between">
    <div>
      <div class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        <BarChart3 size={16} class="mr-2" />
        스마트 채용 대시보드
      </div>
      
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        {env.PUBLIC_VITE_SITE_NAME || 'WITH.B'} 통합 대시보드
      </h1>
      <p class="text-gray-600">
        5개 기관, 하나의 플랫폼 - 부산 청년의 취업 성공을 위한 원스톱 솔루션
      </p>
    </div>
    
    <!-- 새로고침 버튼 -->
    <button
      on:click={refresh}
      disabled={isLoading}
      class="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors duration-200"
    >
      <RefreshCw size={16} class="mr-2 {isLoading ? 'animate-spin' : ''}" />
      {isLoading ? '로딩 중...' : '새로고침'}
    </button>
  </section>

  <!-- 에러 상태 -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-xl p-4">
      <div class="flex items-start space-x-3">
        <div class="p-2 bg-red-100 rounded-lg">
          <AlertCircle size={20} class="text-red-600" />
        </div>
        <div class="flex-1">
          <h3 class="text-red-800 font-semibold">데이터 로드 오류</h3>
          <p class="text-red-700 text-sm mt-1">{error}</p>
          <button
            on:click={refresh}
            class="mt-2 inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium rounded-md transition-colors"
          >
            <RefreshCw size={14} class="mr-1" />
            다시 시도
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- 로딩 상태 -->
  {#if isLoading}
    <section class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">대시보드 데이터를 불러오는 중...</p>
      </div>
    </section>
  {:else if !error}
    <!-- 전역 필터 -->
    <GlobalFilters data={rawData} bind:filters />

    <!-- 필터 적용 상태 안내 (부분 선택 시에만 표시) -->
    {#if (filters.years.length > 0 && filters.years.length < new Set(data.jobs.map(job => job.공고시작일 ? new Date(job.공고시작일).getFullYear() : null).filter(y => y)).size) || 
         (filters.categories.length > 0 && filters.categories.length < new Set(data.jobs.flatMap(job => job.일반전형 ? job.일반전형.split(',').map(c => c.trim()) : [])).size) || 
         (filters.agencies.length > 0 && filters.agencies.length < new Set(data.jobs.map(job => job.기관명)).size)}
      <section class="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div class="flex items-center space-x-2 text-blue-800">
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span class="text-sm font-medium">
            필터가 적용되어 선택된 조건의 데이터만 표시됩니다
          </span>
        </div>
      </section>
    {/if}

    <!-- 요약 통계 카드 -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <SummaryCard
        title="전체 채용공고"
        value={stats.totalJobs}
        icon={Users}
        color="blue"
        description="누적 채용공고 수"
      />
      
      <SummaryCard
        title="2024년 공고"
        value={recent2024Jobs}
        icon={Target}
        color="green"
        description="최근년도 채용공고"
      />
      
      <SummaryCard
        title="총 채용인원"
        value={stats.totalHiring}
        icon={Users}
        color="amber"
        description="5년간 누적 채용"
      />
      
      <SummaryCard
        title="참여기관"
        value={stats.totalAgencies}
        icon={MapPin}
        color="purple"
        description="부산 공공기관"
      />
    </section>

    <!-- 채용현황 개요 -->
    <section class="bg-white rounded-2xl border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">채용현황 개요</h2>
        <div class="text-sm text-gray-500">
          {#if lastUpdated}
            최종 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
          {/if}
        </div>
      </div>
      <JobsOverview {data} />
    </section>

    <!-- 경쟁률 분석 -->
    <section class="bg-white rounded-2xl border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">경쟁률 분석</h2>
        <div class="text-sm text-gray-500">
          평균: {stats.avgCompetition.toFixed(1)}:1
        </div>
      </div>
      <CompetitionChart {data} />
    </section>

    <!-- 하단 차트 및 분석 -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 트렌드 분석 -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900">채용 트렌드</h2>
          <div class="flex items-center space-x-2 text-sm text-gray-500">
            <TrendingUp size={16} />
            <span>연도별 추이</span>
          </div>
        </div>
        <TrendChart {data} onYearSelect={handleYearSelect} getLatestYear={setDefaultYear} />
      </div>

      <!-- 월별 트렌드 패널 -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900">
            {displayYear ? `${displayYear}년 ` : ''}월별 트렌드
          </h2>
          <Calendar size={20} class="text-gray-400" />
        </div>
        {#if displayYear}
          <MonthlyTrends {data} selectedYear={displayYear} />
        {:else}
          <!-- 로딩 상태 -->
          <div class="flex items-center justify-center h-64">
            <div class="text-center text-gray-500">
              <Calendar size={32} class="mx-auto mb-2 text-gray-400" />
              <div class="text-sm">데이터를 불러오는 중...</div>
            </div>
          </div>
        {/if}
      </div>
    </section>

    <!-- 기관별 비교 -->
    <section class="bg-white rounded-2xl border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">기관별 채용 비교</h2>
        <div class="text-sm text-gray-500">
          {stats.totalAgencies}개 기관 데이터
          {#if (filters.years.length > 0 && filters.years.length < new Set(rawData.jobs.map(job => job.공고시작일 ? new Date(job.공고시작일).getFullYear() : null).filter(y => y)).size) || 
               (filters.categories.length > 0 && filters.categories.length < new Set(rawData.jobs.flatMap(job => job.일반전형 ? job.일반전형.split(',').map(c => c.trim()) : [])).size) || 
               (filters.agencies.length > 0 && filters.agencies.length < new Set(rawData.jobs.map(job => job.기관명)).size)}
            <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              필터 적용됨
            </span>
          {/if}
        </div>
      </div>
      <AgencyComparison {data} />
    </section>
  {/if}
</div>


<!-- 우측 상단 필터 상태 표시 -->
<FilterStatusDisplay
  bind:filters
  data={rawData}
  filteredData={data}
/>