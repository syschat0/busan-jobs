<script>
  import { onMount } from 'svelte';
  import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-svelte';
  import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
  import { ko } from 'date-fns/locale';
  import { config } from '$lib/utils/config.js';
  import { generateCalendarData, getHistoricalJobsForDate, getMonthlyComparison } from '$lib/utils/dateUtils.js';
  
  // Stores
  import { jobs, urgentJobs } from '$lib/stores/jobs.js';
  
  let currentDate = new Date();
  let selectedDate = null;
  let calendarDays = [];
  let jobsByDate = {};
  let historicalData = [];
  let monthlyComparison = [];
  let showHistorical = false;
  
  $: {
    generateCalendar();
    generateJobsByDate();
  }
  
  function generateCalendar() {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    calendarDays = eachDayOfInterval({ start, end });
  }
  
  function generateJobsByDate() {
    jobsByDate = {};
    
    $jobs.forEach(job => {
      // 공고시작일
      const startDate = format(new Date(job.startDate), 'yyyy-MM-dd');
      if (!jobsByDate[startDate]) jobsByDate[startDate] = [];
      jobsByDate[startDate].push({
        ...job,
        type: 'start',
        label: '공고시작'
      });
      
      // 접수시작일
      const appStartDate = format(new Date(job.applicationStart), 'yyyy-MM-dd');
      if (!jobsByDate[appStartDate]) jobsByDate[appStartDate] = [];
      jobsByDate[appStartDate].push({
        ...job,
        type: 'application',
        label: '접수시작'
      });
      
      // 접수마감일
      const appEndDate = format(new Date(job.applicationEnd), 'yyyy-MM-dd');
      if (!jobsByDate[appEndDate]) jobsByDate[appEndDate] = [];
      jobsByDate[appEndDate].push({
        ...job,
        type: 'deadline',
        label: '접수마감'
      });
    });
  }
  
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
  
  function selectDate(date) {
    selectedDate = date;
    if (selectedDate) {
      historicalData = getHistoricalJobsForDate($jobs, selectedDate);
    }
  }
  
  function getEventsForDate(date) {
    const dateStr = format(date, 'yyyy-MM-dd');
    return jobsByDate[dateStr] || [];
  }
  
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
  
  function generateMonthlyComparison() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    monthlyComparison = getMonthlyComparison($jobs, year, month);
  }
  
  $: {
    generateCalendar();
    generateJobsByDate();
  }
  
  $: selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  
  onMount(() => {
    generateMonthlyComparison();
  });
</script>

<svelte:head>
  <title>채용캘린더 - {config.siteName}</title>
  <meta name="description" content="부산시 공사/공단 채용 일정을 캘린더로 한눈에 확인하세요" />
</svelte:head>

<div class="space-y-8">
  <!-- 헤더 -->
  <section class="text-center space-y-6">
    <div class="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
      <Calendar size={16} class="mr-2" />
      한눈에 보는 채용 일정
    </div>
    
    <h1 class="text-heading">채용 캘린더</h1>
    <p class="text-gray-600">
      부산시 5개 공사/공단의 채용 일정을 캘린더로 확인하고 
      중요한 일정을 놓치지 마세요
    </p>
  </section>
  
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
          
          <button
            class="relative h-24 p-1 border rounded-lg hover:bg-gray-50 transition-colors
                   text-left {!isCurrentMonth ? 'opacity-50' : ''}
                   {isSelected ? 'bg-primary-100 border-primary-400 ring-2 ring-primary-300' : 
                    showHistorical && getHistoricalJobsForDate($jobs, date).length > 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 shadow-sm' : 'border-gray-100'}"
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
                         {comparison.year === currentDate.getFullYear() ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'} 
                         rounded">
                <div>
                  <span class="font-medium 
                             {comparison.year === currentDate.getFullYear() ? 'text-primary-700' : 'text-gray-700'}">
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
          {#each $urgentJobs.slice(0, 3) as job}
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
</div>