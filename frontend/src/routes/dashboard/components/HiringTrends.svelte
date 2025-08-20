<script>
  import { TrendingUp, Users, Calendar, BarChart3 } from 'lucide-svelte';
  
  export let data = { jobs: [], competition: [], hiring: [] };

  // 선택된 년도 상태
  let selectedYear = null;

  // 년도별 채용 트렌드 분석
  $: yearlyTrends = analyzeYearlyTrends();
  $: monthlyTrends = selectedYear ? analyzeMonthlyTrends(selectedYear) : null;

  function analyzeYearlyTrends() {
    const yearlyData = {};
    
    // 채용공고 데이터에서 년도별 집계
    data.jobs.forEach(job => {
      const year = job.접수시작일 ? new Date(job.접수시작일).getFullYear() : null;
      if (year && year >= 2020) {
        if (!yearlyData[year]) {
          yearlyData[year] = {
            year,
            jobCount: 0,
            totalApplicants: 0,
            totalHired: 0,
            avgCompetition: 0,
            categories: new Set()
          };
        }
        
        yearlyData[year].jobCount++;
        
        // 직렬 정보 추가
        if (job.일반전형) {
          job.일반전형.split(',').forEach(category => {
            yearlyData[year].categories.add(category.trim());
          });
        }
      }
    });

    // 경쟁률 데이터에서 추가 정보
    data.competition.forEach(comp => {
      const year = parseInt(comp.년도);
      if (year && yearlyData[year]) {
        const competition = parseFloat(comp.경쟁률 || '0');
        const applicants = parseInt(comp.지원자수 || '0');
        
        if (competition > 0) {
          yearlyData[year].totalApplicants += applicants;
          yearlyData[year].avgCompetition = (yearlyData[year].avgCompetition + competition) / 2;
        }
      }
    });

    // 신규채용인원 데이터 추가
    data.hiring.forEach(hire => {
      const year = parseInt(hire.년도);
      if (year && yearlyData[year]) {
        const regular = parseInt(hire.정규직_일반 || 0);
        const disabled = parseInt(hire.정규직_장애 || 0);
        const contract = parseInt(hire.공무직 || 0);
        
        yearlyData[year].totalHired += regular + disabled + contract;
      }
    });

    // 배열로 변환하고 정렬
    return Object.values(yearlyData)
      .map(data => ({
        ...data,
        categories: Array.from(data.categories)
      }))
      .sort((a, b) => b.year - a.year);
  }

  function analyzeMonthlyTrends(year) {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i).toLocaleString('ko-KR', { month: 'short' }),
      jobCount: 0,
      categories: new Set(),
      totalApplicants: 0
    }));

    // 해당 년도의 채용공고 월별 분석
    data.jobs
      .filter(job => {
        const jobYear = job.접수시작일 ? new Date(job.접수시작일).getFullYear() : null;
        return jobYear === year;
      })
      .forEach(job => {
        const month = new Date(job.접수시작일).getMonth();
        monthlyData[month].jobCount++;
        
        if (job.일반전형) {
          job.일반전형.split(',').forEach(category => {
            monthlyData[month].categories.add(category.trim());
          });
        }
      });

    // 경쟁률 데이터에서 월별 지원자 수 추가
    data.competition
      .filter(comp => parseInt(comp.년도) === year)
      .forEach(comp => {
        const applicants = parseInt(comp.지원자수 || '0');
        // 월별 분산 (실제 데이터에 월 정보가 없으므로 균등 분산)
        const monthlyApplicants = Math.floor(applicants / 12);
        monthlyData.forEach(month => {
          month.totalApplicants += monthlyApplicants;
        });
      });

    return monthlyData.map(data => ({
      ...data,
      categories: Array.from(data.categories)
    }));
  }

  // 년도 클릭 핸들러
  function selectYear(year) {
    selectedYear = selectedYear === year ? null : year;
  }

  // 트렌드 방향 계산
  function getTrendDirection(trends) {
    if (trends.length < 2) return 'stable';
    
    const recent = trends[0].jobCount;
    const previous = trends[1].jobCount;
    
    if (recent > previous) return 'up';
    if (recent < previous) return 'down';
    return 'stable';
  }

  // 최고 수치 계산 (차트 스케일링용)
  $: maxJobCount = Math.max(...yearlyTrends.map(t => t.jobCount), 1);
  $: maxMonthlyJobCount = monthlyTrends ? Math.max(...monthlyTrends.map(t => t.jobCount), 1) : 1;
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2">
      <TrendingUp size={20} class="text-blue-600" />
      <h3 class="text-lg font-semibold text-gray-900">채용 트렌드</h3>
    </div>
    
    {#if selectedYear}
      <div class="text-sm text-gray-500">
        {selectedYear}년 월별 상세
      </div>
    {:else}
      <div class="text-sm text-gray-500">
        년도를 클릭하여 월별 트렌드 확인
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-1 {selectedYear ? 'lg:grid-cols-2' : ''} gap-6">
    <!-- 년도별 트렌드 -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-medium text-gray-900">년도별 채용공고</h4>
        <div class="flex items-center space-x-2 text-sm text-gray-500">
          {#if yearlyTrends.length >= 2}
            {@const trend = getTrendDirection(yearlyTrends)}
            {#if trend === 'up'}
              <TrendingUp size={16} class="text-green-600" />
              <span class="text-green-600">증가</span>
            {:else if trend === 'down'}
              <TrendingUp size={16} class="text-red-600 rotate-180" />
              <span class="text-red-600">감소</span>
            {:else}
              <div class="w-4 h-4 bg-gray-400 rounded-full"></div>
              <span>안정</span>
            {/if}
          {:else}
            <div class="w-4 h-4 bg-gray-400 rounded-full"></div>
            <span>데이터 부족</span>
          {/if}
        </div>
      </div>

      <div class="space-y-3">
        {#each yearlyTrends as trend}
          <button
            on:click={() => selectYear(trend.year)}
            class="w-full text-left p-4 rounded-lg border-2 transition-all hover:bg-gray-50 {
              selectedYear === trend.year 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'
            }"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-3">
                <span class="text-lg font-bold text-gray-900">{trend.year}</span>
                <div class="flex items-center space-x-1 text-sm text-gray-600">
                  <BarChart3 size={14} />
                  <span>{trend.jobCount}건</span>
                </div>
              </div>
              
              <!-- 시각적 바 -->
              <div class="flex-1 mx-4">
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style="width: {(trend.jobCount / maxJobCount) * 100}%"
                  ></div>
                </div>
              </div>
              
              <div class="text-right">
                <div class="text-sm font-medium text-gray-900">
                  {trend.totalHired}명 채용
                </div>
                {#if trend.avgCompetition > 0}
                  <div class="text-xs text-gray-500">
                    평균 {trend.avgCompetition.toFixed(1)}:1
                  </div>
                {/if}
              </div>
            </div>

            <!-- 주요 직렬 -->
            {#if trend.categories.length > 0}
              <div class="flex flex-wrap gap-1">
                {#each trend.categories.slice(0, 4) as category}
                  <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {category}
                  </span>
                {/each}
                {#if trend.categories.length > 4}
                  <span class="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                    +{trend.categories.length - 4}
                  </span>
                {/if}
              </div>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- 월별 상세 트렌드 (선택된 년도가 있을 때만) -->
    {#if selectedYear && monthlyTrends}
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-gray-900">{selectedYear}년 월별 상세</h4>
          <button
            on:click={() => selectedYear = null}
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            닫기
          </button>
        </div>

        <!-- 월별 차트 -->
        <div class="space-y-3 max-h-96 overflow-y-auto">
          {#each monthlyTrends as month}
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div class="w-8 text-sm font-medium text-gray-700">
                {month.monthName}
              </div>
              
              <!-- 시각적 바 -->
              <div class="flex-1">
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-500"
                    style="width: {month.jobCount > 0 ? (month.jobCount / maxMonthlyJobCount) * 100 : 0}%"
                  ></div>
                </div>
              </div>
              
              <div class="flex items-center space-x-4 text-sm">
                <div class="flex items-center space-x-1">
                  <BarChart3 size={12} class="text-gray-400" />
                  <span class="text-gray-700">{month.jobCount}건</span>
                </div>
                
                {#if month.totalApplicants > 0}
                  <div class="flex items-center space-x-1">
                    <Users size={12} class="text-gray-400" />
                    <span class="text-gray-700">{month.totalApplicants.toLocaleString()}명</span>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <!-- 월별 요약 -->
        {#if monthlyTrends && monthlyTrends.length > 0}
          {@const totalMonthlyJobs = monthlyTrends.reduce((sum, m) => sum + m.jobCount, 0)}
          {@const peakMonth = monthlyTrends.reduce((peak, month) => 
            month.jobCount > peak.jobCount ? month : peak
          )}
          
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm text-blue-800 space-y-1">
              <div class="font-medium">📊 {selectedYear}년 월별 요약</div>
              <div>• 총 {totalMonthlyJobs}건의 채용공고</div>
              <div>• 최다 공고: {peakMonth.monthName} ({peakMonth.jobCount}건)</div>
              <div>• 월평균: {(totalMonthlyJobs / 12).toFixed(1)}건</div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- 전체 트렌드 요약 -->
  {#if yearlyTrends.length > 0}
    {@const totalJobs = yearlyTrends.reduce((sum, t) => sum + t.jobCount, 0)}
    {@const totalHired = yearlyTrends.reduce((sum, t) => sum + t.totalHired, 0)}
    {@const avgCompetition = yearlyTrends.reduce((sum, t) => sum + t.avgCompetition, 0) / yearlyTrends.length}
    
    <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
      <div class="flex items-center space-x-4 text-sm">
        <div class="flex items-center space-x-2">
          <BarChart3 size={16} class="text-blue-600" />
          <span class="text-gray-700">총 {totalJobs}건 공고</span>
        </div>
        
        <div class="flex items-center space-x-2">
          <Users size={16} class="text-green-600" />
          <span class="text-gray-700">{totalHired}명 채용</span>
        </div>
        
        {#if avgCompetition > 0}
          <div class="flex items-center space-x-2">
            <TrendingUp size={16} class="text-purple-600" />
            <span class="text-gray-700">평균 {avgCompetition.toFixed(1)}:1</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>