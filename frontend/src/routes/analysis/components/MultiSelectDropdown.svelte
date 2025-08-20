<script>
  import { createEventDispatcher } from 'svelte';
  import { ChevronDown, Check, X } from 'lucide-svelte';
  
  export let options = [];
  export let selectedValues = [];
  export let placeholder = '선택하세요';
  export let label = '';
  export let icon = null;
  
  const dispatch = createEventDispatcher();
  
  let isOpen = false;
  let dropdownContainer;
  
  // 체크박스 상태 관리
  $: checkedItems = new Set(selectedValues);
  
  // 표시할 텍스트 생성
  $: displayText = (() => {
    if (selectedValues.length === 0 || selectedValues.length === options.length) {
      return `전체 ${label}`;
    } else if (selectedValues.length === 1) {
      return selectedValues[0];
    } else {
      return `${selectedValues[0]} 외 ${selectedValues.length - 1}개`;
    }
  })();
  
  // 옵션 토글
  function toggleOption(value) {
    let newSelected;
    
    if (checkedItems.has(value)) {
      newSelected = selectedValues.filter(v => v !== value);
    } else {
      newSelected = [...selectedValues, value];
    }
    
    dispatch('change', newSelected);
  }
  
  // 전체 선택/해제
  function toggleAll() {
    if (selectedValues.length === options.length) {
      dispatch('change', []);
    } else {
      dispatch('change', [...options]);
    }
  }
  
  // 전체 선택 여부 확인
  $: isAllSelected = selectedValues.length === options.length;
  $: isPartialSelected = selectedValues.length > 0 && selectedValues.length < options.length;
  
  // 외부 클릭 감지
  function handleClickOutside(event) {
    if (dropdownContainer && !dropdownContainer.contains(event.target)) {
      isOpen = false;
    }
  }
  
  // 선택된 항목 제거
  function removeItem(value) {
    const newSelected = selectedValues.filter(v => v !== value);
    dispatch('change', newSelected);
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="space-y-2" bind:this={dropdownContainer}>
  <label class="block text-sm font-medium text-gray-700">
    {#if icon}
      <svelte:component this={icon} size={16} class="inline mr-1" />
    {/if}
    {label}
  </label>
  
  <div class="relative">
    <!-- 드롭다운 버튼 -->
    <button
      type="button"
      on:click={() => isOpen = !isOpen}
      class="relative w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left cursor-default focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
    >
      <span class="block truncate text-sm">
        {displayText}
      </span>
      <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDown size={16} class="text-gray-400 transform transition-transform {isOpen ? 'rotate-180' : ''}" />
      </span>
    </button>
    
    <!-- 드롭다운 메뉴 -->
    {#if isOpen}
      <div class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none border">
        <!-- 전체 선택/해제 옵션 -->
        <div class="px-3 py-2 border-b border-gray-100">
          <label class="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
            <div class="relative">
              <input
                type="checkbox"
                checked={isAllSelected}
                indeterminate={isPartialSelected}
                on:change={toggleAll}
                class="sr-only"
              />
              <div class="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center {isAllSelected ? 'bg-blue-500 border-blue-500' : isPartialSelected ? 'bg-blue-100 border-blue-300' : ''}">
                {#if isAllSelected}
                  <Check size={12} class="text-white" />
                {:else if isPartialSelected}
                  <div class="w-2 h-0.5 bg-blue-500 rounded"></div>
                {/if}
              </div>
            </div>
            <span class="ml-3 text-sm text-gray-700 font-medium">
              전체 {label}
            </span>
          </label>
        </div>
        
        <!-- 개별 옵션들 -->
        {#each options as option}
          <div class="px-3 py-1">
            <label class="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
              <div class="relative">
                <input
                  type="checkbox"
                  checked={checkedItems.has(option)}
                  on:change={() => toggleOption(option)}
                  class="sr-only"
                />
                <div class="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center {checkedItems.has(option) ? 'bg-blue-500 border-blue-500' : ''}">
                  {#if checkedItems.has(option)}
                    <Check size={12} class="text-white" />
                  {/if}
                </div>
              </div>
              <span class="ml-3 text-sm text-gray-700">
                {option}
              </span>
            </label>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- 선택된 항목들 표시 (전체 선택이 아닌 경우에만) -->
  {#if selectedValues.length > 0 && selectedValues.length < options.length}
    <div class="flex flex-wrap gap-1 mt-2">
      {#each selectedValues as value}
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value}
          <button
            type="button"
            on:click={() => removeItem(value)}
            class="ml-1 inline-flex items-center justify-center w-3 h-3 text-blue-400 hover:text-blue-600"
          >
            <X size={10} />
          </button>
        </span>
      {/each}
    </div>
  {/if}
</div>