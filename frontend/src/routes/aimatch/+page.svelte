<script lang="ts">
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    // 🔧 alias 문제가 있으니 우선 상대경로로 안전하게 임포트 (즉시 동작)
    import { userInfo } from '../../lib/stores/userStore';

    const TOTAL = 20;

    let userEmail: string | null = null;
    let index = 0;

    let question = '질문을 불러오는 중…';
    let answer = '';
    let total = TOTAL;
    let isLoading = false;
    let result: any = null;
    let toastMsg = '';
    let sessionLabel = '-';

    // 서버로 답변 전송 (세션키로 email 사용)
    async function postAnswer(ans: string) {
        if (!userEmail) return;

        isLoading = true;
        try {
            const body = new URLSearchParams({ sessionId: userEmail, answer: ans ?? '' });
            const res = await fetch('http://localhost:8080/api/answer', {
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

    // 첫 질문 불러오기
    async function initFirstQuestion() {
        try {
            const data = await postAnswer('');
            applyIndex(data);
            if (data?.question) {
                question = data.question;
                index = data.index ?? 1;
            } else {
                question = '질문을 가져오지 못했습니다.';
            }
        } catch {}
    }

    function applyIndex(data: any) {
        if (Number.isFinite(data?.index) && Number.isFinite(data?.total)) {
            index = data.index;
            total = data.total;
        }
    }

    async function sendAnswer() {
        const val = answer.trim();
        if (!val && !result) return;

        const data = await postAnswer(val);

        if (data?.done) {
            question = '평가가 완료되었습니다 🎉';
            result = data.scores;
            console.log(result);
            index = TOTAL;
            total = TOTAL;
            return;
        }

        applyIndex(data);

        if (typeof data?.question === 'string') {
            question = data.question;
            answer = '';
        } else {
            toastMsg = '다음 질문을 가져오지 못했습니다.';
            setTimeout(() => (toastMsg = ''), 3000);
        }
    }

    // 페이지 진입 시 로그인 여부 확인 → 미로그인 시 /login 리다이렉트
    onMount(() => {
        const u = get(userInfo);
        if (!u?.email) {
            window.location.href = '/login';
            return;
        }
        userEmail = u.email;
        sessionLabel = userEmail; // 화면에 세션(=email) 표시
        initFirstQuestion();
    });
</script>

<!-- UI (화이트톤 유지) -->
<div class="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-8">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-800">스무고개 능력치 테스트</h2>
        <div class="flex items-center gap-3 text-xs text-gray-500">
      <span class="px-2 py-1 rounded-md border border-gray-200 bg-gray-100">
        세션 {sessionLabel}
      </span>
            <span>{index} / {total}</span>
        </div>
    </div>

    <!-- 진행바 -->
    <div class="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
                class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                style="width: {(index - 1) / TOTAL * 100}%"
        />
    </div>

    <!-- 질문 -->
    <div class="text-lg font-medium text-gray-900">{question}</div>

    <!-- 입력 + 버튼 -->
    <div class="flex gap-3">
        <input
                class="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none"
                type="text"
                placeholder="답변을 입력 후 Enter"
                bind:value={answer}
                on:keydown={(e) => e.key === 'Enter' && sendAnswer()}
        />
        <button
                on:click={sendAnswer}
                disabled={isLoading}
                class="px-5 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow"
        >
            {#if isLoading}
                <span class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {:else}
                제출
            {/if}
        </button>
    </div>

    <p class="text-sm text-gray-500">* 매 질문은 AI가 즉석에서 생성합니다. (총 20문항)</p>

    <!-- 결과 -->
    {#if result}
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 overflow-auto max-h-80">
            <pre class="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
    {/if}
</div>

<!-- 토스트 -->
{#if toastMsg}
    <div class="fixed bottom-5 right-5 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
        {toastMsg}
    </div>
{/if}
