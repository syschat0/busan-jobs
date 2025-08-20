<script>
  import { Building2, Users, Target, TrendingUp } from 'lucide-svelte';
  
  export let data = { jobs: [], competition: [], hiring: [] };

  // 기관별 종합 분석
  $: agencyAnalysis = analyzeAgencies();

  function analyzeAgencies() {
    const agencies = {};

    // 채용공고 데이터 분석
    data.jobs.forEach(job => {
      const agency = job.기관명 || 'Unknown';
      if (!agencies[agency]) {
        agencies[agency] = {
          name: agency,
          jobs: [],
          competition: [],
          hiring: [],
          categories: new Set()
        };
      }
      
      agencies[agency].jobs.push(job);
      
      // 직렬 정보 수집 (실제 API 데이터 구조 사용)
      if (job.일반전형) {
        const categories = job.일반전형.split(',').map(c => c.trim());
        categories.forEach(cat => {
          if (cat && cat !== '' && cat !== '데이터 없음') {
            agencies[agency].categories.add(cat);
          }
        });
      }
    });

    // 경쟁률 데이터 연결
    data.competition.forEach(comp => {
      const agency = comp.기관명 || 'Unknown';
      if (agencies[agency]) {
        const rate = parseFloat(comp.경쟁률 || '0');
        if (rate > 0) {
          agencies[agency].competition.push(rate);
        }
      }
    });

    // 채용인원 데이터 연결
    data.hiring.forEach(hire => {
      const agency = hire.agencyName || hire.기관명 || 'Unknown';
      if (agencies[agency]) {
        agencies[agency].hiring.push(hire);
      }
    });

    // 통계 계산
    Object.values(agencies).forEach(agency => {
      // 평균 경쟁률
      agency.avgCompetition = agency.competition.length > 0
        ? agency.competition.reduce((sum, rate) => sum + rate, 0) / agency.competition.length
        : 0;

      // 총 채용인원 (모든 연도 합계) - 실제 API 데이터 구조 사용
      agency.totalHiring = agency.hiring.reduce((sum, hire) => {
        const regular = parseInt(hire.정규직_일반 || 0);
        const disabled = parseInt(hire.정규직_장애 || 0);
        const contract = parseInt(hire.공무직 || 0);
        const internGeneral = parseInt(hire.인턴_일반 === '데이터 없음' ? 0 : hire.인턴_일반 || 0);
        const internDisabled = parseInt(hire.인턴_장애인 === '데이터 없음' ? 0 : hire.인턴_장애인 || 0);
        
        return sum + regular + disabled + contract + internGeneral + internDisabled;
      }, 0);

      // 주요 직렬 (상위 3개)
      agency.topCategories = Array.from(agency.categories).slice(0, 3);
      
      // 채용 활성도 점수 (공고수 + 채용인원/10 - 경쟁률/10)
      agency.activityScore = agency.jobs.length + (agency.totalHiring / 10) - (agency.avgCompetition / 10);
    });

    return Object.values(agencies)
      .filter(agency => agency.jobs.length > 0)
      .sort((a, b) => b.jobs.length - a.jobs.length);
  }

  // 경쟁률 수준 표시
  function getCompetitionLevel(rate) {
    if (rate === 0) return { text: '데이터 없음', color: 'text-gray-500', bg: 'bg-gray-100' };
    if (rate < 10) return { text: '낮음', color: 'text-green-600', bg: 'bg-green-100' };
    if (rate < 30) return { text: '보통', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { text: '높음', color: 'text-red-600', bg: 'bg-red-100' };
  }

  // 채용 활성도 표시
  function getActivityLevel(score) {
    if (score > 50) return { text: '매우 활발', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score > 20) return { text: '활발', color: 'text-green-600', bg: 'bg-green-100' };
    if (score > 10) return { text: '보통', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { text: '저조', color: 'text-gray-600', bg: 'bg-gray-100' };
  }

  // 최대값 계산 (차트 스케일용)
  $: maxJobs = Math.max(...agencyAnalysis.map(a => a.jobs.length), 1);
  $: maxHiring = Math.max(...agencyAnalysis.map(a => a.totalHiring), 1);
</script>

<div class="space-y-6">
  <!-- 필터링 결과가 없는 경우 -->
  {#if agencyAnalysis.length === 0}
    <div class="text-center py-12">
      <div class="mx-auto h-24 w-24 text-gray-300 mb-4">
        <Building2 size={96} />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        선택한 조건에 맞는 기관이 없습니다
      </h3>
      <p class="text-gray-500 mb-6">
        다른 필터 조건을 선택해 보세요
      </p>
    </div>
  {:else}
    <!-- 초압축 테이블 형태 -->
    <div class="overflow-x-auto bg-red-50 border border-red-200 rounded-lg p-3">
      <div class="text-xs text-red-600 font-medium mb-2">🎯 압축 버전 - 기관별 채용 비교</div>
      <table class="w-full text-xs">
        <thead>
          <tr class="border-b border-gray-200 text-gray-700">
            <th class="text-left py-2 px-2 font-semibold">기관명</th>
            <th class="text-center py-2 px-2 font-semibold">공고수</th>
            <th class="text-center py-2 px-2 font-semibold">채용인원</th>
            <th class="text-center py-2 px-2 font-semibold">경쟁률</th>
            <th class="text-center py-2 px-2 font-semibold">직렬수</th>
            <th class="text-left py-2 px-2 font-semibold">주요직렬</th>
            <th class="text-center py-2 px-2 font-semibold">활성도</th>
          </tr>
        </thead>
        <tbody>
          {#each agencyAnalysis as agency}
            {@const competitionLevel = getCompetitionLevel(agency.avgCompetition)}
            {@const activityLevel = getActivityLevel(agency.activityScore)}
            <tr class="border-b border-gray-100 hover:bg-blue-50 transition-colors">
              <!-- 기관명 -->
              <td class="py-2 px-2">
                <div class="flex items-center space-x-2">
                  <div class="w-4 h-4 bg-blue-500 rounded text-white flex items-center justify-center flex-shrink-0">
                    <span class="font-bold text-xs">{agency.name.slice(2, 4)}</span>
                  </div>
                  <span class="font-medium text-gray-900 text-xs truncate">{agency.name}</span>
                </div>
              </td>
              
              <!-- 공고수 -->
              <td class="text-center py-2 px-2">
                <div class="font-bold text-blue-600">{agency.jobs.length}</div>
                <div class="w-8 bg-gray-200 rounded-full h-1 mx-auto mt-1">
                  <div class="bg-blue-500 h-1 rounded-full" style="width: {(agency.jobs.length / maxJobs) * 100}%"></div>
                </div>
              </td>
              
              <!-- 채용인원 -->
              <td class="text-center py-2 px-2">
                <div class="font-bold text-green-600">{agency.totalHiring}</div>
                <div class="w-8 bg-gray-200 rounded-full h-1 mx-auto mt-1">
                  <div class="bg-green-500 h-1 rounded-full" style="width: {(agency.totalHiring / maxHiring) * 100}%"></div>
                </div>
              </td>
              
              <!-- 경쟁률 -->
              <td class="text-center py-2 px-2">
                <div class="font-medium text-gray-900">
                  {agency.avgCompetition > 0 ? `${agency.avgCompetition.toFixed(1)}:1` : '-'}
                </div>
                <span class="inline-block px-1 py-0.5 {competitionLevel.bg} {competitionLevel.color} text-xs rounded">
                  {competitionLevel.text}
                </span>
              </td>
              
              <!-- 직렬수 -->
              <td class="text-center py-2 px-2">
                <span class="font-bold text-purple-600">{agency.categories.size}</span>
              </td>
              
              <!-- 주요직렬 -->
              <td class="py-2 px-2">
                <div class="flex flex-wrap gap-1">
                  {#each agency.topCategories.slice(0, 2) as category}
                    <span class="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {category}
                    </span>
                  {/each}
                  {#if agency.categories.size > 2}
                    <span class="px-1 py-0.5 bg-gray-200 text-gray-500 text-xs rounded">
                      +{agency.categories.size - 2}
                    </span>
                  {/if}
                </div>
              </td>
              
              <!-- 활성도 -->
              <td class="text-center py-2 px-2">
                <span class="px-2 py-0.5 {activityLevel.bg} {activityLevel.color} text-xs font-medium rounded">
                  {activityLevel.text}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- 종합 인사이트 -->
  {#if agencyAnalysis.length > 0}
    <div class="bg-blue-50 rounded-xl p-6">
      <div class="flex items-start space-x-3">
        <div class="p-2 bg-blue-100 rounded-lg">
          <TrendingUp size={20} class="text-blue-600" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-blue-900 mb-3">📊 기관별 분석 인사이트</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <!-- 가장 활발한 기관 -->
            <div class="bg-white rounded-lg p-3">
              <div class="font-semibold mb-1">🔥 가장 활발한 채용</div>
              <div>
                <strong>{agencyAnalysis[0].name}</strong>이 
                {agencyAnalysis[0].jobs.length}건의 공고로 가장 활발한 채용활동을 보입니다.
              </div>
            </div>

            <!-- 경쟁률이 낮은 기관 -->
            {#if agencyAnalysis.filter(a => a.avgCompetition > 0).length > 0}
              {@const lowCompetitionAgency = agencyAnalysis
                .filter(a => a.avgCompetition > 0)
                .sort((a, b) => a.avgCompetition - b.avgCompetition)[0]}
              <div class="bg-white rounded-lg p-3">
                <div class="font-semibold mb-1">🎯 진입 기회</div>
                <div>
                  <strong>{lowCompetitionAgency.name}</strong>이 
                  평균 {lowCompetitionAgency.avgCompetition.toFixed(1)}:1로 
                  상대적으로 경쟁률이 낮습니다.
                </div>
              </div>
            {/if}

            <!-- 다양한 직렬 -->
            {#if agencyAnalysis.length > 0}
              {@const diverseAgency = agencyAnalysis
                .sort((a, b) => b.categories.size - a.categories.size)[0]}
              <div class="bg-white rounded-lg p-3">
                <div class="font-semibold mb-1">🌟 다양한 기회</div>
                <div>
                  <strong>{diverseAgency.name}</strong>에서 
                  {diverseAgency.categories.size}개 직렬로 
                  다양한 분야의 기회를 제공합니다.
                </div>
              </div>
            {/if}

            <!-- 총합 통계 -->
            <div class="bg-white rounded-lg p-3">
              <div class="font-semibold mb-1">📈 전체 현황</div>
              <div>
                총 {agencyAnalysis.length}개 기관에서 
                {agencyAnalysis.reduce((sum, a) => sum + a.jobs.length, 0)}건의 
                채용공고를 제공하고 있습니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>