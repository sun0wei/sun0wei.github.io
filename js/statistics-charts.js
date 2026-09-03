(function () {
  function getColor() {
    return document.documentElement.getAttribute('data-theme') === 'light'
      ? '#4c4948'
      : 'rgba(255,255,255,0.7)'
  }

  function initArchiveChart() {
    const el = document.getElementById('posts-chart')
    if (!el || !window.echarts || echarts.getInstanceByDom(el)) return

    const counts = {}
    document.querySelectorAll('.post-meta-date-created[datetime]').forEach((item) => {
      const month = item.getAttribute('datetime').slice(0, 7)
      counts[month] = (counts[month] || 0) + 1
    })
    const months = Object.keys(counts).sort()
    if (!months.length) return
    const color = getColor()
    const chart = echarts.init(el, 'light')
    chart.setOption({
      title: { text: '文章发布统计图', left: 'center', textStyle: { color } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: months, axisLabel: { color }, axisLine: { lineStyle: { color } } },
      yAxis: { type: 'value', name: '文章篇数', nameTextStyle: { color }, axisLabel: { color }, axisLine: { lineStyle: { color } }, splitLine: { show: false } },
      series: [{ name: '文章篇数', type: 'line', smooth: true, showSymbol: false, data: months.map(month => counts[month]), areaStyle: {}, itemStyle: { color: '#4c9be8' } }]
    })
    window.addEventListener('resize', () => chart.resize())
  }

  function initTagsChart() {
    const el = document.getElementById('tags-chart')
    if (!el || !window.echarts || echarts.getInstanceByDom(el)) return
    const data = []
    document.querySelectorAll('.tag-cloud-list a').forEach((item) => {
      const sup = item.querySelector('sup')
      data.push({ name: item.textContent.replace(sup ? sup.textContent : '', '').trim(), value: sup ? Number(sup.textContent) || 0 : 0 })
    })
    data.sort((a, b) => b.value - a.value)
    const top = data.slice(0, Number(el.dataset.length) || data.length)
    if (!top.length) return
    const color = getColor()
    const chart = echarts.init(el, 'light')
    chart.setOption({
      title: { text: 'Top ' + top.length + ' 标签统计图', left: 'center', textStyle: { color } },
      tooltip: {},
      xAxis: { type: 'category', data: top.map(item => item.name), axisLabel: { color, interval: 0 }, axisLine: { lineStyle: { color } } },
      yAxis: { type: 'value', name: '文章篇数', nameTextStyle: { color }, axisLabel: { color }, axisLine: { lineStyle: { color } }, splitLine: { show: false } },
      series: [{ name: '文章篇数', type: 'bar', data: top.map(item => item.value), itemStyle: { borderRadius: [5, 5, 0, 0], color: '#4c9be8' } }]
    })
    window.addEventListener('resize', () => chart.resize())
  }

  function initCategoriesChart() {
    const el = document.getElementById('categories-chart')
    if (!el || !window.echarts || echarts.getInstanceByDom(el)) return
    const data = []
    document.querySelectorAll('.category-list-link').forEach((item) => {
      const count = item.parentElement.querySelector('.category-list-count')
      data.push({ name: item.textContent.trim(), value: count ? Number(count.textContent) || 0 : 0 })
    })
    if (!data.length) return
    const color = getColor()
    const chart = echarts.init(el, 'light')
    chart.setOption({
      title: { text: '文章分类统计图', left: 'center', textStyle: { color } },
      tooltip: { trigger: 'item' },
      legend: { top: 'bottom', data: data.map(item => item.name), textStyle: { color } },
      series: [{ name: '文章篇数', type: 'pie', radius: [30, 80], roseType: 'area', label: { color, formatter: '{b} : {c} ({d}%)' }, data }]
    })
    window.addEventListener('resize', () => chart.resize())
  }

  function init() {
    initArchiveChart()
    initTagsChart()
    initCategoriesChart()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
  document.addEventListener('pjax:complete', init)
})()
