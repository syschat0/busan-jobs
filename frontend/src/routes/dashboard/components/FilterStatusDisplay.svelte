<script>
  import { Filter, X, Calendar, Briefcase, Building, ChevronRight, Settings, Eye, EyeOff } from 'lucide-svelte';
  
  export let filters = {
    years: [],
    categories: [],
    agencies: []
  };
  export let data = { jobs: [], competition: [], hiring: [] };
  export let filteredData = { jobs: [], competition: [], hiring: [] };
  
  // 사이드 패널 상태
  let isExpanded = false;
  let isVisible = true;

  // 활성 필터 개수 계산
  $: yearOptions = (() => {
    const yearSet = new Set();
    data.jobs.forEach(job => {
      if (job.공고시작일) {
        const year = new Date(job.공고시작일).getFullYear();
        if (!isNaN(year)) yearSet.add(year);
      }
    });
    data.competition.forEach(comp => {
      if (comp.연도) {
        const year = parseInt(comp.연도);
        if (!isNaN(year)) yearSet.add(year);
      }
    });
    return Array.from(yearSet);
  })();

  $: categoryOptions = (() => {
    const categorySet = new Set();
    data.jobs.forEach(job => {
      if (job.일반전형 && typeof job.일반전형 === 'string') {
        job.일반전형.split(',').forEach(category => {
          const trimmed = category.trim();
          if (trimmed.length > 0) categorySet.add(trimmed);
        });
      }
    });
    data.competition.forEach(comp => {
      if (comp.직렬 && comp.직렬 !== '데이터 없음' && typeof comp.직렬 === 'string') {
        categorySet.add(comp.직렬);
      }
    });
    return Array.from(categorySet);
  })();

  $: agencyOptions = (() => {
    const agencySet = new Set();
    data.jobs.forEach(job => {
      if (job.기관명 && typeof job.기관명 === 'string') {
        agencySet.add(job.기관명);
      }
    });
    data.competition.forEach(comp => {
      if (comp.기관명 && typeof comp.기관명 === 'string') {
        agencySet.add(comp.기관명);
      }
    });
    return Array.from(agencySet);
  })();

  $: activeFiltersCount = 
    (filters.years.length > 0 && filters.years.length < yearOptions.length ? filters.years.length : 0) +
    (filters.categories.length > 0 && filters.categories.length < categoryOptions.length ? filters.categories.length : 0) +
    (filters.agencies.length > 0 && filters.agencies.length < agencyOptions.length ? filters.agencies.length : 0);

  // 필터 제거 함수들
  function removeYearFilter(year) {
    filters.years = filters.years.filter(y => y !== year);
    filters = { ...filters }; // 반응성 트리거
  }

  function removeCategoryFilter(category) {
    filters.categories = filters.categories.filter(c => c !== category);
    filters = { ...filters }; // 반응성 트리거
  }

  function removeAgencyFilter(agency) {
    filters.agencies = filters.agencies.filter(a => a !== agency);
    filters = { ...filters }; // 반응성 트리거
  }

  function clearAllFilters() {
    filters = {
      years: [],
      categories: [],
      agencies: []
    };
  }

  // 필터링 효과 계산
  $: totalOriginal = data.jobs.length + data.competition.length + data.hiring.length;
  $: totalFiltered = filteredData.jobs.length + filteredData.competition.length + filteredData.hiring.length;
  $: reductionPercentage = totalOriginal > 0 ? ((totalOriginal - totalFiltered) / totalOriginal * 100) : 0;
  
  // 패널 토글
  function toggleExpanded() {
    isExpanded = !isExpanded;
  }
  
  function toggleVisibility() {
    isVisible = !isVisible;
  }
</script>

<!-- 필터 상태 표시 사이드 패널 -->
{#if isVisible}
  <div class="fixed top-20 right-4 z-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fade-in"
       class:expanded={isExpanded}
       style="width: {isExpanded ? '400px' : '280px'}; transition: width 0.3s ease;">
    
    <!-- 컴팩트 헤더 (항상 표시) -->
    <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
      <div class="flex items-center space-x-2">
        <div class="p-1.5 bg-blue-100 rounded-lg">
          <Filter size={16} class="text-blue-600" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-900">필터 상태</h3>
          <p class="text-xs text-gray-500">
            {#if activeFiltersCount > 0}
              {activeFiltersCount}개 활성 • {totalFiltered}건 결과
            {:else}
              모든 데이터 표시 • {totalOriginal}건 결과
            {/if}
          </p>
        </div>
      </div>
      
      <div class="flex items-center space-x-1">
        <!-- 확장/축소 버튼 -->
        <button
          on:click={toggleExpanded}
          class="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
          title={isExpanded ? "축소" : "상세보기"}
        >
          <ChevronRight 
            size={16} 
            class="text-gray-500 transition-transform duration-300 {isExpanded ? 'rotate-90' : ''}"
          />
        </button>
        
        <!-- 닫기 버튼 -->
        <button
          on:click={toggleVisibility}
          class="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
          title="패널 숨기기"
        >
          <EyeOff size={16} class="text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>

    <!-- 메인 콘텐츠 (확장 시에만 표시) -->
    {#if isExpanded}
      <div class="p-4 space-y-4 max-h-96 overflow-y-auto">
        <!-- 필터링 효과 요약 -->
        <div class="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-blue-800">
              {activeFiltersCount > 0 ? '필터링 효과' : '전체 데이터'}
            </span>
            <span class="text-lg font-bold text-blue-900">
              {activeFiltersCount > 0 ? `${reductionPercentage.toFixed(1)}%` : '100%'}
            </span>
          </div>
          <div class="w-full bg-blue-200 rounded-full h-2">
            <div 
              class="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
              style="width: {activeFiltersCount > 0 ? reductionPercentage : 100}%"
            ></div>
          </div>
          <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div class="text-blue-700">
              <span class="font-medium">원본:</span> {totalOriginal}건
            </div>
            <div class="text-blue-700">
              <span class="font-medium">결과:</span> {totalFiltered}건
            </div>
          </div>
        </div>

        <!-- 활성 필터 목록 -->
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <Settings size={14} class="text-gray-600" />
            <h4 class="text-sm font-semibold text-gray-800">
              {activeFiltersCount > 0 ? '활성 필터' : '필터 설정'}
            </h4>
          </div>
          
          {#if activeFiltersCount === 0}
            <div class="text-center py-6">
              <div class="p-3 bg-gray-50 rounded-lg mb-3">
                <Filter size={24} class="mx-auto text-gray-400 mb-2" />
                <p class="text-sm text-gray-600 font-medium">적용된 필터가 없습니다</p>
                <p class="text-xs text-gray-500 mt-1">전체 데이터가 표시되고 있습니다</p>
              </div>
              <p class="text-xs text-gray-500">
                상단의 필터 메뉴에서 년도, 직렬, 기관을 선택하여<br>
                원하는 조건의 데이터만 확인할 수 있습니다.
              </p>
            </div>
          {/if}
          
          <!-- 년도 필터 -->
          {#if filters.years.length > 0 && filters.years.length < yearOptions.length}
            <div class="bg-white border border-gray-100 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <Calendar size={14} class="text-blue-500" />
                  <span class="text-sm font-medium text-gray-700">년도</span>
                </div>
                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {filters.years.length}개 선택
                </span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each filters.years as year}
                  <span class="inline-flex items-center px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md text-xs font-medium transition-colors">
                    {year}
                    <button
                      on:click={() => removeYearFilter(year)}
                      class="ml-1.5 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- 직렬 필터 -->
          {#if filters.categories.length > 0 && filters.categories.length < categoryOptions.length}
            <div class="bg-white border border-gray-100 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <Briefcase size={14} class="text-green-500" />
                  <span class="text-sm font-medium text-gray-700">직렬</span>
                </div>
                <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {filters.categories.length}개 선택
                </span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each filters.categories as category}
                  <span class="inline-flex items-center px-2.5 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-md text-xs font-medium transition-colors">
                    {category.length > 12 ? category.slice(0, 12) + '...' : category}
                    <button
                      on:click={() => removeCategoryFilter(category)}
                      class="ml-1.5 hover:bg-green-300 rounded-full p-0.5 transition-colors"
                      title={category}
                    >
                      <X size={10} />
                    </button>
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- 기관 필터 -->
          {#if filters.agencies.length > 0 && filters.agencies.length < agencyOptions.length}
            <div class="bg-white border border-gray-100 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <Building size={14} class="text-purple-500" />
                  <span class="text-sm font-medium text-gray-700">기관</span>
                </div>
                <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {filters.agencies.length}개 선택
                </span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each filters.agencies as agency}
                  <span class="inline-flex items-center px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-md text-xs font-medium transition-colors">
                    {agency.length > 15 ? agency.slice(0, 15) + '...' : agency}
                    <button
                      on:click={() => removeAgencyFilter(agency)}
                      class="ml-1.5 hover:bg-purple-300 rounded-full p-0.5 transition-colors"
                      title={agency}
                    >
                      <X size={10} />
                    </button>
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- 하단 데이터 요약 -->
        <div class="border-t border-gray-200 pt-3">
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center p-2 bg-blue-50 rounded-lg">
              <div class="text-lg font-bold text-blue-600">{filteredData.jobs.length}</div>
              <div class="text-xs text-blue-700 font-medium">채용공고</div>
            </div>
            <div class="text-center p-2 bg-green-50 rounded-lg">
              <div class="text-lg font-bold text-green-600">{filteredData.competition.length}</div>
              <div class="text-xs text-green-700 font-medium">경쟁률</div>
            </div>
            <div class="text-center p-2 bg-purple-50 rounded-lg">
              <div class="text-lg font-bold text-purple-600">{filteredData.hiring.length}</div>
              <div class="text-xs text-purple-700 font-medium">채용인원</div>
            </div>
          </div>
        </div>
        
        <!-- 필터 관리 액션 -->
        {#if activeFiltersCount > 0}
          <div class="flex space-x-2">
            <button
              on:click={clearAllFilters}
              class="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition-colors"
            >
              <X size={14} class="mr-1" />
              모든 필터 제거
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<!-- 패널이 숨겨진 경우 재표시 버튼 -->
{#if !isVisible}
  <button
    on:click={toggleVisibility}
    class="fixed top-20 right-4 z-40 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg animate-pulse"
    title="필터 패널 보기"
  >
    <Eye size={20} />
  </button>
{/if}

<style>
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* 확장된 패널 스타일 */
  .expanded {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  /* 스크롤바 스타일링 */
  .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* 애니메이션 효과 */
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }
</style>