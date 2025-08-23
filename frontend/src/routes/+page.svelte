<script>
  import {
    TrendingUp,
    Users,
    Calendar,
    AlertCircle,
    ArrowRight,
    Search,
    Filter,
    Heart,
    MapPin,
    ExternalLink
  } from 'lucide-svelte';
  import JobCard from '$lib/components/JobCard.svelte';
  import { config } from '$lib/utils/config.js';
  // RSY. Svelte 컴포넌트가 DOM에 처음 붙을 때 실행되는 함수
  import { onMount } from 'svelte';

  // Backend URL from environment variable
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

  // Stores
  import { stats, recommendedJobs, urgentJobs } from '$lib/stores/jobs.js';
  import { userInfo } from "$lib/stores/userStore";
  import {format} from "date-fns";
  import {ko} from "date-fns/locale";

  // 변수 선언
  let isLoading = true;
  let error = null;



  // 전체채용정보
  let totJobOpening = {
    activeJobs: 0,                   // 진행중인 채용
    urgentJobs: 0,                   // 마감임박(D-3)
    thisMonthJobs: 0,                // 이번달 신규
    totalHired: 0                    // 5년간 채용
  };

  // 참여기관별 채용
  let agencyJobOpening = { };

  // 참여기관별 채용 직렬
  let agencyJobOpeningJobseries = { };

  // 추천 채용 정보
  let recommendJobOpening = { }

  // 마감임박 채용
  let urgentJobOpening = { }

  // 경쟁률 낮은 채용
  let lowCompetitionRateJobOpening = { };

  // DOM에 처음 붙을 때 실행되는 함수
  // 초기 데이터 로드
  onMount(async () => {
    await loadHomeStats();
  });



  // 백엔드에서 홈페이지 통계 데이터 가져오기
  async function loadHomeStats() {

    isLoading = true;
    error = null;


    console.log('===== $userInfo :', $userInfo);


    try {
      const response = await fetch(`${BACKEND_URL}/home`, {
        method: 'GET',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('===== result :', result);

      totJobOpening = result.totJobOpening;
      agencyJobOpening = result.agencyJobOpening;
      agencyJobOpeningJobseries = result.agencyJobOpeningJobseries;
      recommendJobOpening = result.recommendJobOpening;
      urgentJobOpening = result.urgentJobOpening;
      lowCompetitionRateJobOpening = result.lowCompetitionRateJobOpening;


      console.log('===== totJobOpening :', totJobOpening);
      console.log('===== agencyJobOpening :', agencyJobOpening);
      console.log('===== agencyJobOpeningJobseries :', agencyJobOpeningJobseries);
      console.log('===== recommendJobOpening :', recommendJobOpening);
      console.log('===== urgentJobOpening :', urgentJobOpening);
      console.log('===== lowCompetitionRateJobOpening :', lowCompetitionRateJobOpening);

    } catch (error) {
      console.error('API 요청 실패:', error);
      // API 실패 시 기본값 설정
      totJobOpening = {
        activeJobs: 0,
        urgentJobs: 0,
        thisMonthJobs: 0,
        totalHired: 0
      };
      agencyJobOpening = [];
      agencyJobOpeningJobseries = [];
      urgentJobOpening = [];
      lowCompetitionRateJobOpening = [];
      throw error;
    }
    finally {
      isLoading = false;
    }
  }


  // 기관별 인기 직렬 카테고리 추출
  function getPopularCategories(agencyName) {
    if (!agencyJobOpeningJobseries || agencyJobOpeningJobseries.length === 0) {
      return ['운영직', '기술직', '행정직'];
    }

    // 해당 기관의 직렬들 필터링
    const agencySeries = agencyJobOpeningJobseries.filter(item => item.name === agencyName);

    // 직렬명에서 카테고리 추출 (괄호 제거, 중복 제거)
    const categories = agencySeries.map(item => {
      let category = item.jobSeries;

      // 괄호 안의 내용 제거
      if (category.includes('(')) {
        category = category.split('(')[0];
      }

      // 특수한 경우 처리
      if (category.includes('일반직')) return '일반직';
      if (category.includes('경력직')) return '경력직';
      if (category.includes('공무직')) return '공무직';
      if (category.includes('청년인턴')) return '청년인턴';
      if (category.includes('체험형')) return '체험형인턴';

      return category;
    });

    // 중복 제거하고 상위 3개만 반환
    const uniqueCategories = [...new Set(categories)].slice(0, 3);

    return uniqueCategories.length > 0 ? uniqueCategories : ['운영직', '기술직', '행정직'];
  }


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

    {#if isLoading}
      <!-- 로딩 상태 -->
      {#each Array(4) as _, i}
        <div class="card p-6 text-center bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse">
          <div class="w-12 h-12 mx-auto mb-4 bg-gray-300 rounded-xl flex items-center justify-center">
            <div class="w-6 h-6 bg-gray-400 rounded"></div>
          </div>
          <div class="text-2xl lg:text-3xl font-bold text-gray-400">--</div>
          <div class="text-sm text-gray-500">로딩중...</div>
        </div>
      {/each}
    {:else if error}
      <!-- 에러 상태 -->
      <div class="col-span-full card p-6 text-center bg-gradient-to-br from-red-50 to-red-100">
        <div class="w-12 h-12 mx-auto mb-4 bg-red-500 rounded-xl flex items-center justify-center">
          <AlertCircle class="text-white" size={24} />
        </div>
        <div class="text-lg font-bold text-red-600 mb-2">데이터 로딩 실패</div>
        <div class="text-sm text-red-500 mb-4">{error}</div>
        <button
                class="btn-primary text-sm px-4 py-2"
                on:click={loadHomeStats}
        >
          다시 시도
        </button>
      </div>
    {:else}
      <!-- 정상 데이터 표시 -->
      <a href="/search?status=accepting" class="card p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 animate-fade-in hover:shadow-lg transition-all duration-300 block">
        <div class="w-12 h-12 mx-auto mb-4 bg-blue-500 rounded-xl flex items-center justify-center">
          <Calendar class="text-white" size={24} />
        </div>
        <div class="text-2xl lg:text-3xl font-bold text-blue-600">{totJobOpening.activeJobs}건</div>
        <div class="text-sm text-gray-600">진행중인 채용</div>
      </a>

      <div class="card p-6 text-center bg-gradient-to-br from-orange-50 to-orange-100 animate-fade-in">
        <div class="w-12 h-12 mx-auto mb-4 bg-orange-500 rounded-xl flex items-center justify-center">
          <AlertCircle class="text-white" size={24} />
        </div>
        <div class="text-2xl lg:text-3xl font-bold text-orange-600">{totJobOpening.urgentJobs}건</div>
        <div class="text-sm text-gray-600">마감임박 (D-3)</div>
      </div>

      <div class="card p-6 text-center bg-gradient-to-br from-green-50 to-green-100 animate-fade-in">
        <div class="w-12 h-12 mx-auto mb-4 bg-green-500 rounded-xl flex items-center justify-center">
          <TrendingUp class="text-white" size={24} />
        </div>
        <div class="text-2xl lg:text-3xl font-bold text-green-600">{totJobOpening.thisMonthJobs}건</div>
        <div class="text-sm text-gray-600">이번달 신규</div>
      </div>

      <div class="card p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 animate-fade-in">
        <div class="w-12 h-12 mx-auto mb-4 bg-purple-500 rounded-xl flex items-center justify-center">
          <Users class="text-white" size={24} />
        </div>
        <div class="text-2xl lg:text-3xl font-bold text-purple-600">{totJobOpening.totalHired}명</div>
        <div class="text-sm text-gray-600">5년간 채용</div>
      </div>
    {/if}
  </section>

  <!-- 참여기관 현황 -->
  <section class="space-y-8">
    <div class="text-center">
      <h2 class="text-subheading mb-2">참여기관 현황</h2>
      <p class="text-gray-600">부산시 산하 5개 공사/공단의 채용정보를 통합 제공</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each agencyJobOpening as agency}
        <div class="card overflow-hidden hover:shadow-xl transition-all duration-300 group animate-fade-in">
          <!-- 상단 이미지 영역 -->
          <div class="relative h-48 overflow-hidden">
            <!-- 기관별 실제 배경 이미지 -->
            {#if agency.name.includes('교통공사')}
              <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1545459720-aac8509eb02c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-600/40 to-blue-800/40"></div>
              </div>
            {:else if agency.name.includes('도시공사')}
              <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');">
                <div class="absolute inset-0 bg-gradient-to-br from-green-600/40 to-green-800/40"></div>
              </div>
            {:else if agency.name.includes('시설공단')}
              <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');">
                <div class="absolute inset-0 bg-gradient-to-br from-purple-600/40 to-purple-800/40"></div>
              </div>
            {:else if agency.name.includes('환경공단')}
              <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');">
                <div class="absolute inset-0 bg-gradient-to-br from-emerald-600/40 to-emerald-800/40"></div>
              </div>
            {:else}
              <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');">
                <div class="absolute inset-0 bg-gradient-to-br from-gray-600/40 to-gray-800/40"></div>
              </div>
            {/if}

            <!-- 기관 로고/아이콘 -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                <span class="text-white font-bold text-2xl">{agency.name.slice(2, 4)}</span>
              </div>
            </div>

            <!-- 기관명 오버레이 -->
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <h3 class="text-white font-bold text-xl group-hover:text-blue-200 transition-colors">
                {agency.name}
              </h3>
              <p class="text-white/80 text-sm">공공기관</p>
            </div>
          </div>

          <!-- 하단 정보 영역 -->
          <div class="p-6">
            <!-- 통계 정보 -->
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600 mb-1">{agency.totalJobs}</div>
                <div class="text-sm text-gray-500">진행중인 채용</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900 mb-1">{agency.avgCompetition}:1</div>
                <div class="text-sm text-gray-500">평균 경쟁률</div>
              </div>
            </div>

            <!-- 인기 직렬 태그 -->
            <div class="space-y-3">
              <div class="text-sm font-medium text-gray-700">주요 채용 직렬</div>
              <div class="flex flex-wrap gap-2">
                {#each getPopularCategories(agency.name) as category}
                   <span class="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium border border-blue-200">
                     {category}
                   </span>
                {/each}
              </div>
            </div>

            <!-- 상세보기 버튼 -->
            <div class="mt-6 pt-4 border-t border-gray-100">
              <a href="/search?agency={encodeURIComponent(agency.name)}" class="w-full btn-secondary text-sm py-2 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 block text-center">
                상세 정보 보기
              </a>
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
        <h2 class="text-subheading">AI 자동 매칭 채용정보</h2>
        <p class="text-gray-600">현재 진행중인 채용공고</p>
      </div>
      <a href="/search" class="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1">
        <span>전체보기</span>
        <ArrowRight size={16} />
      </a>
    </div>


    {#if $userInfo}
      <!-- 로그인을 했을때 -->
      {#if recommendJobOpening && recommendJobOpening.length > 0}
        <!-- 추천 채용정보가 있을 때 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {#each recommendJobOpening.slice(0, 3) as job}
            <div class="card p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer animate-fade-in">
              <!-- 기관명 -->
              <div class="flex items-center space-x-2 mb-3">
                <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span class="text-sm font-medium text-primary-600">{job.agencyName}</span>
              </div>

              <!-- 공고명 -->
              <h3 class="text-lg font-bold text-gray-900 mb-4 group-hover:text-primary-700 transition-colors leading-tight">
                {job.jobTitle}
              </h3>

              <!-- 접수기간 -->
              <div class="flex items-center space-x-2 mb-3 text-sm text-gray-600">
                <Calendar size={16} class="text-gray-400" />
                <span>접수기간</span>
              </div>
              <div class="text-sm font-medium text-gray-900 mb-4">
                {format(new Date(job.applicationStart), 'M.dd', { locale: ko })} ~ {format(new Date(job.applicationEnd), 'M.dd', { locale: ko })}
              </div>

              <!-- 모집직렬 -->
              <div class="flex items-center space-x-2 mb-4 text-sm text-gray-600">
                <Users size={16} class="text-gray-400" />
                <span>모집직렬</span>
              </div>
              <div class="text-sm font-medium text-gray-900 mb-4">
                {job.jobSeries || '일반직'}
              </div>

              <!-- 지원하기 버튼 -->
              <button class="w-full btn-primary text-sm py-2 mt-auto">
                지원하기
              </button>
            </div>
          {/each}
        </div>
      {:else}
        <!-- 로그인이 없을때 로그인 안내 -->
        <div class="card p-12 text-center bg-gradient-to-br from-blue-50 to-blue-100 animate-fade-in">
          <div class="w-20 h-20 mx-auto mb-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Search class="text-white" size={32} />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">개인 맞춤 채용정보를 받아보세요</h3>
          <p class="text-gray-600 mb-8 max-w-md mx-auto">
            AI 매칭을 하시면 관심 직렬을 기반으로 한 맞춤 채용정보를 추천해드립니다.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/aimatch" class="btn-primary inline-flex items-center space-x-2">
              <span>AI 매칭</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      {/if}
    {:else}
      <!-- 로그인이 없을때 로그인 안내 -->
      <div class="card p-12 text-center bg-gradient-to-br from-blue-50 to-blue-100 animate-fade-in">
        <div class="w-20 h-20 mx-auto mb-6 bg-blue-500 rounded-full flex items-center justify-center">
          <Search class="text-white" size={32} />
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-4">개인 맞춤 채용정보를 받아보세요</h3>
        <p class="text-gray-600 mb-8 max-w-md mx-auto">
          로그인하시면 관심 직렬을 기반으로 한 맞춤 채용정보를 추천해드립니다.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/login" class="btn-primary inline-flex items-center space-x-2">
            <span>로그인하기</span>
            <ArrowRight size={16} />
          </a>
          <a href="/register" class="btn-secondary inline-flex items-center space-x-2">
            <span>회원가입</span>
          </a>
        </div>
      </div>
    {/if}
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

      {#if urgentJobOpening && urgentJobOpening.length > 0}
        <div class="space-y-4">
          {#each urgentJobOpening.slice(0, 3) as job}
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
      {:else}
        <div class="card p-8 text-center bg-gradient-to-br from-red-50 to-red-100 animate-fade-in">
          <div class="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
            <AlertCircle class="text-white" size={24} />
          </div>
          <h4 class="text-lg font-bold text-gray-900 mb-2">현재 마감임박 채용이 없습니다</h4>
          <p class="text-gray-600 mb-4">새로운 채용공고를 확인해보세요</p>
          <a href="/search" class="btn-primary text-sm px-4 py-2">
            채용정보 검색
          </a>
        </div>
      {/if}
    </section>

    <!-- 경쟁률 낮은 채용 -->
    <section class="space-y-4">
      <div class="flex items-center space-x-2">
        <TrendingUp size={20} class="text-green-500" />
        <h3 class="text-lg font-bold text-gray-900">경쟁률 낮은 채용</h3>
        <span class="badge-success">추천</span>
      </div>


      {#if lowCompetitionRateJobOpening && lowCompetitionRateJobOpening.length > 0}
        <div class="space-y-4">
          {#each lowCompetitionRateJobOpening.slice(0, 3) as job}
            <div class="card p-4 border-l-4 border-green-500 animate-fade-in">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold text-gray-900 text-sm leading-tight">{job.jobTitle}</h4>
                <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                {job.requiredCount}명 모집 / {job.registCount}명 지원
              </span>
              </div>
              <div class="flex items-center justify-between text-sm text-gray-600">
                <span>{job.agencyName}</span>
                <span class="font-semibold text-green-600">{job.competitionRate} : 1</span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="card p-8 text-center bg-gradient-to-br from-green-50 to-green-100 animate-fade-in">
          <div class="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
            <TrendingUp class="text-white" size={24} />
          </div>
          <h4 class="text-lg font-bold text-gray-900 mb-2">현재 추천 채용이 없습니다</h4>
        </div>
      {/if}
    </section>
  </div>


</div>