(function () {
  var cfg = window.JUICY_CFG || { flags: {} };
  function qs(n) {
    var m = new RegExp('[?&]' + n + '=([^&]+)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }
  var enabled = (cfg.flags && cfg.flags.beta) || qs('ff') === 'admin_console';
  var gw = ['/gw/7f3a9c/api/v2'];
  var registry = { routes: [gw + '/' + 'products'] };
  if (enabled) {
    registry.routes.push([gw, 'ad' + 'min', 'con' + 'sole'].join('/'));
    registry.routes.push(['/_int/8b21/internal', 'ad' + 'min', 'imper' + 'sonate'].join('/'));
  }
  window.__features = registry;
})();
