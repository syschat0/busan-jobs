<script>
  import { Eye, EyeOff, Filter, Download, Search } from 'lucide-svelte';
  import DataGrid from '../../datasheet/components/DataGrid.svelte';
  
  export let data = { jobs: [], competition: [], hiring: [] };
  export let filters = { years: [], categories: [], agencies: [] };
  
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
  
  // 현재 선택된 테이블의 데이터
  $: currentTableData = data[selectedTable] || [];
  
  // 필터 적용 여부 확인
  $: hasActiveFilters = filters.years.length > 0 || 
                       filters.categories.length > 0 || 
                       filters.agencies.length > 0;
  
  // 그리드 토글
  function toggleGrid() {
    showGrid = !showGrid;
  }
  
  // 테이블 변경
  function changeTable(tableId) {
    selectedTable = tableId;
  }
  
  // 필터링된 데이터 요약 통계
  $: filterSummary = {
    totalJobs: data.jobs.length,
    totalCompetition: data.competition.length,
    totalHiring: data.hiring.length
  };
</script>

<div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
  <!-- 헤더 -->
  <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-blue-100 rounded-lg">
          <Filter size={20} class="text-blue-600" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">필터링된 데이터</h3>
          <p class="text-sm text-gray-600">
            {#if hasActiveFilters}
              필터가 적용된 데이터를 그리드로 확인하세요
            {:else}
              전체 데이터를 그리드로 확인하세요
            {/if}
          </p>
        </div>
      </div>
      
      <!-- 토글 버튼 -->
      <button
        on:click={toggleGrid}
        class="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
      >
        {#if showGrid}
          <EyeOff size={16} class="mr-2" />
          그리드 숨기기
        {:else}
          <Eye size={16} class="mr-2" />
          그리드 보기
        {/if}
      </button>
    </div>
    
    <!-- 필터 요약 -->
    {#if hasActiveFilters}
      <div class="mt-4 flex flex-wrap gap-2">
        {#if filters.years.length > 0}
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            연도: {filters.years.join(', ')}
          </span>
        {/if}
        {#if filters.categories.length > 0}
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            직렬: {filters.categories.slice(0, 3).join(', ')}{filters.categories.length > 3 ? ' 외 ' + (filters.categories.length - 3) + '개' : ''}
          </span>
        {/if}
        {#if filters.agencies.length > 0}
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            기관: {filters.agencies.slice(0, 2).join(', ')}{filters.agencies.length > 2 ? ' 외 ' + (filters.agencies.length - 2) + '개' : ''}
          </span>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- 그리드 표시 영역 -->
  {#if showGrid}
    <div class="border-t border-gray-200">
      <!-- 데이터 요약 -->
      <div class="px-6 py-4 bg-blue-50 border-b border-blue-200">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-600">{filterSummary.totalJobs}</div>
            <div class="text-sm text-blue-700">채용공고</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-600">{filterSummary.totalCompetition}</div>
            <div class="text-sm text-green-700">경쟁률 데이터</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-purple-600">{filterSummary.totalHiring}</div>
            <div class="text-sm text-purple-700">채용인원 데이터</div>
          </div>
        </div>
      </div>
      
      <!-- 테이블 선택 탭 -->
      <div class="px-6 py-0 border-b border-gray-200 bg-white">
        <nav class="flex space-x-8">
          {#each tables as table}
            <button
              on:click={() => changeTable(table.id)}
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {
                selectedTable === table.id 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }"
            >
              <div class="text-left">
                <div class="font-semibold">{table.name}</div>
                <div class="text-xs text-gray-400 mt-1">
                  {table.description} ({data[table.dataKey]?.length || 0}건)
                </div>
              </div>
            </button>
          {/each}
        </nav>
      </div>
      
      <!-- 데이터 그리드 -->
      <div class="px-6 pb-6">
        {#if currentTableData.length > 0}
          <!-- 커스텀 그리드 (datasheet 구조와 호환) -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <!-- 그리드 헤더 -->
            <div class="p-6 border-b border-gray-200">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">
                    {tables.find(t => t.id === selectedTable)?.name} 데이터
                  </h3>
                  <p class="text-sm text-gray-600 mt-1">
                    총 {currentTableData.length}건
                    {#if hasActiveFilters}
                      (필터 적용됨)
                    {/if}
                  </p>
                </div>
                
                <div class="flex items-center space-x-3">
                  <!-- 내보내기 -->
                  <button
                    on:click={() => {
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
                    }}
                    class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Download size={16} class="mr-2" />
                    CSV 내보내기
                  </button>
                </div>
              </div>
            </div>

            <!-- 테이블 -->
            <div class="overflow-x-auto max-h-96">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    {#each Object.keys(currentTableData[0] || {}) as column}
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {column}
                      </th>
                    {/each}
                  </tr>
                </thead>
                
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each currentTableData.slice(0, 20) as row}
                    <tr class="hover:bg-gray-50 transition-colors">
                      {#each Object.entries(row) as [key, value]}
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
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
              <div class="px-6 py-4 border-t border-gray-200 text-center">
                <p class="text-sm text-gray-500">
                  처음 20건만 표시됩니다. 전체 데이터는 CSV로 내보내기하여 확인하세요.
                </p>
              </div>
            {/if}
          </div>
        {:else}
          <!-- 빈 데이터 상태 -->
          <div class="text-center py-12">
            <Search size={48} class="mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              데이터가 없습니다
            </h3>
            <p class="text-gray-600 mb-4">
              {#if hasActiveFilters}
                현재 필터 조건에 해당하는 {tables.find(t => t.id === selectedTable)?.name} 데이터가 없습니다.
              {:else}
                {tables.find(t => t.id === selectedTable)?.name} 데이터가 없습니다.
              {/if}
            </p>
            {#if hasActiveFilters}
              <button
                on:click={() => {
                  // 필터 초기화는 부모 컴포넌트에서 처리
                  const event = new CustomEvent('resetFilters');
                  document.dispatchEvent(event);
                }}
                class="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                필터 초기화
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- 그리드 숨김 상태 -->
    <div class="px-6 py-8 text-center">
      <div class="text-gray-400 mb-4">
        <Eye size={48} class="mx-auto" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        데이터 그리드가 숨겨져 있습니다
      </h3>
      <p class="text-gray-600 mb-4">
        "그리드 보기" 버튼을 클릭하여 필터링된 데이터를 확인하세요.
      </p>
      <div class="text-sm text-gray-500">
        {#if hasActiveFilters}
          현재 필터가 적용된 상태: 채용공고 {filterSummary.totalJobs}건, 경쟁률 {filterSummary.totalCompetition}건, 채용인원 {filterSummary.totalHiring}건
        {:else}
          전체 데이터: 채용공고 {filterSummary.totalJobs}건, 경쟁률 {filterSummary.totalCompetition}건, 채용인원 {filterSummary.totalHiring}건
        {/if}
      </div>
    </div>
  {/if}
</div>