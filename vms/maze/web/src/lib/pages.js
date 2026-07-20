// Page composition: each active engine block is a PAGE, and a page is BUILT from multiple reusable
// blocks (Lego). Any block whose endpoint isn't live on the view simply renders nothing, so the same
// page recipe adapts to whatever vulns/features this mutation placed. Decorative blocks (hero/stats/
// newsletter/contact/footer) always render, framing the functional ones.
const KIND_BLOCKS = {
  content:     ['hero','search','productgrid','feed','comments','newsletter','contact','footer'],
  feature:     ['hero','productgrid','detail','cart','stats','newsletter','footer'],
  account:     ['hero','auth','reset','profile','lookup','footer'],
  fileportal:  ['hero','file','upload','stats','footer'],
  webhook:     ['hero','webhook','stats','contact','footer'],
  disclosure:  ['hero','docs','stats','footer'],
  adminreport: ['hero','render','stats','footer'],
  adminbackup: ['hero','backup','job','stats','footer'],
  adminupload: ['hero','upload','stats','footer'],
  import:      ['hero','import','stats','footer'],
}
export function pageBlocks(view) { return KIND_BLOCKS[view.kind] || ['hero','stats','contact','footer'] }
