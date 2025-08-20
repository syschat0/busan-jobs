<script>
  import { Building2, TrendingUp } from 'lucide-svelte';
  
  export let widget;
  
  // TODO: 기관별 비교 위젯 구현
</script>

<div class="agency-comparison">
  <div class="coming-soon">
    <Building2 size={32} class="text-gray-400" />
    <h3 class="text-lg font-semibold text-gray-700 mt-3">기관별 비교 분석</h3>
    <p class="text-sm text-gray-500 mt-2">곧 업데이트됩니다</p>
  </div>
</div>

<style>
  .agency-comparison {
    @apply h-full flex items-center justify-center;
  }
  
  .coming-soon {
    @apply text-center;
  }
</style>