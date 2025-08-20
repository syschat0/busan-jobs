<script>
  import { onMount } from 'svelte';
  import { visibleWidgets, dashboardStore, dashboardActions } from '../stores/dashboard.js';
  import WidgetContainer from './WidgetContainer.svelte';
  
  // 위젯 컴포넌트들
  import SummaryStats from './widgets/SummaryStats.svelte';
  import PersonalRecommendations from './widgets/PersonalRecommendations.svelte';
  import CompetitionChart from './widgets/CompetitionChart.svelte';
  import CategoryTracker from './widgets/CategoryTracker.svelte';
  import DeadlineCalendar from './widgets/DeadlineCalendar.svelte';
  import AgencyComparison from './widgets/AgencyComparison.svelte';
  import TrendAnalysis from './widgets/TrendAnalysis.svelte';
  import PersonalInsights from './widgets/PersonalInsights.svelte';
  
  export let isEditMode = false;
  
  // 위젯 타입별 컴포넌트 매핑
  const widgetComponents = {
    'summary-stats': SummaryStats,
    'personal-recommendations': PersonalRecommendations,
    'competition-chart': CompetitionChart,
    'category-tracker': CategoryTracker,
    'deadline-calendar': DeadlineCalendar,
    'agency-comparison': AgencyComparison,
    'trend-analysis': TrendAnalysis,
    'personal-insights': PersonalInsights
  };
  
  // 드래그 앤 드롭 상태
  let draggedWidget = null;
  let dropZone = null;
  let gridElement;
  
  $: widgets = $visibleWidgets;
  $: gridColumns = $dashboardStore.gridColumns;
  
  onMount(() => {
    setupGridLayout();
  });
  
  function setupGridLayout() {
    if (!gridElement) return;
    
    // CSS Grid 설정
    gridElement.style.display = 'grid';
    gridElement.style.gridTemplateColumns = `repeat(${gridColumns}, minmax(0, 1fr))`;
    gridElement.style.gap = '1rem';
    gridElement.style.minHeight = '600px';
  }
  
  // 드래그 앤 드롭 핸들러
  function handleDragStart(event, widget) {
    if (!isEditMode) return;
    
    draggedWidget = widget;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.outerHTML);
    
    // 드래그 중 스타일 적용
    setTimeout(() => {
      event.target.classList.add('dragging');
    }, 0);
  }
  
  function handleDragEnd(event) {
    if (event.target) {
      event.target.classList.remove('dragging');
    }
    draggedWidget = null;
    dropZone = null;
  }
  
  function handleDragOver(event) {
    if (!isEditMode || !draggedWidget) return;
    
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // 드롭 존 계산
    const rect = gridElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const cellWidth = rect.width / gridColumns;
    const cellHeight = 100; // 추정 높이
    
    const gridX = Math.floor(x / cellWidth);
    const gridY = Math.floor(y / cellHeight);
    
    dropZone = { x: gridX, y: gridY };
  }
  
  function handleDrop(event) {
    if (!isEditMode || !draggedWidget || !dropZone) return;
    
    event.preventDefault();
    
    // 위젯 위치 업데이트
    dashboardActions.moveWidget(draggedWidget.id, {
      ...draggedWidget.position,
      x: dropZone.x,
      y: dropZone.y
    });
    
    draggedWidget = null;
    dropZone = null;
  }
  
  function handleWidgetResize(widget, newSize) {
    dashboardActions.updateWidget(widget.id, {
      position: {
        ...widget.position,
        ...newSize
      }
    });
  }
  
  function handleWidgetSettings(widget, newSettings) {
    dashboardActions.updateWidget(widget.id, {
      settings: {
        ...widget.settings,
        ...newSettings
      }
    });
  }
  
  function handleWidgetRemove(widgetId) {
    if (confirm('이 위젯을 제거하시겠습니까?')) {
      dashboardActions.removeWidget(widgetId);
    }
  }
  
  // 그리드 위치를 CSS Grid Area로 변환
  function getGridArea(position) {
    const { x, y, w, h } = position;
    return `${y + 1} / ${x + 1} / ${y + h + 1} / ${x + w + 1}`;
  }
</script>

<div 
  bind:this={gridElement}
  class="dashboard-grid {isEditMode ? 'edit-mode' : ''}"
  on:dragover={handleDragOver}
  on:drop={handleDrop}
>
  {#each widgets as widget (widget.id)}
    <WidgetContainer
      {widget}
      {isEditMode}
      component={widgetComponents[widget.type]}
      style="grid-area: {getGridArea(widget.position)}"
      draggable={isEditMode}
      on:dragstart={(e) => handleDragStart(e, widget)}
      on:dragend={handleDragEnd}
      on:resize={(e) => handleWidgetResize(widget, e.detail)}
      on:settings={(e) => handleWidgetSettings(widget, e.detail)}
      on:remove={() => handleWidgetRemove(widget.id)}
    />
  {/each}
  
  <!-- 드롭 존 표시 -->
  {#if isEditMode && dropZone && draggedWidget}
    <div 
      class="drop-zone"
      style="grid-area: {getGridArea({
        x: dropZone.x,
        y: dropZone.y,
        w: draggedWidget.position.w,
        h: draggedWidget.position.h
      })}"
    ></div>
  {/if}
</div>

<style>
  .dashboard-grid {
    position: relative;
    transition: all 0.3s ease;
  }
  
  .dashboard-grid.edit-mode {
    background-image: 
      radial-gradient(circle, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
  }
  
  :global(.widget-container) {
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  :global(.widget-container.dragging) {
    opacity: 0.6;
    transform: rotate(3deg);
    z-index: 1000;
  }
  
  .drop-zone {
    background: rgba(59, 130, 246, 0.1);
    border: 2px dashed #3b82f6;
    border-radius: 0.75rem;
    z-index: 10;
    pointer-events: none;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  /* 반응형 그리드 */
  @media (max-width: 1024px) {
    .dashboard-grid {
      grid-template-columns: repeat(8, minmax(0, 1fr)) !important;
    }
  }
  
  @media (max-width: 768px) {
    .dashboard-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    }
  }
  
  @media (max-width: 640px) {
    .dashboard-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }
</style>