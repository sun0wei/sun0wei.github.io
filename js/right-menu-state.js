/* 右下角「鼠标」按钮状态同步。
 * 复用 fomal.js 的 localStorage 键 mouse：开启时使用站点右键菜单，关闭时恢复系统右键。
 */
(function () {
  function isOn() {
    try {
      return localStorage.getItem("mouse") !== "off";
    } catch (e) {
      return true;
    }
  }

  function button() {
    var buttons = document.querySelectorAll("#rightside button");
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].querySelector("i.fa-mouse") ||
          (buttons[i].getAttribute("title") || "").indexOf("右键模式") === 0) {
        return buttons[i];
      }
    }
    return null;
  }

  function apply() {
    var on = isOn();
    document.documentElement.setAttribute("data-rm", on ? "on" : "off");
    var target = button();
    if (!target) return;
    target.classList.add("mouse-mode-button");
    target.setAttribute("title", on
      ? "右键模式：站点自定义右键已开启（点击恢复系统默认）"
      : "右键模式：站点自定义右键已关闭（当前为系统默认右键，点击开启）");
  }

  function wrap() {
    var original = window.changeMouseMode;
    if (typeof original !== "function" || original.__mouseStateWrapped) return;
    var wrapped = function () {
      var result = original.apply(this, arguments);
      apply();
      return result;
    };
    wrapped.__mouseStateWrapped = true;
    window.changeMouseMode = wrapped;
  }

  apply();
  document.addEventListener("click", function (event) {
    var target = button();
    if (target && (event.target === target || target.contains(event.target))) {
      setTimeout(apply, 0);
    }
  }, true);
  document.addEventListener("DOMContentLoaded", function () {
    wrap();
    apply();
  });
  document.addEventListener("pjax:complete", function () {
    wrap();
    apply();
  });
  wrap();
})();
