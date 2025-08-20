<script>
  import { Heart, ExternalLink, Clock, Users, Star, TrendingUp } from 'lucide-svelte';
  import { personalizedJobs, userProfileStore } from '../../stores/dashboard.js';
  import { toggleFavorite, favorites } from '$lib/stores/jobs.js';
  
  export let widget;
  
  $: jobs = $personalizedJobs;
  $: userPrefs = $userProfileStore.preferences;
  $: maxItems = widget.settings?.maxItems || 5;
  $: sortBy = widget.settings?.sortBy || 'matchScore';
  
  // 상위 추천 공고들 가져오기
  $: topRecommendations = jobs
    .filter(job => job.personalScore > 50) // 50점 이상만
    .sort((a, b) => b.personalScore - a.personalScore)
    .slice(0, maxItems);
  
  function getScoreColor(score) {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  }
  
  function getDifficultyColor(level) {
    switch(level) {
      case '쉬움': return 'text-green-600 bg-green-100';
      case '보통': return 'text-yellow-600 bg-yellow-100';
      case '어려움': return 'text-orange-600 bg-orange-100';
      case '매우 어려움': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
  
  function formatDaysLeft(job) {
    const days = job.metadata?.timeToDeadline;
    if (days < 0) return '마감됨';
    if (days === 0) return '오늘 마감';
    if (days === 1) return '내일 마감';
    return `D-${days}`;
  }
  
  function getMatchReasons(job) {
    const reasons = [];
    
    // 관심 기관 매칭
    if (userPrefs.interestedAgencies.includes(job.agencyName)) {
      reasons.push('관심 기관');
    }
    
    // 관심 직렬 매칭
    if (job.categories && job.categories.some(cat => 
      userPrefs.targetCategories.includes(cat)
    )) {
      reasons.push('관심 직렬');
    }
    
    // 경쟁률
    if (job.difficultyAnalysis && job.difficultyAnalysis.totalScore <= userPrefs.competitionThreshold) {
      reasons.push('적정 경쟁률');
    }
    
    // 채용 규모
    if (job.requiredCount >= userPrefs.minHiringSize) {
      reasons.push('적정 규모');
    }
    
    return reasons.slice(0, 2); // 최대 2개만 표시
  }
  
  function handleToggleFavorite(jobId) {
    toggleFavorite(jobId);
  }
  
  function handleJobClick(job) {
    // 채용공고 상세 페이지로 이동 (추후 구현)
    console.log('채용공고 상세:', job);
  }
</script>

<div class="personal-recommendations">
  {#if topRecommendations.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <Star size={48} class="text-gray-400" />
      </div>
      <div class="empty-content">
        <h3 class="empty-title">추천 공고가 없습니다</h3>
        <p class="empty-description">
          개인화 설정을 완료하면 맞춤형 추천을 받을 수 있습니다.
        </p>
        <button class="btn-primary btn-sm">
          개인화 설정하기
        </button>
      </div>
    </div>
  {:else}
    <div class="recommendations-header">
      <div class="header-title">
        <Star size={16} class="text-yellow-500" />
        <span>나에게 딱 맞는 채용공고</span>
      </div>
      <div class="header-count">
        {topRecommendations.length}개 추천
      </div>
    </div>
    
    <div class="recommendations-list">
      {#each topRecommendations as job (job.id)}
        <div class="recommendation-card">
          <!-- 카드 헤더 -->
          <div class="card-header">
            <div class="job-info">
              <div class="agency-name">{job.agencyName}</div>
              <h4 class="job-title" on:click={() => handleJobClick(job)}>
                {job.jobTitle}
              </h4>
            </div>
            
            <div class="card-actions">
              <button
                class="favorite-btn {$favorites.includes(job.id) ? 'active' : ''}"
                on:click={() => handleToggleFavorite(job.id)}
                title="즐겨찾기"
              >
                <Heart 
                  size={16} 
                  fill={$favorites.includes(job.id) ? 'currentColor' : 'none'} 
                />
              </button>
              
              <button class="external-btn" title="상세보기">
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
          
          <!-- 매칭 점수 및 이유 -->
          <div class="matching-info">
            <div class="match-score {getScoreColor(job.personalScore)}">
              <TrendingUp size={12} />
              {job.personalScore.toFixed(0)}점 매칭
            </div>
            
            <div class="match-reasons">
              {#each getMatchReasons(job) as reason}
                <span class="reason-tag">{reason}</span>
              {/each}
            </div>
          </div>
          
          <!-- 채용 정보 -->
          <div class="job-details">
            <div class="detail-item">
              <Users size={12} />
              <span>{job.requiredCount}명 채용</span>
            </div>
            
            <div class="detail-item">
              <Clock size={12} />
              <span class="deadline {job.metadata?.timeToDeadline <= 7 ? 'urgent' : ''}">
                {formatDaysLeft(job)}
              </span>
            </div>
            
            {#if job.difficultyAnalysis}
              <div class="detail-item">
                <span class="difficulty-badge {getDifficultyColor(job.difficultyAnalysis.level.level)}">
                  {job.difficultyAnalysis.level.icon} {job.difficultyAnalysis.level.level}
                </span>
              </div>
            {/if}
          </div>
          
          <!-- 직렬 태그들 -->
          {#if job.categories}
            <div class="categories">
              {#each job.categories.slice(0, 3) as category}
                <span class="category-tag">{category}</span>
              {/each}
              {#if job.categories.length > 3}
                <span class="category-more">+{job.categories.length - 3}</span>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
    
    <!-- 더보기 버튼 -->
    {#if jobs.length > maxItems}
      <div class="view-more">
        <button class="btn-outline btn-sm w-full">
          더 많은 추천 보기 ({jobs.length - maxItems}개 더)
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .personal-recommendations {
    @apply h-full flex flex-col;
  }
  
  /* 빈 상태 */
  .empty-state {
    @apply flex flex-col items-center justify-center h-full text-center space-y-4;
  }
  
  .empty-icon {
    @apply p-4 bg-gray-100 rounded-full;
  }
  
  .empty-title {
    @apply text-lg font-semibold text-gray-900;
  }
  
  .empty-description {
    @apply text-sm text-gray-600 max-w-xs;
  }
  
  /* 헤더 */
  .recommendations-header {
    @apply flex items-center justify-between mb-4 pb-3 border-b border-gray-100;
  }
  
  .header-title {
    @apply flex items-center space-x-2 text-sm font-semibold text-gray-900;
  }
  
  .header-count {
    @apply text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full;
  }
  
  /* 추천 목록 */
  .recommendations-list {
    @apply flex-1 space-y-3 overflow-y-auto;
    max-height: 400px;
  }
  
  .recommendation-card {
    @apply bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200;
    @apply border border-gray-200 hover:border-gray-300;
  }
  
  .card-header {
    @apply flex items-start justify-between mb-3;
  }
  
  .job-info {
    @apply flex-1;
  }
  
  .agency-name {
    @apply text-xs text-gray-500 font-medium mb-1;
  }
  
  .job-title {
    @apply text-sm font-semibold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .card-actions {
    @apply flex items-center space-x-2 flex-shrink-0 ml-3;
  }
  
  .favorite-btn {
    @apply p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md;
  }
  
  .favorite-btn.active {
    @apply text-red-500;
  }
  
  .external-btn {
    @apply p-1.5 text-gray-400 hover:text-primary-600 transition-colors rounded-md;
  }
  
  /* 매칭 정보 */
  .matching-info {
    @apply flex items-center space-x-3 mb-3;
  }
  
  .match-score {
    @apply inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium;
  }
  
  .match-reasons {
    @apply flex items-center space-x-2;
  }
  
  .reason-tag {
    @apply px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full;
  }
  
  /* 채용 정보 */
  .job-details {
    @apply flex items-center space-x-4 mb-3 text-xs text-gray-600;
  }
  
  .detail-item {
    @apply flex items-center space-x-1;
  }
  
  .deadline.urgent {
    @apply text-red-600 font-semibold;
  }
  
  .difficulty-badge {
    @apply px-2 py-0.5 rounded-full text-xs font-medium;
  }
  
  /* 직렬 카테고리 */
  .categories {
    @apply flex items-center space-x-2 flex-wrap;
  }
  
  .category-tag {
    @apply px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-md;
  }
  
  .category-more {
    @apply text-xs text-gray-500 font-medium;
  }
  
  /* 더보기 */
  .view-more {
    @apply mt-4 pt-3 border-t border-gray-100;
  }
  
  /* 버튼 스타일 */
  .btn-primary {
    @apply bg-primary-500 text-white px-4 py-2 rounded-lg font-medium;
    @apply hover:bg-primary-600 transition-colors;
  }
  
  .btn-outline {
    @apply border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium;
    @apply hover:bg-gray-50 transition-colors;
  }
  
  .btn-sm {
    @apply text-sm px-3 py-1.5;
  }
</style>