(function () {
  var _b = "eyJ0b2tlbiI6InNka19saXZlX0p1aWN5QmFyXzdmM2EiLCJvcmciOiJqdWljeWJhciIsInBheSI6Ii9ndy83ZjNhOWMvYXBpL3YyL3BheW1lbnRzL2NoYXJnZSJ9";
  var cfg = JSON.parse(atob(_b));
  var telemetry = String.fromCharCode(47, 101, 100, 103, 101, 47, 100, 52, 47, 97, 112, 105, 47, 118, 51, 47, 116, 101, 108, 101, 109, 101, 116, 114, 121);
  window.__SDK__ = { token: cfg.token, org: cfg.org, pay: cfg.pay, telemetry: telemetry };
})();
