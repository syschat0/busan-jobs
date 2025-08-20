<script>
  import { Calendar, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { enhancedDataStore, userProfileStore } from '../../stores/dashboard.js';
  
  export let widget;
  
  $: data = $enhancedDataStore;
  $: userPrefs = $userProfileStore.preferences;
  
  let currentDate = new Date();
  let currentYear = currentDate.getFullYear();
  let currentMonth = currentDate.getMonth();
  
  let calendarJobs = [];
  let upcomingDeadlines = [];
  
  $: if (data.jobs.length > 0) {
    updateCalendarData();
  }
  
  function updateCalendarData() {
    const now = new Date();
    
    // 관심있는 채용공고만 필터링 (개인화)
    let filteredJobs = data.jobs.filter(job => {
      return userPrefs.interestedAgencies.includes(job.agencyName) ||
             (job.categories && job.categories.some(cat => 
               userPrefs.targetCategories.includes(cat)
             ));
    });
    
    // 마감일이 있는 공고들만
    calendarJobs = filteredJobs.filter(job => {
      const deadline = job.timelineInfo?.applicationClose || job.applicationEnd;
      return deadline && new Date(deadline) > now;
    }).map(job => {
      const deadline = new Date(job.timelineInfo?.applicationClose || job.applicationEnd);
      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      
      return {
        ...job,
        deadline,
        daysLeft,
        urgency: daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'high' : daysLeft <= 14 ? 'medium' : 'low'
      };
    }).sort((a, b) => a.deadline - b.deadline);
    
    // 다가오는 마감일 (30일 이내)
    upcomingDeadlines = calendarJobs.filter(job => job.daysLeft <= 30);
  }
  
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  
  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }
  
  function getCalendarDays() {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    
    const days = [];
    
    // 이전 달의 날짜들
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i)
      });
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, day)
      });
    }
    
    // 다음 달의 날짜들 (6주를 채우기 위해)
    const totalCells = 42; // 6주 × 7일
    const remainingCells = totalCells - days.length;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(nextYear, nextMonth, day)
      });
    }
    
    return days;
  }
  
  function getJobsForDate(date) {
    return calendarJobs.filter(job => {
      const jobDate = new Date(job.deadline);
      return jobDate.toDateString() === date.toDateString();
    });
  }
  
  function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
  
  function navigateMonth(direction) {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
      } else {
        currentMonth--;
      }
    } else {
      if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
      } else {
        currentMonth++;
      }
    }
  }
  
  function getUrgencyClass(urgency) {
    switch(urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  }
  
  function formatDeadlineText(daysLeft) {
    if (daysLeft === 0) return '오늘 마감';
    if (daysLeft === 1) return '내일 마감';
    if (daysLeft <= 7) return `${daysLeft}일 후`;
    return `${daysLeft}일 후`;
  }
  
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];
  
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
</script>

<div class="deadline-calendar">
  {#if upcomingDeadlines.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <Calendar size={32} class="text-gray-400" />
      </div>
      <div class="empty-content">
        <h3 class="empty-title">예정된 마감일이 없습니다</h3>
        <p class="empty-description">
          관심있는 분야의 채용공고 마감일을 추적해보세요.
        </p>
      </div>
    </div>
  {:else}
    <!-- 캘린더 헤더 -->
    <div class="calendar-header">
      <div class="month-navigation">
        <button 
          class="nav-btn"
          on:click={() => navigateMonth('prev')}
        >
          <ChevronLeft size={16} />
        </button>
        
        <h3 class="current-month">
          {currentYear}년 {monthNames[currentMonth]}
        </h3>
        
        <button 
          class="nav-btn"
          on:click={() => navigateMonth('next')}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      <div class="urgency-legend">
        <div class="legend-item">
          <div class="legend-dot bg-red-500"></div>
          <span>3일 이내</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot bg-orange-500"></div>
          <span>1주 이내</span>
        </div>
      </div>
    </div>
    
    <!-- 캘린더 그리드 -->
    <div class="calendar-grid">
      <!-- 요일 헤더 -->
      <div class="weekdays">
        {#each dayNames as dayName}
          <div class="weekday">{dayName}</div>
        {/each}
      </div>
      
      <!-- 날짜 그리드 -->
      <div class="days-grid">
        {#each getCalendarDays() as dayInfo}
          {@const jobsForDay = getJobsForDate(dayInfo.date)}
          <div 
            class="day-cell {dayInfo.isCurrentMonth ? 'current-month' : 'other-month'} {isToday(dayInfo.date) ? 'today' : ''}"
          >
            <div class="day-number">{dayInfo.day}</div>
            
            {#if jobsForDay.length > 0}
              <div class="day-jobs">
                {#each jobsForDay.slice(0, 2) as job}
                  <div 
                    class="job-dot {getUrgencyClass(job.urgency)}"
                    title="{job.agencyName} - {formatDeadlineText(job.daysLeft)}"
                  ></div>
                {/each}
                {#if jobsForDay.length > 2}
                  <div class="more-jobs">+{jobsForDay.length - 2}</div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
    <!-- 다가오는 마감일 목록 -->
    <div class="upcoming-deadlines">
      <div class="upcoming-header">
        <AlertTriangle size={14} class="text-orange-600" />
        <span>다가오는 마감일</span>
      </div>
      
      <div class="deadline-list">
        {#each upcomingDeadlines.slice(0, 5) as job}
          <div class="deadline-item urgency-{job.urgency}">
            <div class="deadline-info">
              <div class="job-agency">{job.agencyName}</div>
              <div class="job-title">{job.jobTitle.slice(0, 30)}...</div>
            </div>
            
            <div class="deadline-time">
              <Clock size={12} />
              <span class="deadline-text urgency-{job.urgency}">
                {formatDeadlineText(job.daysLeft)}
              </span>
            </div>
          </div>
        {/each}
        
        {#if upcomingDeadlines.length > 5}
          <div class="more-deadlines">
            외 {upcomingDeadlines.length - 5}개 더
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .deadline-calendar {
    @apply h-full flex flex-col;
  }
  
  /* 빈 상태 */
  .empty-state {
    @apply flex flex-col items-center justify-center h-full text-center space-y-3;
  }
  
  .empty-icon {
    @apply p-3 bg-gray-100 rounded-full;
  }
  
  .empty-title {
    @apply text-lg font-semibold text-gray-900;
  }
  
  .empty-description {
    @apply text-sm text-gray-600 max-w-xs leading-relaxed;
  }
  
  /* 캘린더 헤더 */
  .calendar-header {
    @apply flex items-center justify-between mb-4 pb-3 border-b border-gray-100;
  }
  
  .month-navigation {
    @apply flex items-center space-x-3;
  }
  
  .nav-btn {
    @apply p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors;
  }
  
  .current-month {
    @apply text-base font-semibold text-gray-900 min-w-[120px] text-center;
  }
  
  .urgency-legend {
    @apply flex items-center space-x-3;
  }
  
  .legend-item {
    @apply flex items-center space-x-1 text-xs text-gray-600;
  }
  
  .legend-dot {
    @apply w-2 h-2 rounded-full;
  }
  
  /* 캘린더 그리드 */
  .calendar-grid {
    @apply flex-1 mb-4;
  }
  
  .weekdays {
    @apply grid grid-cols-7 gap-1 mb-2;
  }
  
  .weekday {
    @apply text-xs font-medium text-gray-500 text-center py-2;
  }
  
  .days-grid {
    @apply grid grid-cols-7 gap-1;
  }
  
  .day-cell {
    @apply relative p-2 min-h-[40px] flex flex-col items-center justify-start;
    @apply hover:bg-gray-50 transition-colors rounded-md cursor-pointer;
  }
  
  .day-cell.other-month {
    @apply opacity-40;
  }
  
  .day-cell.today {
    @apply bg-primary-50 border border-primary-200 text-primary-700 font-semibold;
  }
  
  .day-number {
    @apply text-xs font-medium mb-1;
  }
  
  .day-jobs {
    @apply flex flex-wrap gap-0.5 items-center justify-center;
  }
  
  .job-dot {
    @apply w-1.5 h-1.5 rounded-full;
  }
  
  .more-jobs {
    @apply text-xs text-gray-500 font-medium;
  }
  
  /* 다가오는 마감일 */
  .upcoming-deadlines {
    @apply pt-3 border-t border-gray-100;
  }
  
  .upcoming-header {
    @apply flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-3;
  }
  
  .deadline-list {
    @apply space-y-2;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .deadline-item {
    @apply flex items-center justify-between p-2 rounded-lg border-l-4 transition-colors;
  }
  
  .deadline-item.urgency-critical {
    @apply bg-red-50 border-red-500;
  }
  
  .deadline-item.urgency-high {
    @apply bg-orange-50 border-orange-500;
  }
  
  .deadline-item.urgency-medium {
    @apply bg-yellow-50 border-yellow-500;
  }
  
  .deadline-item.urgency-low {
    @apply bg-blue-50 border-blue-500;
  }
  
  .deadline-info {
    @apply flex-1 min-w-0;
  }
  
  .job-agency {
    @apply text-xs text-gray-500 font-medium;
  }
  
  .job-title {
    @apply text-sm text-gray-900 truncate;
  }
  
  .deadline-time {
    @apply flex items-center space-x-1 flex-shrink-0;
  }
  
  .deadline-text.urgency-critical {
    @apply text-red-600 font-semibold;
  }
  
  .deadline-text.urgency-high {
    @apply text-orange-600 font-semibold;
  }
  
  .deadline-text.urgency-medium {
    @apply text-yellow-600 font-medium;
  }
  
  .deadline-text.urgency-low {
    @apply text-blue-600;
  }
  
  .more-deadlines {
    @apply text-xs text-gray-500 text-center py-2 border-t border-gray-100;
  }
  
  /* 반응형 */
  @media (max-width: 640px) {
    .calendar-header {
      @apply flex-col space-y-3 items-stretch;
    }
    
    .month-navigation {
      @apply justify-center;
    }
    
    .urgency-legend {
      @apply justify-center;
    }
    
    .day-cell {
      @apply min-h-[35px] p-1;
    }
    
    .day-number {
      @apply text-xs;
    }
  }
</style>