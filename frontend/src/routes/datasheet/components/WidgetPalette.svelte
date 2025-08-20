<script>
  import { createEventDispatcher } from 'svelte';
  import { 
    BarChart3, Target, Calendar, TrendingUp, 
    Building2, Brain, Users, PieChart, Plus 
  } from 'lucide-svelte';
  import { dashboardActions } from '../stores/dashboard.js';
  
  const dispatch = createEventDispatcher();
  
  // 사용 가능한 위젯 타입들
  const availableWidgets = [
    {
      id: 'summary-stats',
      name: '채용 현황 요약',
      description: '전체 채용 현황을 한눈에 볼 수 있습니다',
      icon: BarChart3,
      category: '기본',
      size: { w: 12, h: 2 },
      color: 'blue'
    },
    {
      id: 'personal-recommendations',
      name: '개인 맞춤 추천',
      description: '나에게 맞는 채용공고를 추천합니다',
      icon: Target,
      category: '개인화',
      size: { w: 6, h: 4 },
      color: 'green'
    },
    {
      id: 'competition-chart',
      name: '경쟁률 분석',
      description: '기관별/직렬별 경쟁률을 시각화합니다',
      icon: PieChart,
      category: '분석',
      size: { w: 6, h: 4 },
      color: 'purple'
    },
    {
      id: 'category-tracker',
      name: '관심 직렬 트래커',
      description: '관심있는 직렬의 채용 동향을 추적합니다',
      icon: Target,
      category: '개인화',
      size: { w: 8, h: 3 },
      color: 'orange'
    },
    {
      id: 'deadline-calendar',
      name: '마감일 캘린더',
      description: '채용 마감일을 캘린더로 확인합니다',
      icon: Calendar,
      category: '일정',
      size: { w: 4, h: 3 },
      color: 'red'
    },
    {
      id: 'agency-comparison',
      name: '기관별 비교',
      description: '기관별 채용 특성을 비교분석합니다',
      icon: Building2,
      category: '분석',
      size: { w: 8, h: 4 },
      color: 'blue',
      comingSoon: true
    },
    {
      id: 'trend-analysis',
      name: '트렌드 분석',
      description: '채용 트렌드 변화를 분석합니다',
      icon: TrendingUp,
      category: '분석',
      size: { w: 6, h: 3 },
      color: 'green',
      comingSoon: true
    },
    {
      id: 'personal-insights',
      name: 'AI 개인화 인사이트',
      description: 'AI가 분석한 개인 맞춤 인사이트입니다',
      icon: Brain,
      category: '개인화',
      size: { w: 6, h: 4 },
      color: 'purple',
      comingSoon: true
    }
  ];
  
  // 카테고리별 그룹핑
  const categories = [...new Set(availableWidgets.map(w => w.category))];
  let selectedCategory = '전체';
  
  $: filteredWidgets = selectedCategory === '전체' 
    ? availableWidgets 
    : availableWidgets.filter(w => w.category === selectedCategory);
  
  function handleAddWidget(widgetType) {
    if (widgetType.comingSoon) {
      alert('곧 업데이트될 예정입니다.');
      return;
    }
    
    const newWidget = {
      id: `${widgetType.id}_${Date.now()}`,
      type: widgetType.id,
      title: widgetType.name,
      position: { 
        x: 0, 
        y: 0, 
        w: widgetType.size.w, 
        h: widgetType.size.h 
      },
      settings: {},
      visible: true
    };
    
    dashboardActions.addWidget(newWidget);
    dispatch('close');
  }
  
  function getIconColor(color) {
    const colors = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      orange: 'text-orange-600 bg-orange-100',
      red: 'text-red-600 bg-red-100'
    };
    return colors[color] || colors.blue;
  }
</script>

<div class="widget-palette">
  <!-- 카테고리 필터 -->
  <div class="category-filters">
    <button 
      class="category-btn {selectedCategory === '전체' ? 'active' : ''}"
      on:click={() => selectedCategory = '전체'}
    >
      전체
    </button>
    {#each categories as category}
      <button 
        class="category-btn {selectedCategory === category ? 'active' : ''}"
        on:click={() => selectedCategory = category}
      >
        {category}
      </button>
    {/each}
  </div>
  
  <!-- 위젯 그리드 -->
  <div class="widgets-grid">
    {#each filteredWidgets as widget}
      <div class="widget-card {widget.comingSoon ? 'coming-soon' : ''}">
        <!-- 위젯 아이콘 -->
        <div class="widget-icon {getIconColor(widget.color)}">
          <svelte:component this={widget.icon} size={24} />
        </div>
        
        <!-- 위젯 정보 -->
        <div class="widget-info">
          <h3 class="widget-name">
            {widget.name}
            {#if widget.comingSoon}
              <span class="coming-soon-badge">준비중</span>
            {/if}
          </h3>
          <p class="widget-description">{widget.description}</p>
          
          <!-- 크기 정보 -->
          <div class="widget-size">
            크기: {widget.size.w} × {widget.size.h}
          </div>
        </div>
        
        <!-- 추가 버튼 -->
        <button 
          class="add-widget-btn {widget.comingSoon ? 'disabled' : ''}"
          on:click={() => handleAddWidget(widget)}
          disabled={widget.comingSoon}
          title={widget.comingSoon ? '곧 업데이트됩니다' : '위젯 추가'}
        >
          <Plus size={16} />
        </button>
      </div>
    {/each}
  </div>
  
  <!-- 도움말 -->
  <div class="palette-help">
    <div class="help-icon">💡</div>
    <div class="help-content">
      <h4 class="help-title">위젯 사용법</h4>
      <ul class="help-list">
        <li>원하는 위젯을 선택하여 대시보드에 추가하세요</li>
        <li>편집 모드에서 위젯을 드래그하여 위치를 변경할 수 있습니다</li>
        <li>위젯의 설정 버튼으로 상세 설정을 변경하세요</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .widget-palette {
    @apply space-y-6;
  }
  
  /* 카테고리 필터 */
  .category-filters {
    @apply flex flex-wrap gap-2 pb-4 border-b border-gray-200;
  }
  
  .category-btn {
    @apply px-3 py-2 text-sm font-medium rounded-lg transition-colors;
    @apply border border-gray-300 text-gray-600 hover:bg-gray-50;
  }
  
  .category-btn.active {
    @apply bg-primary-500 text-white border-primary-500;
  }
  
  /* 위젯 그리드 */
  .widgets-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
  }
  
  .widget-card {
    @apply flex items-start space-x-4 p-4 border border-gray-200 rounded-lg;
    @apply hover:border-gray-300 hover:shadow-sm transition-all duration-200;
  }
  
  .widget-card.coming-soon {
    @apply opacity-60;
  }
  
  .widget-icon {
    @apply w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0;
  }
  
  .widget-info {
    @apply flex-1 min-w-0;
  }
  
  .widget-name {
    @apply text-base font-semibold text-gray-900 mb-1 flex items-center space-x-2;
  }
  
  .coming-soon-badge {
    @apply px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full;
  }
  
  .widget-description {
    @apply text-sm text-gray-600 mb-2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .widget-size {
    @apply text-xs text-gray-500;
  }
  
  .add-widget-btn {
    @apply p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50;
    @apply rounded-lg transition-colors flex-shrink-0;
  }
  
  .add-widget-btn.disabled {
    @apply opacity-50 cursor-not-allowed;
  }
  
  .add-widget-btn:not(.disabled):hover {
    @apply bg-primary-100 text-primary-700;
  }
  
  /* 도움말 */
  .palette-help {
    @apply flex space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200;
  }
  
  .help-icon {
    @apply text-2xl flex-shrink-0;
  }
  
  .help-content {
    @apply flex-1;
  }
  
  .help-title {
    @apply text-sm font-semibold text-blue-900 mb-2;
  }
  
  .help-list {
    @apply space-y-1;
  }
  
  .help-list li {
    @apply text-xs text-blue-800;
  }
  
  /* 반응형 */
  @media (max-width: 768px) {
    .widgets-grid {
      @apply grid-cols-1;
    }
    
    .palette-help {
      @apply flex-col space-x-0 space-y-3;
    }
  }
</style>