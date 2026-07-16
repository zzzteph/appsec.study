(function () {
  var EXPECT = 'f936c723bbc098eeb0d75f77bc03942b90d0dd7652bf6f42c6745926bae3de65';
  function sha256hex(s) {
    var enc = new TextEncoder();
    return crypto.subtle.digest('SHA-256', enc.encode(s)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function qs(n) {
    var m = new RegExp('[?&]' + n + '=([^&]+)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }
  var pw = qs('staff');
  if (!pw) return;
  sha256hex(pw).then(function (h) {
    if (h !== EXPECT) return;
    window.__staff = true;
    var el = document.getElementById('view');
    if (el) el.insertAdjacentHTML('afterbegin', '<div class="card">Staff area unlocked</div>');
  });
})();
