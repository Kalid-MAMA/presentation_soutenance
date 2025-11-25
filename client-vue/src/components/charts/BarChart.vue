<template>
  <div class="chart-container" style="position: relative; height: 300px; width: 100%;">
    <canvas ref="chartContainer"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps<{
  chartData: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string | string[]
    }>
  }
  options?: any
}>()

const chartContainer = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const createChart = async () => {
  if (!chartContainer.value) return
  
  await nextTick()

  if (chart) {
    chart.destroy()
  }

  const ctx = chartContainer.value.getContext('2d')
  if (!ctx) return

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  chart = new Chart(ctx, {
    type: 'bar',
    data: props.chartData,
    options: props.options ? { ...defaultOptions, ...props.options } : defaultOptions
  })
}

watch(() => props.chartData, () => {
  createChart()
}, { deep: true })

onMounted(() => {
  createChart()
})
</script> 