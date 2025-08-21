<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { X, Calendar, MapPin, Users, Phone, Building, FileText, Clock, Award } from 'lucide-svelte';
  import { format } from 'date-fns';
  import { ko } from 'date-fns/locale';
  import { userInfo } from '$lib/stores/userStore.ts';
  import UserRadarChart from './UserRadarChart.svelte';

  export let isOpen = false;
  export let job = null;

  const dispatch = createEventDispatcher();
  
  let userWeights = {};
  let jobWeights = {};
  let isLoadingRadarData = false;
  let radarChartError = null;

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

  function formatDate(dateString) {
    try {
      return format(new Date(dateString), 'yyyy년 M월 d일', { locale: ko });
    } catch (e) {
      return dateString;
    }
  }

  function getStatusBadge(status) {
    switch(status) {
      case '접수중':
        return { class: 'bg-green-100 text-green-800', text: '접수중' };
      case '진행중': 
        return { class: 'bg-yellow-100 text-yellow-800', text: '진행중' };
      case '마감':
        return { class: 'bg-red-100 text-red-800', text: '마감' };
      default:
        return { class: 'bg-gray-100 text-gray-800', text: status || '정보없음' };
    }
  }

  // 사용자 레이더 차트 데이터 가져오기
  async function fetchUserRadarData() {
    if (!$userInfo || !$userInfo.email) {
      console.log("사용자 이메일 정보가 없습니다.");
      return;
    }

    try {
      isLoadingRadarData = true;
      radarChartError = null;

      const encodedEmail = encodeURIComponent($userInfo.email);
      const response = await fetch(`http://localhost:8080/api/result?email=${encodedEmail}`, {
        method: "GET",
        credentials: "include"
      });

      if (response.ok) {
        const result = await response.json();
        console.log("사용자 레이더 차트 데이터:", result);

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

        userWeights = convertedUserWeights;
        console.log("변환된 사용자 가중치:", userWeights);
      } else {
        console.error("사용자 레이더 차트 데이터 가져오기 실패:", response.status);
        radarChartError = "사용자 데이터를 가져올 수 없습니다.";
      }
    } catch (e) {
      console.error("사용자 레이더 차트 데이터 가져오기 오류:", e);
      radarChartError = "데이터 로딩 중 오류가 발생했습니다.";
    } finally {
      isLoadingRadarData = false;
    }
  }

  // 채용공고 상세 정보 가져오기 (jobWeights)
  async function fetchJobDetails() {
    if (!job || !job.id) {
      console.log("채용공고 ID가 없습니다.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/job-posting-scores/${job.id}`, {
        method: "GET",
        credentials: "include"
      });

      if (response.ok) {
        const result = await response.json();
        console.log("채용공고 상세 데이터:", result);
        

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
        const convertedJobWeights = {};
        if (result.data && Array.isArray(result.data)) {
          result.data.forEach(item => {
            if (item.name && item.value !== undefined) {
              const key = nameToKeyMap[item.name];
              if (key) {
                convertedJobWeights[key] = item.value;
              }
            }
          });
        } else if (result.data && typeof result.data === 'object') {
          // result.data가 객체인 경우
          Object.entries(result.data).forEach(([name, value]) => {
            const key = nameToKeyMap[name];
            if (key) {
              convertedJobWeights[key] = value;
            }
          });
        }

        jobWeights = convertedJobWeights;

        // jobWeights 설정 (API 응답 구조에 따라 조정 필요)
        if (!jobWeights) {
          console.warn("채용공고 가중치 정보가 없습니다.");
          // 기본값 설정 (필요에 따라 조정)
          jobWeights = {
            conscientiousness: 3,
            openness: 3,
            extraversion: 3,
            agreeableness: 3,
            emotional_stability: 3,
            technical_mastery: 4,
            cognitive_problem_solving: 4,
            interpersonal_influence: 3,
            self_management: 3,
            adaptability: 3,
            learning_speed: 3,
            people_agility: 3,
            result_agility: 3,
            self_awareness: 3,
            self_regulation: 3,
            empathy_social: 3
          };
        }
        
        console.log("설정된 jobWeights:", jobWeights);
      } else {
        console.error("채용공고 상세 정보 가져오기 실패:", response.status);
      }
    } catch (e) {
      console.error("채용공고 상세 정보 가져오기 오류:", e);
    }
  }

  // 모달이 열릴 때 데이터 로딩
  $: if (isOpen && job) {
    fetchJobDetails();
    if ($userInfo && $userInfo.email) {
      fetchUserRadarData();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && job}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    on:click={handleOutsideClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-orange-50">
        <div class="flex-1">
          <h2 id="modal-title" class="text-xl font-bold text-gray-900 mb-2">
            {job.jobTitle}
          </h2>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <Building size={16} class="text-gray-500" />
              <span class="text-gray-700 font-medium">{job.agencyName}</span>
            </div>
            <span class="inline-flex px-3 py-1 text-xs font-medium rounded-full {getStatusBadge(job.status).class}">
              {getStatusBadge(job.status).text}
            </span>
          </div>
        </div>
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- 기본 정보 -->
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText size={20} class="mr-2 text-blue-500" />
                기본 정보
              </h3>
              <div class="space-y-4">
                <div class="flex">
                  <div class="w-24 text-sm font-medium text-gray-500">ID</div>
                  <div class="flex-1 text-sm text-gray-900">{job.id}</div>
                </div>
                <div class="flex">
                  <div class="w-24 text-sm font-medium text-gray-500">기관명</div>
                  <div class="flex-1 text-sm text-gray-900">{job.agencyName}</div>
                </div>
                <div class="flex">
                  <div class="w-24 text-sm font-medium text-gray-500">공고명</div>
                  <div class="flex-1 text-sm text-gray-900">{job.jobTitle}</div>
                </div>
                <div class="flex">
                  <div class="w-24 text-sm font-medium text-gray-500">채용인원</div>
                  <div class="flex-1 text-sm text-gray-900 font-semibold text-blue-600">
                    {job.requiredCount}명
                  </div>
                </div>
                <div class="flex">
                  <div class="w-24 text-sm font-medium text-gray-500">채용방법</div>
                  <div class="flex-1 text-sm text-gray-900">{job.selectionMethod || '정보없음'}</div>
                </div>
              </div>
            </div>

            <!-- 접수 정보 -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar size={20} class="mr-2 text-green-500" />
                접수 정보
              </h3>
              <div class="space-y-4">
                <div class="flex">
                  <div class="w-24 text-sm font-medium text-gray-500">공고기간</div>
                  <div class="flex-1 text-sm text-gray-900">
                    {formatDate(job.startDate)} ~ {formatDate(job.endDate)}
                  </div>
                </div>
                <div class="flex">
                  <div class="w-24 text-sm font-medium text-gray-500">접수기간</div>
                  <div class="flex-1 text-sm text-gray-900">
                    {formatDate(job.applicationStart)} ~ {formatDate(job.applicationEnd)}
                  </div>
                </div>
                <div class="flex">
                  <div class="w-24 text-sm font-medium text-gray-500">접수방법</div>
                  <div class="flex-1 text-sm text-gray-900">{job.applicationMethod || '정보없음'}</div>
                </div>
                {#if job.applicationUrl}
                  <div class="flex">
                    <div class="w-24 text-sm font-medium text-gray-500">접수사이트</div>
                    <div class="flex-1 text-sm">
                      <a href={job.applicationUrl} target="_blank" class="text-blue-600 hover:text-blue-800 underline">
                        {job.applicationUrl}
                      </a>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <!-- 상세 정보 -->
          <div class="space-y-6">
            <!-- 모집 직렬 -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users size={20} class="mr-2 text-purple-500" />
                모집 직렬
              </h3>
              <div class="flex flex-wrap gap-2">
                {#each job.categories as category}
                  <span class="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    {category}
                  </span>
                {/each}
              </div>
              {#if job.일반전형}
                <div class="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div class="text-sm font-medium text-gray-700 mb-1">일반전형</div>
                  <div class="text-sm text-gray-600">{job.일반전형}</div>
                </div>
              {/if}
            </div>

            <!-- 전형 정보 -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award size={20} class="mr-2 text-orange-500" />
                전형 정보
              </h3>
              <div class="space-y-4">
                {#if job.전형방법}
                  <div class="flex">
                    <div class="w-20 text-sm font-medium text-gray-500">전형방법</div>
                    <div class="flex-1 text-sm text-gray-900">{job.전형방법}</div>
                  </div>
                {/if}
                {#if job.임용시기}
                  <div class="flex">
                    <div class="w-20 text-sm font-medium text-gray-500">임용시기</div>
                    <div class="flex-1 text-sm text-gray-900">{job.임용시기}</div>
                  </div>
                {/if}
                {#if job.임용조건}
                  <div class="flex">
                    <div class="w-20 text-sm font-medium text-gray-500">임용조건</div>
                    <div class="flex-1 text-sm text-gray-900">{job.임용조건}</div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- 연락처 정보 -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Phone size={20} class="mr-2 text-red-500" />
                연락처
              </h3>
              <div class="space-y-4">
                {#if job.담당부서}
                  <div class="flex">
                    <div class="w-20 text-sm font-medium text-gray-500">담당부서</div>
                    <div class="flex-1 text-sm text-gray-900">{job.담당부서}</div>
                  </div>
                {/if}
                {#if job.연락처}
                  <div class="flex">
                    <div class="w-20 text-sm font-medium text-gray-500">연락처</div>
                    <div class="flex-1 text-sm text-gray-900">{job.연락처}</div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- 추가 정보 -->
        {#if job.requirements}
          <div class="mt-8 pt-6 border-t border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">지원 자격</h3>
            <div class="bg-blue-50 p-4 rounded-lg">
              <p class="text-sm text-gray-700 leading-relaxed">{job.requirements}</p>
            </div>
          </div>
        {/if}

        <!-- 직무 적합성 분석 (UserRadarChart) -->
        {#if $userInfo && $userInfo.email}
          <div class="mt-8 pt-6 border-t border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span class="text-xl mr-2">🎯</span>
              직무 적합성 분석
            </h3>
            
            {#if isLoadingRadarData}
              <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span class="ml-3 text-gray-600">분석 데이터를 불러오는 중...</span>
              </div>
            {:else if radarChartError}
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-700 text-sm">{radarChartError}</p>
              </div>
            {:else if Object.keys(userWeights).length > 0 && Object.keys(jobWeights).length > 0}
              <div class="bg-white rounded-lg border border-gray-200 p-6">
                <UserRadarChart 
                  {jobWeights} 
                  {userWeights} 
                  size={400}
                  title="이 공고와의 직무 적합성"
                  showJobMatching={true}
                />
              </div>
            {:else}
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p class="text-gray-600 text-sm text-center">
                  직무 적합성 분석을 위한 데이터를 불러오는 중입니다.
                </p>
              </div>
            {/if}
          </div>
        {:else}
          <div class="mt-8 pt-6 border-t border-gray-200">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-blue-700 text-sm text-center">
                직무 적합성 분석을 보려면 <a href="/login" class="font-semibold underline hover:text-blue-900">로그인</a>해 주세요.
              </p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
        <div class="text-sm text-gray-500">
          마지막 업데이트: {formatDate(job.endDate)}
        </div>
        <div class="flex space-x-3">
          <button
            on:click={closeModal}
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
          {#if job.applicationUrl}
            <a
              href={job.applicationUrl}
              target="_blank"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              지원하기
            </a>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
