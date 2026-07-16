(function () {
  var m = /[?#&]ref=([^&]+)/.exec(location.href);
  if (!m) return;
  var url = decodeURIComponent(m[1]);
  var a = document.getElementById('back');
  if (a) a.setAttribute('href', url);
})();
