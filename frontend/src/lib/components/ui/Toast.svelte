<script>
  import { fly } from 'svelte/transition';
  import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-svelte';
  import { notification, hideNotification } from '$lib/stores/ui.js';
  
  // 아이콘 매핑
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };
  
  // 색상 클래스 매핑
  const colorClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const iconColorClasses = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500'
  };
</script>

<!-- 토스트 컨테이너 -->
<div class="fixed top-4 right-4 z-50 space-y-2">
  {#if $notification}
    <div 
      class="flex items-center p-4 border rounded-xl shadow-lg backdrop-blur-sm {colorClasses[$notification.type]}"
      transition:fly={{ x: 300, duration: 300 }}
      role="alert"
    >
      <!-- 아이콘 -->
      <div class="flex-shrink-0">
        <svelte:component 
          this={icons[$notification.type]} 
          size={20} 
          class={iconColorClasses[$notification.type]}
        />
      </div>
      
      <!-- 메시지 -->
      <div class="ml-3 flex-1">
        <p class="text-sm font-medium">
          {$notification.message}
        </p>
      </div>
      
      <!-- 닫기 버튼 -->
      <button
        class="ml-4 p-1 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors"
        on:click={hideNotification}
      >
        <X size={16} />
      </button>
    </div>
  {/if}
</div>