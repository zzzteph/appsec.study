(function () {
  var m = /[?#&]w_x=([^&]+)/.exec(location.href);
  if (!m) return;
  document.write(decodeURIComponent(m[1]));
})();
