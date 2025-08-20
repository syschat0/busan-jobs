<script>
  import { TrendingUp, BarChart3 } from 'lucide-svelte';
  
  export let widget;
  
  // TODO: 트렌드 분석 위젯 구현
</script>

<div class="trend-analysis">
  <div class="coming-soon">
    <TrendingUp size={32} class="text-gray-400" />
    <h3 class="text-lg font-semibold text-gray-700 mt-3">트렌드 분석</h3>
    <p class="text-sm text-gray-500 mt-2">곧 업데이트됩니다</p>
  </div>
</div>

<style>
  .trend-analysis {
    @apply h-full flex items-center justify-center;
  }
  
  .coming-soon {
    @apply text-center;
  }
</style>