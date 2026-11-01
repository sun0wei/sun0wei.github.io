// Live2D is available on desktop pages and starts after the main page is ready.
// Keep model/config files on OSS, but load executable runtime files locally.
// The OSS objects are served with `Content-Disposition: attachment`, which can
// prevent browser script loading and leave the widget uninitialized.
const live2d_path = "https://blogsunweionline.oss-cn-guangzhou.aliyuncs.com/live2d-widget/";
const live2d_runtime_path = "/live2d-widget/";
const live2d_model_path = "https://cdn.jsdelivr.net/npm/live2d-widget-model-koharu@1.0.5/assets/koharu.model.json";

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

  let initAttempts = 0;
  const init = () => {
    if (window.__live2dWidgetInitialized || document.getElementById('waifu')) return;
    // The runtime files are declared as ordered, deferred scripts in the page.
    // Wait briefly if a cached page resumes before they have executed.
    if (typeof window.initWidget !== 'function' || typeof window.loadlive2d !== 'function') {
      if (initAttempts++ < 12) window.setTimeout(init, 500);
      return;
    }
    window.__live2dWidgetInitialized = true;
    window.initWidget({
      waifuPath: live2d_runtime_path + 'waifu-tips.json',
      cdnPath: live2d_path,
      modelPath: live2d_model_path,
      tools: ['hitokoto', 'switch-texture', 'photo', 'quit']
    });
    syncVisibility();
  };

  const scheduleInit = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(init, { timeout: 2500 });
    } else {
      window.setTimeout(init, 1200);
    }
  };

  // Do not depend on window.load: a slow third-party counter or image can
  // keep the load event pending and prevent the widget from ever appearing.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit, { once: true });
    window.setTimeout(scheduleInit, 3000);
  } else {
    scheduleInit();
  }
})();
