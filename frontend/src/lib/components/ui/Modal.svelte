<script>
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { X } from 'lucide-svelte';
  
  export let open = false;
  export let title = '';
  export let size = 'md'; // sm, md, lg, xl
  export let closeOnBackdrop = true;
  export let showCloseButton = true;
  
  const dispatch = createEventDispatcher();
  
  // 크기별 클래스
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  function handleBackdropClick(event) {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      close();
    }
  }
  
  function close() {
    open = false;
    dispatch('close');
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      close();
    }
  }
</script>

<!-- 모달 오버레이 -->
{#if open}
  <div 
    class="fixed inset-0 z-50 overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    on:keydown={handleKeydown}
  >
    <!-- 백드롭 -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      transition:fade={{ duration: 200 }}
      on:click={handleBackdropClick}
    ></div>
    
    <!-- 모달 컨테이너 -->
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <!-- 모달 콘텐츠 -->
      <div 
        class="relative w-full {sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all"
        transition:fly={{ y: 50, duration: 300 }}
      >
        <!-- 헤더 -->
        {#if title || showCloseButton || $$slots.header}
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <div class="flex-1">
              {#if $$slots.header}
                <slot name="header" />
              {:else if title}
                <h3 id="modal-title" class="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              {/if}
            </div>
            
            {#if showCloseButton}
              <button
                class="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                on:click={close}
              >
                <X size={20} />
              </button>
            {/if}
          </div>
        {/if}
        
        <!-- 본문 -->
        <div class="p-6">
          <slot />
        </div>
        
        <!-- 푸터 -->
        {#if $$slots.footer}
          <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <slot name="footer" />
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  /* 모달이 열릴 때 body 스크롤 방지 */
  :global(body.modal-open) {
    overflow: hidden;
  }
</style>