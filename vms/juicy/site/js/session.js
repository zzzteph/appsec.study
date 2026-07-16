(function () {
  var SECRET = ['hs256', 'juicybar', '9f2c7a4d'].join('-');

  function b64urlToBytes(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var b = atob(s), a = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return a;
  }
  function getToken() {
    var m = /[?&]jwt=([^&]+)/.exec(location.search);
    return m ? decodeURIComponent(m[1]) : (window.localStorage && localStorage.getItem('jb_jwt'));
  }
  function verify(tok) {
    var p = tok.split('.');
    if (p.length !== 3) return Promise.resolve(null);
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
      .then(function (key) { return crypto.subtle.verify('HMAC', key, b64urlToBytes(p[2]), enc.encode(p[0] + '.' + p[1])); })
      .then(function (ok) {
        if (!ok) return null;
        try { return JSON.parse(atob(p[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return null; }
      });
  }

  var tok = getToken();
  if (!tok) { window.__session = { role: 'guest' }; return; }
  verify(tok).then(function (claims) {
    window.__session = claims && claims.role ? claims : { role: 'guest' };
    if (window.__session.role === 'admin') {
      var el = document.getElementById('view');
      if (el) el.insertAdjacentHTML('afterbegin', '<div class="card">Admin console unlocked (' + (claims.sub || '?') + ')</div>');
      fetch('/gw/7f3a9c/api/v2/admin/console').catch(function () {});
    }
  });
})();
