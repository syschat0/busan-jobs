<script>
  import { ChevronUp, ChevronDown, Search, Download, Eye } from 'lucide-svelte';
  
  export let data = [];
  export let tableName = '';

  // 그리드 상태
  let sortColumn = '';
  let sortDirection = 'asc';
  let searchTerm = '';
  let currentPage = 1;
  let itemsPerPage = 20;

  // 컬럼 정의 (동적으로 생성)
  $: columns = data.length > 0 ? Object.keys(data[0]) : [];
  
  // 검색 및 필터링
  $: filteredData = data.filter(item => {
    if (!searchTerm) return true;
    
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // 정렬
  $: sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    // 숫자 비교
    if (!isNaN(aVal) && !isNaN(bVal)) {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // 문자열 비교
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    } else {
      return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
    }
  });

  // 페이지네이션
  $: totalPages = Math.ceil(sortedData.length / itemsPerPage);
  $: paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // 정렬 함수
  function handleSort(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
  }


  // 페이지 변경
  function goToPage(page) {
    currentPage = Math.max(1, Math.min(page, totalPages));
  }

  // 데이터 내보내기
  function exportData() {
    const csvContent = [
      columns.join(','),
      ...sortedData.map(row => 
        columns.map(col => `"${String(row[col]).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${tableName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 컬럼 헤더 표시명 변환
  function getColumnDisplayName(column) {
    const displayNames = {
      // 채용공고 테이블
      'agency_name': '기관명',
      'job_title': '공고명', 
      'start_date': '공고시작일',
      'end_date': '공고마감일',
      'application_start': '접수시작일',
      'application_end': '접수마감일',
      'category': '직렬',
      'required_count': '채용인원',
      
      // 경쟁률 테이블
      'competition_rate': '경쟁률',
      'applicant_count': '지원자수',
      'selected_count': '선발인원',
      'passing_score': '합격선',
      
      // 신입채용인원 테이블
      'year': '연도',
      'regular_general': '정규직(일반)',
      'regular_disabled': '정규직(장애인)',
      'public_worker': '공무직',
      'intern_general': '인턴(일반)',
      'intern_disabled': '인턴(장애인)'
    };
    
    return displayNames[column] || column;
  }
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200">
  <!-- 그리드 헤더 -->
  <div class="p-6 border-b border-gray-200">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">
          {tableName === 'TMP_채용공고' ? '채용공고' : 
           tableName === 'TMP_채용경쟁률' ? '채용경쟁률' : 
           tableName === 'TMP_신입채용인원현황' ? '신입채용인원현황' : tableName} 데이터
        </h3>
        <p class="text-sm text-gray-600 mt-1">
          총 {filteredData.length}건 (전체 {data.length}건)
        </p>
      </div>
      
      <div class="flex items-center space-x-3">
        <!-- 검색 -->
        <div class="relative">
          <Search size={16} class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="데이터 검색..."
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <!-- 내보내기 -->
        <button
          on:click={exportData}
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
          <!-- 컬럼 헤더 -->
          {#each columns as column}
            <th
              class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              on:click={() => handleSort(column)}
            >
              <div class="flex items-center space-x-1">
                <span>{getColumnDisplayName(column)}</span>
                {#if sortColumn === column}
                  {#if sortDirection === 'asc'}
                    <ChevronUp size={14} />
                  {:else}
                    <ChevronDown size={14} />
                  {/if}
                {:else}
                  <div class="w-3.5 h-3.5"></div>
                {/if}
              </div>
            </th>
          {/each}
          
          <!-- 액션 -->
          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            액션
          </th>
        </tr>
      </thead>
      
      <tbody class="bg-white divide-y divide-gray-200">
        {#each paginatedData as row, index}
          <tr class="hover:bg-gray-50 transition-colors">
            <!-- 데이터 셀 -->
            {#each columns as column}
              <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                {#if String(row[column]).length > 50}
                  <div class="max-w-xs truncate" title={row[column]}>
                    {row[column]}
                  </div>
                {:else}
                  {row[column]}
                {/if}
              </td>
            {/each}
            
            <!-- 액션 버튼 -->
            <td class="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
              <button
                class="text-blue-600 hover:text-blue-900 transition-colors"
                title="상세보기"
              >
                <Eye size={16} />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- 페이지네이션 -->
  {#if totalPages > 1}
    <div class="px-6 py-4 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedData.length)} / {sortedData.length}건
        </div>
        
        <div class="flex items-center space-x-2">
          <!-- 이전 페이지 -->
          <button
            on:click={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            이전
          </button>
          
          <!-- 페이지 번호 -->
          {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
            const startPage = Math.max(1, currentPage - 2);
            return startPage + i;
          }) as pageNum}
            {#if pageNum <= totalPages}
              <button
                on:click={() => goToPage(pageNum)}
                class="px-3 py-2 border rounded-lg text-sm font-medium transition-colors {
                  pageNum === currentPage 
                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }"
              >
                {pageNum}
              </button>
            {/if}
          {/each}
          
          <!-- 다음 페이지 -->
          <button
            on:click={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- 빈 데이터 상태 -->
{#if filteredData.length === 0 && data.length > 0}
  <div class="text-center py-12">
    <Search size={48} class="mx-auto text-gray-400 mb-4" />
    <h3 class="text-lg font-semibold text-gray-900 mb-2">
      검색 결과가 없습니다
    </h3>
    <p class="text-gray-600 mb-4">
      "{searchTerm}"에 해당하는 데이터를 찾을 수 없습니다.
    </p>
    <button
      on:click={() => searchTerm = ''}
      class="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
    >
      검색 초기화
    </button>
  </div>
{/if}