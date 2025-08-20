<script>
  import { TrendingUp, Users, Calendar, AlertCircle, ArrowRight, Search, Filter } from 'lucide-svelte';
  import JobCard from '$lib/components/JobCard.svelte';
  import { config } from '$lib/utils/config.js';
  
  // Stores
  import { stats, recommendedJobs, urgentJobs } from '$lib/stores/jobs.js';
  import { agenciesWithStats } from '$lib/stores/jobs.js';
  
  // 추가 통계 계산
  function getQuickStats() {
    return {
      thisMonth: $stats.thisMonthJobs || 0,
      urgent: $stats.urgentJobs || 0
    };
  }
  
  $: quickStats = getQuickStats();
</script>

<svelte:head>
  <title>{config.siteName} - {config.siteDescription}</title>
  <meta name="description" content="{config.siteDescription}" />
</svelte:head>

<div class="space-y-12">
  <!-- Hero Section -->
  <section class="text-center py-16 px-4">
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
        <TrendingUp size={16} class="mr-2" />
        부산 청년 취업의 새로운 시작
      </div>
      
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
        <span class="text-primary-600">5개 기관</span>, <span class="text-secondary-500">하나의 플랫폼</span>
      </h1>
      
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        부산시 산하 공사/공단의 채용정보를 통합하여<br>
        구직자에게는 편리한 정보 접근을, 채용담당자에게는 효율적인 채용 홍보를 제공합니다
      </p>
      
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
        <a href="/search" class="btn-primary inline-flex items-center space-x-2">
          <Search size={20} />
          <span>채용정보 검색</span>
          <ArrowRight size={16} />
        </a>
        
        <a href="/analysis" class="btn-secondary inline-flex items-center space-x-2">
          <TrendingUp size={20} />
          <span>트렌드 분석</span>
        </a>
      </div>
    </div>
  </section>
  
  <!-- 실시간 통계 -->
  <section class="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
    <div class="card p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 animate-fade-in">
      <div class="w-12 h-12 mx-auto mb-4 bg-blue-500 rounded-xl flex items-center justify-center">
        <Calendar class="text-white" size={24} />
      </div>
      <div class="text-2xl lg:text-3xl font-bold text-blue-600">{$stats.activeJobs}건</div>
      <div class="text-sm text-gray-600">진행중인 채용</div>
    </div>
    
    <div class="card p-6 text-center bg-gradient-to-br from-orange-50 to-orange-100 animate-fade-in">
      <div class="w-12 h-12 mx-auto mb-4 bg-orange-500 rounded-xl flex items-center justify-center">
        <AlertCircle class="text-white" size={24} />
      </div>
      <div class="text-2xl lg:text-3xl font-bold text-orange-600">{$stats.urgentJobs}건</div>
      <div class="text-sm text-gray-600">마감임박 (D-3)</div>
    </div>
    
    <div class="card p-6 text-center bg-gradient-to-br from-green-50 to-green-100 animate-fade-in">
      <div class="w-12 h-12 mx-auto mb-4 bg-green-500 rounded-xl flex items-center justify-center">
        <TrendingUp class="text-white" size={24} />
      </div>
      <div class="text-2xl lg:text-3xl font-bold text-green-600">{$stats.thisMonthJobs}건</div>
      <div class="text-sm text-gray-600">이번달 신규</div>
    </div>
    
    <div class="card p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 animate-fade-in">
      <div class="w-12 h-12 mx-auto mb-4 bg-purple-500 rounded-xl flex items-center justify-center">
        <Users class="text-white" size={24} />
      </div>
      <div class="text-2xl lg:text-3xl font-bold text-purple-600">{$stats.totalHired}명</div>
      <div class="text-sm text-gray-600">5년간 채용</div>
    </div>
  </section>
  
  <!-- 참여기관 현황 -->
  <section class="space-y-8">
    <div class="text-center">
      <h2 class="text-subheading mb-2">참여기관 현황</h2>
      <p class="text-gray-600">부산시 산하 5개 공사/공단의 채용정보를 통합 제공</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each $agenciesWithStats.slice(0, 5) as agency}
        <div class="card p-6 hover:shadow-xl transition-all duration-300 group animate-fade-in">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <span class="text-white font-bold text-sm">{agency.name.slice(2, 4)}</span>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {agency.name}
                </h3>
                <p class="text-sm text-gray-500">{agency.type}</p>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">진행중</span>
              <div class="font-semibold text-blue-600">{agency.stats?.totalJobs || 0}건</div>
            </div>
            <div>
              <span class="text-gray-500">평균 경쟁률</span>
              <div class="font-semibold text-gray-900">{agency.stats.avgCompetition}</div>
            </div>
          </div>
          
          <div class="mt-4 pt-4 border-t border-gray-100">
            <div class="flex flex-wrap gap-1">
              {#each agency.stats.popularCategories || ['운영직', '기술직', '행정직'] as category}
                <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {category}
                </span>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>
  
  <!-- 추천 채용정보 -->
  <section class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-subheading">추천 채용정보</h2>
        <p class="text-gray-600">현재 진행중인 채용공고</p>
      </div>
      <a href="/search" class="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1">
        <span>전체보기</span>
        <ArrowRight size={16} />
      </a>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
      {#each $recommendedJobs.slice(0, 3) as job}
        <div class="animate-fade-in">
          <JobCard {job} />
        </div>
      {/each}
    </div>
  </section>
  
  <!-- 마감임박 & 경쟁률 낮은 채용정보 -->
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-12">
    <!-- 마감임박 -->
    <section class="space-y-4">
      <div class="flex items-center space-x-2">
        <AlertCircle size={20} class="text-red-500" />
        <h3 class="text-lg font-bold text-gray-900">마감임박 채용</h3>
        <span class="badge-error">긴급</span>
      </div>
      
      <div class="space-y-4">
        {#each $urgentJobs.slice(0, 3) as job}
          <div class="card p-4 border-l-4 border-red-500 animate-fade-in">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-gray-900 text-sm leading-tight">{job.jobTitle}</h4>
              <span class="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                D-{Math.ceil((new Date(job.endDate) - new Date()) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm text-gray-600">
              <span>{job.agencyName}</span>
              <span>{job.requiredCount}명 모집</span>
            </div>
          </div>
        {/each}
      </div>
    </section>
    
    <!-- 경쟁률 낮은 채용 -->
    <section class="space-y-4">
      <div class="flex items-center space-x-2">
        <TrendingUp size={20} class="text-green-500" />
        <h3 class="text-lg font-bold text-gray-900">경쟁률 낮은 채용</h3>
        <span class="badge-success">추천</span>
      </div>
      
      <div class="space-y-4">
        {#each $recommendedJobs.slice(0, 3) as job}
          <div class="card p-4 border-l-4 border-green-500 animate-fade-in">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-gray-900 text-sm leading-tight">{job.jobTitle}</h4>
              <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                대규모 채용
              </span>
            </div>
            <div class="flex items-center justify-between text-sm text-gray-600">
              <span>{job.agencyName}</span>
              <span class="font-semibold text-green-600">{job.requiredCount}명 모집</span>
            </div>
          </div>
        {/each}
      </div>
    </section>
  </div>
</div>