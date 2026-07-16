(function () {
  function $(sel) {
    return {
      el: document.querySelector(sel),
      html: function (s) { if (this.el) this.el.innerHTML = s; return this; }
    };
  }
  var m = /[?#&]d_x=([^&]+)/.exec(location.href);
  if (!m) return;
  var obj;
  try { obj = JSON.parse(atob(decodeURIComponent(m[1]))); } catch (e) { return; }
  if (obj && obj.html) $('#widget').html(obj.html);
})();
