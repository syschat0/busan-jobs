<script>
  import { Filter, X, Calendar, Briefcase, Building, ChevronRight, Settings, Eye, EyeOff, ChevronDown, Check } from 'lucide-svelte';
  
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
  
  // 드롭다운 상태
  let isYearDropdownOpen = false;
  let isCategoryDropdownOpen = false;
  let isAgencyDropdownOpen = false;

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

  // 필터 상태 계산 (전체 선택도 명시적으로 표시)
  $: hasPartialYearFilter = filters.years.length > 0 && filters.years.length < yearOptions.length;
  $: hasPartialCategoryFilter = filters.categories.length > 0 && filters.categories.length < categoryOptions.length;
  $: hasPartialAgencyFilter = filters.agencies.length > 0 && filters.agencies.length < agencyOptions.length;
  
  $: activeFiltersCount = 
    (hasPartialYearFilter ? filters.years.length : 0) +
    (hasPartialCategoryFilter ? filters.categories.length : 0) +
    (hasPartialAgencyFilter ? filters.agencies.length : 0);
    
  // 표시할 필터 섹션 개수 (전체 선택 포함)
  $: displayedSectionsCount = 
    (yearOptions.length > 0 ? 1 : 0) +
    (categoryOptions.length > 0 ? 1 : 0) +
    (agencyOptions.length > 0 ? 1 : 0);

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

  // 개별 필터 추가 함수들
  function addYearFilter(year) {
    console.log('Adding year filter:', year);
    if (!filters.years.includes(year)) {
      filters.years = [...filters.years, year];
      filters = { ...filters }; // 반응성 트리거
    }
  }

  function addCategoryFilter(category) {
    console.log('Adding category filter:', category);
    if (!filters.categories.includes(category)) {
      filters.categories = [...filters.categories, category];
      filters = { ...filters }; // 반응성 트리거
    }
  }

  function addAgencyFilter(agency) {
    console.log('Adding agency filter:', agency);
    if (!filters.agencies.includes(agency)) {
      filters.agencies = [...filters.agencies, agency];
      filters = { ...filters }; // 반응성 트리거
    }
  }

  // 첫 번째 항목 선택으로 부분 선택 모드 진입
  function startPartialYearSelection() {
    filters.years = yearOptions.length > 0 ? [yearOptions[0]] : [];
    filters = { ...filters };
  }

  function startPartialCategorySelection() {
    filters.categories = categoryOptions.length > 0 ? [categoryOptions[0]] : [];
    filters = { ...filters };
  }

  function startPartialAgencySelection() {
    filters.agencies = agencyOptions.length > 0 ? [agencyOptions[0]] : [];
    filters = { ...filters };
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
  
  // 드롭다운 토글 (이벤트 전파 방지)
  function toggleYearDropdown(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Year dropdown toggle clicked'); // 디버깅용
    isYearDropdownOpen = !isYearDropdownOpen;
    isCategoryDropdownOpen = false;
    isAgencyDropdownOpen = false;
  }
  
  function toggleCategoryDropdown(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Category dropdown toggle clicked'); // 디버깅용
    isCategoryDropdownOpen = !isCategoryDropdownOpen;
    isYearDropdownOpen = false;
    isAgencyDropdownOpen = false;
  }
  
  function toggleAgencyDropdown(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Agency dropdown toggle clicked'); // 디버깅용
    isAgencyDropdownOpen = !isAgencyDropdownOpen;
    isYearDropdownOpen = false;
    isCategoryDropdownOpen = false;
  }
  
  // 전체 선택/해제 (GlobalFilters와 동일한 로직)
  function toggleAllYearsCheckbox() {
    console.log('Toggle all years clicked', filters.years.length, yearOptions.length);
    if (filters.years.length === yearOptions.length) {
      filters.years = [];
    } else {
      filters.years = [...yearOptions];
    }
    filters = { ...filters };
  }
  
  function toggleAllCategoriesCheckbox() {
    console.log('Toggle all categories clicked', filters.categories.length, categoryOptions.length);
    if (filters.categories.length === categoryOptions.length) {
      filters.categories = [];
    } else {
      filters.categories = [...categoryOptions];
    }
    filters = { ...filters };
  }
  
  function toggleAllAgenciesCheckbox() {
    console.log('Toggle all agencies clicked', filters.agencies.length, agencyOptions.length);
    if (filters.agencies.length === agencyOptions.length) {
      filters.agencies = [];
    } else {
      filters.agencies = [...agencyOptions];
    }
    filters = { ...filters };
  }
  
  // 외부 클릭 감지로 드롭다운 닫기
  function handleClickOutside(event) {
    // 드롭다운이 열려있고 클릭한 대상이 드롭다운 내부가 아닌 경우
    if (isYearDropdownOpen || isCategoryDropdownOpen || isAgencyDropdownOpen) {
      const target = event.target;
      
      // 더 정확한 범위 체크: 드롭다운 버튼이나 메뉴 내부인지 확인
      const isInsideFilterPanel = target.closest('.filter-status-panel');
      const isDropdownButton = target.closest('.dropdown-button');
      const isDropdownMenu = target.closest('.dropdown-menu');
      
      // 패널 외부이고, 드롭다운 버튼이나 메뉴도 아닌 경우에만 닫기
      if (!isInsideFilterPanel && !isDropdownButton && !isDropdownMenu) {
        isYearDropdownOpen = false;
        isCategoryDropdownOpen = false;
        isAgencyDropdownOpen = false;
      }
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<!-- 필터 상태 표시 사이드 패널 -->
{#if isVisible}
  <div class="filter-status-panel fixed top-20 right-4 z-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fade-in"
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
              {activeFiltersCount}개 부분선택 • {totalFiltered}건 결과
            {:else}
              {displayedSectionsCount}개 전체선택 • {totalOriginal}건 결과
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
        <!-- 필터 설정 (최상단 배치) -->
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <Settings size={14} class="text-gray-600" />
            <h4 class="text-sm font-semibold text-gray-800">
              {activeFiltersCount > 0 ? '활성 필터' : '필터 설정'}
            </h4>
          </div>
          
          <!-- 필터 섹션들 -->
          {#if yearOptions.length > 0}
            <!-- 년도 필터 섹션 -->
            <div class="bg-white border border-gray-100 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <Calendar size={14} class="text-blue-500" />
                  <span class="text-sm font-medium text-gray-700">년도</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-xs px-2 py-0.5 rounded-full {hasPartialYearFilter ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700'}">
                    {hasPartialYearFilter ? `${filters.years.length}개 선택` : '전체 선택'}
                  </span>
                  <!-- 드롭다운 버튼 -->
                  <button
                    on:click={toggleYearDropdown}
                    class="dropdown-button text-xs px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors flex items-center space-x-1"
                  >
                    <span>선택</span>
                    <ChevronDown size={10} class="transform transition-transform {isYearDropdownOpen ? 'rotate-180' : ''}" />
                  </button>
                </div>
              </div>
              
              <!-- 드롭다운 메뉴 -->
              {#if isYearDropdownOpen}
                <div class="relative mb-3">
                  <div class="dropdown-menu absolute z-50 w-full bg-white shadow-lg max-h-48 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto border">
                    <!-- 전체 선택/해제 옵션 -->
                    <div class="px-3 py-2 border-b border-gray-100">
                      <label class="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                        <div class="relative">
                          <input
                            type="checkbox"
                            checked={filters.years.length === yearOptions.length}
                            indeterminate={filters.years.length > 0 && filters.years.length < yearOptions.length}
                            on:change={(e) => { e.stopPropagation(); toggleAllYearsCheckbox(); }}
                            class="sr-only"
                          />
                          <div class="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center {filters.years.length === yearOptions.length ? 'bg-blue-500 border-blue-500' : filters.years.length > 0 ? 'bg-blue-100 border-blue-300' : ''}">
                            {#if filters.years.length === yearOptions.length}
                              <Check size={12} class="text-white" />
                            {:else if filters.years.length > 0}
                              <div class="w-2 h-0.5 bg-blue-500 rounded"></div>
                            {/if}
                          </div>
                        </div>
                        <span class="ml-3 text-sm text-gray-700 font-medium">전체 년도</span>
                      </label>
                    </div>
                    
                    <!-- 개별 년도 옵션들 -->
                    {#each yearOptions as year}
                      <div class="px-3 py-1">
                        <label class="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <div class="relative">
                            <input
                              type="checkbox"
                              checked={filters.years.includes(year)}
                              on:change={(e) => {
                                e.stopPropagation();
                                if (filters.years.includes(year)) {
                                  removeYearFilter(year);
                                } else {
                                  addYearFilter(year);
                                }
                              }}
                              class="sr-only"
                            />
                            <div class="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center {filters.years.includes(year) ? 'bg-blue-500 border-blue-500' : ''}">
                              {#if filters.years.includes(year)}
                                <Check size={12} class="text-white" />
                              {/if}
                            </div>
                          </div>
                          <span class="ml-3 text-sm text-gray-700">{year}</span>
                        </label>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <!-- 선택된 항목들 표시 -->
              <div class="flex flex-wrap gap-1.5">
                {#if hasPartialYearFilter}
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
                {:else}
                  <span class="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                    전체 년도 ({yearOptions.length}개)
                  </span>
                {/if}
              </div>
            </div>
          {/if}
          
          {#if categoryOptions.length > 0}
            <!-- 직렬 필터 섹션 -->
            <div class="bg-white border border-gray-100 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <Briefcase size={14} class="text-green-500" />
                  <span class="text-sm font-medium text-gray-700">직렬</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    {hasPartialCategoryFilter ? `${filters.categories.length}개 선택` : '전체 선택'}
                  </span>
                  <!-- 드롭다운 버튼 -->
                  <button
                    on:click={toggleCategoryDropdown}
                    class="dropdown-button text-xs px-2 py-0.5 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors flex items-center space-x-1"
                  >
                    <span>선택</span>
                    <ChevronDown size={10} class="transform transition-transform {isCategoryDropdownOpen ? 'rotate-180' : ''}" />
                  </button>
                </div>
              </div>
              
              <!-- 드롭다운 메뉴 -->
              {#if isCategoryDropdownOpen}
                <div class="relative mb-3">
                  <div class="dropdown-menu absolute z-50 w-full bg-white shadow-lg max-h-48 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto border">
                    <!-- 전체 선택/해제 옵션 -->
                    <div class="px-3 py-2 border-b border-gray-100">
                      <label class="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                        <div class="relative">
                          <input
                            type="checkbox"
                            checked={filters.categories.length === categoryOptions.length}
                            indeterminate={filters.categories.length > 0 && filters.categories.length < categoryOptions.length}
                            on:change={(e) => { e.stopPropagation(); toggleAllCategoriesCheckbox(); }}
                            class="sr-only"
                          />
                          <div class="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center {filters.categories.length === categoryOptions.length ? 'bg-green-500 border-green-500' : filters.categories.length > 0 ? 'bg-green-100 border-green-300' : ''}">
                            {#if filters.categories.length === categoryOptions.length}
                              <Check size={12} class="text-white" />
                            {:else if filters.categories.length > 0}
                              <div class="w-2 h-0.5 bg-green-500 rounded"></div>
                            {/if}
                          </div>
                        </div>
                        <span class="ml-3 text-sm text-gray-700 font-medium">전체 직렬</span>
                      </label>
                    </div>
                    
                    <!-- 개별 직렬 옵션들 -->
                    {#each categoryOptions as category}
                      <div class="px-3 py-1">
                        <label class="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <div class="relative">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(category)}
                              on:change={(e) => {
                                e.stopPropagation();
                                if (filters.categories.includes(category)) {
                                  removeCategoryFilter(category);
                                } else {
                                  addCategoryFilter(category);
                                }
                              }}
                              class="sr-only"
                            />
                            <div class="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center {filters.categories.includes(category) ? 'bg-green-500 border-green-500' : ''}">
                              {#if filters.categories.includes(category)}
                                <Check size={12} class="text-white" />
                              {/if}
                            </div>
                          </div>
                          <span class="ml-3 text-sm text-gray-700" title={category}>
                            {category.length > 20 ? category.slice(0, 20) + '...' : category}
                          </span>
                        </label>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <!-- 선택된 항목들 표시 -->
              <div class="flex flex-wrap gap-1.5">
                {#if hasPartialCategoryFilter}
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
                {:else}
                  <span class="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                    전체 직렬 ({categoryOptions.length}개)
                  </span>
                {/if}
              </div>
            </div>
          {/if}
          
          {#if agencyOptions.length > 0}
            <!-- 기관 필터 섹션 -->
            <div class="bg-white border border-gray-100 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <Building size={14} class="text-purple-500" />
                  <span class="text-sm font-medium text-gray-700">기관</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {hasPartialAgencyFilter ? `${filters.agencies.length}개 선택` : '전체 선택'}
                  </span>
                  <!-- 드롭다운 버튼 -->
                  <button
                    on:click={toggleAgencyDropdown}
                    class="dropdown-button text-xs px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors flex items-center space-x-1"
                  >
                    <span>선택</span>
                    <ChevronDown size={10} class="transform transition-transform {isAgencyDropdownOpen ? 'rotate-180' : ''}" />
                  </button>
                </div>
              </div>
              
              <!-- 드롭다운 메뉴 -->
              {#if isAgencyDropdownOpen}
                <div class="relative mb-3">
                  <div class="dropdown-menu absolute z-50 w-full bg-white shadow-lg max-h-48 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto border">
                    <!-- 전체 선택/해제 옵션 -->
                    <div class="px-3 py-2 border-b border-gray-100">
                      <label class="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                        <div class="relative">
                          <input
                            type="checkbox"
                            checked={filters.agencies.length === agencyOptions.length}
                            indeterminate={filters.agencies.length > 0 && filters.agencies.length < agencyOptions.length}
                            on:change={(e) => { e.stopPropagation(); toggleAllAgenciesCheckbox(); }}
                            class="sr-only"
                          />
                          <div class="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center {filters.agencies.length === agencyOptions.length ? 'bg-purple-500 border-purple-500' : filters.agencies.length > 0 ? 'bg-purple-100 border-purple-300' : ''}">
                            {#if filters.agencies.length === agencyOptions.length}
                              <Check size={12} class="text-white" />
                            {:else if filters.agencies.length > 0}
                              <div class="w-2 h-0.5 bg-purple-500 rounded"></div>
                            {/if}
                          </div>
                        </div>
                        <span class="ml-3 text-sm text-gray-700 font-medium">전체 기관</span>
                      </label>
                    </div>
                    
                    <!-- 개별 기관 옵션들 -->
                    {#each agencyOptions as agency}
                      <div class="px-3 py-1">
                        <label class="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <div class="relative">
                            <input
                              type="checkbox"
                              checked={filters.agencies.includes(agency)}
                              on:change={(e) => {
                                e.stopPropagation();
                                if (filters.agencies.includes(agency)) {
                                  removeAgencyFilter(agency);
                                } else {
                                  addAgencyFilter(agency);
                                }
                              }}
                              class="sr-only"
                            />
                            <div class="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center {filters.agencies.includes(agency) ? 'bg-purple-500 border-purple-500' : ''}">
                              {#if filters.agencies.includes(agency)}
                                <Check size={12} class="text-white" />
                              {/if}
                            </div>
                          </div>
                          <span class="ml-3 text-sm text-gray-700" title={agency}>
                            {agency}
                          </span>
                        </label>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <!-- 선택된 항목들 표시 -->
              <div class="flex flex-wrap gap-1.5">
                {#if hasPartialAgencyFilter}
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
                {:else}
                  <span class="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium">
                    전체 기관 ({agencyOptions.length}개)
                  </span>
                {/if}
              </div>
            </div>
          {/if}
        </div>

        <!-- 전체 데이터 요약 -->
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