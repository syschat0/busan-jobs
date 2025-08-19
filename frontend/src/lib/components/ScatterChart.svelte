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
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return context[0].raw.label || '';
          },
          label: function(context) {
            return [
              `채용인원: ${context.parsed.x}명`,
              `경쟁률: ${context.parsed.y}:1`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '채용인원 (명)'
        },
        beginAtZero: true
      },
      y: {
        title: {
          display: true,
          text: '경쟁률 (대 1)'
        },
        beginAtZero: true
      }
    }
  };
  
  onMount(() => {
    Chart.register(...registerables);
    
    if (canvas && data) {
      chartInstance = new Chart(canvas, {
        type: 'scatter',
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