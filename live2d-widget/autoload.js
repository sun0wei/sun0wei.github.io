// Live2D is available on desktop pages and starts after the main page is ready.
const live2d_path = "https://blogsunweionline.oss-cn-guangzhou.aliyuncs.com/live2d-widget/";

(() => {
  if (window.__live2dAutoloadStarted) return;
  window.__live2dAutoloadStarted = true;

  // Articles with a generated table of contents hide the widget while keeping
  // it available on pages without a TOC. The content container is replaced by
  // PJAX, so this check is intentionally performed whenever navigation ends.
  const shouldAutoHide = () => Boolean(
    document.querySelector('#body-wrap.post #card-toc')
  );
  let autoHidden = false;

  const syncVisibility = () => {
    const waifu = document.getElementById('waifu');
    const toggle = document.getElementById('waifu-toggle');
    if (!waifu || !toggle) return;

    if (shouldAutoHide()) {
      if (autoHidden) return;
      autoHidden = true;
      waifu.style.display = 'none';
      toggle.classList.add('waifu-toggle-active');
      return;
    }

    if (!autoHidden) return;
    autoHidden = false;
    waifu.style.display = '';
    waifu.style.bottom = 0;
    toggle.classList.remove('waifu-toggle-active');
  };

  document.addEventListener('pjax:complete', () => {
    window.setTimeout(syncVisibility, 0);
  });

  // Keep the mobile experience light. The toggle remains available on desktop.
  if (window.innerWidth < 768) return;

  const loadExternalResource = (url, type) => new Promise((resolve, reject) => {
    const selector = type === 'css' ? `link[href="${url}"]` : `script[src="${url}"]`;
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(url);
      return;
    }

    const tag = document.createElement(type === 'css' ? 'link' : 'script');
    if (type === 'css') {
      tag.rel = 'stylesheet';
      tag.href = url;
    } else {
      tag.src = url;
      tag.async = true;
    }
    tag.onload = () => resolve(url);
    tag.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(tag);
  });

  const init = () => {
    if (window.__live2dWidgetInitialized || document.getElementById('waifu')) return;
    window.__live2dWidgetInitialized = true;

    Promise.all([
      loadExternalResource(live2d_path + 'waifu.css', 'css'),
      loadExternalResource(live2d_path + 'live2d.min.js', 'js'),
      loadExternalResource(live2d_path + 'waifu-tips.js', 'js')
    ]).then(() => {
      if (typeof window.initWidget !== 'function') throw new Error('Live2D initializer is unavailable');
      window.initWidget({
        waifuPath: live2d_path + 'waifu-tips.json',
        cdnPath: live2d_path,
        tools: ['hitokoto', 'switch-texture', 'photo', 'quit']
      });
      syncVisibility();
    }).catch(error => {
      window.__live2dWidgetInitialized = false;
      console.warn('[Live2D] skipped:', error.message || error);
    });
  };

  const scheduleInit = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(init, { timeout: 2500 });
    } else {
      window.setTimeout(init, 1200);
    }
  };

  if (document.readyState === 'complete') scheduleInit();
  else window.addEventListener('load', scheduleInit, { once: true });
})();
