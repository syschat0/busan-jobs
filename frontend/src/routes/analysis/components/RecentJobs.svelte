<script>
  import { Clock, ExternalLink, Users, Calendar } from 'lucide-svelte';
  
  export let data = { jobs: [], competition: [], hiring: [] };

  // 최근 채용공고 분석
  $: recentJobs = analyzeRecentJobs();

  function analyzeRecentJobs() {
    const jobs = data.jobs
      .map(job => ({
        ...job,
        startDate: parseDate(job.접수시작일 || job.공고시작일),
        endDate: parseDate(job.접수마감일 || job.공고마감일),
        competition: findCompetition(job)
      }))
      .filter(job => job.startDate)
      .sort((a, b) => b.startDate - a.startDate)
      .slice(0, 10);

    return jobs;
  }

  function parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      // 다양한 날짜 형식 처리
      if (dateString.includes('-')) {
        return new Date(dateString);
      }
      if (dateString.includes('.')) {
        const parts = dateString.split('.');
        return new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
      }
      if (dateString.includes('/')) {
        return new Date(dateString);
      }
      
      return new Date(dateString);
    } catch (error) {
      console.warn('날짜 파싱 실패:', dateString);
      return null;
    }
  }

  function findCompetition(job) {
    // 실제 API 데이터 구조에 맞게 수정
    const jobCategories = job.일반전형 ? job.일반전형.split(',').map(c => c.trim()) : [];
    
    const competition = data.competition.find(comp => 
      comp.기관명 === job.기관명 && 
      jobCategories.some(cat => comp.직렬 === cat)
    );
    
    return competition ? parseFloat(competition.경쟁률 || '0') : 0;
  }

  // 날짜 포맷팅
  function formatDate(date) {
    if (!date) return '-';
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  }

  // 상대적 시간 계산
  function getRelativeTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
  }

  // 채용공고 상태 판단
  function getJobStatus(job) {
    const now = new Date();
    
    if (job.startDate && job.startDate > now) {
      return { status: 'upcoming', text: '예정', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
    
    if (job.endDate && job.endDate < now) {
      return { status: 'closed', text: '마감', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
    
    if (job.endDate) {
      const diffTime = job.endDate - now;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3) {
        return { status: 'urgent', text: `D-${diffDays}`, color: 'text-red-600', bg: 'bg-red-100' };
      }
      if (diffDays <= 7) {
        return { status: 'warning', text: `D-${diffDays}`, color: 'text-amber-600', bg: 'bg-amber-100' };
      }
    }
    
    return { status: 'active', text: '진행중', color: 'text-green-600', bg: 'bg-green-100' };
  }

  // 경쟁률 레벨
  function getCompetitionLevel(rate) {
    if (rate === 0) return { text: '예상 불가', color: 'text-gray-500' };
    if (rate < 10) return { text: '낮음', color: 'text-green-600' };
    if (rate < 30) return { text: '보통', color: 'text-amber-600' };
    return { text: '높음', color: 'text-red-600' };
  }
</script>

<div class="space-y-4">
  {#if recentJobs.length > 0}
    <!-- 최근 공고 목록 -->
    <div class="space-y-3 max-h-96 overflow-y-auto">
      {#each recentJobs as job}
        {@const jobStatus = getJobStatus(job)}
        {@const competitionLevel = getCompetitionLevel(job.competition)}
        
        <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors group">
          <!-- 헤더 -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                {job.공고명 || job.채용공고명 || '채용공고'}
              </h4>
              <div class="flex items-center space-x-2 text-xs text-gray-600">
                <span class="font-medium">{job.기관명}</span>
                {#if job.일반전형}
                  <span>•</span>
                  <span>{job.일반전형.split(',')[0].trim()}</span>
                  {#if job.일반전형.split(',').length > 1}
                    <span class="text-gray-500">외 {job.일반전형.split(',').length - 1}개</span>
                  {/if}
                {/if}
              </div>
            </div>

            <!-- 상태 배지 -->
            <span class="px-2 py-1 {jobStatus.bg} {jobStatus.color} text-xs font-medium rounded-full ml-2 shrink-0">
              {jobStatus.text}
            </span>
          </div>

          <!-- 상세 정보 -->
          <div class="grid grid-cols-2 gap-3 text-xs">
            <!-- 접수 기간 -->
            <div class="flex items-center space-x-2">
              <Calendar size={12} class="text-gray-400 shrink-0" />
              <div class="min-w-0">
                <div class="text-gray-600 truncate">
                  {formatDate(job.startDate)} ~ {formatDate(job.endDate)}
                </div>
                <div class="text-gray-500">
                  {getRelativeTime(job.startDate)}
                </div>
              </div>
            </div>

            <!-- 예상 경쟁률 -->
            <div class="flex items-center space-x-2">
              <Users size={12} class="text-gray-400 shrink-0" />
              <div>
                <div class="text-gray-600">
                  {#if job.competition > 0}
                    {job.competition.toFixed(1)}:1
                  {:else}
                    예상 불가
                  {/if}
                </div>
                <div class="{competitionLevel.color}">
                  {competitionLevel.text}
                </div>
              </div>
            </div>
          </div>

          <!-- 채용인원 (있는 경우) -->
          {#if job.채용인원 || job.모집인원}
            <div class="mt-2 pt-2 border-t border-gray-200">
              <div class="flex items-center space-x-2 text-xs">
                <Users size={12} class="text-gray-400" />
                <span class="text-gray-600">모집인원:</span>
                <span class="font-medium text-gray-900">
                  {job.채용인원 || job.모집인원}명
                </span>
              </div>
            </div>
          {/if}

          <!-- 액션 버튼 (호버 시 표시) -->
          <div class="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800">
              <ExternalLink size={12} />
              <span>상세보기</span>
            </button>
          </div>
        </div>
      {/each}
    </div>

    <!-- 더보기 버튼 -->
    <div class="text-center pt-2 border-t border-gray-200">
      <button class="text-sm text-blue-600 hover:text-blue-800 font-medium">
        전체 채용공고 보기
      </button>
    </div>
  {:else}
    <!-- 빈 상태 -->
    <div class="text-center py-8">
      <Clock size={32} class="mx-auto text-gray-400 mb-3" />
      <div class="text-sm text-gray-600 mb-1">
        최근 채용공고가 없습니다
      </div>
      <div class="text-xs text-gray-500">
        새로운 공고가 등록되면 여기에 표시됩니다
      </div>
    </div>
  {/if}

  <!-- 요약 정보 -->
  {#if recentJobs.length > 0}
    {@const activeCount = recentJobs.filter(job => getJobStatus(job).status === 'active').length}
    {@const urgentCount = recentJobs.filter(job => getJobStatus(job).status === 'urgent').length}
    
    <div class="bg-blue-50 rounded-lg p-3">
      <div class="text-xs text-blue-800">
        💡 최근 {recentJobs.length}개 공고 중 
        <span class="font-medium text-green-600">{activeCount}개 진행중</span>
        {#if urgentCount > 0}
          , <span class="font-medium text-red-600">{urgentCount}개 마감임박</span>
        {/if}
      </div>
    </div>
  {/if}
</div>