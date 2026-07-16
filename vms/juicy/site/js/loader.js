(function () {
  var manifest = { 7: 'async.7f3a.js', 9: 'async.9c21.js' };
  function chunkUrl(id) { return '/js/' + manifest[id]; }
  function loadChunk(id) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = chunkUrl(id);
      s.onload = function () { res(window.__chunks && window.__chunks[id]); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  window.__loader = { manifest: manifest, url: chunkUrl, load: loadChunk };
  if (/[?&]pay=1/.test(location.search)) loadChunk(7);
})();
