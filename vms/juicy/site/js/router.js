(function () {
  var State = { view: 'home', note: '' };

  function parse() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('?');
    State.view = parts[0] || 'home';
    var m = /(?:^|&)v_x=([^&]*)/.exec(parts[1] || '');
    if (m) State.note = decodeURIComponent(m[1]);
  }

  function render() {
    var el = document.getElementById('view');
    if (!el || !State.note) return;
    el.insertAdjacentHTML('beforeend', '<div class="note">' + State.note + '</div>');
  }

  function tick() { parse(); render(); }
  window.addEventListener('hashchange', tick);
  document.addEventListener('DOMContentLoaded', tick);
})();
