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

  function initVisitorWorldChart () {
    const el = getElement('visitor-world-map')
    if (!el || el.dataset.loading === 'true') return
    el.dataset.loading = 'true'
    const empty = document.getElementById('visitor-world-empty')
    const updated = document.getElementById('visitor-world-updated')

    Promise.all([
      fetch('/stats/visitor-world.json?t=' + Date.now(), { cache: 'no-store' }).then(response => {
        if (!response.ok) throw new Error('访客地图缓存不存在')
        return response.json()
      }),
      fetch('/lib/echarts/world.json', { cache: 'force-cache' }).then(response => {
        if (!response.ok) throw new Error('世界地图数据读取失败')
        return response.json()
      }),
      fetch('/lib/echarts/china-provinces.json', { cache: 'force-cache' }).then(response => {
        if (!response.ok) throw new Error('中国省份地图数据读取失败')
        return response.json()
      })
    ]).then(([stats, geoJson, chinaGeoJson]) => {
      const countries = Array.isArray(stats.countries) ? stats.countries.filter(item => item && item.name && Number(item.value) > 0) : []
      const provinces = Array.isArray(stats.provinces) ? stats.provinces.filter(item => item && item.name && Number(item.value) > 0) : []
      const mapCountries = provinces.length ? countries.filter(item => item.name !== 'China') : countries
      const mapData = mapCountries.concat(provinces)
      if (!mapData.length) {
        if (empty) empty.hidden = false
        el.dataset.loading = 'false'
        return
      }
      if (empty) empty.hidden = true
      if (!echarts.getMap('visitor-world')) {
        const chinaFeatures = Array.isArray(chinaGeoJson.features)
          ? chinaGeoJson.features.filter(feature => feature && feature.properties && feature.properties.name)
          : []
        echarts.registerMap('visitor-world', Object.assign({}, geoJson, {
          features: (geoJson.features || []).concat(chinaFeatures)
        }))
      }
      const c = color()
      const max = Math.max(1, ...mapData.map(item => Number(item.value) || 0))
      const chart = echarts.init(el, 'light')
      chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: params => {
            const value = Number(params.value) || 0
            return `${params.name}<br/>访问会话：${value.toLocaleString('zh-CN')}`
          }
        },
        visualMap: {
          min: 0,
          max,
          left: 12,
          bottom: 8,
          calculable: false,
          text: ['多', '少'],
          textStyle: { color: c },
          inRange: { color: ['#dbeeed', '#39c5bb', '#147d78'] }
        },
        series: [{
          name: '访问会话',
          type: 'map',
          map: 'visitor-world',
          roam: true,
          scaleLimit: { min: 1, max: 8 },
          selectedMode: false,
          layoutCenter: ['50%', '47%'],
          layoutSize: '108%',
          label: { show: false },
          itemStyle: { areaColor: 'rgba(160, 170, 180, 0.18)', borderColor: 'rgba(110, 120, 130, 0.55)', borderWidth: 0.7 },
          emphasis: { label: { show: false }, itemStyle: { areaColor: '#f0b35a' } },
          data: mapData
        }]
      })
      window.addEventListener('resize', () => chart.resize())
      if (updated) {
        const range = stats.windowStart && stats.windowEnd ? `历史累计（${stats.windowStart} 至 ${stats.windowEnd}）` : '历史累计'
        updated.textContent = `${range} · 更新于 ${stats.updatedAt ? new Date(stats.updatedAt).toLocaleString('zh-CN') : '未知时间'}`
      }
      el.dataset.loading = 'false'
      el.dataset.loaded = 'true'
    }).catch(error => {
      console.warn('访客全球分布：', error)
      if (empty) empty.hidden = false
      if (updated) updated.textContent = '历史累计 · 地域数据暂不可用'
      el.dataset.loading = 'false'
    })
  }

  function init () {
    initArchiveChart()
    initTagsChart()
    initCategoriesChart()
    initVisitorWorldChart()
  }

  function scheduleInit () {
    // PJAX replaces the body asynchronously. Two animation frames allow the
    // new container to receive its final width before ECharts measures it.
    window.requestAnimationFrame(() => window.requestAnimationFrame(init))
    window.setTimeout(init, 150)
  }

  function hasChartElements () {
    return ['posts-chart', 'tags-chart', 'categories-chart', 'visitor-world-map'].some(id => document.getElementById(id))
  }

  function loadEcharts (callback) {
    if (window.echarts) {
      callback()
      return
    }
    const existing = document.querySelector('script[data-statistics-echarts], script[src*="/lib/echarts/echarts.min.js"]')
    if (existing) {
      existing.addEventListener('load', callback, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = '/lib/echarts/echarts.min.js'
    script.dataset.statisticsEcharts = 'true'
    script.onload = callback
    script.onerror = () => console.error('Failed to load ECharts for statistics charts.')
    document.head.appendChild(script)
  }
  function initWhenReady () {
    if (hasChartElements()) loadEcharts(scheduleInit)
  }
  window.initStatisticsCharts = initWhenReady
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWhenReady)
  else initWhenReady()
  document.addEventListener('pjax:complete', initWhenReady)
})()
