<script>
  import { createEventDispatcher } from 'svelte';
  import { Settings, User, Bell, Target } from 'lucide-svelte';
  import { userProfileStore, userProfileActions, enhancedDataStore } from '../stores/dashboard.js';
  
  const dispatch = createEventDispatcher();
  
  $: userProfile = $userProfileStore;
  $: data = $enhancedDataStore;
  
  // 사용 가능한 옵션들 추출
  $: availableAgencies = data.jobs.length > 0 
    ? [...new Set(data.jobs.map(job => job.agencyName))].sort()
    : [];
    
  $: availableCategories = data.jobs.length > 0
    ? [...new Set(data.jobs.flatMap(job => job.categories || []))].sort()
    : [];
  
  let isLoading = false;
  let showSuccess = false;
  
  // 로컬 상태 (저장하기 전까지 임시)
  let localPrefs = { ...userProfile.preferences };
  let localConfig = { ...userProfile.dashboardConfig };
  
  function handleAgencyToggle(agency) {
    if (localPrefs.interestedAgencies.includes(agency)) {
      localPrefs.interestedAgencies = localPrefs.interestedAgencies.filter(a => a !== agency);
    } else {
      localPrefs.interestedAgencies = [...localPrefs.interestedAgencies, agency];
    }
  }
  
  function handleCategoryToggle(category) {
    if (localPrefs.targetCategories.includes(category)) {
      localPrefs.targetCategories = localPrefs.targetCategories.filter(c => c !== category);
    } else {
      localPrefs.targetCategories = [...localPrefs.targetCategories, category];
    }
  }
  
  async function handleSave() {
    isLoading = true;
    
    try {
      // 개인화 설정 업데이트
      userProfileActions.updatePreferences(localPrefs);
      
      // 대시보드 설정 업데이트
      userProfileStore.update(profile => ({
        ...profile,
        dashboardConfig: localConfig
      }));
      
      showSuccess = true;
      setTimeout(() => {
        showSuccess = false;
        dispatch('close');
      }, 1500);
      
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      isLoading = false;
    }
  }
  
  function handleReset() {
    if (confirm('모든 개인화 설정을 초기화하시겠습니까?')) {
      localPrefs = {
        interestedAgencies: [],
        targetCategories: [],
        competitionThreshold: 50,
        minHiringSize: 10,
        preferredExamTypes: ['일반']
      };
      
      localConfig = {
        favoriteWidgets: [],
        theme: 'light',
        notifications: {
          lowCompetitionAlert: true,
          newJobAlert: true,
          deadlineAlert: 7
        }
      };
    }
  }
</script>

<div class="user-settings">
  {#if showSuccess}
    <div class="success-message">
      ✅ 설정이 저장되었습니다!
    </div>
  {:else}
    <!-- 설정 섹션들 -->
    <div class="settings-sections">
      <!-- 관심 기관 설정 -->
      <section class="settings-section">
        <div class="section-header">
          <div class="section-icon">
            <Target size={18} class="text-blue-600" />
          </div>
          <div>
            <h3 class="section-title">관심 기관</h3>
            <p class="section-description">채용정보를 추적하고 싶은 기관을 선택하세요</p>
          </div>
        </div>
        
        <div class="options-grid">
          {#each availableAgencies as agency}
            <label class="option-item">
              <input 
                type="checkbox" 
                bind:group={localPrefs.interestedAgencies}
                value={agency}
                class="option-checkbox"
              />
              <span class="option-label">{agency}</span>
              <span class="option-checkmark"></span>
            </label>
          {/each}
        </div>
      </section>
      
      <!-- 관심 직렬 설정 -->
      <section class="settings-section">
        <div class="section-header">
          <div class="section-icon">
            <User size={18} class="text-green-600" />
          </div>
          <div>
            <h3 class="section-title">관심 직렬</h3>
            <p class="section-description">지원하고 싶은 직렬을 선택하세요</p>
          </div>
        </div>
        
        <div class="options-grid">
          {#each availableCategories.slice(0, 12) as category}
            <label class="option-item">
              <input 
                type="checkbox" 
                bind:group={localPrefs.targetCategories}
                value={category}
                class="option-checkbox"
              />
              <span class="option-label">{category}</span>
              <span class="option-checkmark"></span>
            </label>
          {/each}
        </div>
        
        {#if availableCategories.length > 12}
          <div class="more-options">
            외 {availableCategories.length - 12}개 직렬 더 (전체 보기는 추후 업데이트)
          </div>
        {/if}
      </section>
      
      <!-- 선호도 설정 -->
      <section class="settings-section">
        <div class="section-header">
          <div class="section-icon">
            <Settings size={18} class="text-purple-600" />
          </div>
          <div>
            <h3 class="section-title">선호도 설정</h3>
            <p class="section-description">개인 맞춤 추천을 위한 세부 설정</p>
          </div>
        </div>
        
        <div class="preference-controls">
          <!-- 경쟁률 기준 -->
          <div class="control-item">
            <label class="control-label">
              선호 경쟁률 기준
              <span class="control-value">{localPrefs.competitionThreshold}:1 이하</span>
            </label>
            <input 
              type="range" 
              bind:value={localPrefs.competitionThreshold}
              min="10" 
              max="100" 
              step="5"
              class="range-slider"
            />
            <div class="range-labels">
              <span>10:1 (매우 낮음)</span>
              <span>100:1 (매우 높음)</span>
            </div>
          </div>
          
          <!-- 최소 채용 규모 -->
          <div class="control-item">
            <label class="control-label">
              최소 채용 규모
              <span class="control-value">{localPrefs.minHiringSize}명 이상</span>
            </label>
            <input 
              type="range" 
              bind:value={localPrefs.minHiringSize}
              min="1" 
              max="100" 
              step="5"
              class="range-slider"
            />
            <div class="range-labels">
              <span>1명 (소수정예)</span>
              <span>100명 (대규모)</span>
            </div>
          </div>
          
          <!-- 선호 시험 유형 -->
          <div class="control-item">
            <label class="control-label">선호 시험 유형</label>
            <div class="checkbox-group">
              {#each ['일반', '경력', '장애인', '보훈'] as examType}
                <label class="checkbox-item">
                  <input 
                    type="checkbox" 
                    bind:group={localPrefs.preferredExamTypes}
                    value={examType}
                  />
                  <span>{examType}</span>
                </label>
              {/each}
            </div>
          </div>
        </div>
      </section>
      
      <!-- 알림 설정 -->
      <section class="settings-section">
        <div class="section-header">
          <div class="section-icon">
            <Bell size={18} class="text-orange-600" />
          </div>
          <div>
            <h3 class="section-title">알림 설정</h3>
            <p class="section-description">중요한 정보를 놓치지 않도록 알림을 설정하세요</p>
          </div>
        </div>
        
        <div class="notification-controls">
          <label class="notification-item">
            <input 
              type="checkbox" 
              bind:checked={localConfig.notifications.lowCompetitionAlert}
            />
            <div class="notification-content">
              <span class="notification-title">경쟁률 낮은 공고 알림</span>
              <span class="notification-description">관심 분야에서 경쟁률이 낮은 공고가 있을 때</span>
            </div>
          </label>
          
          <label class="notification-item">
            <input 
              type="checkbox" 
              bind:checked={localConfig.notifications.newJobAlert}
            />
            <div class="notification-content">
              <span class="notification-title">신규 공고 알림</span>
              <span class="notification-description">관심 기관/직렬에서 새로운 채용공고가 올라올 때</span>
            </div>
          </label>
          
          <div class="notification-item">
            <div class="notification-content">
              <span class="notification-title">마감일 알림</span>
              <span class="notification-description">채용 마감일 며칠 전에 알림</span>
            </div>
            <select bind:value={localConfig.notifications.deadlineAlert} class="deadline-select">
              <option value={1}>1일 전</option>
              <option value={3}>3일 전</option>
              <option value={7}>7일 전</option>
              <option value={14}>14일 전</option>
            </select>
          </div>
        </div>
      </section>
    </div>
    
    <!-- 저장 버튼 -->
    <div class="settings-actions">
      <button 
        class="btn-outline"
        on:click={handleReset}
        disabled={isLoading}
      >
        초기화
      </button>
      
      <button 
        class="btn-primary"
        on:click={handleSave}
        disabled={isLoading}
      >
        {#if isLoading}
          저장 중...
        {:else}
          설정 저장
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .user-settings {
    @apply max-h-[80vh] overflow-y-auto;
  }
  
  .success-message {
    @apply text-center py-12 text-green-600 text-lg font-semibold;
  }
  
  .settings-sections {
    @apply space-y-8;
  }
  
  /* 섹션 스타일 */
  .settings-section {
    @apply space-y-4;
  }
  
  .section-header {
    @apply flex space-x-3;
  }
  
  .section-icon {
    @apply flex-shrink-0 mt-0.5;
  }
  
  .section-title {
    @apply text-lg font-semibold text-gray-900;
  }
  
  .section-description {
    @apply text-sm text-gray-600 mt-1;
  }
  
  /* 옵션 그리드 */
  .options-grid {
    @apply grid grid-cols-2 gap-3;
  }
  
  .option-item {
    @apply relative flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer;
    @apply hover:border-gray-300 transition-colors;
  }
  
  .option-checkbox {
    @apply sr-only;
  }
  
  .option-label {
    @apply flex-1 text-sm font-medium text-gray-700;
  }
  
  .option-checkmark {
    @apply w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0;
    @apply transition-colors duration-200;
  }
  
  .option-item:has(.option-checkbox:checked) {
    @apply border-primary-500 bg-primary-50;
  }
  
  .option-item:has(.option-checkbox:checked) .option-checkmark {
    @apply border-primary-500 bg-primary-500;
  }
  
  .option-item:has(.option-checkbox:checked) .option-checkmark::after {
    content: '✓';
    @apply text-white text-xs font-bold flex items-center justify-center;
  }
  
  .more-options {
    @apply text-xs text-gray-500 text-center py-2;
  }
  
  /* 선호도 설정 */
  .preference-controls {
    @apply space-y-6;
  }
  
  .control-item {
    @apply space-y-3;
  }
  
  .control-label {
    @apply flex items-center justify-between text-sm font-medium text-gray-700;
  }
  
  .control-value {
    @apply text-primary-600 font-semibold;
  }
  
  .range-slider {
    @apply w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
  }
  
  .range-slider::-webkit-slider-thumb {
    @apply appearance-none w-5 h-5 bg-primary-500 rounded-full cursor-pointer;
  }
  
  .range-labels {
    @apply flex justify-between text-xs text-gray-500;
  }
  
  .checkbox-group {
    @apply flex flex-wrap gap-3;
  }
  
  .checkbox-item {
    @apply flex items-center space-x-2 cursor-pointer;
  }
  
  /* 알림 설정 */
  .notification-controls {
    @apply space-y-4;
  }
  
  .notification-item {
    @apply flex items-center justify-between p-3 border border-gray-200 rounded-lg;
  }
  
  .notification-content {
    @apply flex-1 space-y-1;
  }
  
  .notification-title {
    @apply text-sm font-medium text-gray-900;
  }
  
  .notification-description {
    @apply text-xs text-gray-600;
  }
  
  .deadline-select {
    @apply px-3 py-1 text-sm border border-gray-300 rounded-md;
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500;
  }
  
  /* 액션 버튼 */
  .settings-actions {
    @apply flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-8;
  }
  
  .btn-outline {
    @apply px-4 py-2 border border-gray-300 text-gray-700 rounded-lg;
    @apply hover:bg-gray-50 transition-colors;
  }
  
  .btn-primary {
    @apply px-4 py-2 bg-primary-500 text-white rounded-lg;
    @apply hover:bg-primary-600 transition-colors disabled:opacity-50;
  }
  
  /* 반응형 */
  @media (max-width: 640px) {
    .options-grid {
      @apply grid-cols-1;
    }
    
    .settings-actions {
      @apply flex-col space-x-0 space-y-3;
    }
  }
</style>