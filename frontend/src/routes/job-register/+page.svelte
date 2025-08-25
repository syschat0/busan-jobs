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
        Target,
        RotateCcw,
        Sparkles
    } from 'lucide-svelte';
    import { config } from '$lib/utils/config.js';
    import { goto } from '$app/navigation';
    import Chart from 'chart.js/auto';

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

    // 점수 항목 데이터 (슬라이더용으로 변경)
    let scoreData = {
        공감사회기술: 3,
        성실성: 3,
        개방성: 3,
        외향성: 3,
        우호성: 3,
        정서안정성: 3,
        기술전문성: 3,
        인지문제해결: 3,
        대인영향력: 3,
        자기관리: 3,
        적응력: 3,
        학습속도: 3,
        대인민첩성: 3,
        성과민첩성: 3,
        자기인식: 3,
        자기조절: 3
    };

    // 직무별 템플릿 프리셋
    const jobPresets = {
        기술직: {
            name: '기술직',
            description: '기술 전문성과 문제해결 중심',
            scores: {
                공감사회기술: 2,
                성실성: 4,
                개방성: 3,
                외향성: 2,
                우호성: 3,
                정서안정성: 3,
                기술전문성: 5,
                인지문제해결: 5,
                대인영향력: 2,
                자기관리: 4,
                적응력: 3,
                학습속도: 4,
                대인민첩성: 2,
                성과민첩성: 4,
                자기인식: 3,
                자기조절: 3
            }
        },
        사무직: {
            name: '사무직',
            description: '균형잡힌 역량 분포',
            scores: {
                공감사회기술: 3,
                성실성: 4,
                개방성: 3,
                외향성: 3,
                우호성: 4,
                정서안정성: 3,
                기술전문성: 3,
                인지문제해결: 4,
                대인영향력: 3,
                자기관리: 4,
                적응력: 3,
                학습속도: 3,
                대인민첩성: 3,
                성과민첩성: 3,
                자기인식: 3,
                자기조절: 4
            }
        },
        서비스직: {
            name: '서비스직',
            description: '대인관계와 소통 중심',
            scores: {
                공감사회기술: 5,
                성실성: 4,
                개방성: 4,
                외향성: 5,
                우호성: 5,
                정서안정성: 4,
                기술전문성: 2,
                인지문제해결: 3,
                대인영향력: 4,
                자기관리: 3,
                적응력: 4,
                학습속도: 3,
                대인민첩성: 4,
                성과민첩성: 3,
                자기인식: 3,
                자기조절: 3
            }
        },
        관리직: {
            name: '관리직',
            description: '리더십과 전략적 사고 중심',
            scores: {
                공감사회기술: 4,
                성실성: 4,
                개방성: 4,
                외향성: 4,
                우호성: 3,
                정서안정성: 4,
                기술전문성: 3,
                인지문제해결: 4,
                대인영향력: 5,
                자기관리: 5,
                적응력: 3,
                학습속도: 3,
                대인민첩성: 4,
                성과민첩성: 4,
                자기인식: 4,
                자기조절: 4
            }
        }
    };

    // 선택된 프리셋
    let selectedPreset = '';
    
    // 자동 균형 조정 모드
    let autoBalance = true;

    // 점수 계산
    $: totalScore = Object.values(scoreData).reduce((sum, score) => sum + score, 0);
    $: averageScore = (totalScore / 16).toFixed(1);

    // 슬라이더로 점수 변경
    function updateScore(field, value) {
        const numValue = parseInt(value);
        
        if (autoBalance) {
            // 자동 균형 조정 모드
            const oldTotal = totalScore;
            const oldValue = scoreData[field];
            const difference = numValue - oldValue;
            
            scoreData[field] = numValue;
            
            // 다른 항목들을 자동으로 조정
            if (difference !== 0) {
                adjustOtherScores(field, difference);
            }
        } else {
            // 수동 모드
            scoreData[field] = numValue;
        }
        
        scoreError = null;
    }

    // 다른 점수들을 자동으로 조정
    function adjustOtherScores(changedField, difference) {
        const fields = Object.keys(scoreData).filter(f => f !== changedField);
        const adjustment = -difference / fields.length;
        
        fields.forEach(field => {
            let newValue = scoreData[field] + adjustment;
            newValue = Math.max(1, Math.min(5, newValue));
            scoreData[field] = Math.round(newValue * 10) / 10; // 소수점 한자리까지
        });
        
        // 정수로 반올림
        Object.keys(scoreData).forEach(field => {
            scoreData[field] = Math.round(scoreData[field]);
        });
    }

    // 프리셋 적용
    function applyPreset(presetKey) {
        if (jobPresets[presetKey]) {
            selectedPreset = presetKey;
            scoreData = { ...jobPresets[presetKey].scores };
        }
    }

    // 점수 초기화
    function resetScores() {
        selectedPreset = '';
        Object.keys(scoreData).forEach(key => {
            scoreData[key] = 3;
        });
    }

    // 레이더 차트용 데이터 변환
    $: radarChartData = {
        labels: Object.keys(scoreData),
        datasets: [{
            label: '평가 점수',
            data: Object.values(scoreData),
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
        }]
    };

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
            const response = await fetch(`${config.backendUrl}/job-register`, {
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

        resetScores();
        error = null;
        scoreError = null;
        isSuccess = false;
    }

    // 미리보기 토글
    function togglePreview() {
        showPreview = !showPreview;
    }

    // 차트 인스턴스
    let radarChartInstance = null;

    // 차트 초기화 및 업데이트
    function initOrUpdateChart() {
        const ctx = document.getElementById('radarChart');
        if (!ctx) return;

        const chartData = {
            labels: Object.keys(scoreData),
            datasets: [{
                label: '평가 점수',
                data: Object.values(scoreData),
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 10
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        };

        if (radarChartInstance) {
            // 기존 차트 업데이트
            radarChartInstance.data = chartData;
            radarChartInstance.update();
        } else {
            // 새 차트 생성
            radarChartInstance = new Chart(ctx, {
                type: 'radar',
                data: chartData,
                options: chartOptions
            });
        }
    }

    // 점수 데이터가 변경될 때마다 차트 업데이트
    $: if (typeof window !== 'undefined' && scoreData) {
        initOrUpdateChart();
    }

    onMount(() => {
        // 차트 초기화
        initOrUpdateChart();

        return () => {
            // 컴포넌트 언마운트 시 차트 정리
            if (radarChartInstance) {
                radarChartInstance.destroy();
            }
        };
    });
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
                    <button
                        on:click={() => isSuccess = false}
                        class="btn-primary px-6 py-2"
                    >
                        확인
                    </button>
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
        <section class="card p-8 space-y-6">
            <!-- 헤더 -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-3">
                    <Target size={24} class="text-primary-600" />
                    <h2 class="text-xl font-semibold text-gray-900">직무 적합성 평가</h2>
                </div>
                <div class="flex items-center space-x-2">
                    <label class="flex items-center space-x-2 text-sm">
                        <input
                            type="checkbox"
                            bind:checked={autoBalance}
                            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span class="text-gray-700">자동 균형 조정</span>
                    </label>
                </div>
            </div>

            <!-- 프리셋 템플릿 선택 -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-2">
                        <Sparkles size={20} class="text-primary-600" />
                        <h3 class="font-semibold text-gray-900">빠른 설정: 직무별 템플릿</h3>
                    </div>
                    {#if selectedPreset}
                        <button
                            type="button"
                            on:click={resetScores}
                            class="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                        >
                            <RotateCcw size={16} />
                            <span>초기화</span>
                        </button>
                    {/if}
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {#each Object.entries(jobPresets) as [key, preset]}
                        <button
                            type="button"
                            on:click={() => applyPreset(key)}
                            class="relative p-4 rounded-lg border-2 transition-all duration-200 {selectedPreset === key 
                                ? 'border-primary-500 bg-primary-50 shadow-lg' 
                                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'}"
                        >
                            {#if selectedPreset === key}
                                <div class="absolute top-2 right-2">
                                    <CheckCircle size={16} class="text-primary-600" />
                                </div>
                            {/if}
                            <div class="text-left">
                                <div class="font-semibold text-gray-900">{preset.name}</div>
                                <div class="text-xs text-gray-600 mt-1">{preset.description}</div>
                            </div>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- 실시간 레이더 차트 미리보기와 슬라이더 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- 레이더 차트 미리보기 -->
                <div class="bg-gray-50 rounded-xl p-6">
                    <h3 class="font-semibold text-gray-900 mb-4">실시간 미리보기</h3>
                    <div class="relative bg-white rounded-lg p-4 shadow-inner">
                        <canvas id="radarChart" class="w-full" style="max-height: 400px;"></canvas>
                    </div>
                    <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div class="bg-white rounded-lg p-3">
                            <div class="text-gray-600">총점</div>
                            <div class="text-2xl font-bold text-primary-600">{totalScore}점</div>
                        </div>
                        <div class="bg-white rounded-lg p-3">
                            <div class="text-gray-600">평균</div>
                            <div class="text-2xl font-bold text-gray-900">{averageScore}점</div>
                        </div>
                    </div>
                </div>

                <!-- 슬라이더 입력 영역 -->
                <div class="space-y-4">
                    <h3 class="font-semibold text-gray-900 mb-4">세부 조정</h3>
                    <div class="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {#each Object.entries(scoreData) as [field, score]}
                            <div class="bg-white rounded-lg p-4 border border-gray-200 hover:border-primary-300 transition-colors">
                                <div class="flex items-center justify-between mb-2">
                                    <label for={field} class="text-sm font-medium text-gray-700">
                                        {field}
                                    </label>
                                    <span class="text-lg font-bold text-primary-600">{score}</span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <span class="text-xs text-gray-500">1</span>
                                    <input
                                        id={field}
                                        type="range"
                                        min="1"
                                        max="5"
                                        step="1"
                                        bind:value={scoreData[field]}
                                        on:input={(e) => updateScore(field, e.target.value)}
                                        class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                    />
                                    <span class="text-xs text-gray-500">5</span>
                                </div>
                                <div class="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        class="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
                                        style="width: {((score - 1) / 4) * 100}%"
                                    ></div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- 도움말 -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-start space-x-3">
                    <AlertCircle size={20} class="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div class="text-sm text-blue-800">
                        <p class="font-semibold mb-1">평가 점수 설정 가이드</p>
                        <ul class="space-y-1 text-xs">
                            <li>• <strong>템플릿 선택:</strong> 직무 유형에 맞는 템플릿을 선택하면 자동으로 적절한 점수가 설정됩니다</li>
                            <li>• <strong>세부 조정:</strong> 슬라이더를 움직여 각 역량의 중요도를 1-5점으로 조정하세요</li>
                            <li>• <strong>자동 균형:</strong> 활성화하면 한 항목을 조정할 때 다른 항목들이 자동으로 균형을 맞춥니다</li>
                            <li>• <strong>실시간 미리보기:</strong> 레이더 차트에서 역량 분포를 실시간으로 확인할 수 있습니다</li>
                        </ul>
                    </div>
                </div>
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
                        disabled={isLoading}
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
                <h3 class="font-medium text-gray-900 mb-2">직무 적합성 평가 점수</h3>
                {#if selectedPreset}
                    <div class="mb-3 p-3 bg-blue-50 rounded-lg">
                        <span class="text-sm text-blue-800">선택된 템플릿: <strong>{jobPresets[selectedPreset].name}</strong></span>
                    </div>
                {/if}
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {#each Object.entries(scoreData) as [field, score]}
                        <div class="bg-white border border-gray-200 rounded-lg p-3">
                            <div class="text-xs text-gray-600 mb-1">{field}</div>
                            <div class="flex items-center space-x-2">
                                <div class="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                        class="h-full bg-primary-500 rounded-full transition-all duration-300"
                                        style="width: {(score / 5) * 100}%"
                                    ></div>
                                </div>
                                <span class="text-sm font-bold text-primary-600">{score}</span>
                            </div>
                        </div>
                    {/each}
                </div>
                <div class="mt-4 grid grid-cols-2 gap-4">
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">총점</span>
                            <span class="text-xl font-bold text-gray-900">{totalScore}점</span>
                        </div>
                    </div>
                    <div class="p-3 bg-primary-50 rounded-lg">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">평균</span>
                            <span class="text-xl font-bold text-primary-600">{averageScore}점</span>
                        </div>
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

<style>
    /* 슬라이더 커스터마이징 */
    input[type="range"].slider {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        cursor: pointer;
    }

    input[type="range"].slider::-webkit-slider-track {
        background: #e5e7eb;
        height: 8px;
        border-radius: 4px;
    }

    input[type="range"].slider::-moz-range-track {
        background: #e5e7eb;
        height: 8px;
        border-radius: 4px;
    }

    input[type="range"].slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        background: #3b82f6;
        height: 20px;
        width: 20px;
        border-radius: 10px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
    }

    input[type="range"].slider::-moz-range-thumb {
        appearance: none;
        background: #3b82f6;
        height: 20px;
        width: 20px;
        border-radius: 10px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
    }

    input[type="range"].slider:hover::-webkit-slider-thumb {
        transform: scale(1.2);
        background: #2563eb;
    }

    input[type="range"].slider:hover::-moz-range-thumb {
        transform: scale(1.2);
        background: #2563eb;
    }

    input[type="range"].slider:focus {
        outline: none;
    }

    input[type="range"].slider:focus::-webkit-slider-thumb {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    }

    input[type="range"].slider:focus::-moz-range-thumb {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    }
</style>
