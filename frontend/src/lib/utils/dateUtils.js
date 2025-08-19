import { format, formatDistanceToNow, isAfter, isBefore, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 날짜를 한국어 형식으로 포맷팅
 */
export function formatDate(date, formatString = 'yyyy.MM.dd') {
  if (!date) return '';
  return format(new Date(date), formatString, { locale: ko });
}

/**
 * 상대 시간 표시 (예: 3일 후, 2시간 전)
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true, 
    locale: ko 
  });
}

/**
 * D-Day 계산
 */
export function getDaysLeft(endDate) {
  if (!endDate) return '';
  
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return '마감';
  if (diffDays === 0) return '오늘 마감';
  if (diffDays <= 3) return `D-${diffDays}`;
  return `${diffDays}일 남음`;
}

/**
 * 날짜 범위 검증
 */
export function isDateInRange(date, startDate, endDate) {
  const targetDate = new Date(date);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  if (start && isBefore(targetDate, start)) return false;
  if (end && isAfter(targetDate, end)) return false;
  
  return true;
}

/**
 * 접수 가능 여부 확인
 */
export function isApplicationOpen(job) {
  const today = new Date();
  const startDate = new Date(job.applicationStart);
  const endDate = new Date(job.applicationEnd);
  
  return isAfter(today, startDate) && isBefore(today, endDate);
}

/**
 * 채용 상태 계산
 */
export function getJobStatus(job) {
  const today = new Date();
  const applicationStart = new Date(job.applicationStart);
  const applicationEnd = new Date(job.applicationEnd);
  const announcementEnd = new Date(job.endDate);
  
  if (isBefore(today, applicationStart)) {
    return '공고중';
  } else if (isAfter(today, applicationStart) && isBefore(today, applicationEnd)) {
    return '접수중';
  } else if (isAfter(today, applicationEnd) && isBefore(today, announcementEnd)) {
    return '진행중';
  } else {
    return '마감';
  }
}

/**
 * 월별 채용 일정 생성
 */
export function generateMonthlySchedule(jobs, year, month) {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  
  return jobs.filter(job => {
    const startDate = new Date(job.startDate);
    const endDate = new Date(job.endDate);
    
    // 해당 월에 겹치는 채용공고들
    return (
      isDateInRange(startDate, monthStart, monthEnd) ||
      isDateInRange(endDate, monthStart, monthEnd) ||
      (isBefore(startDate, monthStart) && isAfter(endDate, monthEnd))
    );
  });
}

/**
 * 급박한 마감일 체크
 */
export function isUrgent(endDate, urgentDays = 3) {
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= urgentDays;
}

/**
 * 날짜 범위 문자열 생성
 */
export function formatDateRange(startDate, endDate, separator = ' ~ ') {
  if (!startDate || !endDate) return '';
  
  const start = formatDate(startDate, 'M.dd');
  const end = formatDate(endDate, 'M.dd');
  
  return `${start}${separator}${end}`;
}

/**
 * 캘린더용 날짜 데이터 생성
 */
export function generateCalendarData(jobs, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  
  const calendar = [];
  
  // 이전 달의 마지막 날들
  for (let i = firstDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, -i);
    calendar.push({
      date: date.getDate(),
      isCurrentMonth: false,
      fullDate: date,
      jobs: []
    });
  }
  
  // 현재 달의 날들
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayJobs = jobs.filter(job => {
      const jobStart = new Date(job.startDate);
      const jobEnd = new Date(job.endDate);
      return (
        date >= jobStart && date <= jobEnd
      );
    });
    
    calendar.push({
      date: day,
      isCurrentMonth: true,
      fullDate: date,
      jobs: dayJobs
    });
  }
  
  // 다음 달의 첫 날들
  const remainingDays = 42 - calendar.length; // 6주 * 7일
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month, day);
    calendar.push({
      date: day,
      isCurrentMonth: false,
      fullDate: date,
      jobs: []
    });
  }
  
  return calendar;
}

/**
 * 과거 년도 동월 동일 데이터 가져오기
 */
export function getHistoricalJobsForDate(jobs, targetDate, yearsBack = 3) {
  const month = targetDate.getMonth() + 1; // 0-based to 1-based
  const day = targetDate.getDate();
  const currentYear = targetDate.getFullYear();
  
  const historicalJobs = [];
  
  for (let i = 1; i <= yearsBack; i++) {
    const pastYear = currentYear - i;
    const pastDate = new Date(pastYear, month - 1, day);
    
    // 해당 날짜의 채용 이벤트들 찾기
    const pastYearJobs = jobs.filter(job => {
      const jobStartDate = new Date(job.startDate);
      const jobApplicationStart = new Date(job.applicationStart);
      const jobApplicationEnd = new Date(job.applicationEnd);
      
      // 해당 날짜에 발생한 이벤트들
      return (
        isSameDate(jobStartDate, pastDate) ||
        isSameDate(jobApplicationStart, pastDate) ||
        isSameDate(jobApplicationEnd, pastDate)
      );
    });
    
    if (pastYearJobs.length > 0) {
      historicalJobs.push({
        year: pastYear,
        date: pastDate,
        jobs: pastYearJobs.map(job => {
          const startDate = new Date(job.startDate);
          const appStart = new Date(job.applicationStart);
          const appEnd = new Date(job.applicationEnd);
          
          let eventType = '';
          if (isSameDate(startDate, pastDate)) eventType = 'start';
          else if (isSameDate(appStart, pastDate)) eventType = 'application';
          else if (isSameDate(appEnd, pastDate)) eventType = 'deadline';
          
          return {
            ...job,
            eventType,
            eventLabel: eventType === 'start' ? '공고시작' :
                       eventType === 'application' ? '접수시작' : '접수마감'
          };
        })
      });
    }
  }
  
  return historicalJobs;
}

/**
 * 날짜 동일성 체크 (년월일만)
 */
function isSameDate(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * 동월 채용 통계 비교
 */
export function getMonthlyComparison(jobs, currentYear, month, yearsBack = 3) {
  const comparison = [];
  
  for (let i = 0; i <= yearsBack; i++) {
    const year = currentYear - i;
    const monthJobs = jobs.filter(job => {
      const jobDate = new Date(job.startDate);
      return jobDate.getFullYear() === year && jobDate.getMonth() === month - 1;
    });
    
    const agencies = [...new Set(monthJobs.map(job => job.agencyName))];
    const totalPositions = monthJobs.reduce((sum, job) => sum + (job.requiredCount || 0), 0);
    
    comparison.push({
      year,
      totalJobs: monthJobs.length,
      totalPositions,
      agencies: agencies.length,
      avgPositionsPerJob: monthJobs.length > 0 ? Math.round(totalPositions / monthJobs.length) : 0
    });
  }
  
  return comparison;
}