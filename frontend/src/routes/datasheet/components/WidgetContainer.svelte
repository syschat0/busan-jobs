<script>
  import { createEventDispatcher } from 'svelte';
  import { Settings, X, Maximize2, Minimize2, Move } from 'lucide-svelte';
  
  export let widget;
  export let component;
  export let isEditMode = false;
  export let style = '';
  export let draggable = false;
  
  const dispatch = createEventDispatcher();
  
  let showSettings = false;
  let isResizing = false;
  let resizeStartPos = null;
  let originalSize = null;
  
  // 크기 조절 핸들러
  function handleResizeStart(event, direction) {
    if (!isEditMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    isResizing = true;
    resizeStartPos = { x: event.clientX, y: event.clientY };
    originalSize = { w: widget.position.w, h: widget.position.h };
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }
  
  function handleResizeMove(event) {
    if (!isResizing || !resizeStartPos || !originalSize) return;
    
    const deltaX = event.clientX - resizeStartPos.x;
    const deltaY = event.clientY - resizeStartPos.y;
    
    // 그리드 단위로 크기 계산 (대략적)
    const gridUnitX = 80; // 대략적인 그리드 폭
    const gridUnitY = 80; // 대략적인 그리드 높이
    
    const deltaW = Math.round(deltaX / gridUnitX);
    const deltaH = Math.round(deltaY / gridUnitY);
    
    const newW = Math.max(2, originalSize.w + deltaW);
    const newH = Math.max(2, originalSize.h + deltaH);
    
    dispatch('resize', { w: newW, h: newH });
  }
  
  function handleResizeEnd() {
    isResizing = false;
    resizeStartPos = null;
    originalSize = null;
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }
  
  function toggleSettings() {
    showSettings = !showSettings;
  }
  
  function handleSettingsUpdate(newSettings) {
    dispatch('settings', newSettings);
    showSettings = false;
  }
  
  function handleRemove() {
    dispatch('remove');
  }
  
  function handleDragStart(event) {
    if (!isEditMode || !draggable) return;
    dispatch('dragstart', event);
  }
  
  function handleDragEnd(event) {
    dispatch('dragend', event);
  }
</script>

<div 
  class="widget-container {isEditMode ? 'edit-mode' : ''} {isResizing ? 'resizing' : ''}"
  {style}
  {draggable}
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
>
  <!-- 위젯 헤더 -->
  <div class="widget-header">
    <div class="widget-title">
      <h3>{widget.title}</h3>
    </div>
    
    <!-- 편집 모드 컨트롤 -->
    {#if isEditMode}
      <div class="widget-controls">
        <button
          class="widget-control-btn drag-handle"
          title="위젯 이동"
        >
          <Move size={14} />
        </button>
        
        <button
          class="widget-control-btn"
          on:click={toggleSettings}
          title="위젯 설정"
        >
          <Settings size={14} />
        </button>
        
        <button
          class="widget-control-btn remove-btn"
          on:click={handleRemove}
          title="위젯 제거"
        >
          <X size={14} />
        </button>
      </div>
    {/if}
  </div>
  
  <!-- 위젯 콘텐츠 -->
  <div class="widget-content">
    {#if component}
      <svelte:component 
        this={component} 
        {widget}
        on:settings={handleSettingsUpdate}
      />
    {:else}
      <div class="widget-placeholder">
        <p class="text-gray-500 text-sm">위젯을 불러올 수 없습니다</p>
      </div>
    {/if}
  </div>
  
  <!-- 크기 조절 핸들 -->
  {#if isEditMode}
    <div class="resize-handles">
      <!-- 우하단 크기 조절 핸들 -->
      <div 
        class="resize-handle resize-se"
        on:mousedown={(e) => handleResizeStart(e, 'se')}
      ></div>
      
      <!-- 우측 크기 조절 핸들 -->
      <div 
        class="resize-handle resize-e"
        on:mousedown={(e) => handleResizeStart(e, 'e')}
      ></div>
      
      <!-- 하단 크기 조절 핸들 -->
      <div 
        class="resize-handle resize-s"
        on:mousedown={(e) => handleResizeStart(e, 's')}
      ></div>
    </div>
  {/if}
  
  <!-- 설정 패널 (드롭다운) -->
  {#if showSettings && isEditMode}
    <div class="settings-panel">
      <div class="settings-content">
        <h4 class="settings-title">위젯 설정</h4>
        
        <!-- 기본 설정 -->
        <div class="setting-item">
          <label class="setting-label">
            제목
            <input 
              type="text" 
              bind:value={widget.title}
              class="setting-input"
              on:change={() => dispatch('settings', { title: widget.title })}
            />
          </label>
        </div>
        
        <!-- 위젯별 커스텀 설정은 각 위젯 컴포넌트에서 처리 -->
        
        <div class="settings-actions">
          <button 
            class="btn-secondary btn-sm"
            on:click={() => showSettings = false}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .widget-container {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 relative overflow-hidden;
    @apply hover:shadow-md transition-all duration-300;
    min-height: 200px;
  }
  
  .widget-container.edit-mode {
    @apply border-2 border-dashed border-transparent;
    @apply hover:border-primary-300 cursor-grab;
  }
  
  .widget-container.edit-mode:hover {
    @apply border-primary-300;
  }
  
  .widget-container.resizing {
    @apply cursor-nw-resize;
    user-select: none;
  }
  
  .widget-header {
    @apply flex items-center justify-between p-4 border-b border-gray-100;
    @apply bg-gradient-to-r from-gray-50 to-white;
  }
  
  .widget-title h3 {
    @apply text-lg font-semibold text-gray-900;
  }
  
  .widget-controls {
    @apply flex items-center space-x-2 opacity-0 transition-opacity duration-200;
  }
  
  .widget-container.edit-mode:hover .widget-controls {
    @apply opacity-100;
  }
  
  .widget-control-btn {
    @apply p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200;
  }
  
  .widget-control-btn.remove-btn:hover {
    @apply text-red-600 bg-red-50;
  }
  
  .widget-content {
    @apply p-4 h-full overflow-hidden;
  }
  
  .widget-placeholder {
    @apply flex items-center justify-center h-full;
  }
  
  /* 크기 조절 핸들 */
  .resize-handles {
    @apply absolute inset-0 pointer-events-none;
  }
  
  .resize-handle {
    @apply absolute bg-primary-500 opacity-0 transition-opacity duration-200;
    @apply hover:opacity-100 cursor-nw-resize;
    pointer-events: auto;
  }
  
  .widget-container.edit-mode:hover .resize-handle {
    @apply opacity-60;
  }
  
  .resize-handle:hover {
    @apply opacity-100 !important;
  }
  
  .resize-se {
    @apply bottom-0 right-0 w-4 h-4;
    cursor: nw-resize;
    clip-path: polygon(100% 0, 100% 100%, 0 100%);
  }
  
  .resize-e {
    @apply top-0 right-0 w-2 h-full;
    cursor: ew-resize;
  }
  
  .resize-s {
    @apply bottom-0 left-0 h-2 w-full;
    cursor: ns-resize;
  }
  
  /* 설정 패널 */
  .settings-panel {
    @apply absolute top-16 right-4 z-50;
    @apply bg-white rounded-lg shadow-lg border border-gray-200;
    @apply w-64;
  }
  
  .settings-content {
    @apply p-4;
  }
  
  .settings-title {
    @apply text-sm font-semibold text-gray-900 mb-3;
  }
  
  .setting-item {
    @apply mb-3;
  }
  
  .setting-label {
    @apply block text-xs font-medium text-gray-700 mb-1;
  }
  
  .setting-input {
    @apply w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md;
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
  }
  
  .settings-actions {
    @apply flex justify-end pt-3 border-t border-gray-100;
  }
  
  .btn-secondary {
    @apply px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md;
    @apply hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500;
  }
  
  .btn-sm {
    @apply text-xs px-2 py-1;
  }
  
  /* 드래그 중 스타일 */
  :global(.widget-container.dragging) {
    @apply opacity-60 transform rotate-1 z-50;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
</style>