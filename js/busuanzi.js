(function () {
  'use strict'

  var counterSelector = '#busuanzi_value_page_pv'
  var scriptId = 'busuanzi-page-pv-script'
  var fallbackText = '暂不可用'
  var timeoutMs = 8000

  function showFallback () {
    document.querySelectorAll(counterSelector).forEach(function (element) {
      var value = (element.textContent || '').trim()
      if (!value || value === '—' || element.querySelector('.fa-spin')) {
        element.textContent = fallbackText
      }
    })
  }

  var previousScript = document.getElementById(scriptId)
  if (previousScript) previousScript.remove()

  var script = document.createElement('script')
  script.id = scriptId
  script.async = true
  script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  script.onerror = showFallback
  document.head.appendChild(script)

  window.setTimeout(showFallback, timeoutMs)
}())
