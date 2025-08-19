<script>
  export let variant = 'primary'; // primary, secondary, ghost, danger
  export let size = 'md'; // sm, md, lg
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;
  export let href = null;
  export let type = 'button';
  
  // 스타일 계산
  $: baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  $: variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:scale-105',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 focus:ring-gray-300 transform hover:scale-105',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 shadow-lg hover:shadow-xl'
  }[variant];
  
  $: sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }[size];
  
  $: widthClasses = fullWidth ? 'w-full' : '';
  
  $: allClasses = [baseClasses, variantClasses, sizeClasses, widthClasses].filter(Boolean).join(' ');
</script>

<!-- 링크인 경우 -->
{#if href}
  <a 
    {href}
    class={allClasses}
    class:opacity-50={disabled}
    class:pointer-events-none={disabled}
    {...$$restProps}
  >
    {#if loading}
      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
    {/if}
    <slot />
  </a>
<!-- 버튼인 경우 -->
{:else}
  <button 
    {type}
    {disabled}
    class={allClasses}
    on:click
    {...$$restProps}
  >
    {#if loading}
      <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
    {/if}
    <slot />
  </button>
{/if}