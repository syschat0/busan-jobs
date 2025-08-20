<script>
  import { Target, TrendingUp, AlertCircle, Users } from 'lucide-svelte';
  import { enhancedDataStore, userProfileStore } from '../../stores/dashboard.js';
  import { categoryNormalizer } from '$lib/utils/dataProcessor.js';
  
  export let widget;
  
  $: data = $enhancedDataStore;
  $: userPrefs = $userProfileStore.preferences;
  $: targetCategories = userPrefs.targetCategories || [];
  
  let categoryStats = [];
  
  $: if (data.jobs.length > 0 && targetCategories.length > 0) {
    calculateCategoryStats();
  }
  
  function calculateCategoryStats() {
    categoryStats = targetCategories.map(category => {
      const categoryJobs = data.jobs.filter(job => 
        job.categories && job.categories.includes(category)
      );
      
      const totalJobs = categoryJobs.length;
      const totalHiring = categoryJobs.reduce((sum, job) => sum + (job.requiredCount || 0), 0);
      
      // 난이도 분석
      const easyJobs = categoryJobs.filter(job => 
        job.difficultyAnalysis && job.difficultyAnalysis.totalScore <= 40
      ).length;
      
      // 최신 공고 (최근 6개월)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentJobs = categoryJobs.filter(job => {
        const jobDate = new Date(job.startDate);
        return jobDate >= sixMonthsAgo;
      }).length;
      
      // 평균 경쟁난이도
      const avgDifficulty = categoryJobs.length > 0 
        ? categoryJobs.reduce((sum, job) => 
            sum + (job.difficultyAnalysis?.totalScore || 50), 0
          ) / categoryJobs.length
        : 50;
      
      // 주요 기관들
      const agencyCount = {};
      categoryJobs.forEach(job => {
        agencyCount[job.agencyName] = (agencyCount[job.agencyName] || 0) + 1;
      });
      
      const topAgencies = Object.entries(agencyCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([agency, count]) => ({ agency, count }));
      
      return {
        category,
        totalJobs,
        totalHiring,
        recentJobs,
        easyJobs,
        avgDifficulty,
        topAgencies,
        trend: recentJobs > totalJobs * 0.6 ? 'up' : 
               recentJobs < totalJobs * 0.3 ? 'down' : 'stable'
      };
    });
  }
  
  function getDifficultyColor(difficulty) {
    if (difficulty <= 30) return 'text-green-600 bg-green-100';
    if (difficulty <= 50) return 'text-yellow-600 bg-yellow-100';
    if (difficulty <= 70) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  }
  
  function getTrendIcon(trend) {
    switch(trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➖';
    }
  }
  
  function getTrendColor(trend) {
    switch(trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
</script>

<div class="category-tracker">
  {#if targetCategories.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <Target size={32} class="text-gray-400" />
      </div>
      <div class="empty-content">
        <h3 class="empty-title">관심 직렬을 설정하세요</h3>
        <p class="empty-description">
          개인화 설정에서 관심있는 직렬을 선택하면 
          해당 직렬의 채용 동향을 추적할 수 있습니다.
        </p>
      </div>
    </div>
  {:else if categoryStats.length === 0}
    <div class="loading-state">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span class="text-sm text-gray-600 ml-2">분석 중...</span>
    </div>
  {:else}
    <div class="tracker-header">
      <div class="header-title">
        <Target size={16} class="text-primary-600" />
        <span>관심 직렬 동향</span>
      </div>
      <div class="header-count">
        {targetCategories.length}개 추적 중
      </div>
    </div>
    
    <div class="category-list">
      {#each categoryStats as stat (stat.category)}
        <div class="category-card">
          <!-- 카테고리 헤더 -->
          <div class="category-header">
            <div class="category-info">
              <h4 class="category-name">{stat.category}</h4>
              <div class="category-trend {getTrendColor(stat.trend)}">
                {getTrendIcon(stat.trend)}
                <span class="trend-text">
                  {stat.trend === 'up' ? '증가 추세' : 
                   stat.trend === 'down' ? '감소 추세' : '안정세'}
                </span>
              </div>
            </div>
            
            <div class="difficulty-badge {getDifficultyColor(stat.avgDifficulty)}">
              평균 난이도 {stat.avgDifficulty.toFixed(0)}점
            </div>
          </div>
          
          <!-- 주요 지표 -->
          <div class="category-metrics">
            <div class="metric-item">
              <div class="metric-icon">
                <Users size={14} class="text-blue-600" />
              </div>
              <div class="metric-content">
                <div class="metric-value">{stat.totalJobs}개</div>
                <div class="metric-label">총 공고</div>
              </div>
            </div>
            
            <div class="metric-item">
              <div class="metric-icon">
                <TrendingUp size={14} class="text-green-600" />
              </div>
              <div class="metric-content">
                <div class="metric-value">{stat.totalHiring}명</div>
                <div class="metric-label">총 채용</div>
              </div>
            </div>
            
            <div class="metric-item">
              <div class="metric-icon">
                <AlertCircle size={14} class="text-orange-600" />
              </div>
              <div class="metric-content">
                <div class="metric-value">{stat.easyJobs}개</div>
                <div class="metric-label">기회 공고</div>
              </div>
            </div>
          </div>
          
          <!-- 주요 기관 -->
          {#if stat.topAgencies.length > 0}
            <div class="top-agencies">
              <div class="agencies-label">주요 채용 기관</div>
              <div class="agencies-list">
                {#each stat.topAgencies as agency}
                  <div class="agency-item">
                    <span class="agency-name">{agency.agency}</span>
                    <span class="agency-count">{agency.count}개</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- 최근 동향 -->
          <div class="recent-activity">
            <div class="activity-text">
              최근 6개월간 <strong>{stat.recentJobs}개</strong>의 새로운 공고가 있었습니다.
              {#if stat.easyJobs > 0}
                이 중 <strong class="text-green-600">{stat.easyJobs}개</strong>는 상대적으로 경쟁률이 낮은 기회입니다.
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- 전체 요약 -->
    <div class="tracker-summary">
      <div class="summary-stats">
        <div class="summary-item">
          <span class="summary-label">총 기회</span>
          <span class="summary-value">
            {categoryStats.reduce((sum, stat) => sum + stat.totalJobs, 0)}개
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">채용 인원</span>
          <span class="summary-value">
            {categoryStats.reduce((sum, stat) => sum + stat.totalHiring, 0)}명
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">좋은 기회</span>
          <span class="summary-value text-green-600">
            {categoryStats.reduce((sum, stat) => sum + stat.easyJobs, 0)}개
          </span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .category-tracker {
    @apply h-full flex flex-col;
  }
  
  /* 빈 상태 */
  .empty-state {
    @apply flex flex-col items-center justify-center h-full text-center space-y-3;
  }
  
  .empty-icon {
    @apply p-3 bg-gray-100 rounded-full;
  }
  
  .empty-title {
    @apply text-lg font-semibold text-gray-900;
  }
  
  .empty-description {
    @apply text-sm text-gray-600 max-w-xs leading-relaxed;
  }
  
  /* 로딩 상태 */
  .loading-state {
    @apply flex items-center justify-center h-full;
  }
  
  /* 헤더 */
  .tracker-header {
    @apply flex items-center justify-between mb-4 pb-3 border-b border-gray-100;
  }
  
  .header-title {
    @apply flex items-center space-x-2 text-sm font-semibold text-gray-900;
  }
  
  .header-count {
    @apply text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full;
  }
  
  /* 카테고리 목록 */
  .category-list {
    @apply flex-1 space-y-4 overflow-y-auto;
    max-height: 400px;
  }
  
  .category-card {
    @apply bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200;
    @apply hover:shadow-md transition-all duration-200;
  }
  
  /* 카테고리 헤더 */
  .category-header {
    @apply flex items-start justify-between mb-3;
  }
  
  .category-info {
    @apply flex-1;
  }
  
  .category-name {
    @apply text-base font-semibold text-gray-900 mb-1;
  }
  
  .category-trend {
    @apply flex items-center space-x-1 text-xs font-medium;
  }
  
  .difficulty-badge {
    @apply px-2 py-1 rounded-full text-xs font-medium flex-shrink-0;
  }
  
  /* 지표 */
  .category-metrics {
    @apply flex items-center space-x-4 mb-3;
  }
  
  .metric-item {
    @apply flex items-center space-x-2;
  }
  
  .metric-icon {
    @apply flex items-center justify-center;
  }
  
  .metric-content {
    @apply text-center;
  }
  
  .metric-value {
    @apply text-sm font-semibold text-gray-900;
  }
  
  .metric-label {
    @apply text-xs text-gray-500;
  }
  
  /* 주요 기관 */
  .top-agencies {
    @apply mb-3;
  }
  
  .agencies-label {
    @apply text-xs font-medium text-gray-700 mb-2;
  }
  
  .agencies-list {
    @apply flex flex-wrap gap-2;
  }
  
  .agency-item {
    @apply flex items-center justify-between space-x-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs;
  }
  
  .agency-name {
    @apply font-medium;
  }
  
  .agency-count {
    @apply text-xs opacity-75;
  }
  
  /* 최근 활동 */
  .recent-activity {
    @apply pt-3 border-t border-gray-100;
  }
  
  .activity-text {
    @apply text-xs text-gray-600 leading-relaxed;
  }
  
  /* 전체 요약 */
  .tracker-summary {
    @apply mt-4 pt-4 border-t border-gray-100;
  }
  
  .summary-stats {
    @apply flex items-center justify-between;
  }
  
  .summary-item {
    @apply text-center;
  }
  
  .summary-label {
    @apply block text-xs text-gray-500 mb-1;
  }
  
  .summary-value {
    @apply text-sm font-semibold text-gray-900;
  }
  
  /* 반응형 */
  @media (max-width: 640px) {
    .category-metrics {
      @apply grid grid-cols-3 gap-3;
    }
    
    .summary-stats {
      @apply grid grid-cols-3 gap-3;
    }
    
    .agencies-list {
      @apply grid grid-cols-2 gap-2;
    }
  }
</style>