<script>
  import { Building2, Users, TrendingUp } from 'lucide-svelte';
  
  export let data = { jobs: [], competition: [], hiring: [] };

  // 기관별 채용현황 분석 (선발 인원 중심)
  $: agencyStats = data.competition.reduce((acc, comp) => {
    const agency = comp.기관명 || 'Unknown';
    if (!acc[agency]) {
      acc[agency] = {
        name: agency,
        totalSelected: 0,
        totalApplied: 0,
        jobCount: 0,
        categories: new Set(),
        avgCompetition: 0
      };
    }
    
    const selected = parseInt(comp.선발인원 || 0);
    const applied = parseInt(comp.지원인원 || 0);
    
    acc[agency].totalSelected += selected;
    acc[agency].totalApplied += applied;
    acc[agency].jobCount++;
    
    // 직렬 정보 추가
    if (comp.직렬 && comp.직렬 !== '' && comp.직렬 !== '데이터 없음') {
      acc[agency].categories.add(comp.직렬);
    }
    
    return acc;
  }, {});

  // 평균 경쟁률 계산 및 상위 기관 목록 (총 선발인원 기준)
  $: topAgencies = Object.values(agencyStats)
    .map(agency => ({
      ...agency,
      avgCompetition: agency.totalApplied / Math.max(agency.totalSelected, 1)
    }))
    .sort((a, b) => b.totalSelected - a.totalSelected)
    .slice(0, 5);

  // 직렬별 선발인원/지원인원 통계 계산 (경쟁률 데이터 기반)
  $: categoryStats = data.competition.reduce((acc, comp) => {
    const category = comp.직렬;
    if (category && category !== '' && category !== '데이터 없음') {
      if (!acc[category]) {
        acc[category] = {
          name: category,
          totalSelected: 0,
          totalApplied: 0,
          count: 0,
          avgCompetition: 0
        };
      }
      
      const selected = parseInt(comp.선발인원 || 0);
      const applied = parseInt(comp.지원인원 || 0);
      
      acc[category].totalSelected += selected;
      acc[category].totalApplied += applied;
      acc[category].count += 1;
    }
    
    return acc;
  }, {});

  // 평균 경쟁률 계산 및 상위 직렬 목록 (총 선발인원 기준)
  $: topCategories = Object.values(categoryStats)
    .map(cat => ({
      ...cat,
      avgCompetition: cat.totalApplied / Math.max(cat.totalSelected, 1)
    }))
    .sort((a, b) => b.totalSelected - a.totalSelected)
    .slice(0, 12);

  // 전체 통계 (선발 인원 중심)
  $: totalStats = {
    totalSelected: Object.values(agencyStats).reduce((sum, agency) => sum + agency.totalSelected, 0),
    totalApplied: Object.values(agencyStats).reduce((sum, agency) => sum + agency.totalApplied, 0),
    totalAgencies: Object.keys(agencyStats).length,
    avgSelectedPerAgency: Object.values(agencyStats).reduce((sum, agency) => sum + agency.totalSelected, 0) / Math.max(Object.keys(agencyStats).length, 1),
    totalCompetition: Object.values(agencyStats).reduce((sum, agency) => sum + agency.totalApplied, 0) / Math.max(Object.values(agencyStats).reduce((sum, agency) => sum + agency.totalSelected, 0), 1)
  };

  // 색상 배열
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-amber-500',
    'bg-red-500'
  ];
</script>

<div class="space-y-6">
  <!-- 전체 통계 (선발 인원 중심) -->
  <div class="grid grid-cols-3 gap-4">
    <div class="text-center">
      <div class="text-2xl font-bold text-green-600">
        {totalStats.totalSelected.toLocaleString()}
      </div>
      <div class="text-sm text-gray-600">총 선발인원</div>
    </div>
    
    <div class="text-center">
      <div class="text-2xl font-bold text-blue-600">
        {totalStats.totalCompetition.toFixed(1)}:1
      </div>
      <div class="text-sm text-gray-600">평균 경쟁률</div>
    </div>
    
    <div class="text-center">
      <div class="text-2xl font-bold text-purple-600">
        {Math.round(totalStats.avgSelectedPerAgency)}
      </div>
      <div class="text-sm text-gray-600">기관당 평균 선발</div>
    </div>
  </div>

  <!-- 기관별 선발인원 현황 -->
  <div class="space-y-3">
    <h3 class="text-sm font-semibold text-gray-700 flex items-center">
      <Building2 size={16} class="mr-2" />
      기관별 선발인원 현황
    </h3>
    
    <div class="space-y-3">
      {#each topAgencies as agency, index}
        {@const percentage = (agency.totalSelected / totalStats.totalSelected) * 100}
        <div class="flex items-center space-x-3">
          <!-- 기관명 -->
          <div class="w-32 text-sm font-medium text-gray-700 truncate">
            {agency.name}
          </div>
          
          <!-- 진행률 바 -->
          <div class="flex-1 bg-gray-200 rounded-full h-3">
            <div 
              class="{colors[index % colors.length]} h-3 rounded-full transition-all duration-500"
              style="width: {percentage}%"
            ></div>
          </div>
          
          <!-- 수치 -->
          <div class="w-20 text-right">
            <div class="text-sm font-semibold text-gray-900">
              {agency.totalSelected.toLocaleString()}명
            </div>
            <div class="text-xs text-gray-500">
              {percentage.toFixed(1)}% • {agency.avgCompetition.toFixed(1)}:1
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- 주요 직렬 현황 -->
  <div class="space-y-3">
    <h3 class="text-sm font-semibold text-gray-700 flex items-center">
      <Users size={16} class="mr-2" />
      주요 직렬 현황
    </h3>
    
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {#each topCategories as category}
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-sm font-medium text-gray-900 mb-1 truncate" title={category.name}>
            {category.name}
          </div>
          <div class="text-xs text-gray-600 space-y-1">
            <div>선발: <span class="font-medium text-green-600">{category.totalSelected}명</span></div>
            <div>경쟁률: <span class="font-medium text-blue-600">{category.avgCompetition.toFixed(1)}:1</span></div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- 채용 인사이트 -->
  <div class="bg-green-50 rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <div class="p-2 bg-green-100 rounded-lg">
        <TrendingUp size={16} class="text-green-600" />
      </div>
      <div class="flex-1">
        <h4 class="text-sm font-semibold text-green-900 mb-2">
          💼 채용 규모 인사이트
        </h4>
        <div class="space-y-2 text-xs text-green-700">
          {#if topAgencies.length > 0}
            <p>
              <strong>{topAgencies[0].name}</strong>이 총 <strong>{topAgencies[0].totalSelected.toLocaleString()}명</strong>
              ({((topAgencies[0].totalSelected / totalStats.totalSelected) * 100).toFixed(1)}%)으로 
              가장 많은 인원을 선발합니다.
            </p>
            <p>
              평균 경쟁률은 <strong>{totalStats.totalCompetition.toFixed(1)}:1</strong>이며, 
              전체 <strong>{totalStats.totalSelected.toLocaleString()}명</strong>의 선발 기회가 있습니다.
            </p>
          {:else}
            <p>데이터를 분석하고 있습니다...</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>