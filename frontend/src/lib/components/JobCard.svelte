<script>
  import { Calendar, MapPin, Users, TrendingUp, ExternalLink, Heart } from 'lucide-svelte';
  import { format } from 'date-fns';
  import { ko } from 'date-fns/locale';
  import competitionData from '$lib/data/competition.json';
  
  export let job;
  
  // 상태에 따른 배지 스타일 결정
  function getStatusBadge(status) {
    switch(status) {
      case '접수중':
        return { class: 'badge-success', emoji: '🟢', text: '접수중' };
      case '진행중': 
        return { class: 'badge-warning', emoji: '🟡', text: '진행중' };
      case '마감':
        return { class: 'badge-error', emoji: '🔴', text: '마감' };
      default:
        return { class: 'badge-warning', emoji: '🟡', text: '진행중' };
    }
  }
  
  // 실제 경쟁률 데이터 기반 배지 스타일
  function getCompetitionBadge(agencyName, categories) {
    // 해당 기관의 경쟁률 데이터 찾기
    const matchingCompetitions = competitionData.filter(comp => 
      comp.agencyName === agencyName && 
      categories.some(cat => comp.category.includes(cat) || cat.includes(comp.category))
    );
    
    let avgCompetition = 0;
    if (matchingCompetitions.length > 0) {
      const rates = matchingCompetitions.map(comp => {
        if (typeof comp.competitionRate === 'string' && comp.competitionRate.includes(':')) {
          return parseFloat(comp.competitionRate.split(':')[0]);
        }
        return parseFloat(comp.competitionRate);
      }).filter(rate => !isNaN(rate) && rate > 0);
      
      if (rates.length > 0) {
        avgCompetition = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      }
    }
    
    // 실제 데이터가 없으면 예상 경쟁률 사용
    if (avgCompetition === 0) {
      avgCompetition = job.requiredCount > 100 ? 25 : job.requiredCount > 50 ? 45 : job.requiredCount > 20 ? 65 : 85;
    }
    
    const rate = Math.round(avgCompetition * 10) / 10; // 소수점 1자리
    
    if (rate < 30) {
      return { class: 'badge-success', emoji: '🟢', text: '낮음', rate: `${rate}:1` };
    } else if (rate < 60) {
      return { class: 'badge-warning', emoji: '🟡', text: '보통', rate: `${rate}:1` };
    } else {
      return { class: 'badge-error', emoji: '🔴', text: '높음', rate: `${rate}:1` };
    }
  }
  
  // 마감일까지 남은 시간 계산
  function getDaysLeft(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '마감';
    if (diffDays === 0) return '오늘 마감';
    if (diffDays <= 3) return `D-${diffDays}`;
    return `${diffDays}일 남음`;
  }
  
  $: statusBadge = getStatusBadge(job.status);
  $: competitionBadge = getCompetitionBadge(job.agencyName, job.categories);
  $: daysLeft = getDaysLeft(job.endDate);
</script>

<div class="card group cursor-pointer animate-fade-in">
  <!-- 상태 헤더 -->
  <div class="px-6 py-4 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-gray-100">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class={statusBadge.class}>
          {statusBadge.emoji} {statusBadge.text}
        </span>
        <span class={competitionBadge.class}>
          {competitionBadge.emoji} 경쟁률 {competitionBadge.text}
        </span>
      </div>
      
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-gray-600">{daysLeft}</span>
        <button class="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
          <Heart size={16} class="text-gray-400 hover:text-red-500" />
        </button>
      </div>
    </div>
  </div>
  
  <!-- 메인 콘텐츠 -->
  <div class="p-8 space-y-6">
    <!-- 제목 및 기관 -->
    <div class="space-y-2">
      <h3 class="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">
        {job.jobTitle}
      </h3>
      
      <div class="flex items-center space-x-2 text-sm text-gray-600">
        <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
        <span class="font-medium">{job.agencyName}</span>
      </div>
    </div>
    
    <!-- 핵심 정보 그리드 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
      <div class="flex items-center space-x-2">
        <Users size={16} class="text-gray-400" />
        <div>
          <span class="text-gray-500">모집인원</span>
          <span class="ml-2 font-semibold text-gray-900">{job.requiredCount}명</span>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <TrendingUp size={16} class="text-gray-400" />
        <div>
          <span class="text-gray-500">예상경쟁률</span>
          <span class="ml-2 font-semibold" class:text-green-600={competitionBadge.text === '낮음'}
                class:text-amber-600={competitionBadge.text === '보통'}
                class:text-red-600={competitionBadge.text === '높음'}>
            {competitionBadge.rate}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 주요 직렬 -->
    <div class="space-y-2">
      <span class="text-sm text-gray-500">모집직렬</span>
      <div class="flex flex-wrap gap-2">
        {#each job.categories.slice(0, 4) as category}
          <span class="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
            {category}
          </span>
        {/each}
        {#if job.categories.length > 4}
          <span class="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
            +{job.categories.length - 4}개
          </span>
        {/if}
      </div>
    </div>
    
    <!-- 일정 정보 -->
    <div class="space-y-4 pt-6 border-t border-gray-100">
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center space-x-2">
          <Calendar size={16} class="text-gray-400" />
          <span class="text-gray-500">접수기간</span>
        </div>
        <span class="font-medium text-gray-900">
          {format(new Date(job.applicationStart), 'M.dd', { locale: ko })} ~ 
          {format(new Date(job.applicationEnd), 'M.dd', { locale: ko })}
        </span>
      </div>
      
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center space-x-2">
          <MapPin size={16} class="text-gray-400" />
          <span class="text-gray-500">지역조건</span>
        </div>
        <span class="font-medium text-gray-900">{job.requirements.split(',')[0]}</span>
      </div>
    </div>
    
    <!-- 액션 버튼 -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-6">
      <button class="btn-primary flex items-center justify-center space-x-2 flex-1">
        <ExternalLink size={16} />
        <span>지원하기</span>
      </button>
      
      <button class="btn-secondary px-4 py-3 sm:w-auto">
        <span class="text-sm">상세보기</span>
      </button>
    </div>
  </div>
  
  <!-- 호버 효과를 위한 그라데이션 오버레이 -->
  <div class="absolute inset-0 bg-gradient-to-r from-primary-500/0 to-primary-600/0 
              group-hover:from-primary-500/5 group-hover:to-primary-600/5 
              transition-all duration-300 rounded-2xl pointer-events-none"></div>
</div>