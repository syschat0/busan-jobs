<script>
  import { createEventDispatcher } from 'svelte';
  import { Filter, Calendar, Building2, Target, RefreshCw } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  export let agencies = [];
  export let categories = [];
  export let years = [];
  
  // 필터 상태
  let selectedAgencies = [];
  let selectedCategories = [];
  let selectedYears = [];
  let competitionRangeMin = 0;
  let competitionRangeMax = 100;
  let isFilterExpanded = false;
  
  // 필터 변경 시 이벤트 발생
  $: {
    dispatch('filterChange', {
      agencies: selectedAgencies,
      categories: selectedCategories,
      years: selectedYears,
      competitionRange: [competitionRangeMin, competitionRangeMax]
    });
  }
  
  function resetFilters() {
    selectedAgencies = [];
    selectedCategories = [];
    selectedYears = [];
    competitionRangeMin = 0;
    competitionRangeMax = 100;
  }
  
  function toggleAgency(agency) {
    if (selectedAgencies.includes(agency)) {
      selectedAgencies = selectedAgencies.filter(a => a !== agency);
    } else {
      selectedAgencies = [...selectedAgencies, agency];
    }
  }
  
  function toggleCategory(category) {
    if (selectedCategories.includes(category)) {
      selectedCategories = selectedCategories.filter(c => c !== category);
    } else {
      selectedCategories = [...selectedCategories, category];
    }
  }
  
  function toggleYear(year) {
    if (selectedYears.includes(year)) {
      selectedYears = selectedYears.filter(y => y !== year);
    } else {
      selectedYears = [...selectedYears, year];
    }
  }
  
  $: activeFiltersCount = selectedAgencies.length + selectedCategories.length + selectedYears.length + 
    (competitionRangeMin > 0 || competitionRangeMax < 100 ? 1 : 0);
</script>

<div class="card p-6 bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-gray-200">
  <!-- 필터 헤더 -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center space-x-3">
      <div class="p-2 bg-primary-100 rounded-lg">
        <Filter size={20} class="text-primary-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-gray-900">스마트 필터</h3>
        <p class="text-sm text-gray-600">원하는 조건으로 데이터를 필터링하세요</p>
      </div>
    </div>
    
    <div class="flex items-center space-x-2">
      {#if activeFiltersCount > 0}
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
          {activeFiltersCount}개 필터 적용됨
        </span>
      {/if}
      
      <button 
        class="btn-secondary text-sm"
        on:click={() => isFilterExpanded = !isFilterExpanded}
      >
        {isFilterExpanded ? '접기' : '펼치기'}
      </button>
      
      <button 
        class="btn-secondary text-sm"
        on:click={resetFilters}
        disabled={activeFiltersCount === 0}
      >
        <RefreshCw size={14} class="mr-1" />
        초기화
      </button>
    </div>
  </div>
  
  {#if isFilterExpanded}
    <div class="space-y-6 border-t border-gray-200 pt-4">
      <!-- 기관 필터 -->
      <div>
        <div class="flex items-center space-x-2 mb-3">
          <Building2 size={16} class="text-gray-600" />
          <label class="text-sm font-semibold text-gray-900">기관별 필터</label>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each agencies as agency}
            <button
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                     {selectedAgencies.includes(agency) 
                       ? 'bg-primary-500 text-white shadow-md' 
                       : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-300'}"
              on:click={() => toggleAgency(agency)}
            >
              {agency}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- 직렬 필터 -->
      <div>
        <div class="flex items-center space-x-2 mb-3">
          <Target size={16} class="text-gray-600" />
          <label class="text-sm font-semibold text-gray-900">직렬별 필터</label>
        </div>
        <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {#each categories.slice(0, 15) as category}
            <button
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                     {selectedCategories.includes(category) 
                       ? 'bg-green-500 text-white shadow-md' 
                       : 'bg-white text-gray-700 border border-gray-300 hover:border-green-300'}"
              on:click={() => toggleCategory(category)}
            >
              {category}
            </button>
          {/each}
        </div>
        {#if categories.length > 15}
          <p class="text-xs text-gray-500 mt-2">상위 15개 직렬만 표시됩니다</p>
        {/if}
      </div>
      
      <!-- 연도 필터 -->
      <div>
        <div class="flex items-center space-x-2 mb-3">
          <Calendar size={16} class="text-gray-600" />
          <label class="text-sm font-semibold text-gray-900">연도별 필터</label>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each years as year}
            <button
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                     {selectedYears.includes(year) 
                       ? 'bg-blue-500 text-white shadow-md' 
                       : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300'}"
              on:click={() => toggleYear(year)}
            >
              {year}년
            </button>
          {/each}
        </div>
      </div>
      
      <!-- 경쟁률 범위 필터 -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-semibold text-gray-900">경쟁률 범위</label>
          <span class="text-sm text-gray-600">{competitionRangeMin}:1 ~ {competitionRangeMax}:1</span>
        </div>
        
        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-600 mb-1 block">최소 경쟁률</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              bind:value={competitionRangeMin}
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label class="text-xs text-gray-600 mb-1 block">최대 경쟁률</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              bind:value={competitionRangeMax}
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  input[type="range"]::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
</style>