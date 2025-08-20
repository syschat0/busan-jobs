<script>
  import { onMount } from 'svelte';
  import { Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-svelte';
  import { fetchCachedData } from '$lib/utils/apiClient.js';
  import { config } from '$lib/utils/config.js';
  import DataGrid from './components/DataGrid.svelte';

  // 데이터 상태
  let currentTable = 'TMP_채용공고';
  let data = [];
  let isLoading = false;
  let error = null;
  let lastUpdated = null;

  // 테이블 목록
  const tables = [
    { 
      id: 'TMP_채용공고', 
      name: '채용공고', 
      description: '부산 공공기관 채용공고 정보' 
    },
    { 
      id: 'TMP_채용경쟁률', 
      name: '채용경쟁률', 
      description: '각 채용공고별 경쟁률 현황' 
    },
    { 
      id: 'TMP_신입채용인원현황', 
      name: '신입채용인원현황', 
      description: '연도별 신입채용 인원 통계' 
    }
  ];

  // 데이터 로드
  async function loadData(tableName) {
    isLoading = true;
    error = null;
    
    try {
      console.log(`테이블 ${tableName} 데이터 로딩 시작...`);
      const result = await fetchCachedData(tableName);
      
      data = Array.isArray(result) ? result : [];
      lastUpdated = new Date();
      
      console.log(`테이블 ${tableName} 데이터 로딩 완료:`, {
        count: data.length,
        sample: data.slice(0, 2)
      });
      
    } catch (err) {
      console.error('데이터 로딩 실패:', err);
      error = err.message || '데이터를 불러오는데 실패했습니다.';
      data = [];
    } finally {
      isLoading = false;
    }
  }

  // 테이블 변경
  async function changeTable(tableName) {
    currentTable = tableName;
    await loadData(tableName);
  }

  // 새로고침
  async function refresh() {
    await loadData(currentTable);
  }

  // 초기 데이터 로드
  onMount(async () => {
    await loadData(currentTable);
  });
</script>

<svelte:head>
  <title>데이터 대시보드 - {config.siteName}</title>
  <meta name="description" content="부산 공공기관 채용정보 데이터 대시보드" />
</svelte:head>

<div class="space-y-6">
  <!-- 헤더 -->
  <section class="flex items-center justify-between">
    <div>
      <div class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium mb-4">
        <Database size={16} class="mr-2" />
        데이터 대시보드
      </div>
      
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        채용정보 데이터 관리
      </h1>
      <p class="text-gray-600">
        부산 공공기관의 채용정보 데이터를 확인하고 관리하세요
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

  <!-- 테이블 선택 탭 -->
  <section class="border-b border-gray-200">
    <nav class="flex space-x-8">
      {#each tables as table}
        <button
          on:click={() => changeTable(table.id)}
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {
            currentTable === table.id 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }"
        >
          <div class="text-left">
            <div class="font-semibold">{table.name}</div>
            <div class="text-xs text-gray-400 mt-1">{table.description}</div>
          </div>
        </button>
      {/each}
    </nav>
  </section>

  <!-- 상태 표시 -->
  <section class="space-y-4">
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

    <!-- 데이터 정보 -->
    {#if !error && data.length > 0}
      <div class="bg-green-50 border border-green-200 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} class="text-green-600" />
            </div>
            <div>
              <h3 class="text-green-800 font-semibold">데이터 로드 완료</h3>
              <p class="text-green-700 text-sm">
                총 {data.length}건의 데이터가 로드되었습니다.
                {#if lastUpdated}
                  (최종 업데이트: {lastUpdated.toLocaleString('ko-KR')})
                {/if}
              </p>
            </div>
          </div>
          
          <!-- 현재 선택된 테이블 정보 -->
          <div class="text-right">
            <div class="text-sm font-medium text-green-800">
              {tables.find(t => t.id === currentTable)?.name}
            </div>
            <div class="text-xs text-green-600">
              {tables.find(t => t.id === currentTable)?.description}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- 빈 데이터 상태 -->
    {#if !error && !isLoading && data.length === 0}
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-8">
        <div class="text-center">
          <Database size={48} class="mx-auto text-gray-400 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            데이터가 없습니다
          </h3>
          <p class="text-gray-600 mb-4">
            {tables.find(t => t.id === currentTable)?.name} 테이블에 데이터가 없거나 로드되지 않았습니다.
          </p>
          <button
            on:click={refresh}
            class="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} class="mr-2" />
            다시 시도
          </button>
        </div>
      </div>
    {/if}
  </section>

  <!-- 데이터 그리드 -->
  {#if !error && !isLoading && data.length > 0}
    <section>
      <DataGrid {data} tableName={currentTable} />
    </section>
  {/if}

  <!-- 로딩 상태 -->
  {#if isLoading}
    <section class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">
          {tables.find(t => t.id === currentTable)?.name} 데이터를 불러오는 중...
        </p>
      </div>
    </section>
  {/if}
</div>