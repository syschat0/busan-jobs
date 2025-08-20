<script>
  import { onMount } from 'svelte';
  import { TrendingDown, TrendingUp, Minus, Trophy, AlertTriangle, Target } from 'lucide-svelte';
  
  export let data = { jobs: [], competition: [], hiring: [] };

  let chartContainer;
  let agencyChartContainer;
  let categoryChartContainer;
  let Chart;

  // 경쟁률 데이터 처리
  $: competitionData = data.competition
    .map(item => ({
      rate: parseFloat(item.경쟁률 || '0'),
      category: item.직렬 || item.구분 || 'Unknown',
      agency: item.기관명 || 'Unknown',
      year: item.연도 || new Date().getFullYear(),
      title: item.시험명 || item.공고명 || 'Unknown'
    }))
    .filter(item => item.rate > 0);

  // 경쟁률 구간별 분석
  $: competitionAnalysis = {
    low: competitionData.filter(d => d.rate < 10).length,     // 낮음 (10:1 미만)
    medium: competitionData.filter(d => d.rate >= 10 && d.rate < 30).length, // 보통 (10:1~30:1)
    high: competitionData.filter(d => d.rate >= 30).length,   // 높음 (30:1 이상)
    average: competitionData.length > 0 
      ? competitionData.reduce((sum, d) => sum + d.rate, 0) / competitionData.length 
      : 0
  };

  // 기관별 경쟁률 상세 분석
  $: agencyCompetition = competitionData.reduce((acc, item) => {
    if (!acc[item.agency]) {
      acc[item.agency] = { 
        rates: [], 
        name: item.agency,
        categories: new Set(),
        years: new Set()
      };
    }
    acc[item.agency].rates.push(item.rate);
    acc[item.agency].categories.add(item.category);
    acc[item.agency].years.add(item.year);
    return acc;
  }, {});

  $: agencyStats = Object.values(agencyCompetition)
    .map(agency => ({
      name: agency.name,
      average: agency.rates.reduce((sum, rate) => sum + rate, 0) / agency.rates.length,
      min: Math.min(...agency.rates),
      max: Math.max(...agency.rates),
      count: agency.rates.length,
      categories: Array.from(agency.categories).length,
      years: Array.from(agency.years)
    }))
    .sort((a, b) => a.average - b.average);

  // 직무(직렬)별 경쟁률 분석
  $: categoryCompetition = competitionData.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { rates: [], name: item.category };
    }
    acc[item.category].rates.push(item.rate);
    return acc;
  }, {});

  $: categoryStats = Object.values(categoryCompetition)
    .map(category => ({
      name: category.name,
      average: category.rates.reduce((sum, rate) => sum + rate, 0) / category.rates.length,
      min: Math.min(...category.rates),
      max: Math.max(...category.rates),
      count: category.rates.length
    }))
    .sort((a, b) => a.average - b.average);

  // TOP 5 높은/낮은 경쟁률 공고
  $: highCompetitionJobs = [...competitionData]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  $: lowCompetitionJobs = [...competitionData]
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5);

  // Chart.js 로드 및 초기화
  onMount(async () => {
    const { default: ChartJS } = await import('chart.js/auto');
    Chart = ChartJS;
    
    if (competitionData.length > 0) {
      createCharts();
    }
  });

  function createCharts() {
    if (!Chart) return;
    
    // 현재 활성 탭에 따라 해당 차트만 생성
    if (activeTab === 'overview') {
      createOverviewChart();
    } else if (activeTab === 'agency') {
      createAgencyChart();
    } else if (activeTab === 'category') {
      createCategoryChart();
    }
  }

  function createOverviewChart() {
    if (!chartContainer) return;

    // 기존 차트 제거
    if (chartContainer._chart) {
      chartContainer._chart.destroy();
    }

    const ctx = chartContainer.getContext('2d');
    
    // 더 세밀한 경쟁률 히스토그램 구간 설정
    const bins = [
      { range: '1-5:1', min: 1, max: 5, color: '#059669', label: '매우 낮음 (기회!)' },
      { range: '5-10:1', min: 5, max: 10, color: '#10b981', label: '낮음' },
      { range: '10-15:1', min: 10, max: 15, color: '#34d399', label: '적정' },
      { range: '15-25:1', min: 15, max: 25, color: '#fbbf24', label: '보통' },
      { range: '25-40:1', min: 25, max: 40, color: '#f59e0b', label: '높음' },
      { range: '40-60:1', min: 40, max: 60, color: '#ea580c', label: '매우 높음' },
      { range: '60-100:1', min: 60, max: 100, color: '#dc2626', label: '치열함' },
      { range: '100:1+', min: 100, max: Infinity, color: '#991b1b', label: '극도로 치열' }
    ];

    const binCounts = bins.map(bin => {
      const count = competitionData.filter(d => d.rate >= bin.min && d.rate < bin.max).length;
      return { count, bin };
    });
    
    chartContainer._chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bins.map(bin => bin.range),
        datasets: [{
          label: '채용공고 수',
          data: binCounts.map(item => item.count),
          backgroundColor: bins.map(bin => bin.color),
          borderColor: bins.map(bin => bin.color),
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: bins.map(bin => bin.color + 'CC'),
          hoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: (context) => {
                const binIndex = context[0].dataIndex;
                return `경쟁률 구간: ${bins[binIndex].range}`;
              },
              label: (context) => {
                const binIndex = context.dataIndex;
                const count = context.parsed.y;
                const percentage = competitionData.length > 0 
                  ? ((count / competitionData.length) * 100).toFixed(1)
                  : 0;
                return [
                  `📊 공고 수: ${count}개`,
                  `📈 비율: ${percentage}%`,
                  `💡 ${bins[binIndex].label}`
                ];
              },
              afterLabel: (context) => {
                const binIndex = context.dataIndex;
                if (binIndex <= 2) {
                  return '✨ 지원 기회가 좋은 구간입니다!';
                } else if (binIndex >= 6) {
                  return '⚠️ 경쟁이 매우 치열한 구간입니다';
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '경쟁률 구간',
              font: { size: 12, weight: 'bold' },
              color: '#374151'
            },
            grid: { 
              display: false 
            },
            ticks: { 
              font: { size: 10, weight: '500' },
              color: '#6b7280',
              maxRotation: 45,
              minRotation: 0
            },
            border: {
              color: '#e5e7eb',
              width: 1
            }
          },
          y: {
            title: {
              display: true,
              text: '채용공고 수',
              font: { size: 12, weight: 'bold' },
              color: '#374151'
            },
            beginAtZero: true,
            grid: { 
              color: 'rgba(0,0,0,0.08)',
              lineWidth: 1
            },
            ticks: { 
              font: { size: 10, weight: '500' },
              color: '#6b7280',
              stepSize: 1,
              callback: (value) => `${value}개`
            },
            border: {
              color: '#e5e7eb',
              width: 1
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutCubic'
        }
      }
    });
  }

  function createAgencyChart() {
    if (!agencyChartContainer) {
      console.log('agencyChartContainer not found');
      return;
    }
    
    if (agencyStats.length === 0) {
      console.log('No agency stats available');
      return;
    }

    // 기존 차트 제거
    if (agencyChartContainer._chart) {
      agencyChartContainer._chart.destroy();
    }

    const ctx = agencyChartContainer.getContext('2d');
    
    console.log('Creating agency chart with', agencyStats.length, 'agencies');
    
    // 기관별 최저, 평균, 최고 경쟁률을 보여주는 범위 차트
    agencyChartContainer._chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: agencyStats.map(a => a.name.replace('부산', '').replace('공사', '').replace('공단', '')),
        datasets: [
          {
            label: '최저 경쟁률',
            data: agencyStats.map(a => a.min),
            backgroundColor: 'rgba(16, 185, 129, 0.3)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: '평균 경쟁률',
            data: agencyStats.map(a => a.average),
            backgroundColor: agencyStats.map(a => 
              a.average < 15 ? 'rgba(16, 185, 129, 0.8)' : 
              a.average < 40 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(239, 68, 68, 0.8)'
            ),
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: '최고 경쟁률',
            data: agencyStats.map(a => a.max),
            backgroundColor: 'rgba(239, 68, 68, 0.3)',
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { size: 10 } }
          },
          tooltip: {
            callbacks: {
              title: (context) => agencyStats[context[0].dataIndex]?.name || '',
              label: (context) => {
                const labels = ['최저', '평균', '최고'];
                return `${labels[context.datasetIndex]}: ${context.parsed.y.toFixed(1)}:1`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { 
              font: { size: 9 },
              maxRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.1)' },
            ticks: { 
              font: { size: 10 },
              callback: (value) => `${value}:1`
            }
          }
        }
      }
    });
  }

  function createCategoryChart() {
    if (!categoryChartContainer) {
      console.log('categoryChartContainer not found');
      return;
    }
    
    if (categoryStats.length === 0) {
      console.log('No category stats available');
      return;
    }

    // 기존 차트 제거
    if (categoryChartContainer._chart) {
      categoryChartContainer._chart.destroy();
    }

    const ctx = categoryChartContainer.getContext('2d');
    
    // 직무별 공고수와 평균 경쟁률을 함께 보여주는 복합 차트
    const topCategories = categoryStats
      .filter(c => c.count >= 2) // 최소 2개 이상의 공고가 있는 직무만
      .slice(0, 10);
      
    console.log('Creating category chart with', topCategories.length, 'categories');
    
    categoryChartContainer._chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: '직무별 경쟁률 분석',
          data: topCategories.map(c => ({
            x: c.count,      // x축: 공고 수
            y: c.average,    // y축: 평균 경쟁률
            label: c.name
          })),
          backgroundColor: topCategories.map(c => 
            c.average < 15 ? 'rgba(16, 185, 129, 0.7)' : 
            c.average < 40 ? 'rgba(245, 158, 11, 0.7)' : 'rgba(239, 68, 68, 0.7)'
          ),
          borderColor: topCategories.map(c => 
            c.average < 15 ? '#10b981' : 
            c.average < 40 ? '#f59e0b' : '#ef4444'
          ),
          borderWidth: 2,
          pointRadius: topCategories.map(c => Math.min(8 + c.count, 15)), // 공고수에 따라 점 크기 조절
          pointHoverRadius: topCategories.map(c => Math.min(10 + c.count, 18))
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (context) => context[0].raw.label,
              label: (context) => [
                `공고 수: ${context.parsed.x}개`,
                `평균 경쟁률: ${context.parsed.y.toFixed(1)}:1`,
                `범위: ${topCategories[context.dataIndex].min.toFixed(1)} ~ ${topCategories[context.dataIndex].max.toFixed(1)}:1`
              ]
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '공고 수',
              font: { size: 11 }
            },
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.1)' },
            ticks: { 
              font: { size: 10 },
              stepSize: 1
            }
          },
          y: {
            title: {
              display: true,
              text: '평균 경쟁률',
              font: { size: 11 }
            },
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.1)' },
            ticks: { 
              font: { size: 10 },
              callback: (value) => `${value}:1`
            }
          }
        }
      }
    });
  }

  // 데이터 변경 시 또는 탭 변경 시 차트 업데이트
  $: if (Chart && competitionData.length > 0) {
    createCharts();
  }

  // 탭 변경 시 차트 업데이트
  $: if (Chart && activeTab) {
    setTimeout(() => createCharts(), 10); // DOM 업데이트 후 차트 생성
  }

  // 경쟁률 레벨 아이콘 반환
  function getCompetitionIcon(rate) {
    if (rate < 10) return { icon: TrendingDown, color: 'text-green-600', bg: 'bg-green-100' };
    if (rate < 30) return { icon: Minus, color: 'text-amber-600', bg: 'bg-amber-100' };
    return { icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-100' };
  }

  // 탭 상태 관리
  let activeTab = 'overview';
  
  // 탭 전환 함수
  function switchTab(tab) {
    activeTab = tab;
    // 탭 전환 후 차트 재생성
    setTimeout(() => {
      if (Chart && competitionData.length > 0) {
        createCharts();
      }
    }, 100);
  }
</script>

<div class="space-y-6">
  <!-- 탭 네비게이션 -->
  <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
    <button
      class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 {activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
      on:click={() => switchTab('overview')}
    >
      전체 개요
    </button>
    <button
      class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 {activeTab === 'agency' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
      on:click={() => switchTab('agency')}
    >
      기관별 분석
    </button>
    <button
      class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 {activeTab === 'category' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
      on:click={() => switchTab('category')}
    >
      직무별 분석
    </button>
  </div>

  {#if competitionData.length > 0}
    <!-- 전체 개요 탭 -->
    {#if activeTab === 'overview'}
      <div class="space-y-6">
        <!-- 히스토그램 차트 -->
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-semibold text-gray-900">📊 경쟁률 분포 히스토그램</h4>
            <div class="text-xs text-gray-500">
              총 {competitionData.length}개 채용공고
            </div>
          </div>
          
          <div class="relative h-64">
            <canvas bind:this={chartContainer}></canvas>
          </div>
          
          <!-- 히스토그램 범례 -->
          <div class="mt-4 pt-3 border-t border-gray-100">
            <div class="flex flex-wrap gap-2 text-xs">
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 bg-green-600 rounded"></div>
                <span>기회 구간</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>적정 구간</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 bg-orange-500 rounded"></div>
                <span>높은 구간</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 bg-red-600 rounded"></div>
                <span>치열한 구간</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 히스토그램 분석 인사이트 -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <div class="flex items-center space-x-2 mb-4">
            <div class="p-2 bg-blue-100 rounded-lg">
              <div class="w-4 h-4 bg-blue-600 rounded"></div>
            </div>
            <h4 class="text-sm font-semibold text-blue-900">📊 히스토그램 분포 분석</h4>
          </div>
          
          <!-- 핵심 통계 지표 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div class="text-center p-3 bg-white rounded-lg shadow-sm">
              <div class="text-lg font-bold text-green-600">
                {competitionData.filter(d => d.rate <= 10).length}
              </div>
              <div class="text-xs text-gray-600">기회 구간</div>
              <div class="text-xs text-green-500">≤ 10:1</div>
            </div>
            
            <div class="text-center p-3 bg-white rounded-lg shadow-sm">
              <div class="text-lg font-bold text-amber-600">
                {competitionData.filter(d => d.rate > 10 && d.rate <= 25).length}
              </div>
              <div class="text-xs text-gray-600">적정 구간</div>
              <div class="text-xs text-amber-500">10-25:1</div>
            </div>
            
            <div class="text-center p-3 bg-white rounded-lg shadow-sm">
              <div class="text-lg font-bold text-orange-600">
                {competitionData.filter(d => d.rate > 25 && d.rate <= 60).length}
              </div>
              <div class="text-xs text-gray-600">높은 구간</div>
              <div class="text-xs text-orange-500">25-60:1</div>
            </div>
            
            <div class="text-center p-3 bg-white rounded-lg shadow-sm">
              <div class="text-lg font-bold text-red-600">
                {competitionData.filter(d => d.rate > 60).length}
              </div>
              <div class="text-xs text-gray-600">치열 구간</div>
              <div class="text-xs text-red-500">> 60:1</div>
            </div>
          </div>
          
          <!-- 통계 요약 -->
          <div class="bg-white rounded-lg p-4 mb-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div class="text-center">
                <div class="text-xs text-gray-500 mb-1">평균</div>
                <div class="font-bold text-gray-900">{competitionAnalysis.average.toFixed(1)}:1</div>
              </div>
              <div class="text-center">
                <div class="text-xs text-gray-500 mb-1">중앙값</div>
                <div class="font-bold text-gray-900">
                  {competitionData.length > 0 ? 
                    [...competitionData].sort((a, b) => a.rate - b.rate)[Math.floor(competitionData.length / 2)].rate.toFixed(1) : 0}:1
                </div>
              </div>
              <div class="text-center">
                <div class="text-xs text-gray-500 mb-1">최저</div>
                <div class="font-bold text-green-600">
                  {competitionData.length > 0 ? Math.min(...competitionData.map(d => d.rate)).toFixed(1) : 0}:1
                </div>
              </div>
              <div class="text-center">
                <div class="text-xs text-gray-500 mb-1">최고</div>
                <div class="font-bold text-red-600">
                  {competitionData.length > 0 ? Math.max(...competitionData.map(d => d.rate)).toFixed(1) : 0}:1
                </div>
              </div>
            </div>
          </div>
          
          <!-- 분포 특성 분석 -->
          <div class="bg-white rounded-lg p-4">
            <h5 class="text-xs font-semibold text-gray-700 mb-2">💡 분포 특성</h5>
            <div class="space-y-2 text-xs text-gray-600">
              {#if competitionData.filter(d => d.rate <= 10).length > 0}
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span><strong>{competitionData.filter(d => d.rate <= 10).length}개 공고</strong>가 기회 구간(10:1 이하)에 있어 지원 기회가 좋습니다</span>
                </div>
              {/if}
              
              {#if competitionData.filter(d => d.rate > 60).length > 0}
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span><strong>{competitionData.filter(d => d.rate > 60).length}개 공고</strong>가 치열한 구간(60:1 이상)으로 경쟁이 매우 치열합니다</span>
                </div>
              {/if}
              
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>전체 평균 <strong>{competitionAnalysis.average.toFixed(1)}:1</strong> 
                  {#if competitionAnalysis.average < 20}
                    - 전반적으로 적정한 수준입니다
                  {:else if competitionAnalysis.average < 40}
                    - 보통 수준의 경쟁률입니다
                  {:else}
                    - 전반적으로 높은 경쟁률입니다
                  {/if}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 기관별/직무별 경쟁률 분석 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 기회의 기관 TOP 5 -->
          <div class="bg-green-50 border border-green-200 rounded-xl p-4">
            <div class="flex items-center space-x-2 mb-4">
              <div class="p-2 bg-green-100 rounded-lg">
                <Trophy size={16} class="text-green-600" />
              </div>
              <h4 class="text-sm font-semibold text-green-800">🏢 기회의 기관 (낮은 평균 경쟁률)</h4>
            </div>
            
            <div class="space-y-2">
              {#each agencyStats.slice(0, 5) as agency, index}
                <div class="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-medium text-gray-900 truncate">
                        {agency.name}
                      </div>
                      <div class="text-xs text-gray-600">
                        {agency.count}개 공고 • {agency.categories}개 직렬
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-green-600">
                      {agency.average.toFixed(1)}:1
                    </div>
                    <div class="text-xs text-gray-500">
                      평균
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- 기회의 직무 TOP 5 -->
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div class="flex items-center space-x-2 mb-4">
              <div class="p-2 bg-blue-100 rounded-lg">
                <Target size={16} class="text-blue-600" />
              </div>
              <h4 class="text-sm font-semibold text-blue-800">💼 기회의 직무 (낮은 평균 경쟁률)</h4>
            </div>
            
            <div class="space-y-2">
              {#each categoryStats.slice(0, 5) as category, index}
                <div class="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-medium text-gray-900 truncate">
                        {category.name}
                      </div>
                      <div class="text-xs text-gray-600">
                        {category.count}개 공고
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-blue-600">
                      {category.average.toFixed(1)}:1
                    </div>
                    <div class="text-xs text-gray-500">
                      평균
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- 치열한 경쟁 분야 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 치열한 기관 TOP 3 -->
          <div class="bg-red-50 border border-red-200 rounded-xl p-4">
            <div class="flex items-center space-x-2 mb-4">
              <div class="p-2 bg-red-100 rounded-lg">
                <AlertTriangle size={16} class="text-red-600" />
              </div>
              <h4 class="text-sm font-semibold text-red-800">⚠️ 치열한 기관 (높은 평균 경쟁률)</h4>
            </div>
            
            <div class="space-y-2">
              {#each [...agencyStats].sort((a, b) => b.average - a.average).slice(0, 3) as agency, index}
                <div class="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-medium text-gray-900 truncate">
                        {agency.name}
                      </div>
                      <div class="text-xs text-gray-600">
                        {agency.count}개 공고 • 최고 {agency.max.toFixed(1)}:1
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-red-600">
                      {agency.average.toFixed(1)}:1
                    </div>
                    <div class="text-xs text-gray-500">
                      평균
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- 치열한 직무 TOP 3 -->
          <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div class="flex items-center space-x-2 mb-4">
              <div class="p-2 bg-orange-100 rounded-lg">
                <TrendingUp size={16} class="text-orange-600" />
              </div>
              <h4 class="text-sm font-semibold text-orange-800">🔥 치열한 직무 (높은 평균 경쟁률)</h4>
            </div>
            
            <div class="space-y-2">
              {#each [...categoryStats].sort((a, b) => b.average - a.average).slice(0, 3) as category, index}
                <div class="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-medium text-gray-900 truncate">
                        {category.name}
                      </div>
                      <div class="text-xs text-gray-600">
                        {category.count}개 공고 • 최고 {category.max.toFixed(1)}:1
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-orange-600">
                      {category.average.toFixed(1)}:1
                    </div>
                    <div class="text-xs text-gray-500">
                      평균
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- 기관별 분석 탭 -->
    {#if activeTab === 'agency'}
      <div class="space-y-6">
        <!-- 기관별 차트 -->
        {#if agencyStats.length > 0}
          <div class="bg-white border border-gray-200 rounded-xl p-4">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-semibold text-gray-900">📊 기관별 경쟁률 비교</h4>
              <div class="text-xs text-gray-500">
                {agencyStats.length}개 기관
              </div>
            </div>
            <div class="relative h-64">
              <canvas bind:this={agencyChartContainer}></canvas>
            </div>
          </div>
        {:else}
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <div class="text-gray-500">
              <Target size={32} class="mx-auto mb-2 text-gray-400" />
              <div class="text-sm">기관별 데이터가 없습니다</div>
            </div>
          </div>
        {/if}

        <!-- 기관별 상세 통계 -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold text-gray-700">기관별 상세 분석</h4>
          
          {#each agencyStats as agency}
            {@const iconInfo = getCompetitionIcon(agency.average)}
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <div class="p-2 {iconInfo.bg} rounded-lg">
                    <svelte:component this={iconInfo.icon} size={16} class={iconInfo.color} />
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {agency.name}
                    </div>
                    <div class="text-xs text-gray-500">
                      {agency.count}개 공고 • {agency.categories}개 직렬
                    </div>
                  </div>
                </div>
                
                <div class="text-right">
                  <div class="text-lg font-bold {iconInfo.color}">
                    {agency.average.toFixed(1)}:1
                  </div>
                  <div class="text-xs text-gray-500">평균</div>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-600">최저 경쟁률:</span>
                  <span class="font-medium text-green-600">{agency.min.toFixed(1)}:1</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">최고 경쟁률:</span>
                  <span class="font-medium text-red-600">{agency.max.toFixed(1)}:1</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 직무별 분석 탭 -->
    {#if activeTab === 'category'}
      <div class="space-y-6">
        <!-- 직무별 차트 -->
        {#if categoryStats.length > 0}
          <div class="bg-white border border-gray-200 rounded-xl p-4">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-semibold text-gray-900">📊 직무별 경쟁률 분석</h4>
              <div class="text-xs text-gray-500">
                {categoryStats.filter(c => c.count >= 2).length}개 직무
              </div>
            </div>
            <div class="relative h-64">
              <canvas bind:this={categoryChartContainer}></canvas>
            </div>
            <div class="mt-3 text-xs text-gray-500">
              💡 X축: 공고수, Y축: 평균경쟁률, 점 크기: 공고수에 비례
            </div>
          </div>
        {:else}
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <div class="text-gray-500">
              <Target size={32} class="mx-auto mb-2 text-gray-400" />
              <div class="text-sm">직무별 데이터가 없습니다</div>
            </div>
          </div>
        {/if}

        <!-- 직무별 경쟁률 순위 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 낮은 경쟁률 직무 TOP 5 -->
          <div class="bg-green-50 border border-green-200 rounded-xl p-4">
            <div class="flex items-center space-x-2 mb-4">
              <div class="p-2 bg-green-100 rounded-lg">
                <Trophy size={16} class="text-green-600" />
              </div>
              <h4 class="text-sm font-semibold text-green-800">🎯 기회의 직무 (낮은 경쟁률)</h4>
            </div>
            
            <div class="space-y-2">
              {#each categoryStats.slice(0, 5) as category, index}
                {@const iconInfo = getCompetitionIcon(category.average)}
                <div class="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-medium text-gray-900 truncate">
                        {category.name}
                      </div>
                      <div class="text-xs text-gray-500">
                        {category.count}개 공고
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-green-600">
                      {category.average.toFixed(1)}:1
                    </div>
                    <div class="text-xs text-gray-500">
                      {category.min.toFixed(1)}~{category.max.toFixed(1)}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- 높은 경쟁률 직무 TOP 5 -->
          <div class="bg-red-50 border border-red-200 rounded-xl p-4">
            <div class="flex items-center space-x-2 mb-4">
              <div class="p-2 bg-red-100 rounded-lg">
                <AlertTriangle size={16} class="text-red-600" />
              </div>
              <h4 class="text-sm font-semibold text-red-800">⚠️ 치열한 직무 (높은 경쟁률)</h4>
            </div>
            
            <div class="space-y-2">
              {#each [...categoryStats].sort((a, b) => b.average - a.average).slice(0, 5) as category, index}
                {@const iconInfo = getCompetitionIcon(category.average)}
                <div class="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-medium text-gray-900 truncate">
                        {category.name}
                      </div>
                      <div class="text-xs text-gray-500">
                        {category.count}개 공고
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-red-600">
                      {category.average.toFixed(1)}:1
                    </div>
                    <div class="text-xs text-gray-500">
                      {category.min.toFixed(1)}~{category.max.toFixed(1)}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- 전체 직무별 상세 분석 -->
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-semibold text-gray-700">📋 전체 직무별 경쟁률 상세</h4>
            <div class="text-xs text-gray-500">
              총 {categoryStats.length}개 직무
            </div>
          </div>
          
          <div class="space-y-2 max-h-64 overflow-y-auto">
            {#each categoryStats as category, index}
              {@const iconInfo = getCompetitionIcon(category.average)}
              <div class="flex items-center justify-between p-2 bg-white rounded-lg">
                <div class="flex items-center space-x-3">
                  <div class="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div class="p-1.5 {iconInfo.bg} rounded-lg">
                    <svelte:component this={iconInfo.icon} size={12} class={iconInfo.color} />
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                    <div class="text-xs text-gray-500">
                      {category.count}개 공고 • 범위: {category.min.toFixed(1)}~{category.max.toFixed(1)}:1
                    </div>
                  </div>
                </div>
                
                <div class="text-right">
                  <div class="text-sm font-bold {iconInfo.color}">
                    {category.average.toFixed(1)}:1
                  </div>
                  <div class="text-xs text-gray-500">평균</div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- 직무별 인사이트 -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div class="flex items-center space-x-2 mb-4">
            <div class="p-2 bg-blue-100 rounded-lg">
              <div class="w-4 h-4 bg-blue-600 rounded"></div>
            </div>
            <h4 class="text-sm font-semibold text-blue-900">💡 직무별 경쟁률 인사이트</h4>
          </div>
          
          <div class="space-y-3 text-xs text-blue-800">
            {#if categoryStats.length > 0}
              <!-- 가장 경쟁이 치열한 직무 -->
              {@const mostCompetitive = [...categoryStats].sort((a, b) => b.average - a.average)[0]}
              <div class="bg-white rounded-lg p-3">
                <div class="flex items-center space-x-2 mb-2">
                  <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span class="font-semibold">가장 치열한 직무</span>
                </div>
                <p><strong>{mostCompetitive.name}</strong>이 평균 {mostCompetitive.average.toFixed(1)}:1로 가장 높은 경쟁률을 보입니다.</p>
                <p class="text-blue-600 mt-1">💼 이 분야는 충분한 준비와 차별화된 역량이 필요합니다.</p>
              </div>

              <!-- 가장 기회가 좋은 직무 -->
              {@const leastCompetitive = categoryStats[0]}
              <div class="bg-white rounded-lg p-3">
                <div class="flex items-center space-x-2 mb-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span class="font-semibold">기회가 좋은 직무</span>
                </div>
                <p><strong>{leastCompetitive.name}</strong>이 평균 {leastCompetitive.average.toFixed(1)}:1로 상대적으로 낮은 경쟁률을 보입니다.</p>
                <p class="text-blue-600 mt-1">✨ 이 분야는 지원 기회가 좋으니 적극 고려해보세요.</p>
              </div>

              <!-- 경쟁률 분포 분석 -->
              <div class="bg-white rounded-lg p-3">
                <div class="flex items-center space-x-2 mb-2">
                  <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span class="font-semibold">분포 특성</span>
                </div>
                {#if categoryStats.length > 0}
                  {@const lowCompetitionJobs = categoryStats.filter(c => c.average < 15).length}
                  {@const highCompetitionJobs = categoryStats.filter(c => c.average > 40).length}
                  <p>전체 {categoryStats.length}개 직무 중 <strong>{lowCompetitionJobs}개 직무</strong>가 15:1 이하의 낮은 경쟁률을 보이고,
                     <strong>{highCompetitionJobs}개 직무</strong>가 40:1 이상의 높은 경쟁률을 보입니다.</p>
                  {#if lowCompetitionJobs > highCompetitionJobs}
                    <p class="text-blue-600 mt-1">📈 전반적으로 기회가 많은 시장 상황입니다.</p>
                  {:else}
                    <p class="text-blue-600 mt-1">⚡ 전반적으로 경쟁이 치열한 시장 상황입니다.</p>
                  {/if}
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

  {:else}
    <div class="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
      <div class="text-center text-gray-500">
        <Target size={32} class="mx-auto mb-2 text-gray-400" />
        <div class="text-sm">경쟁률 데이터가 없습니다</div>
      </div>
    </div>
  {/if}
</div>