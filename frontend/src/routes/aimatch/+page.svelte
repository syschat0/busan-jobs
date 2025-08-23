<script lang="ts">
    import {onMount, tick} from 'svelte';
    import { get } from 'svelte/store';
    import { fly, scale, fade, slide } from 'svelte/transition';
    import { quintOut, backOut, elasticOut, cubicOut } from 'svelte/easing';

    import { recommendedJobs } from '../../lib/stores/jobs.js';
    import { userInfo } from '../../lib/stores/userStore';

    const TOTAL = 20;
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';


    import { Chart, registerables } from 'chart.js';
    import {format} from "date-fns";
    import {ko} from "date-fns/locale";
    import {Calendar, Users} from "lucide-svelte";

    Chart.register(...registerables);
    // 추천 채용 정보
    //let recommendJobOpening = { }
    let recommendJobOpening: any[] = [];


    let chartCanvas: HTMLCanvasElement;
    let chartInstance: Chart | null = null;


    async function renderRadarChart() {
        await tick(); // DOM이 완전히 렌더링된 후 실행

        if (!result || !chartCanvas) return;


        const labels = Object.keys(result);
        const values = Object.values(result).filter(v => typeof v === 'number') as number[];

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(chartCanvas, {
            type: 'radar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'AI 평가 결과',
                        data: values,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)'
                    }
                ]
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        min :0,
                        max :5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: '스무고개 능력치 분석'
                    }
                }
            }
        });
    }




    let userEmail: string | null = null;
    let index = 0;

    let question = '질문을 불러오는 중…';
    let answer = '';
    let total = TOTAL;
    let isLoading = false;
    let result: any = null;
    let toastMsg = '';1

    let sessionLabel = '-';

    // 카드 관련 상태
    let currentCard: {id: number, question?: string, flipped?: boolean, isFlipping?: boolean, colorIndex?: number} | null = null;
    let completedCards: Array<{id: number, question: string, answer: string}> = [];
    let isAnimating = false;
    let remainingCards = TOTAL;

    // 뒤에 쌓인 카드들의 각도 미리 계산
    const stackedCardAngles = Array.from({ length: 5 }, (_, i) => ({
        rotate: (i % 2 === 0 ? -1 : 1) * (2 + i * 0.8),
        rotateY: (i % 2 === 0 ? -1 : 1) * (1 + i * 0.3),
        translateX: (i % 2 === 0 ? -1 : 1) * (i * 2)
    }));

    // 서버로 답변 전송
    async function postAnswer(ans: string) {
        if (!userEmail) return;

        isLoading = true;
        try {
            const body = new URLSearchParams({ sessionId: userEmail, answer: ans ?? '' });
            const res = await fetch(`${BACKEND_URL}/api/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body
            });
            if (!res.ok) throw new Error('요청 오류: ' + res.status);
            return await res.json();
        } catch (e: any) {
            toastMsg = e.message || '요청 중 오류';
            setTimeout(() => (toastMsg = ''), 3000);
            throw e;
        } finally {
            isLoading = false;
        }
    }

    // 카드 뽑기 (맨 위 카드를 앞으로)
    async function drawCard() {
        console.log('drawCard 호출됨', { isAnimating, isLoading, remainingCards });
        if (isAnimating || isLoading || remainingCards <= 0) return;

        isAnimating = true;

        const cardNumber = TOTAL - remainingCards + 1;
        const colorIdx = (cardNumber - 1) % 4;  // 0, 1, 2, 3 순환

        // 새 카드 생성 (뒤집는 중 상태 추가)
        currentCard = {
            id: cardNumber,
            flipped: false,
            isFlipping: true,
            colorIndex: colorIdx  // 색상 인덱스 추가
        };
        console.log('새 카드 생성:', currentCard, '색상 인덱스:', colorIdx);

        // 질문 로드
        await loadQuestionForCard();

        // 카드 뒤집기 완료
        setTimeout(() => {
            if (currentCard) {
                currentCard.isFlipping = false;
                currentCard.flipped = true;
                console.log('카드 뒤집기 완료');
            }
            isAnimating = false;
        }, 1000); // 1초 뒤집기 애니메이션
    }

    // 카드에 질문 로드
    async function loadQuestionForCard() {
        try {
            // 첫 번째 카드인 경우 빈 문자열, 아니면 이전 답변 없이 빈 문자열
            const data = await postAnswer('');
            applyIndex(data);


            //여기 수정해야됨 .

            if (data?.done) {
                question = '평가가 완료되었습니다 🎉';
                result = data.scores;
                console.log(result);
                index = TOTAL;
                total = TOTAL;
                isAnimating = false;
                renderRadarChart();


                console.log("===== 추천채용정보 ====");
                console.log(data.recommendJobOpening);
                console.log(result);

                recommendJobOpening = data.recommendJobOpening;
                return;
            }


            if (data?.question) {
                if (currentCard) {
                    currentCard.question = data.question;
                    question = data.question;
                }

                //alert(data.index);
                //index = data.index ?? (TOTAL - remainingCards + 1);
                index = TOTAL-data.index;
                remainingCards = index;


            } else {
                if (currentCard) {
                    currentCard.question = '질문을 가져오지 못했습니다.';
                }
            }
        } catch (e) {
            console.error('질문 로드 실패:', e);
            if (currentCard) {
                currentCard.question = '질문을 가져오지 못했습니다.';
            }
        }
    }

    // 첫 카드 자동으로 뽑기
    async function initFirstCard() {
        await new Promise(resolve => setTimeout(resolve, 800)); // 초기 애니메이션 대기
        await drawCard();
    }

    function applyIndex(data: any) {
        if (Number.isFinite(data?.index) && Number.isFinite(data?.total)) {
            index = data.index;
            total = data.total;
        }
    }

    // 답변 제출 및 다음 카드
    async function sendAnswer() {
        const val = answer.trim();
        if (!val || !currentCard) return;

        isAnimating = true;

        // 현재 카드를 완료 목록에 추가
        completedCards = [...completedCards, {
            id: currentCard.id,
            question: currentCard.question || '',
            answer: val
        }];

        // 카드를 뒤로 보내는 애니메이션 (즉시 시작)
        currentCard = null;
        remainingCards--;
        answer = '';

        try {
            // 서버에 답변 전송
            const data = await postAnswer(val);

            if (data?.done) {
                question = '평가가 완료되었습니다 🎉';
                result = data.scores;
                console.log(result);
                index = TOTAL;
                total = TOTAL;
                isAnimating = false;
                renderRadarChart();


                console.log("===== 추천채용정보 ====");
                console.log(data.recommendJobOpening);
                console.log(result);

                recommendJobOpening = data.recommendJobOpening;
                return;
            }

            applyIndex(data);

            // 다음 카드가 있으면 자동으로 뽑기
            if (remainingCards > 0) {
                // 딜레이 없이 바로 다음 카드 뽑기
                isAnimating = false;
                drawCard();
            } else {
                isAnimating = false;
            }
        } catch (e) {
            console.error('답변 전송 실패:', e);
            isAnimating = false;
        }
    }

    // 페이지 진입 시 로그인 여부 확인
    onMount(() => {
        const u = get(userInfo);
        if (!u?.email) {
            window.location.href = '/login';
            return;
        }
        userEmail = u.email;
        sessionLabel = userEmail;
        console.log('페이지 로드 완료, 사용자:', userEmail);
        // 자동으로 첫 카드를 뽑지 않고, 사용자가 버튼을 클릭하도록 변경
         initFirstCard();
    });


    let loadingText = "분석중.";
    let dots = 1;

    onMount(() => {
        const interval = setInterval(() => {
            dots = (dots % 3) + 1; // 1,2,3 반복
            loadingText = "분석중" + ".".repeat(dots);
        }, 500);

        return () => clearInterval(interval);
    });

</script>

<!-- 스타일 추가 -->
<style>
    .card-stage {
        perspective: 1500px;
        position: relative;
        min-height: 450px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .deck-behind {
        position: absolute;
        width: 280px;
        height: 400px;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 1;
    }

    .stacked-card {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 2px solid rgba(255, 255, 255, 0.1);
        transform-origin: center bottom;
    }

    /* 파스텔 톤 카드덱 색상 */
    .stacked-card-0 {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); /* blue-50 계열 */
    }

    .stacked-card-1 {
        background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%); /* orange-50 계열 */
    }

    .stacked-card-2 {
        background: linear-gradient(135deg, #bbf7d0 0%, #86efac 100%); /* green-50 계열 */
    }

    .stacked-card-3 {
        background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%); /* purple-50 계열 */
    }

    .current-card {
        position: relative;
        width: 280px;
        height: 400px;
        transform-style: preserve-3d;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 10;
    }

    .current-card.flipped {
        transform: rotateY(180deg);
    }

    .current-card.flipping {
        animation: continuousFlip 1s linear infinite;
    }

    @keyframes continuousFlip {
        from {
            transform: rotateY(0deg);
        }
        to {
            transform: rotateY(360deg);
        }
    }

    .card-face {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .card-front {
        color: #374151;  /* 파스텔 배경에 맞는 어두운 텍스트 색상 */
        border: 2px solid rgba(255, 255, 255, 0.5);
    }

    /* 카드 앞면 파스텔 색상들 - 카드덱과 동일 */
    .card-color-0 {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); /* blue-50 계열 */
    }

    .card-color-1 {
        background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%); /* orange-50 계열 */
    }

    .card-color-2 {
        background: linear-gradient(135deg, #bbf7d0 0%, #86efac 100%); /* green-50 계열 */
    }

    .card-color-3 {
        background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%); /* purple-50 계열 */
    }

    .card-back {
        background: white;
        transform: rotateY(180deg);
        padding: 24px;
        flex-direction: column;
    }

    /* 카드 뒷면 테두리 색상들 - 파스텔 톤과 매칭 */
    .card-back-border-0 {
        border: 3px solid #93c5fd;  /* blue-300 */
        box-shadow: 0 10px 40px rgba(147, 197, 253, 0.25);
    }

    .card-back-border-1 {
        border: 3px solid #fdba74;  /* orange-300 */
        box-shadow: 0 10px 40px rgba(253, 186, 116, 0.25);
    }

    .card-back-border-2 {
        border: 3px solid #86efac;  /* green-300 */
        box-shadow: 0 10px 40px rgba(134, 239, 172, 0.25);
    }

    .card-back-border-3 {
        border: 3px solid #d8b4fe;  /* purple-300 */
        box-shadow: 0 10px 40px rgba(216, 180, 254, 0.25);
    }

    /* Q번호 배지 색상들 - 진한 색상으로 가독성 확보 */
    .q-badge-0 {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);  /* blue-500 */
    }

    .q-badge-1 {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);  /* orange-500 */
    }

    .q-badge-2 {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);  /* green-500 */
    }

    .q-badge-3 {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);  /* purple-500 */
    }


    .completed-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px;
        transition: all 0.3s ease;
    }

    .completed-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .deck-indicator {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #a78bfa;
        margin: 0 2px;
        opacity: 0.6;
    }

    .deck-indicator.active {
        background: #7c3aed;
        opacity: 1;
    }
</style>

<!-- 메인 컨테이너 -->
<div class="space-y-6">
    <!-- 헤더 섹션 -->
    <section class="flex items-center justify-between">
        <div>
            <div class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                AI 직무 매칭
            </div>

            <h1 class="text-3xl font-bold text-gray-900 mb-2">
                스무고개 직무 적합도 테스트
            </h1>
            <p class="text-gray-600">
                카드를 뽑아 AI가 생성하는 20개 질문에 답변해보세요
            </p>
        </div>

        <!-- 세션 정보 -->
        <div class="text-sm text-gray-500">
            <div class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <span class="font-medium">세션:</span> {sessionLabel}
            </div>
        </div>
    </section>

    <!-- 메인 게임 영역 -->
    <div class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-gray-200 p-8">
        {#if !result}
        <!-- 프로그레스 영역 -->
        <div class="mb-8">
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <div class="text-sm font-medium text-gray-600 mb-1">진행 상황</div>
                        <div class="flex items-center space-x-4">
                            <span class="text-2xl font-bold text-gray-900">{completedCards.length} / {TOTAL}</span>
                            <span class="text-sm text-gray-500">완료</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-medium text-gray-600 mb-2">남은 카드</div>
                        <div class="flex items-center justify-end space-x-1">
                            {#each Array(TOTAL) as _, i}
                                <span class="deck-indicator"
                                      class:active={i < remainingCards}></span>
                            {/each}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">{remainingCards}장</div>
                    </div>
                </div>
                <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 ease-out"
                        style="width: {(completedCards.length / TOTAL) * 100}%"
                    />
                </div>
            </div>
        </div>


            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- 카드 스테이지 영역 -->
                <div class="card-stage">
                    <!-- 뒤에 쌓인 카드들 -->
                    <div class="deck-behind">
                        {#if remainingCards > 0}
                            {#each Array(Math.min(remainingCards - (currentCard ? 1 : 0), 5)) as _, i}
                                <div class="stacked-card stacked-card-{i % 4}"
                                     style="transform:
                                            translateZ(-{(i + 1) * 20}px)
                                            translateY({(i + 1) * 3}px)
                                            translateX({stackedCardAngles[i].translateX}px)
                                            rotate({stackedCardAngles[i].rotate}deg)
                                            rotateY({stackedCardAngles[i].rotateY}deg);
                                            opacity: {1 - (i + 1) * 0.12};
                                            z-index: {5 - i}">
                                </div>
                            {/each}
                        {/if}
                    </div>

                    <!-- 현재 카드 (앞에 표시) -->
                    {#if currentCard}
                        <div class="current-card"
                             class:flipped={currentCard.flipped}
                             class:flipping={currentCard.isFlipping}>
                            <!-- 카드 앞면 -->
                            <div class="card-face card-front card-color-{currentCard.colorIndex}">
                                <div class="text-center">
                                    <div class="text-6xl font-bold mb-4">?</div>
                                    <div class="text-xl font-medium">질문 {currentCard.id}</div>
                                    <div class="text-sm mt-2 opacity-80">자동으로 뒤집힙니다</div>
                                </div>
                            </div>
                            <!-- 카드 뒷면 -->
                            <div class="card-face card-back card-back-border-{currentCard.colorIndex}">
                                <!-- Q번호 표시 (좌측 상단) -->
                                <div class="absolute top-4 left-4 w-10 h-10 rounded-lg flex items-center justify-center q-badge-{currentCard.colorIndex}">
                                    <span class="text-white font-bold text-sm">Q{currentCard.id}</span>
                                </div>
                                <div class="text-center px-4">
                                    <p class="text-gray-800 text-lg leading-relaxed">
                                        {currentCard.question || '질문을 불러오는 중...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    {:else if remainingCards > 0}
                        <!-- 카드 뽑기 버튼 (초기 상태) -->
                        <button
                            class="relative w-72 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20
                                   border-2 border-dashed border-purple-400 rounded-2xl
                                   hover:border-purple-600 hover:bg-gradient-to-br hover:from-purple-500/30 hover:to-pink-500/30
                                   transition-all duration-300 cursor-pointer z-20"
                            on:click={() => {
                                console.log('버튼 클릭됨!');
                                drawCard();
                            }}
                            disabled={isAnimating}
                            type="button">
                            <div class="flex flex-col items-center justify-center h-full pointer-events-none">
                                <svg class="w-16 h-16 text-purple-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <div class="text-xl font-medium text-purple-700">
                                    {completedCards.length === 0 ? '첫 카드 뽑기' : '다음 카드 뽑기'}
                                </div>
                                <div class="text-sm text-purple-600 mt-2">남은 카드: {remainingCards}장</div>
                            </div>
                        </button>
                    {/if}
                </div>

                <!-- 답변 입력 영역 -->
                <div class="flex flex-col justify-center">
                    {#if currentCard?.flipped}
                        <div class="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200"
                             in:fly={{ x: 50, duration: 400, easing: quintOut }}>
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">답변을 입력하세요</h3>

                            <div class="space-y-4">
                                <div class="relative">
                                    <textarea
                                        class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-900
                                               placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                                               outline-none transition-all duration-200 resize-none"
                                        rows="4"
                                        placeholder="여기에 답변을 입력하세요..."
                                        bind:value={answer}
                                        on:keydown={(e) => e.key === 'Enter' && e.ctrlKey && sendAnswer()}
                                        disabled={isLoading}
                                    />
                                    {#if answer.length > 0}
                                        <div class="absolute right-3 bottom-3">
                                            <span class="text-sm text-gray-500">{answer.length}자</span>
                                        </div>
                                    {/if}
                                </div>

                                <div class="flex items-center justify-between">
                                    <p class="text-sm text-gray-500">
                                        Ctrl + Enter로 제출
                                    </p>

                                    <button
                                        on:click={sendAnswer}
                                        disabled={isLoading || !answer.trim() || isAnimating}
                                        class="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500
                                               hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500
                                               text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                                    >
                                        {#if isLoading}
                                            <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                            처리 중...
                                        {:else}
                                            답변 제출
                                            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        {/if}
                                    </button>
                                </div>
                            </div>
                        </div>
                    {:else if currentCard && !currentCard.flipped}
                        <div class="bg-white/60 backdrop-blur rounded-xl p-8 text-center">
                            <div class="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                                <div class="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">카드를 뒤집는 중...</h3>
                            <p class="text-gray-600">잠시만 기다려주세요</p>
                        </div>
                    {:else if remainingCards > 0}
                        <button
                            class="bg-white/60 backdrop-blur rounded-xl p-8 text-center hover:bg-white/80
                                   transition-all duration-300 cursor-pointer border-2 border-transparent
                                   hover:border-purple-300 hover:shadow-lg transform hover:scale-105"
                            on:click={() => {
                                console.log('오른쪽 영역 클릭으로 카드 뽑기');
                                drawCard();
                            }}
                            disabled={isAnimating}
                            type="button">
                            <div class="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                                <svg class="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">다음 카드 뽑기</h3>
                            <p class="text-gray-600">클릭하여 다음 질문 카드를 뽑아주세요</p>
                            <p class="text-sm text-purple-600 mt-2">남은 카드: {remainingCards}장</p>
                        </button>
                    {:else}
                        <!-- 결과 대기 화면 (팝업 오버레이) -->
                        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div class="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center">
                                <!-- 로딩 아이콘 -->
                                <div class="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-6"></div>

                                <!-- 동적으로 점이 늘어나는 텍스트 -->
                                <p class="text-xl font-semibold text-gray-800 animate-pulse text-center">
                                    {loadingText}
                                </p>
                                <p class="text-sm text-gray-500 mt-2 text-center">
                                    AI가 결과를 분석하는 중입니다
                                </p>
                            </div>
                        </div>
                    {/if}



                </div>
            </div>


            {#if completedCards.length > 0}
                <!-- 완료된 질문 히스토리
                <div class="mt-8">
                    <h3 class="text-sm font-semibold text-gray-700 mb-3">완료한 질문들</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {#each completedCards as card}
                            <div class="completed-card" in:fade={{ duration: 300 }}>
                                <div class="flex items-start space-x-3">
                                    <span class="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                                        {card.id}
                                    </span>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-xs text-gray-600 truncate">{card.question}</p>
                                        <p class="text-sm text-gray-900 mt-1 truncate">"{card.answer}"</p>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
                -->
            {/if}
        {:else}
            <!-- 결과 화면 -->
            <div class="py-8">
                <!-- 완료 헤더 -->
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">분석 완료!</h2>
                    <p class="text-gray-600">당신의 직무 적합도 분석 결과입니다</p>
                </div>

                <!-- 결과 표시 -->
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="font-semibold text-gray-700 mb-4 flex items-center">
                        <svg class="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        상세 분석 결과
                    </h3>
                    <!--
                    <div class="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700 overflow-auto max-h-96 border border-gray-200">
                        <pre class="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                    -->

                    <!-- Radar Chart -->
                    <div class="bg-white border border-gray-200 rounded-lg p-6">
                        <canvas bind:this={chartCanvas} width="400" height="400"></canvas>
                    </div>
                </div>

                <!-- 액션 버튼들 -->
                <div class="mt-6 flex justify-center space-x-3">
                    <button
                        on:click={() => window.location.reload()}
                        class="px-6 py-2.5 bg-white border border-gray-300 rounded-lg font-medium
                               text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                        다시 테스트 해보기
                    </button>

                </div>

                <!-- AI추천채용정보 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {#each recommendJobOpening.slice(0, 3) as job}
                        <div class="card p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer animate-fade-in">
                            <!-- 기관명 -->
                            <div class="flex items-center space-x-2 mb-3">
                                <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                                <span class="text-sm font-medium text-primary-600">{job.agencyName}</span>
                            </div>

                            <!-- 공고명 -->
                            <h3 class="text-lg font-bold text-gray-900 mb-4 group-hover:text-primary-700 transition-colors leading-tight">
                                {job.jobTitle}
                            </h3>

                            <!-- 접수기간 -->
                            <div class="flex items-center space-x-2 mb-3 text-sm text-gray-600">
                                <Calendar size={16} class="text-gray-400" />
                                <span>접수기간</span>
                            </div>
                            <div class="text-sm font-medium text-gray-900 mb-4">
                                {#if job.applicationStart && job.applicationEnd}
                                    {format(new Date(job.applicationStart), 'M.dd', { locale: ko })} ~
                                    {format(new Date(job.applicationEnd), 'M.dd', { locale: ko })}
                                {:else}
                                    <span>기간 정보 없음</span>
                                {/if}

                            </div>

                            <!-- 모집직렬 -->
                            <div class="flex items-center space-x-2 mb-4 text-sm text-gray-600">
                                <Users size={16} class="text-gray-400" />
                                <span>모집직렬</span>
                            </div>
                            <div class="text-sm font-medium text-gray-900 mb-4">
                                {job.jobSeries || '일반직'}
                            </div>

                            <!-- 지원하기 버튼 -->
                            <button class="w-full btn-primary text-sm py-2 mt-auto">
                                지원하기
                            </button>
                        </div>
                    {/each}
                </div>



            </div>
        {/if}
    </div>
</div>

<!-- 토스트 메시지 -->
{#if toastMsg}
    <div class="fixed bottom-5 right-5 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm font-medium">{toastMsg}</span>
    </div>
{/if}