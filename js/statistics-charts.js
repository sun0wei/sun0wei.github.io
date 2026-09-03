(function () {
  function color () {
    return document.documentElement.getAttribute('data-theme') === 'light' ? '#4c4948' : 'rgba(255,255,255,0.7)'
  }

  function gradient () {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: 'rgba(128, 255, 165)' },
      { offset: 1, color: 'rgba(1, 191, 236)' }
    ])
  }

  function getElement (id) {
    const el = document.getElementById(id)
    return el && window.echarts && !echarts.getInstanceByDom(el) ? el : null
  }

  function initArchiveChart () {
    const el = getElement('posts-chart')
    if (!el) return
    let months = []; let values = []
    try { months = JSON.parse(el.dataset.months || '[]'); values = JSON.parse(el.dataset.values || '[]') } catch (e) {}
    if (!months.length) return
    const c = color(); const chart = echarts.init(el, 'light')
    chart.setOption({
      title: { text: '文章发布统计图', x: 'center', textStyle: { color: c } },
      tooltip: { trigger: 'axis' },
      xAxis: { name: '日期', type: 'category', boundaryGap: false, nameTextStyle: { color: c }, axisTick: { show: false }, axisLabel: { show: true, color: c }, axisLine: { show: true, lineStyle: { color: c } }, data: months },
      yAxis: { name: '文章篇数', type: 'value', nameTextStyle: { color: c }, splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: true, color: c }, axisLine: { show: true, lineStyle: { color: c } } },
      series: [{ name: '文章篇数', type: 'line', smooth: true, lineStyle: { width: 0 }, showSymbol: false, itemStyle: { opacity: 1, color: gradient() }, areaStyle: { opacity: 1, color: gradient() }, data: values, markLine: { data: [{ name: '平均值', type: 'average', label: { color: c } }] } }]
    })
    window.addEventListener('resize', () => chart.resize())
    chart.on('click', 'series', event => { if (event.componentType === 'series') window.location.href = '/archives/' + event.name.replace('-', '/') })
  }

  function initTagsChart () {
    const el = getElement('tags-chart')
    if (!el) return
    let data = []
    try { data = JSON.parse(el.dataset.items || '[]') } catch (e) {}
    data.sort((a, b) => b.value - a.value)
    const top = data.slice(0, Number(el.dataset.length) || data.length)
    if (!top.length) return
    const c = color(); const chart = echarts.init(el, 'light')
    chart.setOption({
      title: { text: 'Top ' + top.length + ' 标签统计图', x: 'center', textStyle: { color: c } }, tooltip: {},
      xAxis: { name: '标签', type: 'category', nameTextStyle: { color: c }, axisTick: { show: false }, axisLabel: { show: true, color: c, interval: 0 }, axisLine: { show: true, lineStyle: { color: c } }, data: top.map(item => item.name) },
      yAxis: { name: '文章篇数', type: 'value', splitLine: { show: false }, nameTextStyle: { color: c }, axisTick: { show: false }, axisLabel: { show: true, color: c }, axisLine: { show: true, lineStyle: { color: c } } },
      series: [{ name: '文章篇数', type: 'bar', data: top, itemStyle: { borderRadius: [5, 5, 0, 0], color: gradient() }, markLine: { data: [{ name: '平均值', type: 'average', label: { color: c } }] } }]
    })
    window.addEventListener('resize', () => chart.resize())
    chart.on('click', 'series', event => { if (event.data && event.data.path) window.location.href = '/' + event.data.path })
  }

  function initCategoriesChart () {
    const el = getElement('categories-chart')
    if (!el) return
    let data = []
    try { data = JSON.parse(el.dataset.items || '[]') } catch (e) {}
    if (!data.length) return
    const c = color(); const chart = echarts.init(el, 'light')
    chart.setOption({
      title: { text: '文章分类统计图', x: 'center', textStyle: { color: c } },
      legend: { top: 'bottom', data: data.map(item => item.name), textStyle: { color: c } },
      tooltip: { trigger: 'item' },
      series: [{ name: '文章篇数', type: 'pie', radius: [30, 80], roseType: 'area', label: { color: c, formatter: '{b} : {c} ({d}%)' }, data, itemStyle: { emphasis: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(255, 255, 255, 0.5)' } } }]
    })
    window.addEventListener('resize', () => chart.resize())
    chart.on('click', 'series', event => { if (event.data && event.data.path) window.location.href = '/' + event.data.path })
  }

  function init () { initArchiveChart(); initTagsChart(); initCategoriesChart() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
  document.addEventListener('pjax:complete', init)
})()
