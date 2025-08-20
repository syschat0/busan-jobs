<script>
  import { Calendar, BarChart3, Users, TrendingUp } from 'lucide-svelte';
  
  export let data = { jobs: [], competition: [], hiring: [] };
  export let selectedYear = null;

  // 선택된 년도의 월별 트렌드 분석
  $: monthlyData = selectedYear ? analyzeMonthlyTrends(selectedYear) : [];

  function analyzeMonthlyTrends(year) {
    const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i).toLocaleString('ko-KR', { month: 'short' }),
      fullMonthName: new Date(year, i).toLocaleString('ko-KR', { month: 'long' }),
      jobCount: 0,
      categories: new Set(),
      agencies: new Set(),
      totalApplicants: 0,
      competitions: []
    }));

    // 해당 년도의 채용공고 월별 분석
    data.jobs
      .filter(job => {
        const jobYear = job.접수시작일 ? new Date(job.접수시작일).getFullYear() : null;
        return jobYear === year;
      })
      .forEach(job => {
        const jobDate = new Date(job.접수시작일);
        const month = jobDate.getMonth();
        
        if (month >= 0 && month < 12) {
          monthlyStats[month].jobCount++;
          monthlyStats[month].agencies.add(job.기관명);
          
          if (job.일반전형) {
            job.일반전형.split(',').forEach(category => {
              monthlyStats[month].categories.add(category.trim());
            });
          }
        }
      });

    // 경쟁률 데이터 추가 (해당 년도)
    data.competition
      .filter(comp => parseInt(comp.년도) === year)
      .forEach(comp => {
        const competition = parseFloat(comp.경쟁률 || '0');
        const applicants = parseInt(comp.지원자수 || '0');
        
        // 월별 분산 (실제 데이터에 월 정보가 없으므로 균등 분산)
        if (competition > 0) {
          monthlyStats.forEach(month => {
            month.competitions.push(competition);
            month.totalApplicants += Math.floor(applicants / 12);
          });
        }
      });

    // Set을 Array로 변환하고 평균 경쟁률 계산
    return monthlyStats.map(month => ({
      ...month,
      categories: Array.from(month.categories),
      agencies: Array.from(month.agencies),
      avgCompetition: month.competitions.length > 0 
        ? month.competitions.reduce((sum, comp) => sum + comp, 0) / month.competitions.length 
        : 0
    }));
  }

  // 최고 수치 계산 (차트 스케일링용)
  $: maxJobCount = Math.max(...monthlyData.map(m => m.jobCount), 1);
  $: maxApplicants = Math.max(...monthlyData.map(m => m.totalApplicants), 1);

  // 피크 월 계산
  $: peakMonth = monthlyData.reduce((peak, month) => 
    month.jobCount > peak.jobCount ? month : peak, monthlyData[0] || {}
  );

  // 총 통계
  $: totalStats = {
    totalJobs: monthlyData.reduce((sum, m) => sum + m.jobCount, 0),
    totalApplicants: monthlyData.reduce((sum, m) => sum + m.totalApplicants, 0),
    avgJobsPerMonth: monthlyData.reduce((sum, m) => sum + m.jobCount, 0) / 12,
    totalCategories: new Set(monthlyData.flatMap(m => m.categories)).size,
    totalAgencies: new Set(monthlyData.flatMap(m => m.agencies)).size,
    avgCompetition: monthlyData.reduce((sum, m) => sum + m.avgCompetition, 0) / monthlyData.filter(m => m.avgCompetition > 0).length || 0
  };
</script>

<div class="space-y-3">

  <!-- 월별 차트 -->
  <div class="space-y-1">
    {#each monthlyData as month}
      <div class="flex items-center space-x-2 py-0.5 px-1 rounded hover:bg-gray-50 transition-colors">
        <!-- 월 표시 -->
        <div class="w-8 text-xs font-medium text-gray-700 text-center shrink-0">
          {month.monthName}
        </div>
        
        <!-- 시각적 바 (채용공고) -->
        <div class="flex-1 flex items-center space-x-2">
          <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style="width: {month.jobCount > 0 ? (month.jobCount / maxJobCount) * 100 : 0}%"
            ></div>
          </div>
          
          <div class="w-12 text-right shrink-0">
            <div class="text-xs font-medium text-gray-900">{month.jobCount}건</div>
          </div>
        </div>
        
        <!-- 추가 정보 (간소화) -->
        <div class="flex items-center space-x-2 text-xs text-gray-500 shrink-0">
          {#if month.agencies.length > 0}
            <span>{month.agencies.length}기관</span>
          {/if}
          {#if month.categories.length > 0}
            <span>{month.categories.length}직렬</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- 월별 상세 정보 -->
  {#if monthlyData.some(m => m.jobCount > 0)}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- 주요 월 -->
      <div class="bg-blue-50 rounded-lg p-3">
        <h5 class="font-medium text-blue-900 mb-2 flex items-center space-x-2">
          <TrendingUp size={14} />
          <span>최다 공고 월</span>
        </h5>
        <div class="space-y-1 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-blue-800">📅 {peakMonth.fullMonthName}</span>
            <span class="font-bold text-blue-900">{peakMonth.jobCount}건</span>
          </div>
          {#if peakMonth.categories && peakMonth.categories.length > 0}
            <div class="text-blue-700 text-xs">
              <span class="font-medium">주요 직렬:</span>
              {peakMonth.categories.slice(0, 2).join(', ')}
              {#if peakMonth.categories.length > 2}
                <span class="text-blue-600"> 외 {peakMonth.categories.length - 2}개</span>
              {/if}
            </div>
          {/if}
          {#if peakMonth.agencies && peakMonth.agencies.length > 0}
            <div class="text-blue-700 text-xs">
              <span class="font-medium">참여 기관:</span>
              {peakMonth.agencies.slice(0, 2).join(', ')}
              {#if peakMonth.agencies.length > 2}
                <span class="text-blue-600"> 외 {peakMonth.agencies.length - 2}개</span>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- 전체 통계 및 분기별 분석 -->
      <div class="bg-green-50 rounded-lg p-3">
        <h5 class="font-medium text-green-900 mb-2 flex items-center space-x-2">
          <BarChart3 size={14} />
          <span>{selectedYear}년 요약</span>
        </h5>
        <div class="space-y-1 text-sm text-green-800">
          <div class="flex justify-between">
            <span>총 채용공고:</span>
            <span class="font-bold">{totalStats.totalJobs}건</span>
          </div>
          <div class="flex justify-between">
            <span>월평균:</span>
            <span class="font-bold">{totalStats.avgJobsPerMonth.toFixed(1)}건</span>
          </div>
          <div class="flex justify-between">
            <span>참여 기관:</span>
            <span class="font-bold">{totalStats.totalAgencies}개</span>
          </div>
          <div class="flex justify-between">
            <span>총 직렬:</span>
            <span class="font-bold">{totalStats.totalCategories}개</span>
          </div>
          {#if totalStats.avgCompetition > 0}
            <div class="flex justify-between">
              <span>평균 경쟁률:</span>
              <span class="font-bold">{totalStats.avgCompetition.toFixed(1)}:1</span>
            </div>
          {/if}
          
          <!-- 분기별 분석 추가 -->
          {#if monthlyData.some(m => m.jobCount > 0)}
            {@const quarterData = [
              { quarter: '1분기', months: monthlyData.slice(0, 3) },
              { quarter: '2분기', months: monthlyData.slice(3, 6) },
              { quarter: '3분기', months: monthlyData.slice(6, 9) },
              { quarter: '4분기', months: monthlyData.slice(9, 12) }
            ]}
            {@const mostActiveQuarter = quarterData.reduce((max, q) => {
              const qJobs = q.months.reduce((sum, m) => sum + m.jobCount, 0);
              const maxJobs = max.months.reduce((sum, m) => sum + m.jobCount, 0);
              return qJobs > maxJobs ? q : max;
            })}
            {@const activeQuarters = quarterData.filter(q => q.months.some(m => m.jobCount > 0))}
            
            <div class="mt-2 pt-2 border-t border-green-200">
              <div class="flex justify-between text-xs">
                <span>활동 분기:</span>
                <span class="font-bold">{activeQuarters.length}/4분기</span>
              </div>
              <div class="flex justify-between text-xs">
                <span>주요 시기:</span>
                <span class="font-bold">{mostActiveQuarter.quarter}</span>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- 빈 상태 -->
    <div class="text-center py-4 bg-gray-50 rounded-lg">
      <Calendar size={32} class="mx-auto text-gray-400 mb-2" />
      <div class="text-sm text-gray-600 mb-1">
        {selectedYear}년 채용공고 데이터가 없습니다
      </div>
      <div class="text-xs text-gray-500">
        다른 년도를 선택해보세요
      </div>
    </div>
  {/if}

</div>