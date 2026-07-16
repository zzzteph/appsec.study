(function () {
  var root = ((window.Juicy && Juicy.base) || '/gw/7f3a9c/api/v2').split('/api/')[0];
  var endpoint = root + '/' + ['gr', 'aphql'].join('');
  var OPS = {
    Me: {
      hash: 'c13a61cecc96d8ab8abd24d351e8a17db9876cec58e49bed410580555df4ff7e',
      doc: 'query Me{me{id email role}}'
    },
    AdminUsers: {
      hash: '4e1b67a79e16ff8d1c0f183dac1b83b6eb7b7eb2ada56f2fe17ad0e018533795',
      doc: 'query AdminUsers{adminUsers{id email role token}}'
    }
  };
  function call(op, vars) {
    var o = OPS[op];
    if (!o) return Promise.reject('unknown op');
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: op,
        variables: vars || {},
        extensions: { persistedQuery: { version: 1, sha256Hash: o.hash } }
      })
    }).then(function (r) { return r.json(); });
  }
  window.__gql = { endpoint: endpoint, ops: OPS, call: call };
})();
