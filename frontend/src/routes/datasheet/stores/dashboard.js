import { writable, derived, get } from 'svelte/store';
import { dataProcessor, calculatePersonalMatchScore } from '$lib/utils/dataProcessor.js';
import { fetchAllCachedData, clearCache } from '$lib/utils/apiClient.js';

// =============================================================================
// 대시보드 상태 관리 스토어
// =============================================================================

// 대시보드 기본 설정
export const dashboardStore = writable({
  layout: 'grid', // 'grid' | 'masonry' | 'flex'
  theme: 'light', // 'light' | 'dark' | 'busan'
  gridColumns: 12,
  isEditMode: false,
  isInitialized: false,
  widgets: [
    // 기본 위젯들
    {
      id: 'summary-stats',
      type: 'summary-stats',
      title: '채용 현황 요약',
      position: { x: 0, y: 0, w: 12, h: 2 },
      settings: {
        showAgencyCount: true,
        showJobCount: true,
        showCompetitionAvg: true,
        showTotalHiring: true
      },
      visible: true
    },
    {
      id: 'personal-recommendations',
      type: 'personal-recommendations', 
      title: '개인 맞춤 추천',
      position: { x: 0, y: 2, w: 6, h: 4 },
      settings: {
        maxItems: 5,
        sortBy: 'matchScore'
      },
      visible: true
    },
    {
      id: 'competition-chart',
      type: 'competition-chart',
      title: '경쟁률 분석',
      position: { x: 6, y: 2, w: 6, h: 4 },
      settings: {
        chartType: 'bar',
        groupBy: 'agency'
      },
      visible: true
    },
    {
      id: 'category-tracker',
      type: 'category-tracker',
      title: '관심 직렬 트래커',
      position: { x: 0, y: 6, w: 8, h: 3 },
      settings: {
        categories: [], // 개인화 설정에서 가져옴
        showTrend: true
      },
      visible: true
    },
    {
      id: 'deadline-calendar',
      type: 'deadline-calendar',
      title: '마감일 캘린더',
      position: { x: 8, y: 6, w: 4, h: 3 },
      settings: {
        viewMode: 'month',
        highlightUrgent: true
      },
      visible: true
    }
  ]
});

// 사용자 개인화 프로필
export const userProfileStore = writable({
  preferences: {
    interestedAgencies: ['부산교통공사'],
    targetCategories: ['운영직', '전기직'],
    competitionThreshold: 50, // 50:1 이하 선호
    minHiringSize: 10,
    preferredExamTypes: ['일반']
  },
  dashboardConfig: {
    favoriteWidgets: ['personal-recommendations', 'category-tracker'],
    theme: 'light',
    notifications: {
      lowCompetitionAlert: true,
      newJobAlert: true,
      deadlineAlert: 7 // D-7 알림
    }
  },
  history: {
    viewedJobs: [],
    searchQueries: [],
    usageTime: 0
  }
});

// 가공된 데이터 스토어
export const enhancedDataStore = writable({
  jobs: [],
  isLoading: true,
  lastUpdated: null,
  error: null
});

// =============================================================================
// 파생된 스토어들
// =============================================================================

// 현재 표시할 위젯들
export const visibleWidgets = derived(
  [dashboardStore],
  ([$dashboard]) => {
    return $dashboard.widgets.filter(widget => widget.visible);
  }
);

// 개인화된 채용공고들
export const personalizedJobs = derived(
  [enhancedDataStore, userProfileStore],
  ([$data, $profile]) => {
    if (!$data.jobs.length) return [];
    
    return $data.jobs.map(job => ({
      ...job,
      personalScore: calculatePersonalMatchScore(job, $profile)
    })).sort((a, b) => b.personalScore - a.personalScore);
  }
);

// 대시보드 통계
export const dashboardStats = derived(
  [personalizedJobs, userProfileStore],
  ([$jobs, $profile]) => {
    const prefs = $profile.preferences;
    
    const totalJobs = $jobs.length;
    const interestedJobs = $jobs.filter(job => 
      prefs.interestedAgencies.includes(job.agencyName) ||
      (job.categories && job.categories.some(cat => 
        prefs.targetCategories.includes(cat)
      ))
    );
    
    const lowCompetitionJobs = $jobs.filter(job => 
      job.difficultyAnalysis?.totalScore <= prefs.competitionThreshold
    );
    
    const upcomingDeadlines = $jobs.filter(job => 
      job.timelineInfo?.timeToDeadline > 0 && 
      job.timelineInfo.timeToDeadline <= 7
    );
    
    return {
      totalJobs,
      interestedJobs: interestedJobs.length,
      lowCompetitionJobs: lowCompetitionJobs.length,
      upcomingDeadlines: upcomingDeadlines.length,
      averageMatchScore: interestedJobs.length > 0 ? 
        interestedJobs.reduce((sum, job) => sum + job.personalScore, 0) / interestedJobs.length : 0
    };
  }
);

// =============================================================================
// 액션 함수들
// =============================================================================

export const dashboardActions = {
  // 대시보드 초기화
  initialize: async function() {
    const dashboard = get(dashboardStore);
    if (dashboard.isInitialized) return;
    
    // 로딩 상태 시작
    enhancedDataStore.update(store => ({
      ...store,
      isLoading: true,
      error: null
    }));
    
    try {
      // API에서 데이터 가져오기
      console.log('API에서 데이터를 가져오는 중...');
      const apiData = await fetchAllCachedData();
      
      // 데이터 가공
      const enhanced = dataProcessor.enhanceJobData(
        apiData.jobs,
        apiData.competition,
        apiData.hiring
      );
      
      enhancedDataStore.update(store => ({
        ...store,
        jobs: enhanced,
        isLoading: false,
        lastUpdated: new Date(),
        error: null
      }));
      
      // 대시보드 초기화 완료
      dashboardStore.update(store => ({
        ...store,
        isInitialized: true
      }));
      
      // localStorage에서 설정 불러오기
      this.loadSettings();
      
      console.log('대시보드 초기화 완료', { 
        jobsCount: enhanced.length,
        lastUpdated: new Date().toLocaleString()
      });
      
    } catch (error) {
      console.error('대시보드 초기화 실패:', error);
      
      // 에러 상태 업데이트
      enhancedDataStore.update(store => ({
        ...store,
        isLoading: false,
        error: error.message || '데이터를 불러오는데 실패했습니다.'
      }));
    }
  },

  // 데이터 새로고침
  refresh: async function() {
    console.log('데이터 새로고침 중...');
    
    // 캐시 클리어
    clearCache();
    
    // 초기화 상태 리셋 후 다시 초기화
    dashboardStore.update(store => ({
      ...store,
      isInitialized: false
    }));
    
    await this.initialize();
  },
  
  // 위젯 추가
  addWidget(widget) {
    dashboardStore.update(store => ({
      ...store,
      widgets: [...store.widgets, {
        ...widget,
        id: widget.id || `widget_${Date.now()}`,
        visible: true,
        position: widget.position || { x: 0, y: 0, w: 4, h: 3 }
      }]
    }));
    this.saveSettings();
  },
  
  // 위젯 제거
  removeWidget(widgetId) {
    dashboardStore.update(store => ({
      ...store,
      widgets: store.widgets.filter(w => w.id !== widgetId)
    }));
    this.saveSettings();
  },
  
  // 위젯 업데이트
  updateWidget(widgetId, updates) {
    dashboardStore.update(store => ({
      ...store,
      widgets: store.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      )
    }));
    this.saveSettings();
  },
  
  // 위젯 위치 변경
  moveWidget(widgetId, newPosition) {
    this.updateWidget(widgetId, { position: newPosition });
  },
  
  // 편집 모드 토글
  setEditMode(isEdit) {
    dashboardStore.update(store => ({
      ...store,
      isEditMode: isEdit
    }));
  },
  
  // 테마 변경
  setTheme(theme) {
    dashboardStore.update(store => ({
      ...store,
      theme
    }));
    this.saveSettings();
  },
  
  // 레이아웃 변경
  setLayout(layout) {
    dashboardStore.update(store => ({
      ...store,
      layout
    }));
    this.saveSettings();
  },
  
  // 설정 저장
  saveSettings() {
    try {
      const dashboard = get(dashboardStore);
      const userProfile = get(userProfileStore);
      
      localStorage.setItem('dashboardSettings', JSON.stringify({
        dashboard: {
          layout: dashboard.layout,
          theme: dashboard.theme,
          widgets: dashboard.widgets
        },
        userProfile
      }));
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  },
  
  // 설정 불러오기
  loadSettings() {
    try {
      const saved = localStorage.getItem('dashboardSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        
        if (settings.dashboard) {
          dashboardStore.update(store => ({
            ...store,
            ...settings.dashboard
          }));
        }
        
        if (settings.userProfile) {
          userProfileStore.set(settings.userProfile);
        }
      }
    } catch (error) {
      console.error('설정 불러오기 실패:', error);
    }
  },
  
  // 대시보드 리셋
  reset() {
    dashboardStore.update(store => ({
      ...store,
      widgets: [
        {
          id: 'summary-stats',
          type: 'summary-stats',
          title: '채용 현황 요약',
          position: { x: 0, y: 0, w: 12, h: 2 },
          settings: {},
          visible: true
        },
        {
          id: 'personal-recommendations',
          type: 'personal-recommendations',
          title: '개인 맞춤 추천',
          position: { x: 0, y: 2, w: 6, h: 4 },
          settings: {},
          visible: true
        }
      ]
    }));
    this.saveSettings();
  }
};

// 개인화 액션들
export const userProfileActions = {
  // 관심 기관 업데이트
  updateInterestedAgencies(agencies) {
    userProfileStore.update(profile => ({
      ...profile,
      preferences: {
        ...profile.preferences,
        interestedAgencies: agencies
      }
    }));
    dashboardActions.saveSettings();
  },
  
  // 관심 직렬 업데이트
  updateTargetCategories(categories) {
    userProfileStore.update(profile => ({
      ...profile,
      preferences: {
        ...profile.preferences,
        targetCategories: categories
      }
    }));
    dashboardActions.saveSettings();
  },
  
  // 경쟁률 기준 업데이트
  updateCompetitionThreshold(threshold) {
    userProfileStore.update(profile => ({
      ...profile,
      preferences: {
        ...profile.preferences,
        competitionThreshold: threshold
      }
    }));
    dashboardActions.saveSettings();
  },
  
  // 전체 개인화 설정 업데이트
  updatePreferences(newPreferences) {
    userProfileStore.update(profile => ({
      ...profile,
      preferences: {
        ...profile.preferences,
        ...newPreferences
      }
    }));
    dashboardActions.saveSettings();
  }
};

// 편의를 위한 단일 스토어 export (대시보드 컴포넌트에서 사용)
export const dashboard = {
  store: dashboardStore,
  actions: dashboardActions
};

export const userProfile = {
  store: userProfileStore,
  actions: userProfileActions
};