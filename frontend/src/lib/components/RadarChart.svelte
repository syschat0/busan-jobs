<script>
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  
  export let data = {};
  export let height = 400;
  export let options = {};
  
  let canvas;
  let chartInstance;
  
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    elements: {
      line: {
        borderWidth: 3
      },
      point: {
        radius: 6,
        hoverRadius: 8
      }
    }
  };
  
  onMount(() => {
    Chart.register(...registerables);
    
    if (canvas && data) {
      chartInstance = new Chart(canvas, {
        type: 'radar',
        data,
        options: { ...defaultOptions, ...options }
      });
    }
    
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  });
  
  $: if (chartInstance && data) {
    chartInstance.data = data;
    chartInstance.options = { ...defaultOptions, ...options };
    chartInstance.update();
  }
</script>

<div style="height: {height}px; position: relative;">
  <canvas bind:this={canvas}></canvas>
</div>