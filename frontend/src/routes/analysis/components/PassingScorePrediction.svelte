<script>
  import { TrendingUp, Target, AlertCircle, Calculator } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  export let data = { jobs: [], competition: [], hiring: [] };
  
  let chartContainer;
  let probabilityContainer;
  let chart;
  let probabilityChart;
  let userScore = '';
  let selectedCategory = '';
  let predictionResult = null;

  // 필터링된 데이터를 사용하여 직렬별 과거 데이터 분석
  $: categoryData = analyzeCategoryData(data);
  $: categories = Object.keys(categoryData).sort();
  
  // 데이터가 필터링되었는지 확인
  $: isFiltered = data.competition.length > 0;

  function analyzeCategoryData(currentData) {
    const analysis = {};
    
    // 경쟁률 데이터에서 합격선과 직렬 정보 추출 (기관별로 구분)
    currentData.competition.forEach(comp => {
      const agency = comp.기관명 || '';
      const category = comp.채용분야 || comp.직렬 || '';
      const year = parseInt(comp.연도 || 2024);
      const passingScore = parseFloat(comp.필기합격선 || comp.합격선 || 0);
      const competitionRate = parseFloat(comp.경쟁률 || '0');
      
      if (agency && category && passingScore > 0) {
        // 기관명과 직렬을 조합한 키 생성
        const key = `${agency} - ${category}`;
        
        if (!analysis[key]) {
          analysis[key] = {
            agency,
            category,
            years: [],
            scores: [],
            competitions: [],
            dataPoints: []
          };
        }
        
        // 중복 연도 체크
        const existingIndex = analysis[key].years.indexOf(year);
        if (existingIndex === -1) {
          analysis[key].years.push(year);
          analysis[key].scores.push(passingScore);
          analysis[key].competitions.push(competitionRate);
          analysis[key].dataPoints.push({
            year,
            score: passingScore,
            competition: competitionRate
          });
        } else {
          // 같은 연도 데이터가 여러 개인 경우 평균값 사용
          const existingScore = analysis[key].scores[existingIndex];
          const existingCompetition = analysis[key].competitions[existingIndex];
          analysis[key].scores[existingIndex] = (existingScore + passingScore) / 2;
          analysis[key].competitions[existingIndex] = (existingCompetition + competitionRate) / 2;
          analysis[key].dataPoints[existingIndex].score = (existingScore + passingScore) / 2;
          analysis[key].dataPoints[existingIndex].competition = (existingCompetition + competitionRate) / 2;
        }
      }
    });

    // 연도별 정렬
    Object.values(analysis).forEach(cat => {
      const sorted = cat.dataPoints.sort((a, b) => a.year - b.year);
      cat.years = sorted.map(d => d.year);
      cat.scores = sorted.map(d => d.score);
      cat.competitions = sorted.map(d => d.competition);
    });

    return analysis;
  }

  // 합격선 예측 (선형 회귀)
  function predictPassingScore(categoryName) {
    const catData = categoryData[categoryName];
    if (!catData || catData.scores.length < 2) return null;

    // 전체 데이터 사용 (필터링된 범위 내에서)
    const allData = catData.dataPoints;
    const actualDataCount = allData.length;
    
    // 평균 계산
    const avgScore = allData.reduce((sum, d) => sum + d.score, 0) / allData.length;
    const avgCompetition = allData.reduce((sum, d) => sum + d.competition, 0) / allData.length;
    
    // 표준편차 계산 (신뢰구간용)
    const variance = allData.reduce((sum, d) => sum + Math.pow(d.score - avgScore, 2), 0) / allData.length;
    const stdDev = Math.sqrt(variance);
    
    // 추세 계산 (간단한 선형 회귀)
    let trend = 0;
    if (allData.length >= 2) {
      const lastScore = allData[allData.length - 1].score;
      const firstScore = allData[0].score;
      trend = (lastScore - firstScore) / allData.length;
    }
    
    // 2025년 예측
    const prediction = avgScore + trend;
    
    // 데이터 개수에 따른 신뢰구간 조정
    const confidenceMultiplier = actualDataCount < 3 ? 2.5 : actualDataCount < 5 ? 2.0 : 1.5;
    
    return {
      predicted: Math.max(0, Math.min(100, prediction)), // 0-100 범위 제한
      lower: Math.max(0, prediction - (stdDev * confidenceMultiplier)),
      upper: Math.min(100, prediction + (stdDev * confidenceMultiplier)),
      avgScore,
      avgCompetition,
      trend: trend > 0 ? '상승' : trend < 0 ? '하락' : '유지',
      confidence: actualDataCount >= 5 ? '보통' : actualDataCount >= 3 ? '낮음' : '매우 낮음',
      dataCount: actualDataCount
    };
  }

  // 합격 가능성 계산
  function calculateProbability(userScoreVal, prediction) {
    if (!prediction || !userScoreVal) return null;
    
    const score = parseFloat(userScoreVal);
    const mean = prediction.predicted;
    const stdDev = (prediction.upper - prediction.lower) / 4; // 2σ 범위
    
    // 정규분포 기반 확률 계산
    const zScore = (score - mean) / stdDev;
    
    // 누적분포함수 근사
    const probability = 0.5 * (1 + Math.tanh(zScore / Math.sqrt(2)));
    
    return {
      probability: Math.round(probability * 100),
      evaluation: probability > 0.7 ? '높음' : probability > 0.4 ? '보통' : '낮음',
      zScore: zScore.toFixed(2)
    };
  }

  // 차트 업데이트
  function updateChart() {
    if (!chartContainer || !selectedCategory || !categoryData[selectedCategory]) return;

    const catData = categoryData[selectedCategory];
    const prediction = predictPassingScore(selectedCategory);
    
    if (!catData.years.length) return;

    // 기존 차트 제거
    if (chart) chart.destroy();

    const ctx = chartContainer.getContext('2d');
    
    // 예측 데이터 추가
    const allYears = [...catData.years, 2025];
    const allScores = [...catData.scores];
    const predictions = catData.years.map(() => null);
    const lowerBound = catData.years.map(() => null);
    const upperBound = catData.years.map(() => null);
    
    if (prediction) {
      allScores.push(null); // 실제 데이터는 2025년에 없음
      predictions.push(prediction.predicted);
      lowerBound.push(prediction.lower);
      upperBound.push(prediction.upper);
    }

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allYears,
        datasets: [
          {
            label: '실제 합격선',
            data: allScores,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: '예측 합격선',
            data: predictions,
            borderColor: 'rgb(236, 72, 153)',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.2,
            pointRadius: 6,
            pointHoverRadius: 8
          },
          {
            label: '신뢰구간 상한',
            data: upperBound,
            borderColor: 'rgba(236, 72, 153, 0.3)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [2, 2],
            tension: 0.2,
            pointRadius: 0,
            fill: false
          },
          {
            label: '신뢰구간 하한',
            data: lowerBound,
            borderColor: 'rgba(236, 72, 153, 0.3)',
            backgroundColor: 'rgba(236, 72, 153, 0.05)',
            borderWidth: 1,
            borderDash: [2, 2],
            tension: 0.2,
            pointRadius: 0,
            fill: '-2'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(1) + '점';
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: Math.min(...catData.scores.filter(s => s > 0)) - 10,
            max: Math.max(...catData.scores) + 10,
            ticks: {
              stepSize: 1,  // 1점 단위로 표시
              precision: 0,  // 소수점 없음
              callback: function(value) {
                // 정수일 때만 표시
                if (Math.floor(value) === value) {
                  return value + '점';
                }
                return '';
              }
            },
            title: {
              display: true,
              text: '합격선 (점)'
            }
          },
          x: {
            title: {
              display: true,
              text: '연도'
            }
          }
        }
      }
    });
  }

  // 확률 분포 차트
  function updateProbabilityChart() {
    if (!probabilityContainer || !predictionResult) return;

    if (probabilityChart) probabilityChart.destroy();

    const ctx = probabilityContainer.getContext('2d');
    const prediction = predictPassingScore(selectedCategory);
    if (!prediction) return;

    // 정규분포 데이터 생성
    const mean = prediction.predicted;
    const stdDev = (prediction.upper - prediction.lower) / 4;
    const xValues = [];
    const yValues = [];
    
    for (let x = mean - 3 * stdDev; x <= mean + 3 * stdDev; x += stdDev / 10) {
      xValues.push(x);
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      yValues.push(y);
    }

    // 사용자 점수 위치
    const userScoreVal = parseFloat(userScore);
    const userY = userScoreVal ? (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                  Math.exp(-0.5 * Math.pow((userScoreVal - mean) / stdDev, 2)) : null;

    probabilityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: xValues.map(x => x.toFixed(1)),
        datasets: [
          {
            label: '점수 분포',
            data: yValues,
            borderColor: 'rgba(59, 130, 246, 0.8)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
          },
          {
            label: '내 점수',
            data: xValues.map(x => Math.abs(x - userScoreVal) < 0.5 ? userY : null),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgb(239, 68, 68)',
            borderWidth: 0,
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (context.datasetIndex === 1) {
                  return `내 점수: ${userScoreVal}점`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          y: {
            display: false
          },
          x: {
            title: {
              display: true,
              text: '점수'
            }
          }
        }
      }
    });
  }

  // 사용자 점수 입력 처리
  function handleScoreInput() {
    if (!selectedCategory || !userScore) {
      predictionResult = null;
      return;
    }

    const prediction = predictPassingScore(selectedCategory);
    if (!prediction) {
      predictionResult = null;
      return;
    }

    const probability = calculateProbability(userScore, prediction);
    predictionResult = {
      ...prediction,
      ...probability,
      userScore: parseFloat(userScore)
    };

    updateProbabilityChart();
  }

  onMount(() => {
    // 자동으로 첫 번째 직렬 선택
    if (categories.length > 0 && !selectedCategory) {
      selectedCategory = categories[0];
      updateChart();
    }
  });

  // 카테고리 데이터가 변경될 때마다 첫 번째 직렬 자동 선택
  $: if (categories.length > 0 && !categories.includes(selectedCategory)) {
    selectedCategory = categories[0];
    predictionResult = null;
    userScore = '';
  }

  $: if (selectedCategory && chartContainer) {
    updateChart();
  }
</script>

<div class="space-y-6">
  <!-- 직렬 선택 및 점수 입력 -->
  <div class="bg-white rounded-xl border border-gray-200 p-6">
    <div class="flex items-start space-x-3 mb-4">
      <div class="p-2 bg-purple-100 rounded-lg">
        <Target size={20} class="text-purple-600" />
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900">합격선 예측 및 분석</h3>
        <p class="text-sm text-gray-600 mt-1">
          {#if isFiltered}
            필터링된 데이터를 기반으로 2025년 합격선을 예측합니다
          {:else}
            전체 과거 데이터를 기반으로 2025년 합격선을 예측합니다
          {/if}
        </p>
      </div>
    </div>

    {#if categories.length > 0}
      {@const groupedByAgency = categories.reduce((acc, key) => {
        const agency = categoryData[key].agency;
        if (!acc[agency]) acc[agency] = [];
        acc[agency].push(key);
        return acc;
      }, {})}
      <div class="mb-4 p-3 bg-purple-50 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-purple-700">분석 대상:</span>
            <select 
              bind:value={selectedCategory}
              on:change={() => {
                predictionResult = null;
                userScore = '';
                updateChart();
              }}
              class="px-3 py-1 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white min-w-[250px]"
            >
              {#each Object.entries(groupedByAgency) as [agency, keys]}
                <optgroup label={agency}>
                  {#each keys as key}
                    <option value={key}>
                      {categoryData[key].category} ({categoryData[key].years.length}개년)
                    </option>
                  {/each}
                </optgroup>
              {/each}
            </select>
          </div>
          
          <!-- 점수 입력 -->
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">
              예상 점수:
            </label>
            <input 
              type="number" 
              bind:value={userScore}
              on:input={handleScoreInput}
              placeholder="75.5"
              min="0"
              max="100"
              step="0.5"
              class="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              disabled={!selectedCategory}
            />
            <button 
              on:click={handleScoreInput}
              disabled={!selectedCategory || !userScore}
              class="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              예측
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- 차트 영역 -->
  {#if selectedCategory && categoryData[selectedCategory]?.years.length > 0}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 합격선 추이 차트 -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h4 class="text-base font-semibold text-gray-900 mb-4">
          📈 합격선 추이 및 예측
          {#if categoryData[selectedCategory]}
            <span class="text-sm font-normal text-gray-600 ml-2">
              {categoryData[selectedCategory].agency} - {categoryData[selectedCategory].category}
            </span>
          {/if}
        </h4>
        <div class="h-64">
          <canvas bind:this={chartContainer}></canvas>
        </div>
        
        <!-- 예측 정보 -->
        {#if predictPassingScore(selectedCategory)}
          {@const pred = predictPassingScore(selectedCategory)}
          <div class="mt-4 p-3 bg-purple-50 rounded-lg">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-600">2025년 예측:</span>
                <span class="font-bold text-purple-600 ml-1">{pred.predicted.toFixed(1)}점</span>
              </div>
              <div>
                <span class="text-gray-600">신뢰구간:</span>
                <span class="font-medium text-gray-700 ml-1">
                  {pred.lower.toFixed(1)} ~ {pred.upper.toFixed(1)}점
                </span>
              </div>
              <div>
                <span class="text-gray-600">추세:</span>
                <span class={`font-medium ml-1 ${
                  pred.trend === '상승' ? 'text-red-600' : 
                  pred.trend === '하락' ? 'text-green-600' : 
                  'text-gray-600'
                }`}>
                  {pred.trend}
                </span>
              </div>
              <div>
                <span class="text-gray-600">신뢰도:</span>
                <span class={`font-medium ml-1 ${
                  pred.dataCount >= 5 ? 'text-green-600' : 
                  pred.dataCount >= 3 ? 'text-amber-600' : 
                  'text-red-600'
                }`}>
                  {pred.dataCount >= 5 ? '보통' : pred.dataCount >= 3 ? '낮음' : '매우 낮음'}
                  <span class="text-xs text-gray-500">({pred.dataCount}개년)</span>
                </span>
              </div>
            </div>
            
            {#if pred.dataCount <= 5}
              <div class="mt-3 p-2 {pred.dataCount === 5 ? 'bg-yellow-50 border-yellow-200' : 'bg-amber-50 border-amber-200'} border rounded text-xs">
                <div class="flex items-start space-x-1">
                  <AlertCircle size={14} class="{pred.dataCount === 5 ? 'text-yellow-600' : 'text-amber-600'} mt-0.5 flex-shrink-0" />
                  <div class="{pred.dataCount === 5 ? 'text-yellow-800' : 'text-amber-800'}">
                    <strong>통계적 한계:</strong> 
                    {#if pred.dataCount === 5}
                      5개년 데이터는 최소한의 통계적 요건을 충족하나, 여전히 표본 크기가 작습니다.
                      회귀분석의 일반적 요구사항(n≥30)에는 미달하므로 예측값은 <strong>제한적 참고용</strong>으로 활용하세요.
                    {:else}
                      {pred.dataCount}개년 데이터로는 통계적 신뢰성이 낮습니다.
                      예측값은 <strong>참고용</strong>으로만 활용하시고, 
                      실제 합격선은 크게 달라질 수 있음을 유의하세요.
                    {/if}
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- 확률 분포 차트 -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h4 class="text-base font-semibold text-gray-900 mb-4">
          📊 점수 분포 및 합격 가능성
        </h4>
        
        {#if userScore && predictionResult}
          <div class="h-64">
            <canvas bind:this={probabilityContainer}></canvas>
          </div>
          
          <!-- 합격 가능성 결과 -->
          <div class="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div class="text-center">
              <div class="text-3xl font-bold {
                predictionResult.probability >= 70 ? 'text-green-600' :
                predictionResult.probability >= 40 ? 'text-amber-600' :
                'text-red-600'
              }">
                {predictionResult.probability}%
              </div>
              <div class="text-sm text-gray-600 mt-1">합격 가능성</div>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div class="text-center">
                <span class="text-gray-600">내 점수:</span>
                <span class="font-bold text-gray-900 ml-1">{predictionResult.userScore}점</span>
              </div>
              <div class="text-center">
                <span class="text-gray-600">예측 합격선:</span>
                <span class="font-bold text-purple-600 ml-1">{predictionResult.predicted.toFixed(1)}점</span>
              </div>
            </div>
            
            <div class="mt-3 p-2 bg-white rounded text-center">
              <span class={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                predictionResult.evaluation === '높음' ? 'bg-green-100 text-green-700' :
                predictionResult.evaluation === '보통' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                합격 가능성 {predictionResult.evaluation}
              </span>
            </div>
          </div>
        {:else}
          <div class="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div class="text-center">
              <Calculator size={48} class="mx-auto text-gray-300 mb-3" />
              <p class="text-gray-500">
                예상 점수를 입력하면<br/>
                합격 가능성을 분석해드립니다
              </p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- 분석 인사이트 -->
    {#if predictPassingScore(selectedCategory)}
      {@const pred = predictPassingScore(selectedCategory)}
      <div class="bg-blue-50 rounded-xl p-6">
        <div class="flex items-start space-x-3">
          <div class="p-2 bg-blue-100 rounded-lg">
            <TrendingUp size={20} class="text-blue-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-blue-900 mb-3">
              📊 {#if categoryData[selectedCategory]}
                {categoryData[selectedCategory].agency} {categoryData[selectedCategory].category} 분석 인사이트
              {:else}
                분석 인사이트
              {/if}
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div class="bg-white rounded-lg p-3">
                <div class="font-semibold mb-1">과거 평균 합격선</div>
                <div>
                  {pred.dataCount}개년 데이터 평균 <span class="font-bold text-blue-600">{pred.avgScore.toFixed(1)}점</span>으로,
                  평균 경쟁률은 <span class="font-bold">{pred.avgCompetition.toFixed(1)}:1</span>이었습니다.
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-3">
                <div class="font-semibold mb-1">2025년 전망</div>
                <div>
                  합격선이 <span class="font-bold text-purple-600">{pred.predicted.toFixed(1)}점</span>으로 예측되며,
                  추세는 <span class={`font-bold ${
                    pred.trend === '상승' ? 'text-red-600' : 
                    pred.trend === '하락' ? 'text-green-600' : 
                    'text-gray-600'
                  }`}>{pred.trend}</span> 경향을 보입니다.
                </div>
              </div>
            </div>

            {#if userScore && predictionResult}
              <div class="mt-4 p-3 bg-yellow-50 rounded-lg">
                <div class="flex items-start space-x-2">
                  <AlertCircle size={16} class="text-yellow-600 mt-0.5" />
                  <div class="text-sm text-yellow-800">
                    <strong>준비 전략:</strong>
                    {#if predictionResult.probability >= 70}
                      현재 점수로 충분히 경쟁력이 있습니다. 면접 준비에 집중하세요.
                    {:else if predictionResult.probability >= 40}
                      합격 가능성이 있으나 추가 학습이 필요합니다. 취약 과목을 보완하세요.
                    {:else}
                      더 많은 준비가 필요합니다. 기초부터 체계적으로 학습 계획을 세우세요.
                    {/if}
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {:else if selectedCategory}
    <div class="bg-white rounded-xl border border-gray-200 p-12">
      <div class="text-center">
        <AlertCircle size={48} class="mx-auto text-gray-300 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          데이터가 부족합니다
        </h3>
        <p class="text-gray-500">
          {selectedCategory} 직렬의 과거 합격선 데이터가 없거나 부족합니다.
        </p>
      </div>
    </div>
  {:else if categories.length === 0}
    <div class="bg-white rounded-xl border border-gray-200 p-12">
      <div class="text-center">
        <AlertCircle size={48} class="mx-auto text-amber-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          필터 조건에 맞는 데이터가 없습니다
        </h3>
        <p class="text-gray-500">
          다른 필터 조건을 선택하거나 필터를 해제해 주세요.
        </p>
      </div>
    </div>
  {:else}
    <div class="bg-white rounded-xl border border-gray-200 p-12">
      <div class="text-center">
        <Target size={48} class="mx-auto text-gray-300 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          데이터를 불러오는 중입니다
        </h3>
        <p class="text-gray-500">
          잠시만 기다려 주세요.
        </p>
      </div>
    </div>
  {/if}
</div>