<script>
  import { Filter, X, Calendar, Briefcase, Building } from 'lucide-svelte';
  
  export let filters = {
    years: [],
    categories: [],
    agencies: []
  };
  export let data = { jobs: [], competition: [], hiring: [] };
  export let filteredData = { jobs: [], competition: [], hiring: [] };

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
</script>

<!-- 필터 상태 표시 패널 -->
{#if activeFiltersCount > 0}
  <div class="fixed top-20 right-4 z-40 bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-sm animate-fade-in">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <div class="p-1.5 bg-blue-100 rounded-lg">
          <Filter size={16} class="text-blue-600" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-900">적용된 필터</h3>
          <p class="text-xs text-gray-500">
            {activeFiltersCount}개 활성 • {totalFiltered}건 결과
          </p>
        </div>
      </div>
      <button
        on:click={clearAllFilters}
        class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        title="모든 필터 제거"
      >
        <X size={16} class="text-gray-400 hover:text-gray-600" />
      </button>
    </div>

    <!-- 필터링 효과 요약 -->
    <div class="mb-3 p-2 bg-blue-50 rounded-lg">
      <div class="flex items-center justify-between text-xs">
        <span class="text-blue-700">데이터 감소:</span>
        <span class="font-medium text-blue-800">{reductionPercentage.toFixed(1)}%</span>
      </div>
      <div class="mt-1 w-full bg-blue-200 rounded-full h-1.5">
        <div 
          class="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
          style="width: {reductionPercentage}%"
        ></div>
      </div>
    </div>

    <!-- 활성 필터 목록 -->
    <div class="space-y-2">
      <!-- 년도 필터 -->
      {#if filters.years.length > 0 && filters.years.length < yearOptions.length}
        <div>
          <div class="flex items-center space-x-2 mb-1">
            <Calendar size={12} class="text-blue-500" />
            <span class="text-xs font-medium text-gray-700">년도</span>
            <span class="text-xs text-gray-500">({filters.years.length})</span>
          </div>
          <div class="flex flex-wrap gap-1">
            {#each filters.years.slice(0, 3) as year}
              <span class="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                {year}
                <button
                  on:click={() => removeYearFilter(year)}
                  class="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            {/each}
            {#if filters.years.length > 3}
              <span class="text-xs text-gray-500 px-2 py-0.5">
                +{filters.years.length - 3}개 더
              </span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- 직렬 필터 -->
      {#if filters.categories.length > 0 && filters.categories.length < categoryOptions.length}
        <div>
          <div class="flex items-center space-x-2 mb-1">
            <Briefcase size={12} class="text-green-500" />
            <span class="text-xs font-medium text-gray-700">직렬</span>
            <span class="text-xs text-gray-500">({filters.categories.length})</span>
          </div>
          <div class="flex flex-wrap gap-1">
            {#each filters.categories.slice(0, 2) as category}
              <span class="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                {category.length > 8 ? category.slice(0, 8) + '...' : category}
                <button
                  on:click={() => removeCategoryFilter(category)}
                  class="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            {/each}
            {#if filters.categories.length > 2}
              <span class="text-xs text-gray-500 px-2 py-0.5">
                +{filters.categories.length - 2}개 더
              </span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- 기관 필터 -->
      {#if filters.agencies.length > 0 && filters.agencies.length < agencyOptions.length}
        <div>
          <div class="flex items-center space-x-2 mb-1">
            <Building size={12} class="text-purple-500" />
            <span class="text-xs font-medium text-gray-700">기관</span>
            <span class="text-xs text-gray-500">({filters.agencies.length})</span>
          </div>
          <div class="flex flex-wrap gap-1">
            {#each filters.agencies.slice(0, 2) as agency}
              <span class="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                {agency.length > 10 ? agency.slice(0, 10) + '...' : agency}
                <button
                  on:click={() => removeAgencyFilter(agency)}
                  class="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            {/each}
            {#if filters.agencies.length > 2}
              <span class="text-xs text-gray-500 px-2 py-0.5">
                +{filters.agencies.length - 2}개 더
              </span>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- 하단 요약 -->
    <div class="mt-3 pt-3 border-t border-gray-200">
      <div class="grid grid-cols-3 gap-2 text-center">
        <div>
          <div class="text-sm font-bold text-blue-600">{filteredData.jobs.length}</div>
          <div class="text-xs text-gray-500">채용공고</div>
        </div>
        <div>
          <div class="text-sm font-bold text-green-600">{filteredData.competition.length}</div>
          <div class="text-xs text-gray-500">경쟁률</div>
        </div>
        <div>
          <div class="text-sm font-bold text-purple-600">{filteredData.hiring.length}</div>
          <div class="text-xs text-gray-500">채용인원</div>
        </div>
      </div>
    </div>
  </div>
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
</style>