<script>
  import { onMount } from 'svelte';
  import { BarChart3, Settings, Filter } from 'lucide-svelte';
  import Chart from '$lib/components/Chart.svelte';
  import { enhancedDataStore, userProfileStore } from '../../stores/dashboard.js';
  
  export let widget;
  
  $: data = $enhancedDataStore;
  $: userPrefs = $userProfileStore.preferences;
  $: chartType = widget.settings?.chartType || 'bar';
  $: groupBy = widget.settings?.groupBy || 'agency';
  $: showOnlyInterested = widget.settings?.showOnlyInterested || false;
  
  let chartData = {};
  let isLoading = true;
  let selectedFilter = 'all'; // all, interested, easy
  
  onMount(() => {
    generateChartData();
    isLoading = false;
  });
  
  $: if (data.jobs.length > 0) {
    generateChartData();
  }
  
  function generateChartData() {
    if (!data.jobs.length) return;
    
    let filteredJobs = [...data.jobs];
    
    // 필터 적용
    if (selectedFilter === 'interested') {
      filteredJobs = filteredJobs.filter(job => 
        userPrefs.interestedAgencies.includes(job.agencyName) ||
        (job.categories && job.categories.some(cat => 
          userPrefs.targetCategories.includes(cat)
        ))
      );
    } else if (selectedFilter === 'easy') {
      filteredJobs = filteredJobs.filter(job => 
        job.difficultyAnalysis && job.difficultyAnalysis.totalScore <= 50
      );
    }
    
    if (groupBy === 'agency') {
      generateAgencyChart(filteredJobs);
    } else if (groupBy === 'category') {
      generateCategoryChart(filteredJobs);
    } else if (groupBy === 'difficulty') {
      generateDifficultyChart(filteredJobs);
    }
  }
  
  function generateAgencyChart(jobs) {
    const agencyStats = {};
    
    jobs.forEach(job => {
      if (!agencyStats[job.agencyName]) {
        agencyStats[job.agencyName] = {
          totalJobs: 0,
          totalDifficulty: 0,
          avgDifficulty: 0,
          totalHiring: 0
        };
      }
      
      agencyStats[job.agencyName].totalJobs++;
      agencyStats[job.agencyName].totalHiring += job.requiredCount || 0;
      
      if (job.difficultyAnalysis) {
        agencyStats[job.agencyName].totalDifficulty += job.difficultyAnalysis.totalScore;
      }
    });
    
    // 평균 계산
    Object.keys(agencyStats).forEach(agency => {
      const stats = agencyStats[agency];
      stats.avgDifficulty = stats.totalJobs > 0 ? stats.totalDifficulty / stats.totalJobs : 0;
    });
    
    const agencies = Object.keys(agencyStats);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    if (chartType === 'bar') {
      chartData = {
        labels: agencies,
        datasets: [{
          label: '평균 경쟁 난이도',
          data: agencies.map(agency => agencyStats[agency].avgDifficulty.toFixed(1)),
          backgroundColor: colors.slice(0, agencies.length),
          borderRadius: 6,
          borderSkipped: false
        }]
      };
    } else if (chartType === 'doughnut') {
      chartData = {
        labels: agencies,
        datasets: [{
          label: '채용공고 수',
          data: agencies.map(agency => agencyStats[agency].totalJobs),
          backgroundColor: colors.slice(0, agencies.length),
          borderWidth: 0,
          hoverOffset: 8
        }]
      };
    }
  }
  
  function generateCategoryChart(jobs) {
    const categoryStats = {};
    
    jobs.forEach(job => {
      if (job.categories) {
        job.categories.forEach(category => {
          if (!categoryStats[category]) {
            categoryStats[category] = {
              count: 0,
              totalDifficulty: 0,
              avgDifficulty: 0
            };
          }
          
          categoryStats[category].count++;
          if (job.difficultyAnalysis) {
            categoryStats[category].totalDifficulty += job.difficultyAnalysis.totalScore;
          }
        });
      }
    });
    
    // 평균 계산 및 상위 10개만 선택
    const sortedCategories = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        avgDifficulty: stats.count > 0 ? stats.totalDifficulty / stats.count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
      '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e'
    ];
    
    chartData = {
      labels: sortedCategories.map(item => item.category),
      datasets: [{
        label: chartType === 'bar' ? '평균 경쟁 난이도' : '채용공고 수',
        data: chartType === 'bar' 
          ? sortedCategories.map(item => item.avgDifficulty.toFixed(1))
          : sortedCategories.map(item => item.count),
        backgroundColor: colors.slice(0, sortedCategories.length),
        borderRadius: chartType === 'bar' ? 6 : 0,
        borderSkipped: chartType === 'bar' ? false : undefined,
        borderWidth: chartType === 'doughnut' ? 0 : undefined,
        hoverOffset: chartType === 'doughnut' ? 8 : undefined
      }]
    };
  }
  
  function generateDifficultyChart(jobs) {
    const difficultyLevels = { '쉬움': 0, '보통': 0, '어려움': 0, '매우 어려움': 0 };
    
    jobs.forEach(job => {
      if (job.difficultyAnalysis && job.difficultyAnalysis.level) {
        difficultyLevels[job.difficultyAnalysis.level.level]++;
      }
    });
    
    const colors = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];
    
    chartData = {
      labels: Object.keys(difficultyLevels),
      datasets: [{
        label: '채용공고 수',
        data: Object.values(difficultyLevels),
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
  }
  
  function handleFilterChange(newFilter) {
    selectedFilter = newFilter;
    generateChartData();
  }
  
  function handleGroupByChange(newGroupBy) {
    groupBy = newGroupBy;
    widget.settings = { ...widget.settings, groupBy: newGroupBy };
    generateChartData();
  }
  
  function handleChartTypeChange(newType) {
    chartType = newType;
    widget.settings = { ...widget.settings, chartType: newType };
    generateChartData();
  }
</script>

<div class="competition-chart">
  {#if isLoading}
    <div class="loading-state">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span class="text-sm text-gray-600 mt-2">차트 생성 중...</span>
    </div>
  {:else}
    <!-- 차트 컨트롤 -->
    <div class="chart-controls">
      <!-- 필터 버튼들 -->
      <div class="control-group">
        <div class="control-buttons">
          <button 
            class="control-btn {selectedFilter === 'all' ? 'active' : ''}"
            on:click={() => handleFilterChange('all')}
          >
            전체
          </button>
          <button 
            class="control-btn {selectedFilter === 'interested' ? 'active' : ''}"
            on:click={() => handleFilterChange('interested')}
          >
            관심 분야
          </button>
          <button 
            class="control-btn {selectedFilter === 'easy' ? 'active' : ''}"
            on:click={() => handleFilterChange('easy')}
          >
            경쟁률 낮음
          </button>
        </div>
      </div>
      
      <!-- 그룹핑 및 차트 타입 선택 -->
      <div class="control-group">
        <select 
          bind:value={groupBy}
          on:change={(e) => handleGroupByChange(e.target.value)}
          class="control-select"
        >
          <option value="agency">기관별</option>
          <option value="category">직렬별</option>
          <option value="difficulty">난이도별</option>
        </select>
        
        <select 
          bind:value={chartType}
          on:change={(e) => handleChartTypeChange(e.target.value)}
          class="control-select"
        >
          <option value="bar">막대 차트</option>
          <option value="doughnut">도넛 차트</option>
        </select>
      </div>
    </div>
    
    <!-- 차트 영역 -->
    <div class="chart-container">
      {#if chartData.labels && chartData.labels.length > 0}
        <Chart 
          type={chartType}
          data={chartData}
          height={300}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: chartType === 'doughnut',
                position: chartType === 'doughnut' ? 'bottom' : 'top',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  font: { size: 12 }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    if (chartType === 'bar') {
                      return `${context.dataset.label}: ${context.parsed.y}점`;
                    } else {
                      return `${context.label}: ${context.parsed}개`;
                    }
                  }
                }
              }
            },
            scales: chartType === 'bar' ? {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: groupBy === 'difficulty' ? '채용공고 수' : '평균 경쟁 난이도'
                },
                ticks: {
                  stepSize: groupBy === 'difficulty' ? 1 : 10
                }
              },
              x: {
                title: {
                  display: true,
                  text: groupBy === 'agency' ? '기관명' : 
                        groupBy === 'category' ? '직렬' : '난이도'
                }
              }
            } : undefined,
            cutout: chartType === 'doughnut' ? '50%' : undefined
          }}
        />
      {:else}
        <div class="no-data">
          <BarChart3 size={32} class="text-gray-400" />
          <p class="text-sm text-gray-600 mt-2">표시할 데이터가 없습니다</p>
        </div>
      {/if}
    </div>
    
    <!-- 차트 인사이트 -->
    <div class="chart-insights">
      {#if selectedFilter === 'interested'}
        <div class="insight-item">
          <span class="insight-icon">🎯</span>
          <span class="insight-text">관심 분야에 집중된 분석 결과입니다</span>
        </div>
      {:else if selectedFilter === 'easy'}
        <div class="insight-item">
          <span class="insight-icon">✨</span>
          <span class="insight-text">경쟁률이 낮은 기회들을 보여드립니다</span>
        </div>
      {:else}
        <div class="insight-item">
          <span class="insight-icon">📊</span>
          <span class="insight-text">전체 채용공고 기준 통계입니다</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .competition-chart {
    @apply h-full flex flex-col;
  }
  
  .loading-state {
    @apply flex flex-col items-center justify-center h-full text-center;
  }
  
  /* 차트 컨트롤 */
  .chart-controls {
    @apply flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100;
  }
  
  .control-group {
    @apply flex items-center space-x-2;
  }
  
  .control-buttons {
    @apply flex items-center space-x-1;
  }
  
  .control-btn {
    @apply px-3 py-1.5 text-xs font-medium rounded-lg transition-colors;
    @apply border border-gray-300 text-gray-600 hover:bg-gray-50;
  }
  
  .control-btn.active {
    @apply bg-primary-500 text-white border-primary-500;
  }
  
  .control-select {
    @apply px-3 py-1.5 text-xs border border-gray-300 rounded-lg;
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
  }
  
  /* 차트 컨테이너 */
  .chart-container {
    @apply flex-1 relative min-h-0;
  }
  
  .no-data {
    @apply flex flex-col items-center justify-center h-full text-center;
  }
  
  /* 차트 인사이트 */
  .chart-insights {
    @apply mt-3 pt-3 border-t border-gray-100;
  }
  
  .insight-item {
    @apply flex items-center space-x-2 text-sm;
  }
  
  .insight-icon {
    @apply text-base;
  }
  
  .insight-text {
    @apply text-gray-600;
  }
  
  /* 반응형 */
  @media (max-width: 640px) {
    .chart-controls {
      @apply flex-col items-stretch space-y-3;
    }
    
    .control-group {
      @apply justify-center;
    }
    
    .control-buttons {
      @apply justify-center;
    }
  }
</style>