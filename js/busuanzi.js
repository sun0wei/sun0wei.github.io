(function () {
  'use strict'

  var counterSelector = '#busuanzi_value_page_pv'
  var scriptId = 'busuanzi-page-pv-script'
  var fallbackText = '暂不可用'
  var timeoutMs = 8000

  if (window.__busuanziPagePvInitialized) return
  window.__busuanziPagePvInitialized = true

  function getCounters () {
    return Array.prototype.slice.call(document.querySelectorAll(counterSelector))
  }

  function getArticlePath (element) {
    return element.getAttribute('data-article-path') || window.location.pathname
  }

  function showFallback (counters) {
    counters.forEach(function (element) {
      var value = (element.textContent || '').trim()
      if (!value || value === '—' || element.querySelector('.fa-spin')) {
        element.textContent = fallbackText
      }
    })
  }

  function loadArticleViews () {
    if (!window.__articleViewsPromise) {
      window.__articleViewsPromise = fetch('/stats/article-views.json', { cache: 'no-store' })
        .then(function (response) {
          if (!response.ok) throw new Error('文章阅读量缓存不存在')
          return response.json()
        })
        .catch(function () { return null })
    }
    return window.__articleViewsPromise
  }

  function applyCachedCount (counters) {
    if (!counters.length) return Promise.resolve(true)
    var articlePath = getArticlePath(counters[0])
    return loadArticleViews().then(function (data) {
      var paths = data && data.paths
      if (!data || !data.updatedAt || !paths || typeof paths !== 'object') return false
      var value = Number(paths[articlePath] || 0)
      if (!Number.isFinite(value) || value < 0) value = 0
      counters.forEach(function (element) { element.textContent = value.toLocaleString('zh-CN') })
      return true
    })
  }

  function loadBusuanzi (counters) {
    var previousScript = document.getElementById(scriptId)
    if (previousScript) previousScript.remove()

    var script = document.createElement('script')
    script.id = scriptId
    script.async = true
    script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
    script.onerror = function () { showFallback(counters) }
    document.head.appendChild(script)
    window.setTimeout(function () { showFallback(counters) }, timeoutMs)
  }

  function refresh () {
    var counters = getCounters()
    if (!counters.length) return
    applyCachedCount(counters).then(function (handled) {
      if (!handled) loadBusuanzi(counters)
    })
  }

  refresh()
  document.addEventListener('pjax:complete', refresh)
}())
