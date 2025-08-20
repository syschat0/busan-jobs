<script>
  export let title = '';
  export let value = 0;
  export let icon = null;
  export let color = 'blue';
  export let description = '';
  export let urgent = false;

  // 색상 매핑
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-600',
      text: 'text-blue-800',
      accent: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-100 text-green-600',
      text: 'text-green-800',
      accent: 'text-green-600'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'bg-amber-100 text-amber-600',
      text: 'text-amber-800',
      accent: 'text-amber-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-100 text-purple-600',
      text: 'text-purple-800',
      accent: 'text-purple-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-100 text-red-600',
      text: 'text-red-800',
      accent: 'text-red-600'
    }
  };

  $: currentColor = colorClasses[color] || colorClasses.blue;
</script>

<div class="relative group hover:shadow-lg transition-all duration-300 
            bg-white rounded-2xl border border-gray-200 hover:border-{color}-300 overflow-hidden">
  
  <!-- 긴급 표시 -->
  {#if urgent}
    <div class="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-red-500"></div>
    <div class="absolute top-1 right-1 text-white text-xs font-bold">!</div>
  {/if}

  <div class="p-6">
    <div class="flex items-center space-x-4">
      <!-- 아이콘 -->
      {#if icon}
        <div class="p-3 rounded-xl {currentColor.icon}">
          <svelte:component this={icon} size={24} />
        </div>
      {/if}

      <!-- 콘텐츠 -->
      <div class="flex-1">
        <div class="flex items-baseline space-x-2">
          <h3 class="text-2xl font-bold {currentColor.text}">
            {value.toLocaleString()}
          </h3>
          {#if urgent && value > 0}
            <span class="text-red-500 text-sm font-medium animate-pulse">
              주의
            </span>
          {/if}
        </div>
        
        <p class="text-sm font-medium text-gray-600 mt-1">
          {title}
        </p>
        
        {#if description}
          <p class="text-xs text-gray-500 mt-1">
            {description}
          </p>
        {/if}
      </div>
    </div>

    <!-- 진행률 바 (선택사항) -->
    {#if urgent && value > 0}
      <div class="mt-4">
        <div class="w-full bg-gray-200 rounded-full h-1.5">
          <div class="bg-amber-500 h-1.5 rounded-full animate-pulse" style="width: 75%"></div>
        </div>
        <p class="text-xs text-amber-600 mt-1">마감이 임박했습니다</p>
      </div>
    {/if}
  </div>

  <!-- 호버 효과 -->
  <div class="absolute inset-0 bg-gradient-to-r from-{color}-500 to-{color}-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
</div>