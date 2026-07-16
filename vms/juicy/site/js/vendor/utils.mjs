export function boot() {
  var el = document.getElementById('widget');
  if (el) el.insertAdjacentHTML('beforeend', '<div class="muted">utils v3 ready</div>');
}

export const CONFIG = {
  push: '/gw/7f3a9c/api/v2/push/register',
  vapid: 'BVapidJuicyPublicKeyExample000-do-not-share'
};
