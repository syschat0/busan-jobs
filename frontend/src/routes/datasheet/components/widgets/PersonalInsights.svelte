<script>
  import { Brain, Lightbulb } from 'lucide-svelte';
  
  export let widget;
  
  // TODO: 개인화 인사이트 위젯 구현
</script>

<div class="personal-insights">
  <div class="coming-soon">
    <Brain size={32} class="text-gray-400" />
    <h3 class="text-lg font-semibold text-gray-700 mt-3">AI 개인화 인사이트</h3>
    <p class="text-sm text-gray-500 mt-2">곧 업데이트됩니다</p>
  </div>
</div>

<style>
  .personal-insights {
    @apply h-full flex items-center justify-center;
  }
  
  .coming-soon {
    @apply text-center;
  }
</style>