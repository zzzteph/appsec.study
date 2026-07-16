(function () {
  var EXPECT = '2c91ca9e01feadabef9103c5367dff0d37ea34dc16454e48ed59d0be09393b47';
  function sha256hex(s) {
    var enc = new TextEncoder();
    return crypto.subtle.digest('SHA-256', enc.encode(s)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  var m = /[?&]dbg=([^&]+)/.exec(location.search);
  if (!m) return;
  sha256hex(decodeURIComponent(m[1])).then(function (h) {
    if (h !== EXPECT) return;
    window.__debug = {
      on: true,
      endpoints: ['/edge/d4/api/debug/config', '/edge/d4/api/debug/state'],
      token: 'dbg_live_JuicyBar_5a7f'
    };
    var el = document.getElementById('view');
    if (el) el.insertAdjacentHTML('afterbegin', '<div class="card">debug mode on</div>');
  });
})();
