(function () {
  var m = /[?#&]tpl=([^&]+)/.exec(location.href);
  if (!m) return;
  var tpl = decodeURIComponent(m[1]);
  var html = tpl.replace(/\{\{\s*brand\s*\}\}/g, window.JUICY_CFG ? 'Juicy' : 'Shop');
  var w = document.getElementById('widget');
  if (w) w.innerHTML = html;
})();
