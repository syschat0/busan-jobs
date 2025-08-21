<script>
  import { createEventDispatcher } from 'svelte';
  import { X } from 'lucide-svelte';
  import UserRadarChart from './UserRadarChart.svelte';

  export let isOpen = false;
  export let radarData = null;
  export let showJobMatching = false; // 새로운 prop 추가 - 직무 매칭 정보 표시 여부

  const dispatch = createEventDispatcher();

  function closeModal() {
    isOpen = false;
    dispatch('close');
  }

  function handleOutsideClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    on:click={handleOutsideClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
      <!-- Header (메인 테마와 일치하는 그라데이션) -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-orange-50">
        <h2 id="modal-title" class="text-xl font-semibold text-gray-900">
          {showJobMatching ? '직무 적합성 분석' : '내 역량 분석 레이더 차트'}
        </h2>
        <button
          on:click={closeModal}
          class="p-2 hover:bg-white/50 rounded-lg transition-colors"
          aria-label="닫기"
        >
          <X size={20} class="text-gray-500" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        {#if radarData && radarData.jobWeights && radarData.userWeights}
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- 레이더 차트 -->
            <div class="{showJobMatching ? 'lg:col-span-2' : 'lg:col-span-3'}">
              <UserRadarChart 
                jobWeights={radarData.jobWeights}
                userWeights={radarData.userWeights}
                size={400}
                title={showJobMatching ? "이 공고와의 직무 적합성" : "내 역량 프로필"}
                showJobMatching={showJobMatching}
              />
            </div>

            <!-- 분석 정보 (showJobMatching이 true일 때만 표시) -->
            {#if showJobMatching}
            <div class="space-y-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-medium text-blue-900 mb-2">매칭 점수</h3>
                <div class="text-2xl font-bold text-blue-600">
                  {radarData.matchScore || '계산중'}점
                </div>
                <p class="text-sm text-blue-700 mt-1">
                  직무 요구사항과의 적합도
                </p>
              </div>

              {#if radarData.rawData}
                <div class="space-y-3">
                  <h3 class="font-medium text-gray-900">상세 분석</h3>
                  
                  {#if radarData.rawData.strengths}
                    <div class="bg-green-50 p-3 rounded-lg">
                      <h4 class="text-sm font-medium text-green-900 mb-1">강점</h4>
                      <ul class="text-sm text-green-700 space-y-1">
                        {#each radarData.rawData.strengths as strength}
                          <li>• {strength}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}

                  {#if radarData.rawData.improvements}
                    <div class="bg-orange-50 p-3 rounded-lg">
                      <h4 class="text-sm font-medium text-orange-900 mb-1">개선점</h4>
                      <ul class="text-sm text-orange-700 space-y-1">
                        {#each radarData.rawData.improvements as improvement}
                          <li>• {improvement}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}

                  {#if radarData.rawData.recommendations}
                    <div class="bg-purple-50 p-3 rounded-lg">
                      <h4 class="text-sm font-medium text-purple-900 mb-1">추천사항</h4>
                      <ul class="text-sm text-purple-700 space-y-1">
                        {#each radarData.rawData.recommendations as recommendation}
                          <li>• {recommendation}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
            {/if}
          </div>
        {:else}
          <div class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-500">레이더 차트 데이터를 불러오는 중...</p>
          </div>
        {/if}

      </div>

      <!-- Footer (메인 테마와 일치) -->
      <div class="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
        <button
          on:click={closeModal}
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  </div>
{/if}
