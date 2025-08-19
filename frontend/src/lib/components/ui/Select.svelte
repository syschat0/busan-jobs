<script>
  export let value = '';
  export let options = [];
  export let placeholder = '선택해주세요';
  export let disabled = false;
  export let error = '';
  export let label = '';
  export let required = false;
  export let id = '';
  
  $: hasError = !!error;
  $: selectClasses = [
    'select',
    hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '',
    disabled ? 'bg-gray-50 cursor-not-allowed' : ''
  ].filter(Boolean).join(' ');
</script>

<div class="space-y-1">
  <!-- 라벨 -->
  {#if label}
    <label 
      for={id}
      class="block text-sm font-medium text-gray-700"
      class:text-red-700={hasError}
    >
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}
  
  <!-- 선택 필드 -->
  <select
    {id}
    {disabled}
    {required}
    bind:value
    class={selectClasses}
    on:change
    {...$$restProps}
  >
    {#if placeholder}
      <option value="" disabled>{placeholder}</option>
    {/if}
    
    {#each options as option}
      {#if typeof option === 'string'}
        <option value={option}>{option}</option>
      {:else}
        <option value={option.value}>{option.label}</option>
      {/if}
    {/each}
    
    <!-- 슬롯으로 커스텀 옵션 지원 -->
    <slot />
  </select>
  
  <!-- 에러 메시지 -->
  {#if hasError}
    <p class="text-sm text-red-600">
      {error}
    </p>
  {/if}
</div>