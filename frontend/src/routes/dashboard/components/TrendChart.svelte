<script>
  import { onMount } from 'svelte';
  import { TrendingUp, Calendar } from 'lucide-svelte';
  
  export let data = { jobs: [], competition: [], hiring: [] };
  export let onYearSelect = null; // 년도 선택 콜백 함수
  export let getLatestYear = null; // 최신 년도 가져오기 콜백

  let chartContainer;
  let Chart;

  // 연도별 데이터 분석 - 필터링된 데이터 반영
  $: yearlyData = analyzeYearlyTrends(data);

  // 최신 년도를 부모 컴포넌트에 알림
  $: {
    if (getLatestYear && Object.keys(yearlyData).length > 0) {
      const latestYear = Math.max(...Object.keys(yearlyData).map(Number));
      getLatestYear(latestYear);
    }
  }

  function analyzeYearlyTrends(filteredData) {
    const trends = {};
    
    // 채용공고 트렌드 - 필터링된 데이터 사용
    filteredData.jobs.forEach(job => {
      const year = extractYear(job.접수시작일 || job.공고시작일);
      if (!trends[year]) {
        trends[year] = { jobs: 0, hiring: 0, competition: [] };
      }
      trends[year].jobs++;
    });

    // 신규채용 트렌드 - 필터링된 데이터 사용
    filteredData.hiring.forEach(hire => {
      const year = extractYear(hire.연도) || new Date().getFullYear();
      if (!trends[year]) {
        trends[year] = { jobs: 0, hiring: 0, competition: [] };
      }
      
      const regular = parseInt(hire.정규직_일반 || hire.정규직일반 || 0);
      const disabled = parseInt(hire.정규직_장애 || hire.정규직장애인 || 0);
      const contract = parseInt(hire.공무직 || hire.무기계약직 || 0);
      const internGeneral = parseInt(hire.인턴_일반 || hire.인턴일반 || 0);
      const internDisabled = parseInt(hire.인턴_장애인 || hire.인턴장애인 || 0);
      
      trends[year].hiring += regular + disabled + contract + internGeneral + internDisabled;
    });

    // 경쟁률 트렌드 - 필터링된 데이터 사용
    filteredData.competition.forEach(comp => {
      const year = comp.연도 || new Date().getFullYear();
      const rate = parseFloat(comp.경쟁률 || '0');
      if (!trends[year]) {
        trends[year] = { jobs: 0, hiring: 0, competition: [] };
      }
      if (rate > 0) {
        trends[year].competition.push(rate);
      }
    });

    // 평균 경쟁률 계산
    Object.keys(trends).forEach(year => {
      const rates = trends[year].competition;
      trends[year].avgCompetition = rates.length > 0 
        ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length 
        : 0;
    });

    return trends;
  }

  function extractYear(dateString) {
    if (!dateString) return new Date().getFullYear();
    
    // 다양한 날짜 형식 처리
    if (dateString.includes('-')) {
      return parseInt(dateString.split('-')[0]);
    }
    if (dateString.includes('.')) {
      return parseInt(dateString.split('.')[0]);
    }
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      return parseInt(parts[parts.length - 1]);
    }
    
    // 4자리 숫자 찾기
    const match = dateString.match(/20\d{2}/);
    return match ? parseInt(match[0]) : new Date().getFullYear();
  }

  // 차트 데이터 준비 - yearlyData 변경 시 자동 업데이트
  $: chartData = prepareChartData(yearlyData);

  function prepareChartData(trends) {
    const years = Object.keys(trends).sort();
    
    return {
      labels: years,
      datasets: [
        {
          label: '채용공고 수',
          data: years.map(year => trends[year].jobs),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: '신규채용 인원',
          data: years.map(year => trends[year].hiring),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: '평균 경쟁률',
          data: years.map(year => trends[year].avgCompetition),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  }

  // Chart.js 로드 및 초기화
  onMount(async () => {
    const { default: ChartJS } = await import('chart.js/auto');
    Chart = ChartJS;
    
    if (chartContainer && Object.keys(yearlyData).length > 0) {
      createChart();
    }
  });

  function createChart() {
    if (!Chart || !chartContainer) return;

    // 기존 차트 제거
    if (chartContainer._chart) {
      chartContainer._chart.destroy();
    }

    const ctx = chartContainer.getContext('2d');
    
    chartContainer._chart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: '연도'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: '채용공고 수 / 인원'
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: '경쟁률 (:1)'
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          }
        }
      }
    });
  }

  // 데이터 변경 시 차트 업데이트 - chartData 기준으로 변경
  $: if (Chart && chartContainer && chartData && chartData.labels.length > 0) {
    updateChart();
  }
  
  function updateChart() {
    if (!chartContainer._chart) {
      createChart();
    } else {
      // 기존 차트 데이터 업데이트
      chartContainer._chart.data = chartData;
      chartContainer._chart.update('active');
    }
  }

  // 트렌드 분석 결과 - yearlyData 변경 시 자동 업데이트
  $: trendAnalysis = analyzeTrends(yearlyData);

  function analyzeTrends(trends) {
    const years = Object.keys(trends).sort();
    if (years.length < 2) return null;

    const latest = trends[years[years.length - 1]];
    const previous = trends[years[years.length - 2]];

    return {
      jobsChange: latest.jobs - previous.jobs,
      hiringChange: latest.hiring - previous.hiring,
      competitionChange: latest.avgCompetition - previous.avgCompetition,
      latestYear: years[years.length - 1],
      previousYear: years[years.length - 2]
    };
  }
</script>

<div class="space-y-4">
  <!-- 차트 영역 -->
  {#if Object.keys(yearlyData).length > 0}
    <div class="relative h-64">
      <canvas bind:this={chartContainer}></canvas>
    </div>
  {:else}
    <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
      <div class="text-center text-gray-500">
        <Calendar size={32} class="mx-auto mb-2 text-gray-400" />
        <div class="text-sm">트렌드 데이터가 없습니다</div>
      </div>
    </div>
  {/if}

  <!-- 연도별 요약 -->
  {#if Object.keys(yearlyData).length > 0}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {#each Object.entries(yearlyData).sort(([a], [b]) => b - a).slice(0, 4) as [year, stats]}
        <button
          class="bg-gray-50 hover:bg-blue-50 hover:border-blue-200 rounded-lg p-3 text-left transition-all duration-200 border border-gray-200 hover:shadow-sm"
          on:click={() => onYearSelect && onYearSelect(parseInt(year))}
        >
          <div class="text-sm font-semibold text-gray-900 mb-2">
            {year}년
            <span class="text-xs text-gray-500 ml-1">클릭</span>
          </div>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-600">공고</span>
              <span class="font-medium text-blue-600">{stats.jobs}건</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">채용</span>
              <span class="font-medium text-green-600">{stats.hiring}명</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">경쟁률</span>
              <span class="font-medium text-amber-600">
                {stats.avgCompetition > 0 ? `${stats.avgCompetition.toFixed(1)}:1` : '-'}
              </span>
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}

  <!-- 트렌드 분석 -->
  {#if trendAnalysis}
    <div class="bg-blue-50 rounded-lg p-4">
      <div class="flex items-start space-x-3">
        <div class="p-2 bg-blue-100 rounded-lg">
          <TrendingUp size={16} class="text-blue-600" />
        </div>
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-blue-900 mb-2">📈 최근 트렌드 분석</h4>
          <div class="text-xs text-blue-800 space-y-1">
            <p>
              • {trendAnalysis.previousYear}년 대비 {trendAnalysis.latestYear}년 
              채용공고 
              {#if trendAnalysis.jobsChange > 0}
                <span class="text-green-600 font-medium">
                  {trendAnalysis.jobsChange}건 증가 ↗️
                </span>
              {:else if trendAnalysis.jobsChange < 0}
                <span class="text-red-600 font-medium">
                  {Math.abs(trendAnalysis.jobsChange)}건 감소 ↘️
                </span>
              {:else}
                <span class="text-gray-600">변화 없음 →</span>
              {/if}
            </p>
            
            {#if trendAnalysis.hiringChange !== 0}
              <p>
                • 신규채용 인원 
                {#if trendAnalysis.hiringChange > 0}
                  <span class="text-green-600 font-medium">
                    {trendAnalysis.hiringChange}명 증가
                  </span>
                {:else}
                  <span class="text-red-600 font-medium">
                    {Math.abs(trendAnalysis.hiringChange)}명 감소
                  </span>
                {/if}
              </p>
            {/if}
            
            {#if trendAnalysis.competitionChange !== 0}
              <p>
                • 평균 경쟁률 
                {#if trendAnalysis.competitionChange > 0}
                  <span class="text-red-600 font-medium">
                    {trendAnalysis.competitionChange.toFixed(1)} 상승
                  </span>
                {:else}
                  <span class="text-green-600 font-medium">
                    {Math.abs(trendAnalysis.competitionChange).toFixed(1)} 하락
                  </span>
                {/if}
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>