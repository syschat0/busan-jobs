<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { 
    Filter, 
    Calendar, 
    Briefcase, 
    RotateCcw, 
    X, 
    Download,
    Search,
    ChevronDown,
    Check
  } from 'lucide-svelte';
  import { filterAllData } from '$lib/utils/dataFilters.js';
  
  export let data = { jobs: [], competition: [], hiring: [] };
  export let filters = {
    years: [],
    categories: [],
    agencies: []
  };
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  // 드롭다운 상태
  let yearDropdownOpen = false;
  let categoryDropdownOpen = false;
  let agencyDropdownOpen = false;

  // 검색 상태
  let yearSearch = '';
  let categorySearch = '';
  let agencySearch = '';

  // 필터링된 데이터
  $: filteredData = filterAllData(data, filters);

  // 필터 옵션 추출
  $: yearOptions = (() => {
    const yearSet = new Set();
    
    data.jobs.forEach(job => {
      if (job.공고시작일) {
        const year = new Date(job.공고시작일).getFullYear();
        if (!isNaN(year)) {
          yearSet.add(year);
        }
      }
    });
    
    data.competition.forEach(comp => {
      if (comp.연도) {
        const year = parseInt(comp.연도);
        if (!isNaN(year)) {
          yearSet.add(year);
        }
      }
    });
    
    return Array.from(yearSet).sort((a, b) => b - a);
  })();

  $: categoryOptions = (() => {
    const categorySet = new Set();
    
    data.jobs.forEach(job => {
      if (job.일반전형 && typeof job.일반전형 === 'string') {
        job.일반전형.split(',').forEach(category => {
          const trimmed = category.trim();
          if (trimmed.length > 0) {
            categorySet.add(trimmed);
          }
        });
      }
    });
    
    data.competition.forEach(comp => {
      if (comp.직렬 && comp.직렬 !== '데이터 없음' && typeof comp.직렬 === 'string') {
        categorySet.add(comp.직렬);
      }
    });
    
    return Array.from(categorySet).sort();
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
    
    return Array.from(agencySet).sort();
  })();

  // 검색 필터링된 옵션들
  $: filteredYearOptions = yearOptions.filter(year => 
    year.toString().includes(yearSearch)
  );
  
  $: filteredCategoryOptions = categoryOptions.filter(category => 
    category.toLowerCase().includes(categorySearch.toLowerCase())
  );
  
  $: filteredAgencyOptions = agencyOptions.filter(agency => 
    agency.toLowerCase().includes(agencySearch.toLowerCase())
  );

  // 활성 필터 개수 계산
  $: activeFiltersCount = 
    (filters.years.length > 0 && filters.years.length < yearOptions.length ? filters.years.length : 0) +
    (filters.categories.length > 0 && filters.categories.length < categoryOptions.length ? filters.categories.length : 0) +
    (filters.agencies.length > 0 && filters.agencies.length < agencyOptions.length ? filters.agencies.length : 0);

  // 필터 토글 함수들
  function toggleYear(year) {
    const yearStr = `${year}년`;
    if (filters.years.includes(yearStr)) {
      filters.years = filters.years.filter(y => y !== yearStr);
    } else {
      filters.years = [...filters.years, yearStr];
    }
    dispatch('filtersChange', filters);
  }

  function toggleCategory(category) {
    if (filters.categories.includes(category)) {
      filters.categories = filters.categories.filter(c => c !== category);
    } else {
      filters.categories = [...filters.categories, category];
    }
    dispatch('filtersChange', filters);
  }

  function toggleAgency(agency) {
    if (filters.agencies.includes(agency)) {
      filters.agencies = filters.agencies.filter(a => a !== agency);
    } else {
      filters.agencies = [...filters.agencies, agency];
    }
    dispatch('filtersChange', filters);
  }

  // 전체 선택/해제
  function selectAllYears() {
    if (filters.years.length === yearOptions.length) {
      filters.years = [];
    } else {
      filters.years = yearOptions.map(y => `${y}년`);
    }
    dispatch('filtersChange', filters);
  }

  function selectAllCategories() {
    if (filters.categories.length === categoryOptions.length) {
      filters.categories = [];
    } else {
      filters.categories = [...categoryOptions];
    }
    dispatch('filtersChange', filters);
  }

  function selectAllAgencies() {
    if (filters.agencies.length === agencyOptions.length) {
      filters.agencies = [];
    } else {
      filters.agencies = [...agencyOptions];
    }
    dispatch('filtersChange', filters);
  }

  // 필터 초기화
  function resetFilters() {
    filters = {
      years: [],
      categories: [],
      agencies: []
    };
    dispatch('filtersChange', filters);
  }

  // 패널 닫기
  function closePanel() {
    dispatch('close');
  }

  // CSV 내보내기
  function exportData(dataType) {
    const data = filteredData[dataType];
    if (data.length === 0) return;
    
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => 
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `filtered_${dataType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 외부 클릭 감지
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closePanel();
    }
  }

  // 키보드 이벤트 처리
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closePanel();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />


<!-- 사이드 패널 오버레이 -->
{#if isOpen}
  <div 
    class="fixed inset-0 z-50 overflow-hidden"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="filter-panel-title"
    transition:fade={{ duration: 300 }}
  >
    <!-- 배경 오버레이 -->
    <div 
      class="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
    ></div>
    
    <!-- 사이드 패널 (반응형) -->
    <div 
      class="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl
             sm:inset-0 sm:max-w-none transform transition-transform duration-300 ease-in-out"
      transition:fly={{ x: 400, duration: 300 }}
    >
      <div class="h-full flex flex-col">
        <!-- 헤더 -->
        <div class="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-white bg-opacity-20 rounded-lg">
                <Filter size={20} />
              </div>
              <div>
                <h2 id="filter-panel-title" class="text-lg font-semibold">
                  고급 필터 설정
                </h2>
                <p class="text-sm text-blue-100">
                  {#if activeFiltersCount > 0}
                    {activeFiltersCount}개 필터 적용 중
                  {:else}
                    전체 데이터 표시
                  {/if}
                </p>
              </div>
            </div>
            <button
              on:click={closePanel}
              class="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              aria-label="필터 패널 닫기"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <!-- 본문 (스크롤 가능) -->
        <div class="flex-1 overflow-y-auto">
          <!-- 필터링 결과 요약 -->
          <div class="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">현재 필터 적용 상태</h3>
              {#if activeFiltersCount > 0}
                <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {activeFiltersCount}개 필터 활성
                </span>
              {:else}
                <span class="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                  전체 데이터
                </span>
              {/if}
            </div>

            <!-- 데이터 카운트 -->
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="bg-white p-4 rounded-xl text-center shadow-sm">
                <div class="text-2xl font-bold text-blue-600">{filteredData.jobs.length}</div>
                <div class="text-sm text-gray-600">채용공고</div>
                <div class="text-xs text-gray-500 mt-1">
                  전체 {data.jobs.length}건 중
                </div>
              </div>
              <div class="bg-white p-4 rounded-xl text-center shadow-sm">
                <div class="text-2xl font-bold text-green-600">{filteredData.competition.length}</div>
                <div class="text-sm text-gray-600">경쟁률</div>
                <div class="text-xs text-gray-500 mt-1">
                  전체 {data.competition.length}건 중
                </div>
              </div>
              <div class="bg-white p-4 rounded-xl text-center shadow-sm">
                <div class="text-2xl font-bold text-purple-600">{filteredData.hiring.length}</div>
                <div class="text-sm text-gray-600">채용인원</div>
                <div class="text-xs text-gray-500 mt-1">
                  전체 {data.hiring.length}건 중
                </div>
              </div>
            </div>

            <!-- 필터 효과 시각화 -->
            {#if activeFiltersCount > 0}
              <div class="bg-white p-4 rounded-xl">
                <h4 class="text-sm font-medium text-gray-900 mb-3">필터 효과</h4>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">채용공고 필터링</span>
                    <div class="flex items-center space-x-2">
                      <div class="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style="width: {(filteredData.jobs.length / data.jobs.length * 100).toFixed(1)}%"
                        ></div>
                      </div>
                      <span class="text-xs text-gray-500">
                        {(filteredData.jobs.length / data.jobs.length * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">경쟁률 데이터</span>
                    <div class="flex items-center space-x-2">
                      <div class="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style="width: {(filteredData.competition.length / data.competition.length * 100).toFixed(1)}%"
                        ></div>
                      </div>
                      <span class="text-xs text-gray-500">
                        {(filteredData.competition.length / data.competition.length * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">채용인원 데이터</span>
                    <div class="flex items-center space-x-2">
                      <div class="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style="width: {(filteredData.hiring.length / data.hiring.length * 100).toFixed(1)}%"
                        ></div>
                      </div>
                      <span class="text-xs text-gray-500">
                        {(filteredData.hiring.length / data.hiring.length * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- 필터 설정 -->
          <div class="p-6 space-y-6">
            <!-- 년도 필터 -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-gray-900 flex items-center">
                  <Calendar size={16} class="mr-2 text-blue-500" />
                  년도 ({filters.years.length}/{yearOptions.length})
                </label>
                <button
                  on:click={selectAllYears}
                  class="text-xs text-blue-600 hover:text-blue-800"
                >
                  {filters.years.length === yearOptions.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              
              <div class="relative">
                <button
                  on:click={() => yearDropdownOpen = !yearDropdownOpen}
                  class="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <span class="text-gray-700">
                    {filters.years.length > 0 ? `${filters.years.length}개 선택됨` : '년도 선택'}
                  </span>
                  <ChevronDown size={16} class="text-gray-400 transform transition-transform {yearDropdownOpen ? 'rotate-180' : ''}" />
                </button>
                
                {#if yearDropdownOpen}
                  <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div class="p-2 border-b">
                      <div class="relative">
                        <Search size={16} class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="년도 검색..."
                          bind:value={yearSearch}
                          class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div class="py-1">
                      {#each filteredYearOptions as year}
                        <button
                          on:click={() => toggleYear(year)}
                          class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>{year}년</span>
                          {#if filters.years.includes(`${year}년`)}
                            <Check size={16} class="text-blue-500" />
                          {/if}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- 직렬 필터 -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-gray-900 flex items-center">
                  <Briefcase size={16} class="mr-2 text-green-500" />
                  직렬 ({filters.categories.length}/{categoryOptions.length})
                </label>
                <button
                  on:click={selectAllCategories}
                  class="text-xs text-green-600 hover:text-green-800"
                >
                  {filters.categories.length === categoryOptions.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              
              <div class="relative">
                <button
                  on:click={() => categoryDropdownOpen = !categoryDropdownOpen}
                  class="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <span class="text-gray-700">
                    {filters.categories.length > 0 ? `${filters.categories.length}개 선택됨` : '직렬 선택'}
                  </span>
                  <ChevronDown size={16} class="text-gray-400 transform transition-transform {categoryDropdownOpen ? 'rotate-180' : ''}" />
                </button>
                
                {#if categoryDropdownOpen}
                  <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div class="p-2 border-b">
                      <div class="relative">
                        <Search size={16} class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="직렬 검색..."
                          bind:value={categorySearch}
                          class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                    <div class="py-1">
                      {#each filteredCategoryOptions as category}
                        <button
                          on:click={() => toggleCategory(category)}
                          class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>{category}</span>
                          {#if filters.categories.includes(category)}
                            <Check size={16} class="text-green-500" />
                          {/if}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- 기관 필터 -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-gray-900 flex items-center">
                  <Filter size={16} class="mr-2 text-purple-500" />
                  기관 ({filters.agencies.length}/{agencyOptions.length})
                </label>
                <button
                  on:click={selectAllAgencies}
                  class="text-xs text-purple-600 hover:text-purple-800"
                >
                  {filters.agencies.length === agencyOptions.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              
              <div class="relative">
                <button
                  on:click={() => agencyDropdownOpen = !agencyDropdownOpen}
                  class="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <span class="text-gray-700">
                    {filters.agencies.length > 0 ? `${filters.agencies.length}개 선택됨` : '기관 선택'}
                  </span>
                  <ChevronDown size={16} class="text-gray-400 transform transition-transform {agencyDropdownOpen ? 'rotate-180' : ''}" />
                </button>
                
                {#if agencyDropdownOpen}
                  <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div class="p-2 border-b">
                      <div class="relative">
                        <Search size={16} class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="기관 검색..."
                          bind:value={agencySearch}
                          class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div class="py-1">
                      {#each filteredAgencyOptions as agency}
                        <button
                          on:click={() => toggleAgency(agency)}
                          class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>{agency}</span>
                          {#if filters.agencies.includes(agency)}
                            <Check size={16} class="text-purple-500" />
                          {/if}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- 활성 필터 상세 표시 -->
            {#if activeFiltersCount > 0}
              <div class="pt-6 border-t border-gray-200">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-semibold text-gray-900">적용된 필터</h4>
                  <button
                    on:click={resetFilters}
                    class="text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors"
                  >
                    모두 제거
                  </button>
                </div>
                
                <div class="space-y-4">
                  <!-- 년도 필터 -->
                  {#if filters.years.length > 0 && filters.years.length < yearOptions.length}
                    <div class="bg-blue-50 p-4 rounded-xl">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                          <Calendar size={16} class="text-blue-500" />
                          <span class="text-sm font-medium text-blue-900">년도 필터</span>
                        </div>
                        <span class="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                          {filters.years.length}개 선택
                        </span>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        {#each filters.years as year}
                          <span class="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                            {year}
                            <button
                              on:click={() => toggleYear(parseInt(year.replace('년', '')))}
                              class="ml-2 hover:bg-blue-300 rounded-full p-1 transition-colors"
                              title="필터 제거"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- 직렬 필터 -->
                  {#if filters.categories.length > 0 && filters.categories.length < categoryOptions.length}
                    <div class="bg-green-50 p-4 rounded-xl">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                          <Briefcase size={16} class="text-green-500" />
                          <span class="text-sm font-medium text-green-900">직렬 필터</span>
                        </div>
                        <span class="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          {filters.categories.length}개 선택
                        </span>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        {#each filters.categories as category}
                          <span class="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                            {category}
                            <button
                              on:click={() => toggleCategory(category)}
                              class="ml-2 hover:bg-green-300 rounded-full p-1 transition-colors"
                              title="필터 제거"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- 기관 필터 -->
                  {#if filters.agencies.length > 0 && filters.agencies.length < agencyOptions.length}
                    <div class="bg-purple-50 p-4 rounded-xl">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                          <Filter size={16} class="text-purple-500" />
                          <span class="text-sm font-medium text-purple-900">기관 필터</span>
                        </div>
                        <span class="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                          {filters.agencies.length}개 선택
                        </span>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        {#each filters.agencies as agency}
                          <span class="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors">
                            {agency}
                            <button
                              on:click={() => toggleAgency(agency)}
                              class="ml-2 hover:bg-purple-300 rounded-full p-1 transition-colors"
                              title="필터 제거"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>

                <!-- 필터 요약 정보 -->
                <div class="mt-4 p-3 bg-gray-100 rounded-lg">
                  <div class="text-xs text-gray-600 space-y-1">
                    <div class="flex justify-between">
                      <span>필터링 전 데이터:</span>
                      <span class="font-medium">{data.jobs.length + data.competition.length + data.hiring.length}건</span>
                    </div>
                    <div class="flex justify-between">
                      <span>필터링 후 데이터:</span>
                      <span class="font-medium text-blue-600">{filteredData.jobs.length + filteredData.competition.length + filteredData.hiring.length}건</span>
                    </div>
                    <div class="flex justify-between border-t border-gray-200 pt-1">
                      <span>감소율:</span>
                      <span class="font-medium text-red-600">
                        {((1 - (filteredData.jobs.length + filteredData.competition.length + filteredData.hiring.length) / (data.jobs.length + data.competition.length + data.hiring.length)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            {:else}
              <!-- 필터가 없을 때 -->
              <div class="pt-6 border-t border-gray-200">
                <div class="text-center py-6">
                  <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Filter size={24} class="text-gray-400" />
                  </div>
                  <h4 class="text-lg font-medium text-gray-900 mb-2">필터가 적용되지 않았습니다</h4>
                  <p class="text-sm text-gray-600 mb-4">
                    위의 필터 옵션을 사용하여 원하는 데이터를 선택하세요.
                  </p>
                  <div class="bg-blue-50 p-3 rounded-lg">
                    <p class="text-xs text-blue-800">
                      💡 팁: 여러 필터를 조합하여 더 정확한 데이터를 찾을 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- 하단 액션 버튼 -->
        <div class="px-6 py-4 bg-gray-50 border-t space-y-3">
          <!-- 데이터 내보내기 -->
          <div class="grid grid-cols-3 gap-2">
            <button
              on:click={() => exportData('jobs')}
              disabled={filteredData.jobs.length === 0}
              class="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors flex items-center justify-center"
            >
              <Download size={12} class="mr-1" />
              채용공고
            </button>
            <button
              on:click={() => exportData('competition')}
              disabled={filteredData.competition.length === 0}
              class="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors flex items-center justify-center"
            >
              <Download size={12} class="mr-1" />
              경쟁률
            </button>
            <button
              on:click={() => exportData('hiring')}
              disabled={filteredData.hiring.length === 0}
              class="px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors flex items-center justify-center"
            >
              <Download size={12} class="mr-1" />
              채용인원
            </button>
          </div>

          <!-- 메인 액션 버튼 -->
          <div class="flex space-x-3">
            {#if activeFiltersCount > 0}
              <button
                on:click={resetFilters}
                class="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <RotateCcw size={16} class="mr-2" />
                초기화
              </button>
            {/if}
            <button
              on:click={closePanel}
              class="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              적용하기
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* 드롭다운이 패널 밖으로 나가지 않도록 z-index 조정 */
  :global(.relative .absolute) {
    z-index: 100;
  }
</style>