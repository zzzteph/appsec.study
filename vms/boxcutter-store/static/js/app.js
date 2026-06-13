/*!
 * Boxcutter Store - storefront widgets + analytics (loaded on every page).
 * Defines the internal API map used by the cart/recommendation widgets and
 * fires a lightweight pageview beacon.
 */
(function () {
  "use strict";
  window.BOXCUTTER = window.BOXCUTTER || {};

  // Internal API map. A few of these are internal services that aren't in the
  // public API docs.
  window.BOXCUTTER.api = {
    products: "/api/products",
    cart: "/api/cart",
    me: "/api/me",
    recommendations: "/api/v1/users",      // internal recommendations service (undocumented)
    internalDebug: "/api/internal/debug",   // internal build/debug endpoint (undocumented)
    adminStats: "/api/admin/stats"
  };

  // Internal admin tooling - feature-flagged OFF in production, so these are
  // never called by the running app. (Left in the bundle by mistake.)
  window.BOXCUTTER.internal = {
    userLookup: "/api/internal/user-lookup?email=",   // staff user search
    debugReport: "/api/internal/debug-report?id=",     // build/debug report
    fetchProxy: "/api/internal/fetch?url=",            // server-side URL fetcher
    adminConsole: "/api/admin/console",                // admin console (JWT)
    exportUsers: "/exports/users-2024-q1.json"         // quarterly data export
  };

  // QA / feature plumbing primed from the URL (not in the public docs). Read on
  // every page load.
  var qs = new URLSearchParams(location.search);

  // VULN[dom-localstorage]: ?pref=key:value writes an arbitrary localStorage entry,
  // e.g. ?pref=role:admin or ?pref=feature_admin:true.
  var pref = qs.get("pref");
  if (pref && pref.indexOf(":") > 0) {
    var kv = pref.split(":");
    localStorage.setItem("bc_" + kv[0], kv.slice(1).join(":"));
  }

  // VULN[dom-script-load]: ?widget=<url> loads an external script and persists it to
  // localStorage, so it is re-injected on every subsequent page load.
  var widget = qs.get("widget") || localStorage.getItem("bc_widget");
  if (widget) {
    localStorage.setItem("bc_widget", widget);
    var s = document.createElement("script");
    s.src = widget;
    document.head.appendChild(s);
  }

  // Pageview beacon (best-effort, ignored if unsupported).
  try {
    if (navigator.sendBeacon) navigator.sendBeacon("/api/collect", location.pathname);
  } catch (e) { /* no-op */ }
})();
