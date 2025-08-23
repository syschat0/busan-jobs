<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { Building2, Calendar, BarChart3, Settings, Search, Heart, Grid3X3, PieChart, LogIn, LogOut, Airplay, AirVentIcon, Brain, Palette, Home} from 'lucide-svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import UserRadarChartModal from '$lib/components/UserRadarChartModal.svelte';
  import { config } from '$lib/utils/config.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  import { userInfo } from "$lib/stores/userStore";
  
  // 레이더 차트 모달 상태
  let showRadarChart = false;
  let radarChartData = null;

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

  async function checkSession() {
    try {
      const res = await fetch(`${BACKEND_URL}/user/SessionInfo`, {
        method: "GET",
        credentials: "include"
      });
      const result = await res.json();

      if (result.RESULT === "OK") {
        userInfo.set(result.USER);   // store 갱신
      } else {
        userInfo.set(null);
      }
    } catch (e) {
      console.error("세션 확인 오류:", e);
      userInfo.set(null);
    }
  }

  async function logout() {
    try {
      await fetch(`${BACKEND_URL}/user/Logout`, {
        method: "POST",
        credentials: "include"
      });
      userInfo.set(null);  // 로그아웃 시 store 초기화
      goto("/");
    } catch (e) {
      console.error("로그아웃 오류:", e);
    }
  }

  async function openUserRadarChart() {
    try {
      if (!$userInfo || !$userInfo.email) {
        console.error("사용자 이메일 정보가 없습니다.");
        return;
      }
      
      const encodedEmail = encodeURIComponent($userInfo.email);
      const response = await fetch(`${BACKEND_URL}/api/result?email=${encodedEmail}`, {
        method: "GET",
        credentials: "include"
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("레이더 차트 데이터:", result);
        
        // STATS name을 key로 맵핑하는 객체
        const nameToKeyMap = {
          '성실성': 'conscientiousness',
          '개방성': 'openness',
          '외향성': 'extraversion',
          '우호성': 'agreeableness',
          '정서안정성': 'emotional_stability',
          '기술전문성': 'technical_mastery',
          '인지문제해결': 'cognitive_problem_solving',
          '대인영향력': 'interpersonal_influence',
          '자기관리': 'self_management',
          '적응력': 'adaptability',
          '학습속도': 'learning_speed',
          '대인민첩성': 'people_agility',
          '성과민첩성': 'result_agility',
          '자기인식': 'self_awareness',
          '자기조절': 'self_regulation',
          '공감사회기술': 'empathy_social'
        };
        
        // result.data를 key 기반 객체로 변환
        const convertedUserWeights = {};
        if (result.data && Array.isArray(result.data)) {
          result.data.forEach(item => {
            if (item.name && item.value !== undefined) {
              const key = nameToKeyMap[item.name];
              if (key) {
                convertedUserWeights[key] = item.value;
              }
            }
          });
        } else if (result.data && typeof result.data === 'object') {
          // result.data가 객체인 경우
          Object.entries(result.data).forEach(([name, value]) => {
            const key = nameToKeyMap[name];
            if (key) {
              convertedUserWeights[key] = value;
            }
          });
        }
        
        // 데이터를 UserRadarChart 컴포넌트에 맞는 형태로 변환
        radarChartData = {
          jobWeights: result.jobWeights || {},
          userWeights: convertedUserWeights,
          rawData: result // 원본 데이터도 함께 저장
        };
        
        console.log("변환된 사용자 가중치:", convertedUserWeights);
        
        // 모달 열기
        showRadarChart = true;
      } else {
        console.error("레이더 차트 데이터 가져오기 실패:", response.status);
      }
    } catch (e) {
      console.error("레이더 차트 오류:", e);
    }
  }

  function closeRadarChart() {
    showRadarChart = false;
    radarChartData = null;
  }
  onMount(() => {
    checkSession();
  });
</script>

<svelte:head>
  <title>{config.siteName} - {config.siteDescription}</title>
  <meta name="description" content={config.siteDescription} />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
  <!-- Header -->
  <header class="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <a href="/" class="flex items-center space-x-3 group">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <Building2 size={24} class="text-white" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">{config.siteName}</h1>
            <p class="text-xs text-gray-500">{config.siteDescription}</p>
          </div>
        </a>

        <!-- Navigation -->
        <nav class="hidden md:flex items-center space-x-1">
          <a href="/" class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}">
            <Home size={18} />
            <span>홈</span>
          </a>
          <a href="/search" class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/search' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}">
            <Search size={18} />
            <span>검색</span>
          </a>
          <a href="/calendar" class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}">
            <Calendar size={18} />
            <span>캘린더</span>
          </a>
          <a href="/analysis" class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/analysis' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}">
            <BarChart3 size={18} />
            <span>분석</span>
          </a>
          <a href="/datasheet" class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/datasheet' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}">
            <Grid3X3 size={18} />
            <span>데이터시트</span>
          </a>
          <a href="/aimatch" class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/aimatch' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}">
            <Brain size={18} />
            <span>AI매칭</span>
          </a>
        </nav>

        <!-- User actions -->
        <div class="flex items-center space-x-2">
          {#if $userInfo}
            <button 
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              on:click={openUserRadarChart}
              title="내 레이더 차트 보기"
            >
              <Palette size={20} class="text-gray-600 hover:text-blue-600" />
            </button>
            <span class="text-gray-700 font-medium">{$userInfo.name} 님 안녕하세요 👋</span>
            <button
                    class="flex items-center space-x-2 px-2 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    on:click={logout}
            >
              <LogOut size={20} />
              <span>로그아웃</span>
            </button>
          {:else}
            <a href="/login"
               class="flex items-center space-x-2 px-2 py-2 rounded-lg transition-colors {$page.url.pathname === '/login' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
            >
              <LogIn size={20} />
              <span>로그인</span>
            </a>
          {/if}
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1">
    <div class="container-custom section-padding">
      <slot />
    </div>
  </main>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="col-span-1 md:col-span-2">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 size={18} class="text-white" />
            </div>
            <span class="text-lg font-bold">{config.siteName}</span>
          </div>
          <p class="text-gray-400 mb-4">
            부산시 5개 공사/공단의 채용정보를 통합하여<br>
            구직자와 채용담당자 모두에게 편리한 서비스를 제공합니다.
          </p>
          <div class="text-sm text-gray-400">
            <p>🏢 부산교통공사 • 부산도시공사 • 부산시설공단 • 부산환경공단 • 부산관광공사</p>
          </div>
        </div>

        <div>
          <h3 class="font-semibold mb-4">서비스</h3>
          <ul class="space-y-2 text-sm text-gray-400">
            <li><a href="/search" class="hover:text-white transition-colors">채용정보 검색</a></li>
            <li><a href="/calendar" class="hover:text-white transition-colors">채용 캘린더</a></li>
            <li><a href="/analysis" class="hover:text-white transition-colors">경쟁률 분석</a></li>
            <li><a href="/job-register" class="hover:text-white transition-colors">채용정보등록</a></li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-4">지원</h3>
          <ul class="space-y-2 text-sm text-gray-400">
            <li><a href="/help" class="hover:text-white transition-colors">이용가이드</a></li>
            <li><a href="/contact" class="hover:text-white transition-colors">문의하기</a></li>
            <li><a href="/privacy" class="hover:text-white transition-colors">개인정보처리방침</a></li>
          </ul>
        </div>
      </div>

      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
        <p>© 2025 {config.siteName}. Made with ❤️ for 부산 청년들</p>
      </div>
    </div>
  </footer>

  <!-- Toast Notifications -->
  <Toast />
  
  <!-- User Radar Chart Modal -->
  <UserRadarChartModal 
    isOpen={showRadarChart} 
    radarData={radarChartData}
    showJobMatching={false}
    on:close={closeRadarChart} 
  />
</div>
