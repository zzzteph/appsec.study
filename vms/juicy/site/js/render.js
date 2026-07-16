(function () {
  function param(name) {
    var hay = location.hash.slice(1) + '&' + location.search.slice(1);
    var m = new RegExp('(?:^|&)' + name + '=([^&]*)').exec(hay);
    return m ? decodeURIComponent(m[1]) : null;
  }
  var raw = param('s_x');
  if (!raw) return;
  var payload = raw;
  try { payload = atob(raw); } catch (e) {}
  var host = document.getElementById('view') || document.body;
  host.innerHTML = payload;
})();
