<script>
  export let type = 'text';
  export let placeholder = '';
  export let value = '';
  export let disabled = false;
  export let error = '';
  export let label = '';
  export let required = false;
  export let id = '';
  export let autocomplete = '';
  
  // 포커스 상태
  let focused = false;
  
  $: hasError = !!error;
  $: inputClasses = [
    'input',
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
  
  <!-- 입력 필드 -->
  <input
    {id}
    {type}
    {placeholder}
    {disabled}
    {required}
    {autocomplete}
    bind:value
    class={inputClasses}
    on:focus={() => focused = true}
    on:blur={() => focused = false}
    on:input
    on:change
    on:keydown
    {...$$restProps}
  />
  
  <!-- 에러 메시지 -->
  {#if hasError}
    <p class="text-sm text-red-600">
      {error}
    </p>
  {/if}
</div>