(() => {
  "use strict";
  var r = {
    418: (e, t) => {
      var n = ["ju", "icy", "bar"].join("");
      t.jwt = n + "-jwt-s3cr3t-k3y-2024";
      t.svc = "svc_live_9d2f7a4c1e8b6033";
    },
    277: (e, t) => {
      var p = ["", "_int", "8b21", "internal"].join("/");
      t.users = p + "/" + ["admin", "users"].join("/");
      t.flags = p + "/" + ["admin", "flags"].join("/");
      t.metrics = p + "/metrics";
    },
    603: (e, t, n) => {
      var a = n(277);
      var gw = "/" + ["gw", "7f3a9c"].join("/") + "/" + ["api", "v2"].join("/");
      t.coupon = gw + "/" + ["cou", "pons"].join("") + "/redeem";
      t.admin = a.users;
      t.flags = a.flags;
      t.metrics = a.metrics;
    }
  };
  var o = {};
  function n(e) {
    var t = o[e];
    if (void 0 !== t) return t.exports;
    var a = (o[e] = { exports: {} });
    return r[e](a, a.exports, n), a.exports;
  }
  var a = n(603), c = n(418);
  window.__JB__ = {
    ep: { couponRedeem: a.coupon, adminUsers: a.admin, adminFlags: a.flags, metrics: a.metrics },
    secret: c.jwt,
    service: c.svc
  };
})();
