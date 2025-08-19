<script>
  import { onMount, afterUpdate } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  
  Chart.register(...registerables);
  
  export let type = 'bar'; // bar, line, pie, doughnut
  export let data = {};
  export let options = {};
  export let height = 400;
  export let className = '';
  
  let canvas;
  let chart;
  
  // 기본 옵션 설정
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          font: {
            family: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 12
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        titleFont: {
          family: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          family: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
          size: 12
        }
      }
    },
    scales: type === 'bar' || type === 'line' ? {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: '#f3f4f6',
          drawBorder: false
        },
        ticks: {
          font: {
            family: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 11
          }
        }
      }
    } : {},
    animation: {
      duration: 800,
      easing: 'easeInOutCubic'
    }
  };
  
  function createChart() {
    if (chart) {
      chart.destroy();
    }
    
    const mergedOptions = {
      ...defaultOptions,
      ...options
    };
    
    chart = new Chart(canvas, {
      type,
      data,
      options: mergedOptions
    });
  }
  
  onMount(() => {
    if (canvas && data) {
      createChart();
    }
  });
  
  afterUpdate(() => {
    if (chart && data) {
      chart.data = data;
      chart.update('none');
    }
  });
  
  // 컴포넌트 파괴시 차트 정리
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
</script>

<div class="relative {className}" style="height: {height}px;">
  <canvas bind:this={canvas}></canvas>
</div>