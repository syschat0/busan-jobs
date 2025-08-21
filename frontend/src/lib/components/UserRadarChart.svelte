<script lang="ts">
  import { onMount } from 'svelte';
  
  interface Props {
    jobWeights: Record<string, number>;    // 채용공고의 직무 적합성 가중치
    userWeights: Record<string, number>;   // 사용자의 직무 적합성 점수
    size?: number;
    title?: string;
    showJobMatching?: boolean;             // 매칭도 표시 여부
  }
  
  let { jobWeights, userWeights, size = 360, title = '직무 적합성 비교', showJobMatching = true }: Props = $props();
  
  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;
  
  // RPG 능력치 정의
  const STATS = [
    // A. Big Five
    {key:'conscientiousness', name:'성실성', group:'A', category: '성격(빅파이브)'},
    {key:'openness', name:'개방성', group:'A', category: '성격(빅파이브)'},
    {key:'extraversion', name:'외향성', group:'A', category: '성격(빅파이브)'},
    {key:'agreeableness', name:'우호성', group:'A', category: '성격(빅파이브)'},
    {key:'emotional_stability', name:'정서안정성', group:'A', category: '성격(빅파이브)'},
    // B. Competency
    {key:'technical_mastery', name:'기술전문성', group:'B', category: '직무역량'},
    {key:'cognitive_problem_solving', name:'인지문제해결', group:'B', category: '직무역량'},
    {key:'interpersonal_influence', name:'대인·영향력', group:'B', category: '직무역량'},
    {key:'self_management', name:'자기관리', group:'B', category: '직무역량'},
    {key:'adaptability', name:'적응력', group:'B', category: '직무역량'},
    // C. Learning Agility
    {key:'learning_speed', name:'학습속도', group:'C', category: '학습민첩성'},
    {key:'people_agility', name:'대인민첩성', group:'C', category: '학습민첩성'},
    {key:'result_agility', name:'성과민첩성', group:'C', category: '학습민첩성'},
    // D. EQ
    {key:'self_awareness', name:'자기인식', group:'D', category: 'EQ(감성지능)'},
    {key:'self_regulation', name:'자기조절', group:'D', category: 'EQ(감성지능)'},
    {key:'empathy_social', name:'공감·사회기술', group:'D', category: 'EQ(감성지능)'},
  ];
  
  // 그룹별 색상 (메인 테마와 일치)
  const groupColors = {
    'A': '#3b82f6', // blue-500 (메인 로고와 일치)
    'B': '#10b981', // green-500
    'C': '#8b5cf6', // purple-500
    'D': '#f59e0b'  // orange-500 (메인 그라데이션과 일치)
  };
  
  // 매칭 점수 계산
  function calculateMatchScore() {
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    STATS.forEach(stat => {
      const jobWeight = jobWeights[stat.key] || 0;
      const userScore = userWeights[stat.key] || 0;
      
      // 가중치가 높을수록, 사용자 점수가 높을수록 좋음
      totalScore += jobWeight * userScore;
      maxPossibleScore += jobWeight * 5; // 최대 점수는 5
    });
    
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }
  
  // 강점과 보완점 분석
  function getAnalysisPoints() {
    const strongPoints = STATS.filter(s => (userWeights[s.key] || 0) >= (jobWeights[s.key] || 0) && (jobWeights[s.key] || 0) >= 3);
    const weakPoints = STATS.filter(s => (userWeights[s.key] || 0) < (jobWeights[s.key] || 0) && (jobWeights[s.key] || 0) >= 3);
    
    return { strongPoints, weakPoints };
  }
  
  // 레이더 차트 그리기
  function drawOverlayRadarChart() {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const W = canvas.width;
    const H = canvas.height;
    
    ctx.clearRect(0, 0, W, H);
    
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) / 2 - 50;
    const N = STATS.length;

    // 배경 그리드 (light 테마)
    ctx.strokeStyle = '#e5e7eb'; // gray-200
    ctx.lineWidth = 1;
    
    // 동심원
    for (let ring = 1; ring <= 5; ring++) {
      const r = radius * (ring / 5);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      
      // 링 레벨 표시 (light 테마)
      ctx.fillStyle = '#6b7280'; // gray-500
      ctx.font = '10px -apple-system, BlinkMacSystemFont';
      ctx.textAlign = 'center';
      ctx.fillText(ring.toString(), cx + r + 8, cy - 2);
    }

    // 축선
    STATS.forEach((stat, i) => {
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // 레이블
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui';
    ctx.textAlign = 'center';
    
    STATS.forEach((stat, i) => {
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      const labelRadius = radius + 30;
      const x = cx + Math.cos(angle) * labelRadius;
      const y = cy + Math.sin(angle) * labelRadius;
      
      // 그룹별 색상 설정
      ctx.fillStyle = groupColors[stat.group as keyof typeof groupColors] || '#374151';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui';
      
      ctx.fillText(stat.name, x, y + 4);
    });

    // 1. 채용공고 요구사항 (빨간색, 반투명)
    ctx.beginPath();
    STATS.forEach((stat, i) => {
      const weight = jobWeights[stat.key] || 0;
      const ratio = weight / 5; // 0-5 범위로 정규화
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius * ratio;
      const y = cy + Math.sin(angle) * radius * ratio;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // red-500 with opacity
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. 사용자 능력 (파란색, 반투명)
    ctx.beginPath();
    STATS.forEach((stat, i) => {
      const userScore = userWeights[stat.key] || 0;
      const ratio = userScore / 5; // 0-5 범위로 정규화
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius * ratio;
      const y = cy + Math.sin(angle) * radius * ratio;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'; // blue-500 with opacity
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 데이터 포인트
    STATS.forEach((stat, i) => {
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      
      // 채용공고 요구사항 포인트 (빨간색)
      const jobWeight = jobWeights[stat.key] || 0;
      const jobRatio = jobWeight / 5;
      const jobX = cx + Math.cos(angle) * radius * jobRatio;
      const jobY = cy + Math.sin(angle) * radius * jobRatio;
      
      ctx.beginPath();
      ctx.arc(jobX, jobY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 사용자 능력 포인트 (파란색)
      const userScore = userWeights[stat.key] || 0;
      const userRatio = userScore / 5;
      const userX = cx + Math.cos(angle) * radius * userRatio;
      const userY = cy + Math.sin(angle) * radius * userRatio;
      
      ctx.beginPath();
      ctx.arc(userX, userY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
  
  // weights가 변경되면 차트 다시 그리기
  $effect(() => {
    if (jobWeights && userWeights) {
      drawOverlayRadarChart();
    }
  });
  
  onMount(() => {
    drawOverlayRadarChart();
  });
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-black flex items-center gap-2">
      <span class="text-xl">🎯</span>
      {title}
    </h3>
    
    {#if showJobMatching}
    <div class="text-right">
      <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
        {calculateMatchScore()}%
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400">매칭도</div>
    </div>
    {/if}
  </div>
  
  <!-- Canvas와 범례를 나란히 배치 -->
  <div class="flex items-center justify-center gap-8">
    <!-- Canvas와 데이터 범례를 세로로 배치 -->
    <div class="flex-shrink-0 space-y-4">
      <!-- Canvas -->
      <div bind:this={container}>
        <canvas 
          bind:this={canvas}
          width={size} 
          height={size}
          class="border border-gray-100 dark:border-gray-300 rounded-xl bg-gray-50 dark:bg-gray-50"
          style="width: {size}px; height: {size}px;"
        ></canvas>
      </div>
      
      <!-- 데이터 범례 (Canvas 바로 아래) -->
      <div class="text-center">
        <h4 class="text-sm font-medium text-gray-900 mb-3">데이터 구분</h4>
        <div class="flex items-center justify-center gap-6">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-red-500 rounded-full"></div>
            <span class="text-sm text-gray-700">채용공고 요구사항</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span class="text-sm text-gray-700">내 능력치</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 역량 카테고리 범례 (Canvas 오른쪽) -->
    <div class="space-y-4 flex-shrink-0">
      <div>
        <h4 class="text-sm font-medium text-gray-900 mb-3">역량 카테고리</h4>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-blue-500 rounded"></div>
            <span class="text-xs text-gray-700">성격(빅파이브)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-green-500 rounded"></div>
            <span class="text-xs text-gray-700">직무역량</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-purple-500 rounded"></div>
            <span class="text-xs text-gray-700">학습민첩성</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-orange-500 rounded"></div>
            <span class="text-xs text-gray-700">EQ(감성지능)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  {#if showJobMatching}
  <!-- 분석 결과 (메인 테마와 일치하는 그라데이션) -->
  <div class="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-4 border border-blue-200">
    <h4 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
      <span class="text-sm">📊</span>
      매칭 분석 결과
    </h4>
    <div class="text-sm text-gray-700 space-y-1">
      {#if calculateMatchScore() >= 80}
        <p class="text-green-700">✅ <strong>매우 높은 일치도!</strong> 이 공고에 적극 지원해보세요.</p>
      {:else if calculateMatchScore() >= 60}
        <p class="text-blue-700">💡 <strong>좋은 일치도입니다.</strong> 지원을 고려해보세요.</p>
      {:else}
        <p class="text-orange-700">⚠️ <strong>일부 역량 보완이 필요합니다.</strong> 추가 학습을 고려해보세요.</p>
      {/if}
      
      <!-- 강점/보완점 분석 -->
      {#if getAnalysisPoints().strongPoints.length > 0}
        <p>
          <strong>강점:</strong> 
          {getAnalysisPoints().strongPoints.slice(0, 3).map(s => s.name).join(', ')}
          {getAnalysisPoints().strongPoints.length > 3 ? ' 등' : ''}
        </p>
      {/if}
      
      {#if getAnalysisPoints().weakPoints.length > 0}
        <p>
          <strong>보완 필요:</strong> 
          {getAnalysisPoints().weakPoints.slice(0, 3).map(s => s.name).join(', ')}
          {getAnalysisPoints().weakPoints.length > 3 ? ' 등' : ''}
        </p>
      {/if}
    </div>
  </div>
  {/if}
</div>