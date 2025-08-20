<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { Building2, Calendar, BarChart3, Settings, Search, Heart, Grid3X3, PieChart } from 'lucide-svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import { config } from '$lib/utils/config.js';
</script>

<svelte:head>
  <title>{config.siteName} - {config.siteDescription}</title>
  <meta name="description" content="{config.siteDescription}" />
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
          <a 
            href="/" 
            class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
          >
            <Search size={18} />
            <span>홈</span>
          </a>
          <a 
            href="/search" 
            class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/search' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
          >
            <Search size={18} />
            <span>검색</span>
          </a>
          <a 
            href="/dashboard" 
            class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
          >
            <PieChart size={18} />
            <span>대시보드</span>
          </a>
          <a 
            href="/calendar" 
            class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
          >
            <Calendar size={18} />
            <span>캘린더</span>
          </a>
          <a 
            href="/analysis" 
            class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/analysis' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
          >
            <BarChart3 size={18} />
            <span>분석</span>
          </a>
          <a 
            href="/datasheet" 
            class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors {$page.url.pathname === '/datasheet' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
          >
            <Grid3X3 size={18} />
            <span>데이터시트</span>
          </a>
        </nav>

        <!-- Mobile menu button & User actions -->
        <div class="flex items-center space-x-2">
          <button class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Heart size={20} />
          </button>
          <button class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings size={20} />
          </button>
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
            <li><a href="/tools/resume" class="hover:text-white transition-colors">AI 자기소개서</a></li>
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
        <p>© 2024 {config.siteName}. Made with ❤️ for 부산 청년들</p>
      </div>
    </div>
  </footer>
  
  <!-- Toast Notifications -->
  <Toast />
</div>