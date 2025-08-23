<script>
  import { onMount } from 'svelte';
  import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, RefreshCw, AlertCircle } from 'lucide-svelte';
  import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
  import { ko } from 'date-fns/locale';
  import { config } from '$lib/utils/config.js';
  import { fetchAllCachedData, clearCache } from '$lib/utils/apiClient.js';
  
  // API 데이터 상태
  let rawData = {
    jobs: [],
    competition: [],
    hiring: []
  };
  let isLoading = false;
  let error = null;
  let lastUpdated = null;
  
  // 캘린더 상태
  let currentDate = new Date();
  let selectedDate = null;
  let calendarDays = [];
  let jobsByDate = {};
  let historicalData = [];
  let monthlyComparison = [];
  let showHistorical = false;
  let urgentJobs = [];
  
  // 캘린더 생성
  function generateCalendar() {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    calendarDays = eachDayOfInterval({ start, end });
  }
  
  // 날짜별 채용정보 정리
  function generateJobsByDate() {
    jobsByDate = {};
    
    rawData.jobs.forEach(job => {
      // 공고시작일
      if (job.공고시작일) {
        const startDate = format(new Date(job.공고시작일), 'yyyy-MM-dd');
        if (!jobsByDate[startDate]) jobsByDate[startDate] = [];
        jobsByDate[startDate].push({
          ...job,
          type: 'start',
          label: '공고시작',
          jobTitle: job.공고명,
          agencyName: job.기관명
        });
      }
      
      // 접수시작일
      if (job.접수시작일) {
        const appStartDate = format(new Date(job.접수시작일), 'yyyy-MM-dd');
        if (!jobsByDate[appStartDate]) jobsByDate[appStartDate] = [];
        jobsByDate[appStartDate].push({
          ...job,
          type: 'application',
          label: '접수시작',
          jobTitle: job.공고명,
          agencyName: job.기관명
        });
      }
      
      // 접수마감일
      if (job.접수마감일) {
        const appEndDate = format(new Date(job.접수마감일), 'yyyy-MM-dd');
        if (!jobsByDate[appEndDate]) jobsByDate[appEndDate] = [];
        jobsByDate[appEndDate].push({
          ...job,
          type: 'deadline',
          label: '접수마감',
          jobTitle: job.공고명,
          agencyName: job.기관명
        });
      }
    });
  }
  
  // 마감임박 채용정보 생성
  function generateUrgentJobs() {
    const today = new Date();
    urgentJobs = rawData.jobs
      .filter(job => {
        if (!job.접수마감일) return false;
        const endDate = new Date(job.접수마감일);
        const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 7;
      })
      .map(job => ({
        jobTitle: job.공고명,
        agencyName: job.기관명,
        applicationEnd: job.접수마감일,
        requiredCount: parseInt(job.모집인원 || 0),
        categories: job.일반전형 ? job.일반전형.split(',').map(c => c.trim()) : []
      }))
      .sort((a, b) => new Date(a.applicationEnd) - new Date(b.applicationEnd))
      .slice(0, 10);
  }
  
  // 월 이동
  function previousMonth() {
    currentDate = subMonths(currentDate, 1);
    generateCalendar();
    generateMonthlyComparison();
  }
  
  function nextMonth() {
    currentDate = addMonths(currentDate, 1);
    generateCalendar();
    generateMonthlyComparison();
  }
  
  // 날짜 선택
  function selectDate(date) {
    selectedDate = date;
    if (selectedDate) {
      historicalData = getHistoricalJobsForDate(selectedDate);
    }
  }
  
  // 특정 날짜의 이벤트 가져오기
  function getEventsForDate(date) {
    const dateStr = format(date, 'yyyy-MM-dd');
    return jobsByDate[dateStr] || [];
  }
  
  // 이벤트 타입별 색상
  function getEventTypeColor(type) {
    switch(type) {
      case 'start':
        return 'bg-blue-100 text-blue-800';
      case 'application':
        return 'bg-green-100 text-green-800';
      case 'deadline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  // 과거 동일 날짜 채용정보 가져오기
  function getHistoricalJobsForDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const selectedYear = date.getFullYear(); // 선택된 날짜의 연도
    
    const historicalJobs = {};
    
    rawData.jobs.forEach(job => {
      // 각 날짜 필드 확인
      const checkDates = [
        { date: job.공고시작일, type: 'start', label: '공고시작' },
        { date: job.접수시작일, type: 'application', label: '접수시작' },
        { date: job.접수마감일, type: 'deadline', label: '접수마감' }
      ];
      
      checkDates.forEach(({ date: dateStr, type, label }) => {
        if (!dateStr) return;
        
        const jobDate = new Date(dateStr);
        if (jobDate.getMonth() + 1 === month && jobDate.getDate() === day) {
          const year = jobDate.getFullYear();
          
          // 선택된 날짜의 연도는 제외
          if (year === selectedYear) return;
          
          if (!historicalJobs[year]) {
            historicalJobs[year] = [];
          }
          
          historicalJobs[year].push({
            jobTitle: job.공고명,
            agencyName: job.기관명,
            eventType: type,
            eventLabel: label
          });
        }
      });
    });
    
    // 연도별로 정렬
    return Object.entries(historicalJobs)
      .map(([year, jobs]) => ({
        year: parseInt(year),
        jobs
      }))
      .sort((a, b) => b.year - a.year);
  }
  
  // 월별 비교 데이터 생성
  function generateMonthlyComparison() {
    const targetMonth = currentDate.getMonth() + 1;
    const yearData = {};
    
    rawData.jobs.forEach(job => {
      if (!job.공고시작일) return;
      
      const jobDate = new Date(job.공고시작일);
      const jobMonth = jobDate.getMonth() + 1;
      const jobYear = jobDate.getFullYear();
      
      if (jobMonth === targetMonth) {
        if (!yearData[jobYear]) {
          yearData[jobYear] = {
            year: jobYear,
            totalJobs: 0,
            totalPositions: 0,
            agencies: new Set()
          };
        }
        
        yearData[jobYear].totalJobs++;
        yearData[jobYear].totalPositions += parseInt(job.모집인원 || 0);
        yearData[jobYear].agencies.add(job.기관명);
      }
    });
    
    monthlyComparison = Object.values(yearData)
      .map(data => ({
        ...data,
        agencies: data.agencies.size
      }))
      .sort((a, b) => b.year - a.year);
  }
  
  // 데이터 로드
  async function loadCalendarData() {
    isLoading = true;
    error = null;
    
    try {
      console.log('캘린더 데이터 로딩 시작...');
      const result = await fetchAllCachedData();
      
      rawData = result;
      lastUpdated = new Date();
      
      // 데이터 처리
      generateJobsByDate();
      generateUrgentJobs();
      generateMonthlyComparison();
      
      console.log('캘린더 데이터 로딩 완료:', {
        jobs: result.jobs.length,
        competition: result.competition.length,
        hiring: result.hiring.length
      });
      
    } catch (err) {
      console.error('캘린더 데이터 로딩 실패:', err);
      error = err.message || '데이터를 불러오는데 실패했습니다.';
    } finally {
      isLoading = false;
    }
  }
  
  // 새로고침
  async function refresh() {
    clearCache();
    await loadCalendarData();
  }
  
  // 반응형 업데이트
  $: if (rawData.jobs.length > 0) {
    generateCalendar();
    generateJobsByDate();
    generateUrgentJobs();
  }
  
  $: selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  
  // 초기 데이터 로드
  onMount(async () => {
    generateCalendar();
    await loadCalendarData();
  });
</script>

<svelte:head>
  <title>채용캘린더 - {config.siteName}</title>
  <meta name="description" content="부산시 공사/공단 채용 일정을 캘린더로 한눈에 확인하세요" />
</svelte:head>

<div class="space-y-8">
  <!-- 헤더 -->
  <section class="text-center space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
          <Calendar size={16} class="mr-2" />
          한눈에 보는 채용 일정
        </div>
        
        <h1 class="text-heading">채용 캘린더</h1>
        <p class="text-gray-600">
          부산시 5개 공사/공단의 채용 일정을 캘린더로 확인하고 
          중요한 일정을 놓치지 마세요
        </p>
      </div>
      
      <!-- 새로고침 버튼 -->
      <button
        on:click={refresh}
        disabled={isLoading}
        class="btn-secondary flex items-center space-x-2"
      >
        <RefreshCw size={16} class={isLoading ? 'animate-spin' : ''} />
        <span>{isLoading ? '로딩 중...' : '새로고침'}</span>
      </button>
    </div>
  </section>
  
  <!-- 에러 상태 -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-xl p-4">
      <div class="flex items-start space-x-3">
        <div class="p-2 bg-red-100 rounded-lg">
          <AlertCircle size={20} class="text-red-600" />
        </div>
        <div class="flex-1">
          <h3 class="text-red-800 font-semibold">데이터 로드 오류</h3>
          <p class="text-red-700 text-sm mt-1">{error}</p>
          <button
            on:click={refresh}
            class="mt-2 btn-secondary text-sm"
          >
            <RefreshCw size={14} class="mr-1" />
            다시 시도
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- 로딩 상태 -->
  {#if isLoading}
    <section class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">캘린더 데이터를 불러오는 중...</p>
      </div>
    </section>
  {:else if !error}
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- 캘린더 -->
      <section class="lg:col-span-3 card p-8">
        <!-- 캘린더 헤더 -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </h2>
          
          <div class="flex items-center space-x-2">
            <button
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              on:click={previousMonth}
            >
              <ChevronLeft size={20} class="text-gray-600" />
            </button>
            
            <button
              class="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              on:click={() => { currentDate = new Date(); selectedDate = null; }}
            >
              오늘
            </button>
            
            <button
              class="px-3 py-2 text-xs font-medium rounded-lg transition-colors
                     {showHistorical ? 'bg-secondary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}"
              on:click={() => showHistorical = !showHistorical}
              title="과거 년도 동월 정보 표시"
            >
              📅 과거비교
            </button>
            
            <button
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              on:click={nextMonth}
            >
              <ChevronRight size={20} class="text-gray-600" />
            </button>
          </div>
        </div>
        
        <!-- 요일 헤더 -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          {#each ['일', '월', '화', '수', '목', '금', '토'] as day, index}
            <div class="h-10 flex items-center justify-center text-sm font-medium
                        {index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'}">
              {day}
            </div>
          {/each}
        </div>
        
        <!-- 캘린더 그리드 -->
        <div class="grid grid-cols-7 gap-1">
          {#each calendarDays as date}
            {@const events = getEventsForDate(date)}
            {@const isSelected = selectedDate && isSameDay(date, selectedDate)}
            {@const isTodayDate = isToday(date)}
            {@const isCurrentMonth = isSameMonth(date, currentDate)}
            {@const historicalEvents = showHistorical ? getHistoricalJobsForDate(date) : []}
            
            <button
              class="relative h-24 p-1 border rounded-lg hover:bg-gray-50 transition-colors
                     text-left {!isCurrentMonth ? 'opacity-50' : ''}
                     {isSelected ? 'bg-primary-100 border-primary-400 ring-2 ring-primary-300' : 
                      showHistorical && historicalEvents.length > 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 shadow-sm' : 'border-gray-100'}"
              on:click={() => selectDate(date)}
            >
              <!-- 날짜 -->
              <span class="text-sm font-medium 
                           {isTodayDate ? 'text-primary-600' : 
                            date.getDay() === 0 ? 'text-red-600' : 
                            date.getDay() === 6 ? 'text-blue-600' : 'text-gray-900'}">
                {format(date, 'd')}
              </span>
              
              <!-- 오늘 표시 -->
              {#if isTodayDate}
                <div class="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></div>
              {/if}
              
              <!-- 이벤트 표시 -->
              <div class="mt-1 space-y-1">
                {#each events.slice(0, 2) as event}
                  <div class="text-xs px-1 py-0.5 rounded {getEventTypeColor(event.type)} truncate">
                    {event.label}
                  </div>
                {/each}
                
                {#if events.length > 2}
                  <div class="text-xs text-gray-500">
                    +{events.length - 2}개
                  </div>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </section>
      
      <!-- 사이드바 -->
      <section class="space-y-8">
        <!-- 범례 -->
        <div class="card p-6">
          <h3 class="font-bold text-gray-900 mb-3">범례</h3>
          <div class="space-y-2 text-sm">
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-blue-100 rounded border border-blue-200"></div>
              <span>공고시작</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-green-100 rounded border border-green-200"></div>
              <span>접수시작</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-red-100 rounded border border-red-200"></div>
              <span>접수마감</span>
            </div>
            {#if showHistorical}
              <div class="flex items-center space-x-2 mt-2 pt-2 border-t border-gray-200">
                <div class="w-4 h-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 rounded shadow-sm"></div>
                <span class="text-xs">과거 동일날짜 이벤트</span>
              </div>
            {/if}
          </div>
        </div>
        
        <!-- 선택된 날짜의 일정 -->
        {#if selectedDate}
          <div class="card p-6">
            <h3 class="font-bold text-gray-900 mb-3">
              {format(selectedDate, 'M월 d일 (E)', { locale: ko })} 일정
            </h3>
            
            {#if selectedEvents.length === 0}
              <p class="text-sm text-gray-500">이 날에는 일정이 없습니다.</p>
            {:else}
              <div class="space-y-3">
                {#each selectedEvents as event}
                  <div class="border-l-4 pl-3 py-2
                             {event.type === 'start' ? 'border-blue-500' :
                              event.type === 'application' ? 'border-green-500' :
                              'border-red-500'}">
                    <div class="flex items-center space-x-2 mb-1">
                      <Clock size={14} class="text-gray-400" />
                      <span class="text-xs font-medium {getEventTypeColor(event.type)} px-2 py-0.5 rounded">
                        {event.label}
                      </span>
                    </div>
                    
                    <h4 class="font-medium text-gray-900 text-sm leading-tight mb-1">
                      {event.jobTitle}
                    </h4>
                    
                    <div class="flex items-center space-x-1 text-xs text-gray-500">
                      <MapPin size={12} />
                      <span>{event.agencyName}</span>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- 과거 동월 비교 -->
        {#if selectedDate && historicalData.length > 0}
          <div class="card p-6">
            <h3 class="font-bold text-gray-900 mb-3">
              {format(selectedDate, 'M월 d일', { locale: ko })} 과거 동일 날짜
            </h3>
            
            <div class="space-y-3 text-sm">
              {#each historicalData as yearData}
                <div class="p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-gray-700">{yearData.year}년</span>
                    <span class="text-xs text-gray-500">{yearData.jobs.length}건</span>
                  </div>
                  
                  <div class="space-y-2">
                    {#each yearData.jobs as job}
                      <div class="border-l-2 pl-2 
                                 {job.eventType === 'start' ? 'border-blue-400' :
                                  job.eventType === 'application' ? 'border-green-400' :
                                  'border-red-400'}">
                        <div class="text-xs font-medium 
                                   {job.eventType === 'start' ? 'text-blue-700' :
                                    job.eventType === 'application' ? 'text-green-700' :
                                    'text-red-700'}">
                          {job.eventLabel}
                        </div>
                        <div class="text-xs text-gray-900 font-medium truncate">
                          {job.jobTitle}
                        </div>
                        <div class="text-xs text-gray-600">{job.agencyName}</div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- 월별 채용 트렌드 비교 -->
        {#if monthlyComparison.length > 1}
          <div class="card p-6">
            <h3 class="font-bold text-gray-900 mb-3">
              {format(currentDate, 'M월', { locale: ko })} 연도별 채용 비교
            </h3>
            
            <div class="space-y-2 text-sm">
              {#each monthlyComparison as comparison}
                <div class="flex items-center justify-between p-2 
                           {comparison.year === new Date().getFullYear() ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'} 
                           rounded">
                  <div>
                    <span class="font-medium 
                               {comparison.year === new Date().getFullYear() ? 'text-primary-700' : 'text-gray-700'}">
                      {comparison.year}년
                    </span>
                    <span class="text-xs text-gray-500 ml-1">
                      {comparison.agencies}개 기관
                    </span>
                  </div>
                  <div class="text-right">
                    <div class="font-medium text-gray-900">{comparison.totalJobs}건</div>
                    <div class="text-xs text-gray-500">{comparison.totalPositions}명</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- 이번 주 중요 일정 -->
        <div class="card p-6">
          <h3 class="font-bold text-gray-900 mb-3">이번 주 중요 일정</h3>
          <div class="space-y-2 text-sm">
            {#each urgentJobs.slice(0, 3) as job}
              <div class="p-2 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-red-600">접수마감</span>
                  <span class="text-xs text-red-600">
                    D-{Math.ceil((new Date(job.applicationEnd) - new Date()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <p class="text-xs text-gray-900 font-medium leading-tight">
                  {job.jobTitle}
                </p>
                <p class="text-xs text-gray-600">{job.agencyName}</p>
                
                <!-- 채용인원 표시 -->
                <div class="flex items-center space-x-2 mt-1">
                  <span class="text-xs text-gray-500">{job.requiredCount}명 모집</span>
                  {#if job.categories && job.categories.length > 0}
                    <span class="text-xs bg-gray-100 text-gray-600 px-1 rounded">
                      {job.categories[0]}
                    </span>
                  {/if}
                </div>
              </div>
            {:else}
              <div class="text-center py-4">
                <Clock size={24} class="text-gray-400 mx-auto mb-2" />
                <p class="text-gray-500">이번 주 마감 예정인 채용이 없습니다.</p>
              </div>
            {/each}
          </div>
        </div>
      </section>
    </div>
  {/if}
</div>