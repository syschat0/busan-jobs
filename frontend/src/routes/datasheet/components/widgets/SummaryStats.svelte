<script>
  import { Target, TrendingUp, Users, Calendar } from 'lucide-svelte';
  import { dashboardStats, personalizedJobs } from '../../stores/dashboard.js';
  
  export let widget;
  
  $: stats = $dashboardStats;
  $: jobs = $personalizedJobs;
  
  // 통계 카드 데이터
  $: statisticCards = [
    {
      title: '총 채용공고',
      value: stats.totalJobs,
      suffix: '개',
      icon: Target,
      color: 'blue',
      gradient: 'from-blue-50 to-primary-100',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-600',
      change: null
    },
    {
      title: '관심 분야',
      value: stats.interestedJobs,
      suffix: '개',
      icon: TrendingUp,
      color: 'green',
      gradient: 'from-green-50 to-emerald-100',
      iconBg: 'bg-green-500',
      textColor: 'text-green-600',
      change: null
    },
    {
      title: '경쟁률 낮음',
      value: stats.lowCompetitionJobs,
      suffix: '개',
      icon: Users,
      color: 'purple',
      gradient: 'from-purple-50 to-violet-100',
      iconBg: 'bg-purple-500',
      textColor: 'text-purple-600',
      change: null
    },
    {
      title: '마감임박',
      value: stats.upcomingDeadlines,
      suffix: '개',
      icon: Calendar,
      color: 'orange',
      gradient: 'from-orange-50 to-amber-100',
      iconBg: 'bg-orange-500',
      textColor: 'text-orange-600',
      change: null,
      urgent: stats.upcomingDeadlines > 0
    }
  ];
  
  function formatNumber(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
</script>

<div class="summary-stats">
  <div class="stats-grid">
    {#each statisticCards as stat}
      <div class="stat-card bg-gradient-to-br {stat.gradient} {stat.urgent ? 'ring-2 ring-orange-300' : ''}">
        <div class="stat-header">
          <div class="stat-icon {stat.iconBg}">
            <svelte:component this={stat.icon} class="text-white" size={20} />
          </div>
          {#if stat.urgent}
            <div class="urgent-badge">
              <span class="urgent-pulse"></span>
              긴급
            </div>
          {/if}
        </div>
        
        <div class="stat-content">
          <div class="stat-value {stat.textColor}">
            {formatNumber(stat.value)}<span class="stat-suffix">{stat.suffix}</span>
          </div>
          <div class="stat-title">
            {stat.title}
          </div>
        </div>
        
        {#if stat.change}
          <div class="stat-change {stat.change.positive ? 'text-green-600' : 'text-red-600'}">
            {stat.change.positive ? '+' : ''}{stat.change.value}%
            <span class="text-gray-500 text-xs">vs 지난주</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  <!-- 개인화 요약 -->
  <div class="personalization-summary">
    <div class="summary-header">
      <div class="summary-title">
        <div class="title-icon">
          🎯
        </div>
        <span>개인화 요약</span>
      </div>
      <div class="match-score">
        평균 적합도: <span class="score-value">{stats.averageMatchScore.toFixed(1)}점</span>
      </div>
    </div>
    
    <div class="summary-content">
      <div class="summary-item">
        <div class="item-label">최고 적합 공고</div>
        <div class="item-value">
          {jobs.length > 0 ? jobs[0].agencyName + ' - ' + jobs[0].jobTitle.slice(0, 20) + '...' : '데이터 없음'}
        </div>
      </div>
      
      <div class="summary-item">
        <div class="item-label">추천 지원 전략</div>
        <div class="item-value">
          {#if stats.lowCompetitionJobs > 5}
            기회가 많습니다! 적극적으로 지원하세요.
          {:else if stats.lowCompetitionJobs > 0}
            선별적 지원을 권장합니다.
          {:else}
            차별화된 준비가 필요합니다.
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .summary-stats {
    @apply h-full flex flex-col space-y-4;
  }
  
  .stats-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-4;
  }
  
  .stat-card {
    @apply p-4 rounded-xl border border-gray-200 relative overflow-hidden;
    @apply transition-all duration-300 hover:shadow-md;
  }
  
  .stat-header {
    @apply flex items-center justify-between mb-3;
  }
  
  .stat-icon {
    @apply w-10 h-10 rounded-lg flex items-center justify-center;
  }
  
  .urgent-badge {
    @apply flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium;
    @apply relative;
  }
  
  .urgent-pulse {
    @apply w-2 h-2 bg-orange-500 rounded-full animate-pulse;
  }
  
  .stat-content {
    @apply space-y-1;
  }
  
  .stat-value {
    @apply text-2xl font-bold flex items-baseline;
  }
  
  .stat-suffix {
    @apply text-sm font-medium ml-1 opacity-80;
  }
  
  .stat-title {
    @apply text-sm text-gray-600 font-medium;
  }
  
  .stat-change {
    @apply text-xs font-medium mt-2;
  }
  
  /* 개인화 요약 */
  .personalization-summary {
    @apply bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200;
  }
  
  .summary-header {
    @apply flex items-center justify-between mb-3;
  }
  
  .summary-title {
    @apply flex items-center space-x-2;
  }
  
  .title-icon {
    @apply text-lg;
  }
  
  .summary-title span {
    @apply font-semibold text-gray-900;
  }
  
  .match-score {
    @apply text-sm text-gray-600;
  }
  
  .score-value {
    @apply font-bold text-indigo-600;
  }
  
  .summary-content {
    @apply space-y-3;
  }
  
  .summary-item {
    @apply flex justify-between items-start;
  }
  
  .item-label {
    @apply text-sm font-medium text-gray-700 flex-shrink-0 w-24;
  }
  
  .item-value {
    @apply text-sm text-gray-900 text-right flex-1;
  }
  
  /* 반응형 */
  @media (max-width: 768px) {
    .stats-grid {
      @apply grid-cols-2;
    }
    
    .stat-value {
      @apply text-xl;
    }
    
    .summary-item {
      @apply flex-col items-start space-y-1;
    }
    
    .item-value {
      @apply text-left;
    }
  }
  
  @media (max-width: 640px) {
    .stats-grid {
      @apply grid-cols-1 gap-3;
    }
    
    .stat-card {
      @apply p-3;
    }
  }
</style>