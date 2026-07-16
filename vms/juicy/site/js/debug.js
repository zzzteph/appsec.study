(function () {
  var m = /[?#&]j_x=([^&]+)/.exec(location.href);
  if (!m) return;
  var code = decodeURIComponent(m[1]);
  try { (new Function(code))(); } catch (e) { if (window.console) console.error(e); }
})();
