<script>
    import { onMount } from 'svelte';
    import {
        Save,
        Calendar,
        Users,
        Building,
        FileText,
        Phone,
        Mail,
        ArrowLeft,
        AlertCircle,
        CheckCircle,
        Star,
        Target
    } from 'lucide-svelte';
    import { config } from '$lib/utils/config.js';
    import { goto } from '$app/navigation';

    // 폼 데이터
    let formData = {
        기관명: '',
        공고명: '',
        공고시작일: '',
        공고마감일: '',
        접수시작일: '',
        접수마감일: '',
        접수방법: '',
        접수대행: '',
        일반전형: '',
        채용인원: '',
        채용방법: '',
        전형방법: '',
        임용시기: '',
        임용조건: '',
        담당부서: '',
        연락처: ''
    };

    // 점수 항목 데이터 (1점으로 초기화)
    let scoreData = {
        공감사회기술: 1,
        성실성: 1,
        개방성: 1,
        외향성: 1,
        우호성: 1,
        정서안정성: 1,
        기술전문성: 1,
        인지문제해결: 1,
        대인영향력: 1,
        자기관리: 1,
        적응력: 1,
        학습속도: 1,
        대인민첩성: 1,
        성과민첩성: 1,
        자기인식: 1,
        자기조절: 1
    };


    // 점수 계산
    $: totalScore = Object.values(scoreData).reduce((sum, score) => sum + score, 0);
    $: remainingScore = 50 - totalScore;


    // 점수 변경 함수 (1~5점 제한)
    function updateScore(field, value) {
        const numValue = parseInt(value) || 1;
        if (numValue >= 1 && numValue <= 5) {
            const oldValue = scoreData[field];
            const difference = numValue - oldValue;

            if (totalScore + difference <= 50) {
                scoreData[field] = numValue;
                scoreError = null; // 성공 시 점수 에러 메시지 제거
            } else {
                scoreError = `총점이 50점을 초과합니다. 현재 총점: ${totalScore + difference}점, 남은 점수: ${50 - (totalScore + difference)}점`;
            }
        }
    }

    // UI 상태
    let isLoading = false;
    let isSuccess = false;
    let error = null;
    let scoreError = null; // 점수 초과 전용 에러
    let showPreview = false;

    // 기관 목록 (실제 데이터로 교체 가능)
    const agencies = [
        '부산교통공사',
        '부산도시공사',
        '부산시설공단',
        '부산환경공단',
        '부산항만공사'
    ];

    // 접수방법 옵션
    const applicationMethods = [
        '온라인 접수',
        '우편 접수',
        '방문 접수',
        '온라인 + 우편 접수',
        '온라인 + 방문 접수'
    ];

    // 채용방법 옵션
    const hiringMethods = [
        '공개채용',
        '특별채용',
        '경력채용',
        '청년인턴',
        '체험형인턴'
    ];

    // 전형방법 옵션
    const selectionMethods = [
        '서류전형 + 면접',
        '서류전형 + 필기시험 + 면접',
        '서류전형 + 실기시험 + 면접',
        '서류전형 + 필기시험 + 실기시험 + 면접',
        '서류전형만'
    ];

    // 임용시기 옵션
    const appointmentTimes = [
        '채용 확정 즉시',
        '2024년 상반기',
        '2024년 하반기',
        '2025년 상반기',
        '2025년 하반기',
        '추후 협의'
    ];

    // 폼 유효성 검사
    function validateForm() {
        const requiredFields = [
            '기관명', '공고명', '공고시작일', '공고마감일',
            '접수시작일', '접수마감일', '접수방법', '채용인원',
            '채용방법', '전형방법', '임용시기', '담당부서', '연락처'
        ];

        for (const field of requiredFields) {
            if (!formData[field]) {
                error = `${field}은(는) 필수 입력 항목입니다.`;
                return false;
            }
        }

        // 날짜 유효성 검사
        const startDate = new Date(formData.공고시작일);
        const endDate = new Date(formData.공고마감일);
        const appStartDate = new Date(formData.접수시작일);
        const appEndDate = new Date(formData.접수마감일);

        if (endDate <= startDate) {
            error = '공고마감일은 공고시작일보다 늦어야 합니다.';
            return false;
        }

        if (appEndDate <= appStartDate) {
            error = '접수마감일은 접수시작일보다 늦어야 합니다.';
            return false;
        }

        if (appStartDate < startDate) {
            error = '접수시작일은 공고시작일 이후여야 합니다.';
            return false;
        }

        if (appEndDate > endDate) {
            error = '접수마감일은 공고마감일 이전이어야 합니다.';
            return false;
        }

        return true;
    }

    // 폼 제출
    async function handleSubmit() {
        if (!validateForm()) {
            return;
        }

        isLoading = true;
        error = null;

        const submitData = {
            ...formData,
            ...scoreData
        };

        try {
            const response = await fetch('http://localhost:8080/job-register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData)
            });

            const result = await response.json();

            console.log("result ---> ", result);

            if (result.RESULT === "success") {

                isSuccess = true;

                console.log("서버 등록 성공!!!!!!!!!");

                // 2초 후 목록 페이지로 이동
                // setTimeout(() => {
                //     goto('/search');
                // }, 2000);
            }
            else{
                console.error("서버 등록 오류...");
                error = '서버 오류가 있습니다. 담당자에게 연락하세요.';
            }

        } catch (err) {
            console.error('채용공고 등록 실패:', err);
            error = '채용공고 등록에 실패했습니다. 다시 시도해주세요.';
        } finally {
            isLoading = false;
        }
    }

    // 폼 초기화
    function resetForm() {
        formData = {
            기관명: '',
            공고명: '',
            공고시작일: '',
            공고마감일: '',
            접수시작일: '',
            접수마감일: '',
            접수방법: '',
            접수대행: '',
            일반전형: '',
            채용인원: '',
            채용방법: '',
            전형방법: '',
            임용시기: '',
            임용조건: '',
            담당부서: '',
            연락처: ''
        };

        scoreData = {
            공감사회기술: 1,
            성실성: 1,
            개방성: 1,
            외향성: 1,
            우호성: 1,
            정서안정성: 1,
            기술전문성: 1,
            인지문제해결: 1,
            대인영향력: 1,
            자기관리: 1,
            적응력: 1,
            학습속도: 1,
            대인민첩성: 1,
            성과민첩성: 1,
            자기인식: 1,
            자기조절: 1
        };

        error = null;
        scoreError = null;
        isSuccess = false;
    }

    // 미리보기 토글
    function togglePreview() {
        showPreview = !showPreview;
    }
</script>

<svelte:head>
    <title>채용공고 등록 - {config.siteName}</title>
    <meta name="description" content="부산시 공사/공단 채용공고를 등록하세요" />
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
    <!-- 헤더 -->
    <section class="space-y-4">
        <div class="flex items-center space-x-4">
            <a href="/search" class="btn-ghost p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={20} />
            </a>
            <div>
                <h1 class="text-heading mb-2">채용공고 등록</h1>
                <p class="text-gray-600">부산시 공사/공단의 새로운 채용공고를 등록하세요</p>
            </div>
        </div>
    </section>

    <!-- 성공 팝업 메시지 -->
    {#if isSuccess}
        <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4 transform transition-all">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle size={24} class="text-green-600" />
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900">등록 완료!</h3>
                    </div>
                </div>
                <div class="text-center">
                    <p class="text-gray-600 mb-6">채용공고가 성공적으로 등록되었습니다.</p>
                    <div class="flex items-center justify-center space-x-2 text-sm text-green-600">
                        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>2초 후 검색 페이지로 이동합니다...</span>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- 서버 에러 팝업 메시지 -->
    {#if error}
        <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4 transform transition-all">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle size={24} class="text-red-600" />
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900">등록 실패</h3>
                    </div>
                </div>
                <div class="text-center">
                    <p class="text-gray-600 mb-6">서버 오류가 있습니다. 담당자에게 연락하세요.</p>
                    <button
                            on:click={() => error = null}
                            class="btn-primary px-6 py-2"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- 점수 초과 팝업 메시지 -->
    {#if scoreError}
        <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4 transform transition-all">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertCircle size={24} class="text-orange-600" />
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900">점수 초과</h3>
                    </div>
                </div>
                <div class="text-center">
                    <p class="text-gray-600 mb-6">{scoreError}</p>
                    <button
                            on:click={() => scoreError = null}
                            class="btn-primary px-6 py-2"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- 폼 -->
    <form on:submit|preventDefault={handleSubmit} class="space-y-8">
        <!-- 기본 정보 -->
        <section class="card p-8 space-y-6">
            <div class="flex items-center space-x-3 mb-6">
                <Building size={24} class="text-primary-600" />
                <h2 class="text-xl font-semibold text-gray-900">기본 정보</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 기관명 -->
                <div>
                    <label for="agency" class="block text-sm font-medium text-gray-700 mb-2">
                        기관명 <span class="text-red-500">*</span>
                    </label>
                    <select
                            id="agency"
                            bind:value={formData.기관명}
                            class="select w-full"
                            required
                    >
                        <option value="">기관을 선택하세요</option>
                        {#each agencies as agency}
                            <option value={agency}>{agency}</option>
                        {/each}
                    </select>
                </div>

                <!-- 공고명 -->
                <div>
                    <label for="jobTitle" class="block text-sm font-medium text-gray-700 mb-2">
                        공고명 <span class="text-red-500">*</span>
                    </label>
                    <input
                            id="jobTitle"
                            type="text"
                            bind:value={formData.공고명}
                            placeholder="예: 2024년도 정규직 공개채용"
                            class="input w-full"
                            required
                    />
                </div>
            </div>
        </section>

        <!-- 공고 기간 -->
        <section class="card p-8 space-y-6">
            <div class="flex items-center space-x-3 mb-6">
                <Calendar size={24} class="text-primary-600" />
                <h2 class="text-xl font-semibold text-gray-900">공고 기간</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 공고시작일 -->
                <div>
                    <label for="announcementStart" class="block text-sm font-medium text-gray-700 mb-2">
                        공고시작일 <span class="text-red-500">*</span>
                    </label>
                    <input
                            id="announcementStart"
                            type="date"
                            bind:value={formData.공고시작일}
                            class="input w-full"
                            required
                    />
                </div>

                <!-- 공고마감일 -->
                <div>
                    <label for="announcementEnd" class="block text-sm font-medium text-gray-700 mb-2">
                        공고마감일 <span class="text-red-500">*</span>
                    </label>
                    <input
                            id="announcementEnd"
                            type="date"
                            bind:value={formData.공고마감일}
                            class="input w-full"
                            required
                    />
                </div>
            </div>
        </section>

        <!-- 접수 정보 -->
        <section class="card p-8 space-y-6">
            <div class="flex items-center space-x-3 mb-6">
                <FileText size={24} class="text-primary-600" />
                <h2 class="text-xl font-semibold text-gray-900">접수 정보</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 접수시작일 -->
                <div>
                    <label for="applicationStart" class="block text-sm font-medium text-gray-700 mb-2">
                        접수시작일 <span class="text-red-500">*</span>
                    </label>
                    <input
                            id="applicationStart"
                            type="date"
                            bind:value={formData.접수시작일}
                            class="input w-full"
                            required
                    />
                </div>

                <!-- 접수마감일 -->
                <div>
                    <label for="applicationEnd" class="block text-sm font-medium text-gray-700 mb-2">
                        접수마감일 <span class="text-red-500">*</span>
                    </label>
                    <input
                            id="applicationEnd"
                            type="date"
                            bind:value={formData.접수마감일}
                            class="input w-full"
                            required
                    />
                </div>

                <!-- 접수방법 -->
                <div>
                    <label for="applicationMethod" class="block text-sm font-medium text-gray-700 mb-2">
                        접수방법 <span class="text-red-500">*</span>
                    </label>
                    <select
                            id="applicationMethod"
                            bind:value={formData.접수방법}
                            class="select w-full"
                            required
                    >
                        <option value="">접수방법을 선택하세요</option>
                        {#each applicationMethods as method}
                            <option value={method}>{method}</option>
                        {/each}
                    </select>
                </div>

                <!-- 접수대행 -->
                <div>
                    <label for="applicationAgency" class="block text-sm font-medium text-gray-700 mb-2">
                        접수대행
                    </label>
                    <input
                            id="applicationAgency"
                            type="text"
                            bind:value={formData.접수대행}
                            placeholder="예: 부산시청 인사과"
                            class="input w-full"
                    />
                </div>

                <!-- 일반전형 -->
                <div>
                    <label for="generalSelection" class="block text-sm font-medium text-gray-700 mb-2">
                        일반전형
                    </label>
                    <input
                            id="generalSelection"
                            type="text"
                            bind:value={formData.일반전형}
                            placeholder="예: 서류전형 100%"
                            class="input w-full"
                    />
                </div>
            </div>
        </section>

        <!-- 채용 정보 -->
        <section class="card p-8 space-y-6">
            <div class="flex items-center space-x-3 mb-6">
                <Users size={24} class="text-primary-600" />
                <h2 class="text-xl font-semibold text-gray-900">채용 정보</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 채용인원 -->
                <div>
                    <label for="hiringCount" class="block text-sm font-medium text-gray-700 mb-2">
                        채용인원 <span class="text-red-500">*</span>
                    </label>
                    <input
                            id="hiringCount"
                            type="text"
                            bind:value={formData.채용인원}
                            placeholder="예: 10명"
                            class="input w-full"
                            required
                    />
                </div>

                <!-- 채용방법 -->
                <div>
                    <label for="hiringMethod" class="block text-sm font-medium text-gray-700 mb-2">
                        채용방법 <span class="text-red-500">*</span>
                    </label>
                    <select
                            id="hiringMethod"
                            bind:value={formData.채용방법}
                            class="select w-full"
                            required
                    >
                        <option value="">채용방법을 선택하세요</option>
                        {#each hiringMethods as method}
                            <option value={method}>{method}</option>
                        {/each}
                    </select>
                </div>

                <!-- 전형방법 -->
                <div>
                    <label for="selectionMethod" class="block text-sm font-medium text-gray-700 mb-2">
                        전형방법 <span class="text-red-500">*</span>
                    </label>
                    <select
                            id="selectionMethod"
                            bind:value={formData.전형방법}
                            class="select w-full"
                            required
                    >
                        <option value="">전형방법을 선택하세요</option>
                        {#each selectionMethods as method}
                            <option value={method}>{method}</option>
                        {/each}
                    </select>
                </div>

                <!-- 임용시기 -->
                <div>
                    <label for="appointmentTime" class="block text-sm font-medium text-gray-700 mb-2">
                        임용시기 <span class="text-red-500">*</span>
                    </label>
                    <select
                            id="appointmentTime"
                            bind:value={formData.임용시기}
                            class="select w-full"
                            required
                    >
                        <option value="">임용시기를 선택하세요</option>
                        {#each appointmentTimes as time}
                            <option value={time}>{time}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <!-- 임용조건 -->
            <div>
                <label for="appointmentConditions" class="block text-sm font-medium text-gray-700 mb-2">
                    임용조건
                </label>
                <textarea
                        id="appointmentConditions"
                        bind:value={formData.임용조건}
                        placeholder="임용조건을 상세히 입력하세요..."
                        rows="4"
                        class="textarea w-full"
                ></textarea>
            </div>
        </section>

        <!-- 점수 평가 -->
        <section class="card p-6 space-y-6">
            <!-- 헤더 -->
            <div class="text-center space-y-3">
                <div class="flex items-center justify-center space-x-3">
                    <Target size={24} class="text-primary-600" />
                    <h2 class="text-xl font-bold text-gray-900">평가 점수</h2>
                </div>
                <p class="text-sm text-gray-600">각 항목에 대해 1~5점을 부여하세요. 총점은 50점을 초과할 수 없습니다.</p>
            </div>

            <!-- 점수 요약 (고정 위치) -->
            <div class="sticky top-4 z-10 bg-white border-2 border-primary-200 rounded-lg p-4 shadow-lg">
                <div class="flex items-center justify-center space-x-6">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-primary-600">{totalScore}</div>
                        <div class="text-xs font-medium text-gray-600">현재 점수</div>
                    </div>
                    <div class="w-px h-8 bg-gray-300"></div>
                    <div class="text-center">
                        <div class="text-2xl font-bold {remainingScore >= 0 ? 'text-green-600' : 'text-red-600'}">{remainingScore}</div>
                        <div class="text-xs font-medium text-gray-600">남은 점수</div>
                    </div>
                    <div class="w-px h-8 bg-gray-300"></div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-gray-700">50</div>
                        <div class="text-xs font-medium text-gray-600">최대 점수</div>
                    </div>
                </div>

                <!-- 점수 초과 경고 -->
                {#if remainingScore < 0}
                    <div class="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                        <div class="flex items-center space-x-2">
                            <AlertCircle size={16} class="text-red-600" />
                            <span class="text-red-700 text-sm font-medium">총점이 50점을 초과했습니다. 현재 총점: {totalScore}점, 초과: {Math.abs(remainingScore)}점</span>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- 점수 입력 그리드 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each Object.entries(scoreData) as [field, score]}
                    <div class="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200">
                        <div class="space-y-4">
                            <!-- 항목명 -->
                            <div class="text-center">
                                <h3 class="text-sm font-semibold text-gray-900 leading-tight">{field}</h3>
                            </div>

                            <!-- 현재 점수 표시 -->
                            <div class="text-center">
                                <div class="text-2xl font-bold text-primary-600">{score}</div>
                                <div class="text-xs text-gray-500">현재 점수</div>
                            </div>

                            <!-- 점수 입력 버튼 -->
                            <div class="space-y-2">
                                <div class="flex justify-center space-x-1">
                                    {#each Array(5) as _, i}
                                        <button
                                                type="button"
                                                on:click={() => updateScore(field, i + 1)}
                                                class="w-8 h-8 rounded border-2 font-bold text-sm transition-all duration-200 hover:scale-110 {i + 1 === score ? 'bg-primary-500 border-primary-500 text-white shadow-md' : 'border-gray-300 text-gray-600 hover:border-primary-300 hover:bg-primary-50'}"
                                        >
                                            {i + 1}
                                        </button>
                                    {/each}
                                </div>
                                <div class="text-center text-xs text-gray-400">1~5점</div>
                            </div>

                            <!-- 점수 막대 -->
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div
                                        class="bg-gradient-to-r from-primary-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                                        style="width: {((score - 1) / 4) * 100}%"
                                ></div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </section>

        <!-- 연락처 정보 -->
        <section class="card p-8 space-y-6">
            <div class="flex items-center space-x-3 mb-6">
                <Phone size={24} class="text-primary-600" />
                <h2 class="text-xl font-semibold text-gray-900">연락처 정보</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 담당부서 -->
                <div>
                    <label for="department" class="block text-sm font-medium text-gray-700 mb-2">
                        담당부서 <span class="text-red-500">*</span>
                    </label>
                    <input
                            id="department"
                            type="text"
                            bind:value={formData.담당부서}
                            placeholder="예: 인사과"
                            class="input w-full"
                            required
                    />
                </div>

                <!-- 연락처 -->
                <div>
                    <label for="contact" class="block text-sm font-medium text-gray-700 mb-2">
                        연락처 <span class="text-red-500">*</span>
                    </label>
                    <input
                            id="contact"
                            type="text"
                            bind:value={formData.연락처}
                            placeholder="예: 051-123-4567"
                            class="input w-full"
                            required
                    />
                </div>
            </div>
        </section>

        <!-- 액션 버튼 -->
        <section class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center space-x-4">
                <button
                        type="button"
                        on:click={togglePreview}
                        class="btn-secondary inline-flex items-center space-x-2"
                >
                    <FileText size={16} />
                    <span>{showPreview ? '미리보기 숨기기' : '미리보기'}</span>
                </button>

                <button
                        type="button"
                        on:click={resetForm}
                        class="btn-ghost text-gray-600 hover:text-gray-800"
                >
                    폼 초기화
                </button>
            </div>

            <div class="flex items-center space-x-4">
                <a href="/search" class="btn-secondary">
                    취소
                </a>

                <button
                        type="submit"
                        disabled={isLoading || remainingScore < 0}
                        class="btn-primary inline-flex items-center space-x-2"
                >
                    {#if isLoading}
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>등록 중...</span>
                    {:else}
                        <Save size={16} />
                        <span>채용공고 등록</span>
                    {/if}
                </button>
            </div>
        </section>
    </form>

    <!-- 미리보기 -->
    {#if showPreview}
        <section class="card p-8 space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">등록 미리보기</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 class="font-medium text-gray-900 mb-2">기본 정보</h3>
                    <div class="space-y-2 text-sm text-gray-600">
                        <div><strong>기관명:</strong> {formData.기관명 || '-'}</div>
                        <div><strong>공고명:</strong> {formData.공고명 || '-'}</div>
                        <div><strong>공고기간:</strong> {formData.공고시작일} ~ {formData.공고마감일}</div>
                    </div>
                </div>

                <div>
                    <h3 class="font-medium text-gray-900 mb-2">접수 정보</h3>
                    <div class="space-y-2 text-sm text-gray-600">
                        <div><strong>접수기간:</strong> {formData.접수시작일} ~ {formData.접수마감일}</div>
                        <div><strong>접수방법:</strong> {formData.접수방법 || '-'}</div>
                        <div><strong>접수대행:</strong> {formData.접수대행 || '-'}</div>
                    </div>
                </div>

                <div>
                    <h3 class="font-medium text-gray-900 mb-2">채용 정보</h3>
                    <div class="space-y-2 text-sm text-gray-600">
                        <div><strong>채용인원:</strong> {formData.채용인원 || '-'}</div>
                        <div><strong>채용방법:</strong> {formData.채용방법 || '-'}</div>
                        <div><strong>전형방법:</strong> {formData.전형방법 || '-'}</div>
                        <div><strong>임용시기:</strong> {formData.임용시기 || '-'}</div>
                    </div>
                </div>

                <div>
                    <h3 class="font-medium text-gray-900 mb-2">연락처 정보</h3>
                    <div class="space-y-2 text-sm text-gray-600">
                        <div><strong>담당부서:</strong> {formData.담당부서 || '-'}</div>
                        <div><strong>연락처:</strong> {formData.연락처 || '-'}</div>
                    </div>
                </div>
            </div>

            <!-- 점수 정보 -->
            <div>
                <h3 class="font-medium text-gray-900 mb-2">평가 점수</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {#each Object.entries(scoreData) as [field, score]}
                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span class="text-sm text-gray-600">{field}</span>
                            <span class="font-medium text-primary-600">{score}점</span>
                        </div>
                    {/each}
                </div>
                <div class="mt-4 p-3 bg-primary-50 rounded-lg">
                    <div class="flex justify-between items-center">
                        <span class="font-medium text-gray-900">총점</span>
                        <span class="text-xl font-bold text-primary-600">{totalScore}/50점</span>
                    </div>
                </div>
            </div>

            {#if formData.임용조건}
                <div>
                    <h3 class="font-medium text-gray-900 mb-2">임용조건</h3>
                    <div class="text-sm text-gray-600 whitespace-pre-wrap">
                        {formData.임용조건}
                    </div>
                </div>
            {/if}
        </section>
    {/if}
</div>
