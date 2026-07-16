(function () {
  if (!/[?#&]m_x=1/.test(location.href)) return;
  window.addEventListener('message', function (ev) {
    var d = ev.data || {};
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = { html: d }; } }
    if (d && d.html) {
      var host = document.getElementById('widget') || document.body;
      host.innerHTML = d.html;
    }
  }, false);
})();
