<script>
  import { onMount } from 'svelte';
  import { Search, Filter, SlidersHorizontal, X, MapPin, Calendar, Users, Grid, List } from 'lucide-svelte';
  import JobCard from '$lib/components/JobCard.svelte';
  import JobDetailModal from '$lib/components/JobDetailModal.svelte';
  import { config } from '$lib/utils/config.js';
  
  // Stores import
  import { filteredJobs, filters, uniqueAgencies, uniqueCategories, updateFilters, resetFilters } from '$lib/stores/jobs.js';
  import { viewMode, setViewMode, showNotification } from '$lib/stores/ui.js';
  
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
  
  // 필터 상태를 로컬에서 관리하고 store와 동기화
  let searchQuery = '';
  let selectedAgency = '';
  let selectedStatus = '';
  let selectedCategory = '';
  let sortBy = 'latest';
  let competitionLevel = '';
  
  // 반응형 필터 적용
  $: {
    updateFilters({
      searchQuery,
      agency: selectedAgency,
      status: selectedStatus,
      category: selectedCategory,
      sortBy,
      competitionLevel
    });
  }
  
  function clearFilters() {
    searchQuery = '';
    selectedAgency = '';
    selectedStatus = '';
    selectedCategory = '';
    sortBy = 'latest';
    competitionLevel = '';
    resetFilters();
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
</script>

<svelte:head>
  <title>채용정보 검색 - {config.siteName}</title>
  <meta name="description" content="부산시 5개 공사/공단의 채용정보를 검색하고 필터링하세요" />
</svelte:head>

<div class="space-y-8">
  <!-- 검색 헤더 -->
  <section class="space-y-6">
    <div>
      <h1 class="text-heading mb-2">채용정보 검색</h1>
      <p class="text-gray-600">부산시 5개 공사/공단의 통합 채용정보를 검색하세요</p>
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
              {#each $uniqueAgencies as agency}
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
              {#each $uniqueCategories as category}
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
        <span>검색결과 <strong class="text-blue-600">{$filteredJobs.length}건</strong></span>
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
  
  <!-- 검색 결과 -->
  <section>
    {#if $filteredJobs.length === 0}
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
          {#each $filteredJobs as job (job.id)}
            <div class="animate-fade-in">
              <JobCard {job} on:showDetail={handleShowDetail} />
            </div>
          {/each}
        </div>
      {:else}
        <!-- 리스트 뷰 -->
        <div class="space-y-6">
          {#each $filteredJobs as job (job.id)}
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
</div>

<!-- Job Detail Modal -->
{#if showDetailModal && selectedJob}
  <JobDetailModal 
    isOpen={showDetailModal} 
    job={selectedJob} 
    on:close={closeDetailModal} 
  />
{/if}