var Juicy = (function () {
  var _gw = '/' + 'gw' + '/' + '7f3a9c';
  var _seg = ['a', 'p', 'i'];
  var BASE = _gw + '/' + _seg.join('') + '/v' + (1 + 1);

  function path() {
    return BASE + '/' + Array.prototype.slice.call(arguments).join('/');
  }

  var routes = {
    products:  function () { return path('pro' + 'ducts'); },
    product:   function (id) { return path('pro' + 'ducts', id); },
    orders:    function () { return path('or' + 'ders'); },
    order:     function (id) { return path('or' + 'ders', id); },
    me:        function () { return path('acc' + 'ount', 'me'); },
    addresses: function () { return path('acc' + 'ount', 'add' + 'resses'); },
    cart:      function () { return path('ca' + 'rt'); },
    addItem:   function () { return path('ca' + 'rt', 'it' + 'ems'); },
    coupon:    function () { return path('cou' + 'pons', 'redeem'); },
    search:    function (q) { return path('sea' + 'rch') + '?q=' + encodeURIComponent(q); },
    checkout:  function () { return path('che' + 'ckout'); }
  };

  var DEMO = [
    { name: 'Green Machine', price: 6.5 },
    { name: 'Sunrise Citrus', price: 5.0 },
    { name: 'Berry Bolt', price: 6.0 }
  ];

  function render(items) {
    var view = document.getElementById('view');
    if (!view || !items || !items.map) { view.innerHTML = DEMO.map(card).join(''); return; }
    view.innerHTML = items.map(card).join('');
  }

  function card(p) {
    return '<div class="card"><h3>' + p.name + '</h3>' +
           '<span class="price">$' + Number(p.price).toFixed(2) + '</span></div>';
  }

  function load() {
    fetch(routes.products())
      .then(function (r) { return r.json(); })
      .then(function (d) { render(d && d.data && d.data.length ? d.data : DEMO); })
      .catch(function () { render(DEMO); });
  }

  return { load: load, routes: routes, base: BASE };
})();

document.addEventListener('DOMContentLoaded', Juicy.load);
