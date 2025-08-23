<script>
  import { onMount } from 'svelte';
  import { Search, Filter, SlidersHorizontal, X, MapPin, Calendar, Users, Grid, List, RefreshCw, AlertCircle } from 'lucide-svelte';
  import JobCard from '$lib/components/JobCard.svelte';
  import JobDetailModal from '$lib/components/JobDetailModal.svelte';
  import { config } from '$lib/utils/config.js';
  import { fetchAllCachedData, clearCache } from '$lib/utils/apiClient.js';
  
  // Stores import
  import { viewMode, setViewMode, showNotification } from '$lib/stores/ui.js';
  import { page } from '$app/stores';
  
  // API 데이터 상태
  let rawData = {
    jobs: [],
    competition: [],
    hiring: []
  };
  let isLoading = false;
  let error = null;
  let lastUpdated = null;
  
  // UI 상태
  let showFilters = false;
  
  // 모달 상태
  let showDetailModal = false;
  let selectedJob = null;
  
  function handleShowDetail(event) {
    selectedJob = event.detail.job;
    showDetailModal = true;
  }
  
  function closeDetailModal() {
    showDetailModal = false;
    selectedJob = null;
  }
  
  // 필터 상태를 로컬에서 관리
  let searchQuery = '';
  let selectedAgency = '';
  let selectedStatus = '';
  let selectedCategory = '';
  let sortBy = 'latest';
  let competitionLevel = '';
  
  // 필터링된 데이터
  let filteredJobs = [];
  let uniqueAgencies = [];
  let uniqueCategories = [];
  
  // 데이터 필터링 함수
  function applyFilters() {
    let filtered = [...rawData.jobs];
    
    // 기관 필터
    if (selectedAgency) {
      filtered = filtered.filter(job => job.기관명 === selectedAgency);
    }
    
    // 직렬 필터
    if (selectedCategory) {
      filtered = filtered.filter(job => {
        const categories = job.일반전형 ? job.일반전형.split(',').map(c => c.trim()) : [];
        return categories.includes(selectedCategory);
      });
    }
    
    // 상태 필터
    if (selectedStatus) {
      const now = new Date();
      filtered = filtered.filter(job => {
        const endDate = job.접수마감일 ? new Date(job.접수마감일) : null;
        if (selectedStatus === '접수중') {
          return endDate && endDate > now;
        } else if (selectedStatus === '마감') {
          return endDate && endDate <= now;
        }
        return true;
      });
    }
    
    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.공고명?.toLowerCase().includes(query) ||
        job.기관명?.toLowerCase().includes(query) ||
        job.일반전형?.toLowerCase().includes(query)
      );
    }
    
    // 경쟁률 수준 필터
    if (competitionLevel) {
      filtered = filtered.filter(job => {
        const expectedCompetition = getExpectedCompetition(job);
        if (competitionLevel === 'low') return expectedCompetition < 30;
        if (competitionLevel === 'medium') return expectedCompetition >= 30 && expectedCompetition < 60;
        if (competitionLevel === 'high') return expectedCompetition >= 60;
        return true;
      });
    }
    
    // 정렬
    switch (sortBy) {
      case 'deadline':
        filtered.sort((a, b) => {
          const dateA = a.접수마감일 ? new Date(a.접수마감일) : new Date(0);
          const dateB = b.접수마감일 ? new Date(b.접수마감일) : new Date(0);
          return dateA - dateB;
        });
        break;
      case 'competition':
        filtered.sort((a, b) => 
          getExpectedCompetition(a) - getExpectedCompetition(b)
        );
        break;
      case 'hiring':
        filtered.sort((a, b) => {
          const countA = parseInt(a.모집인원 || 0);
          const countB = parseInt(b.모집인원 || 0);
          return countB - countA;
        });
        break;
      case 'latest':
      default:
        filtered.sort((a, b) => {
          const dateA = a.공고시작일 ? new Date(a.공고시작일) : new Date(0);
          const dateB = b.공고시작일 ? new Date(b.공고시작일) : new Date(0);
          return dateB - dateA;
        });
        break;
    }
    
    filteredJobs = filtered.map(job => ({
      id: job.id || Math.random().toString(),
      jobTitle: job.공고명,
      agencyName: job.기관명,
      startDate: job.공고시작일,
      endDate: job.공고마감일,
      applicationStart: job.접수시작일,
      applicationEnd: job.접수마감일,
      categories: job.일반전형 ? job.일반전형.split(',').map(c => c.trim()) : [],
      requiredCount: parseInt(job.모집인원 || 0),
      requirements: job.지역조건 || '',
      status: getJobStatus(job)
    }));
  }
  
  // 반응형 필터 적용
  $: if (rawData.jobs.length > 0) {
    applyFilters();
  }
  
  function clearFilters() {
    searchQuery = '';
    selectedAgency = '';
    selectedStatus = '';
    selectedCategory = '';
    sortBy = 'latest';
    competitionLevel = '';
    applyFilters();
    showNotification('필터가 초기화되었습니다', 'success');
  }
  
  function getActiveFilterCount() {
    let count = 0;
    if (selectedAgency) count++;
    if (selectedStatus) count++;
    if (selectedCategory) count++;
    if (competitionLevel) count++;
    return count;
  }
  
  function toggleViewMode() {
    const newMode = $viewMode === 'card' ? 'list' : 'card';
    setViewMode(newMode);
  }
  
  $: activeFilterCount = getActiveFilterCount();
  
  // 헬퍼 함수들
  function getJobStatus(job) {
    const now = new Date();
    const endDate = job.접수마감일 ? new Date(job.접수마감일) : null;
    if (endDate && endDate > now) {
      return '접수중';
    }
    return '마감';
  }
  
  function getExpectedCompetition(job) {
    // 기관별 평균 경쟁률 데이터 활용
    const agencyCompetitions = rawData.competition.filter(comp => 
      comp.기관명 === job.기관명
    );
    
    if (agencyCompetitions.length > 0) {
      const rates = agencyCompetitions
        .map(comp => parseFloat(comp.경쟁률 || '0'))
        .filter(rate => rate > 0);
      
      if (rates.length > 0) {
        return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      }
    }
    
    // 폴백: 모집인원 기반 추정
    const count = parseInt(job.모집인원 || 0);
    return count > 100 ? 25 : count > 50 ? 45 : count > 20 ? 65 : 85;
  }
  
  // 데이터 로드
  async function loadSearchData() {
    isLoading = true;
    error = null;
    
    try {
      console.log('검색 데이터 로딩 시작...');
      const result = await fetchAllCachedData();
      
      rawData = result;
      lastUpdated = new Date();
      
      // 유니크한 기관 및 직렬 추출
      uniqueAgencies = [...new Set(result.jobs.map(job => job.기관명))].sort();
      
      const allCategories = new Set();
      result.jobs.forEach(job => {
        if (job.일반전형) {
          job.일반전형.split(',').forEach(cat => allCategories.add(cat.trim()));
        }
      });
      uniqueCategories = [...allCategories].sort();
      
      // 초기 필터 적용
      applyFilters();
      
      console.log('검색 데이터 로딩 완료:', {
        jobs: result.jobs.length,
        competition: result.competition.length,
        hiring: result.hiring.length
      });
      
    } catch (err) {
      console.error('검색 데이터 로딩 실패:', err);
      error = err.message || '데이터를 불러오는데 실패했습니다.';
    } finally {
      isLoading = false;
    }
  }
  
  // 새로고침
  async function refresh() {
    clearCache();
    await loadSearchData();
  }
  
  // URL 파라미터에서 기관 정보 읽어오기
  $: {
    const urlParams = $page.url.searchParams;
    const agencyParam = urlParams.get('agency');
    if (agencyParam && !selectedAgency) {
      selectedAgency = decodeURIComponent(agencyParam);
      // 필터 패널 자동으로 열기
      showFilters = true;
      if (rawData.jobs.length > 0) {
        applyFilters();
      }
    }
  }
  
  // 초기 데이터 로드
  onMount(async () => {
    await loadSearchData();
  });
</script>

<svelte:head>
  <title>채용정보 검색 - {config.siteName}</title>
  <meta name="description" content="부산시 5개 공사/공단의 채용정보를 검색하고 필터링하세요" />
</svelte:head>

<div class="space-y-8">
  <!-- 검색 헤더 -->
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-heading mb-2">채용정보 검색</h1>
        <p class="text-gray-600">부산시 5개 공사/공단의 통합 채용정보를 검색하세요</p>
      </div>
      
      <!-- 새로고침 버튼 -->
      <button
        on:click={refresh}
        disabled={isLoading}
        class="btn-secondary flex items-center space-x-2"
      >
        <RefreshCw size={16} class={isLoading ? 'animate-spin' : ''} />
        <span>{isLoading ? '로딩 중...' : '새로고침'}</span>
      </button>
    </div>
    
    <!-- 검색바 -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <Search size={20} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="채용공고명, 기관명, 직렬을 검색하세요..."
          bind:value={searchQuery}
          class="input pl-12"
        />
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- 뷰 모드 토글 -->
        <button
          class="btn-ghost p-3"
          on:click={toggleViewMode}
          title="뷰 모드 변경"
        >
          {#if $viewMode === 'card'}
            <List size={18} />
          {:else}
            <Grid size={18} />
          {/if}
        </button>
        
        <!-- 필터 버튼 -->
        <button
          class="btn-secondary flex items-center space-x-2 px-6 relative"
          on:click={() => showFilters = !showFilters}
        >
          <SlidersHorizontal size={18} />
          <span>필터</span>
          {#if activeFilterCount > 0}
            <span class="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          {/if}
        </button>
      </div>
    </div>
    
    <!-- 필터 패널 -->
    {#if showFilters}
      <div class="card p-8 space-y-6 animate-slide-up">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">필터 옵션</h3>
          <button
            class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            on:click={clearFilters}
          >
            전체 초기화
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- 기관 선택 -->
          <div>
            <label for="agency-select" class="block text-sm font-medium text-gray-700 mb-2">기관</label>
            <select
              id="agency-select"
              bind:value={selectedAgency}
              class="select text-sm"
            >
              <option value="">전체 기관</option>
              {#each uniqueAgencies as agency}
                <option value={agency}>{agency}</option>
              {/each}
            </select>
          </div>
          
          <!-- 상태 선택 -->
          <div>
            <label for="status-select" class="block text-sm font-medium text-gray-700 mb-2">진행 상태</label>
            <select
              id="status-select"
              bind:value={selectedStatus}
              class="select text-sm"
            >
              <option value="">전체 상태</option>
              <option value="접수중">접수중</option>
              <option value="진행중">진행중</option>
              <option value="마감">마감</option>
            </select>
          </div>
          
          <!-- 직렬 선택 -->
          <div>
            <label for="category-select" class="block text-sm font-medium text-gray-700 mb-2">직렬</label>
            <select
              id="category-select"
              bind:value={selectedCategory}
              class="select text-sm"
            >
              <option value="">전체 직렬</option>
              {#each uniqueCategories as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>
          
          <!-- 경쟁률 수준 -->
          <div>
            <label for="competition-select" class="block text-sm font-medium text-gray-700 mb-2">경쟁률 수준</label>
            <select
              id="competition-select"
              bind:value={competitionLevel}
              class="select text-sm"
            >
              <option value="">전체</option>
              <option value="low">낮음 (30:1 미만)</option>
              <option value="medium">보통 (30-60:1)</option>
              <option value="high">높음 (60:1 이상)</option>
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 정렬 기준 -->
          <div>
            <label for="sort-select" class="block text-sm font-medium text-gray-700 mb-2">정렬 기준</label>
            <select
              id="sort-select"
              bind:value={sortBy}
              class="select text-sm"
            >
              <option value="latest">최신순</option>
              <option value="deadline">마감일순</option>
              <option value="hiring">채용인원순</option>
              <option value="competition">경쟁률순</option>
            </select>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- 검색 결과 요약 -->
    <div class="flex items-center justify-between text-sm">
      <div class="flex items-center space-x-4 text-gray-600">
        <span>검색결과 <strong class="text-blue-600">{filteredJobs.length}건</strong></span>
        {#if searchQuery}
          <span>'{searchQuery}'에 대한 검색결과</span>
        {/if}
      </div>
      
      <!-- 활성 필터 태그 -->
      {#if activeFilterCount > 0}
        <div class="flex items-center space-x-2">
          {#if selectedAgency}
            <span class="inline-flex items-center px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              <MapPin size={12} class="mr-1" />
              {selectedAgency}
              <button class="ml-1 hover:text-primary-900" on:click={() => selectedAgency = ''}>
                <X size={12} />
              </button>
            </span>
          {/if}
          
          {#if selectedStatus}
            <span class="inline-flex items-center px-2.5 py-1 bg-success-100 text-green-700 text-xs font-medium rounded-full">
              <Calendar size={12} class="mr-1" />
              {selectedStatus}
              <button class="ml-1 hover:text-green-900" on:click={() => selectedStatus = ''}>
                <X size={12} />
              </button>
            </span>
          {/if}
          
          {#if selectedCategory}
            <span class="inline-flex items-center px-2.5 py-1 bg-secondary-100 text-orange-700 text-xs font-medium rounded-full">
              <Users size={12} class="mr-1" />
              {selectedCategory}
              <button class="ml-1 hover:text-orange-900" on:click={() => selectedCategory = ''}>
                <X size={12} />
              </button>
            </span>
          {/if}
        </div>
      {/if}
    </div>
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
            class="mt-2 btn-secondary text-sm"
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
        <p class="text-gray-600">검색 데이터를 불러오는 중...</p>
      </div>
    </section>
  {:else if !error}
    <!-- 검색 결과 -->
    <section>
      {#if filteredJobs.length === 0}
        <!-- 빈 상태 -->
        <div class="text-center py-16">
          <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Search size={40} class="text-gray-400" />
          </div>
          <h3 class="text-xl font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
          <p class="text-gray-500 mb-6 max-w-md mx-auto">
            다른 검색어를 사용하거나 필터 조건을 변경해 보세요
          </p>
          <button class="btn-primary" on:click={clearFilters}>
            검색 조건 초기화
          </button>
        </div>
      {:else}
        <!-- 카드 뷰 -->
        {#if $viewMode === 'card'}
          <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {#each filteredJobs as job (job.id)}
              <div class="animate-fade-in">
                <JobCard {job} on:showDetail={handleShowDetail} />
              </div>
            {/each}
          </div>
        {:else}
          <!-- 리스트 뷰 -->
          <div class="space-y-6">
            {#each filteredJobs as job (job.id)}
              <div class="card p-8 hover:shadow-lg transition-all duration-300 animate-fade-in">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div class="flex-1 space-y-2">
                    <div class="flex items-center space-x-2">
                      <h3 class="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                        {job.jobTitle}
                      </h3>
                      <span class="badge-primary">{job.agencyName}</span>
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div class="flex items-center space-x-1">
                        <Users size={14} />
                        <span>{job.requiredCount}명 모집</span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>~{job.endDate}</span>
                      </div>
                      <div class="flex flex-wrap gap-1">
                        {#each job.categories?.slice(0, 3) || [] as category}
                          <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {category}
                          </span>
                        {/each}
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <button class="btn-secondary text-sm px-4 py-2">
                      상세보기
                    </button>
                    <button class="btn-primary text-sm px-4 py-2">
                      지원하기
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </section>
  {/if}
</div>

<!-- Job Detail Modal -->
{#if showDetailModal && selectedJob}
  <JobDetailModal 
    isOpen={showDetailModal} 
    job={selectedJob} 
    on:close={closeDetailModal} 
  />
{/if}