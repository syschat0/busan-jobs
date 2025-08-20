<script>
  import { Filter, Calendar, Briefcase, RotateCcw, Eye, EyeOff, Download, Search } from 'lucide-svelte';
  import MultiSelectDropdown from './MultiSelectDropdown.svelte';
  import { filterAllData } from '$lib/utils/dataFilters.js';
  
  export let data = { jobs: [], competition: [], hiring: [] };
  export let filters = {
    years: [],
    categories: [],
    agencies: []
  };

  // 그리드 표시 상태
  let showGrid = false;
  let selectedTable = 'jobs';

  // 테이블 목록
  const tables = [
    { 
      id: 'jobs', 
      name: '채용공고', 
      description: '필터링된 채용공고 정보',
      dataKey: 'jobs'
    },
    { 
      id: 'competition', 
      name: '채용경쟁률', 
      description: '필터링된 경쟁률 현황',
      dataKey: 'competition'
    },
    { 
      id: 'hiring', 
      name: '신입채용인원현황', 
      description: '필터링된 채용인원 통계',
      dataKey: 'hiring'
    }
  ];

  // 필터링된 데이터
  $: filteredData = filterAllData(data, filters);
  
  // 현재 선택된 테이블의 데이터
  $: currentTableData = filteredData[selectedTable] || [];

  // 필터 옵션 추출 (중복 제거 보장)
  $: yearOptions = (() => {
    const yearSet = new Set();
    
    // 채용공고에서 년도 추출
    data.jobs.forEach(job => {
      if (job.공고시작일) {
        const year = new Date(job.공고시작일).getFullYear();
        if (!isNaN(year)) {
          yearSet.add(year);
        }
      }
    });
    
    // 경쟁률 데이터에서 년도 추출
    data.competition.forEach(comp => {
      if (comp.연도) {
        const year = parseInt(comp.연도);
        if (!isNaN(year)) {
          yearSet.add(year);
        }
      }
    });
    
    const years = Array.from(yearSet).sort((a, b) => b - a);
    return ['all', ...years];
  })();

  $: categoryOptions = (() => {
    const categorySet = new Set();
    
    // 채용공고에서 직렬 추출
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
    
    // 경쟁률 데이터에서 직렬 추출
    data.competition.forEach(comp => {
      if (comp.직렬 && comp.직렬 !== '데이터 없음' && typeof comp.직렬 === 'string') {
        categorySet.add(comp.직렬);
      }
    });
    
    const categories = Array.from(categorySet).sort();
    return ['all', ...categories];
  })();

  $: agencyOptions = (() => {
    const agencySet = new Set();
    
    // 채용공고에서 기관명 추출
    data.jobs.forEach(job => {
      if (job.기관명 && typeof job.기관명 === 'string') {
        agencySet.add(job.기관명);
      }
    });
    
    // 경쟁률 데이터에서 기관명 추출
    data.competition.forEach(comp => {
      if (comp.기관명 && typeof comp.기관명 === 'string') {
        agencySet.add(comp.기관명);
      }
    });
    
    const agencies = Array.from(agencySet).sort();
    return ['all', ...agencies];
  })();

  // 필터 초기화
  function resetFilters() {
    filters = {
      years: [],
      categories: [],
      agencies: []
    };
  }

  // 그리드 토글
  function toggleGrid() {
    showGrid = !showGrid;
  }
  
  // 테이블 변경
  function changeTable(tableId) {
    selectedTable = tableId;
  }

  // CSV 내보내기
  function exportData() {
    if (currentTableData.length === 0) return;
    
    const csvContent = [
      Object.keys(currentTableData[0]).join(','),
      ...currentTableData.map(row => 
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `filtered_${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 활성 필터 개수 계산 (전체 선택은 필터 적용으로 간주하지 않음)
  $: activeFiltersCount = 
    (filters.years.length > 0 && filters.years.length < yearOptions.filter(y => y !== 'all').length ? filters.years.length : 0) +
    (filters.categories.length > 0 && filters.categories.length < categoryOptions.filter(c => c !== 'all').length ? filters.categories.length : 0) +
    (filters.agencies.length > 0 && filters.agencies.length < agencyOptions.filter(a => a !== 'all').length ? filters.agencies.length : 0);

  // 필터 변경 핸들러
  function handleYearChange(event) {
    filters.years = event.detail;
  }

  function handleCategoryChange(event) {
    filters.categories = event.detail;
  }

  function handleAgencyChange(event) {
    filters.agencies = event.detail;
  }

</script>

<div class="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center space-x-2">
      <div class="p-2 bg-blue-100 rounded-lg">
        <Filter size={20} class="text-blue-600" />
      </div>
      <div>
        <h2 class="text-lg font-semibold text-gray-900">필터 설정</h2>
        <p class="text-sm text-gray-500">
          {#if activeFiltersCount > 0}
            {activeFiltersCount}개 필터 적용 중
          {:else}
            전체 데이터 표시
          {/if}
        </p>
      </div>
    </div>
    
    <div class="flex items-center space-x-2">
      <!-- 그리드 토글 버튼 -->
      <button
        on:click={toggleGrid}
        class="inline-flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {#if showGrid}
          <EyeOff size={16} class="mr-1" />
          그리드 숨기기
        {:else}
          <Eye size={16} class="mr-1" />
          필터된 데이터 보기
        {/if}
      </button>
      
      {#if activeFiltersCount > 0}
        <button
          on:click={resetFilters}
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <RotateCcw size={16} class="mr-1" />
          초기화
        </button>
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- 년도 필터 -->
    <MultiSelectDropdown
      options={yearOptions.filter(y => y !== 'all').map(y => `${y}년`)}
      selectedValues={filters.years}
      label="년도"
      icon={Calendar}
      on:change={handleYearChange}
    />

    <!-- 직렬 필터 -->
    <MultiSelectDropdown
      options={categoryOptions.filter(c => c !== 'all')}
      selectedValues={filters.categories}
      label="직렬"
      icon={Briefcase}
      on:change={handleCategoryChange}
    />

    <!-- 기관 필터 -->
    <MultiSelectDropdown
      options={agencyOptions.filter(a => a !== 'all')}
      selectedValues={filters.agencies}
      label="기관"
      icon={Filter}
      on:change={handleAgencyChange}
    />
  </div>

  <!-- 활성 필터 표시 (전체 선택이 아닌 항목들만) -->
  {#if activeFiltersCount > 0}
    <div class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="text-gray-600">적용된 필터:</span>
        {#if filters.years.length > 0 && filters.years.length < yearOptions.filter(y => y !== 'all').length}
          {#each filters.years as year}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {year}
            </span>
          {/each}
        {/if}
        {#if filters.categories.length > 0 && filters.categories.length < categoryOptions.filter(c => c !== 'all').length}
          {#each filters.categories as category}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {category}
            </span>
          {/each}
        {/if}
        {#if filters.agencies.length > 0 && filters.agencies.length < agencyOptions.filter(a => a !== 'all').length}
          {#each filters.agencies as agency}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {agency}
            </span>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  <!-- 필터링된 데이터 그리드 -->
  {#if showGrid}
    <div class="mt-6 pt-6 border-t border-gray-200">
      <!-- 데이터 요약 -->
      <div class="mb-6 p-4 bg-blue-50 rounded-xl">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-600">{filteredData.jobs.length}</div>
            <div class="text-sm text-blue-700">채용공고</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-600">{filteredData.competition.length}</div>
            <div class="text-sm text-green-700">경쟁률 데이터</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-purple-600">{filteredData.hiring.length}</div>
            <div class="text-sm text-purple-700">채용인원 데이터</div>
          </div>
        </div>
      </div>
      
      <!-- 테이블 선택 탭 -->
      <div class="border-b border-gray-200 mb-4">
        <nav class="flex space-x-8">
          {#each tables as table}
            <button
              on:click={() => changeTable(table.id)}
              class="py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {
                selectedTable === table.id 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }"
            >
              <div class="text-left">
                <div class="font-semibold">{table.name}</div>
                <div class="text-xs text-gray-400 mt-1">
                  {table.description} ({filteredData[table.dataKey]?.length || 0}건)
                </div>
              </div>
            </button>
          {/each}
        </nav>
      </div>
      
      <!-- 데이터 그리드 -->
      {#if currentTableData.length > 0}
        <div class="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <!-- 그리드 헤더 -->
          <div class="p-4 bg-white border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {tables.find(t => t.id === selectedTable)?.name} 데이터
                </h3>
                <p class="text-sm text-gray-600 mt-1">
                  총 {currentTableData.length}건
                  {#if activeFiltersCount > 0}
                    (필터 적용됨)
                  {/if}
                </p>
              </div>
              
              <button
                on:click={exportData}
                class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download size={16} class="mr-2" />
                CSV 내보내기
              </button>
            </div>
          </div>

          <!-- 테이블 -->
          <div class="overflow-x-auto max-h-80">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  {#each Object.keys(currentTableData[0] || {}) as column}
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column}
                    </th>
                  {/each}
                </tr>
              </thead>
              
              <tbody class="bg-white divide-y divide-gray-200">
                {#each currentTableData.slice(0, 20) as row}
                  <tr class="hover:bg-gray-50 transition-colors">
                    {#each Object.entries(row) as [key, value]}
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {#if String(value).length > 50}
                          <div class="max-w-xs truncate" title={value}>
                            {value}
                          </div>
                        {:else}
                          {value}
                        {/if}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          {#if currentTableData.length > 20}
            <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
              <p class="text-sm text-gray-500">
                처음 20건만 표시됩니다. 전체 {currentTableData.length}건 데이터는 CSV로 내보내기하여 확인하세요.
              </p>
            </div>
          {/if}
        </div>
      {:else}
        <!-- 빈 데이터 상태 -->
        <div class="text-center py-12 bg-gray-50 rounded-xl">
          <Search size={48} class="mx-auto text-gray-400 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            데이터가 없습니다
          </h3>
          <p class="text-gray-600 mb-4">
            {#if activeFiltersCount > 0}
              현재 필터 조건에 해당하는 {tables.find(t => t.id === selectedTable)?.name} 데이터가 없습니다.
            {:else}
              {tables.find(t => t.id === selectedTable)?.name} 데이터가 없습니다.
            {/if}
          </p>
          {#if activeFiltersCount > 0}
            <button
              on:click={resetFilters}
              class="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              필터 초기화
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>