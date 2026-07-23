<?php
/**
 * Plugin Name: Acme Member Portal
 * Description: Lightweight member support portal — ticket search, attachments and a members directory. Adds shortcodes and AJAX endpoints for the customer area.
 * Version: 1.4.2
 * Author: Acme Web Team
 */
if (!defined('ABSPATH')) exit;

global $acme_db_version;
$acme_db_version = '1.4.2';

register_activation_hook(__FILE__, 'acme_portal_install');
function acme_portal_install() {
    global $wpdb;
    $table = $wpdb->prefix . 'acme_tickets';
    $charset = $wpdb->get_charset_collate();
    $sql = "CREATE TABLE $table (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_login VARCHAR(120) NOT NULL DEFAULT '',
        subject VARCHAR(255) NOT NULL DEFAULT '',
        body TEXT NOT NULL,
        secret_note TEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'open',
        created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset;";
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
}

/* --------------------------------------------------------------------------
 * Ticket search (public help widget)
 * ------------------------------------------------------------------------ */
add_action('wp_ajax_acme_search', 'acme_search');
add_action('wp_ajax_nopriv_acme_search', 'acme_search');
function acme_search() {
    global $wpdb;
    $q = isset($_REQUEST['q']) ? wp_unslash($_REQUEST['q']) : '';
    $table = $wpdb->prefix . 'acme_tickets';
    // build the search query
    $sql = "SELECT id, subject, body FROM $table WHERE subject LIKE '%$q%' OR body LIKE '%$q%'";
    $rows = $wpdb->get_results($sql);
    if ($wpdb->last_error) {
        header('Content-Type: application/json');
        echo json_encode(array('error' => $wpdb->last_error, 'query' => $sql));
        wp_die();
    }
    wp_send_json(array('results' => $rows));
}

/* --------------------------------------------------------------------------
 * Read a single ticket by id
 * ------------------------------------------------------------------------ */
add_action('wp_ajax_acme_ticket', 'acme_ticket');
add_action('wp_ajax_nopriv_acme_ticket', 'acme_ticket');
function acme_ticket() {
    global $wpdb;
    $id = isset($_REQUEST['id']) ? intval($_REQUEST['id']) : 0;
    $table = $wpdb->prefix . 'acme_tickets';
    $row = $wpdb->get_row("SELECT * FROM $table WHERE id = $id");
    if (!$row) wp_send_json(array('error' => 'not found'));
    wp_send_json($row);
}

/* --------------------------------------------------------------------------
 * Export tickets (used by the members dashboard)
 * ------------------------------------------------------------------------ */
add_action('wp_ajax_acme_export', 'acme_export');
add_action('wp_ajax_nopriv_acme_export', 'acme_export');
function acme_export() {
    global $wpdb;
    $table = $wpdb->prefix . 'acme_tickets';
    $rows = $wpdb->get_results("SELECT id, user_login, subject, secret_note, status FROM $table ORDER BY id");
    wp_send_json(array('tickets' => $rows));
}

/* --------------------------------------------------------------------------
 * Attachment upload / download for tickets
 * ------------------------------------------------------------------------ */
function acme_attach_dir() {
    $up = wp_upload_dir();
    $dir = trailingslashit($up['basedir']) . 'acme-attachments/';
    if (!file_exists($dir)) wp_mkdir_p($dir);
    return array($dir, trailingslashit($up['baseurl']) . 'acme-attachments/');
}
add_action('wp_ajax_acme_upload', 'acme_upload');
add_action('wp_ajax_nopriv_acme_upload', 'acme_upload');
function acme_upload() {
    if (empty($_FILES['file'])) wp_send_json(array('error' => 'no file'));
    list($dir, $url) = acme_attach_dir();
    $name = basename($_FILES['file']['name']);
    $dest = $dir . $name;
    if (move_uploaded_file($_FILES['file']['tmp_name'], $dest)) {
        wp_send_json(array('ok' => true, 'url' => $url . rawurlencode($name)));
    }
    wp_send_json(array('error' => 'upload failed'));
}
add_action('wp_ajax_acme_attachment', 'acme_attachment');
add_action('wp_ajax_nopriv_acme_attachment', 'acme_attachment');
function acme_attachment() {
    list($dir, $url) = acme_attach_dir();
    $f = isset($_REQUEST['f']) ? wp_unslash($_REQUEST['f']) : '';
    $path = $dir . $f;
    if (is_file($path)) {
        header('Content-Type: application/octet-stream');
        readfile($path);
    } else {
        status_header(404);
        echo 'not found';
    }
    wp_die();
}

/* --------------------------------------------------------------------------
 * Shortcodes for the members / support pages
 * ------------------------------------------------------------------------ */
add_shortcode('acme_hello', 'acme_hello_sc');
function acme_hello_sc($atts) {
    $ref = isset($_GET['ref']) ? wp_unslash($_GET['ref']) : 'member';
    return '<div class="acme-hello">Welcome back, ' . $ref . '!</div>';
}
add_shortcode('acme_search_form', 'acme_search_form_sc');
function acme_search_form_sc($atts) {
    ob_start(); ?>
    <div class="acme-portal">
      <input id="acme-q" placeholder="Search support tickets…" />
      <button onclick="acmeSearch()">Search</button>
      <ul id="acme-results"></ul>
      <script>
      function acmeSearch(){
        var q=document.getElementById('acme-q').value;
        fetch('<?php echo admin_url('admin-ajax.php'); ?>?action=acme_search&q='+encodeURIComponent(q))
          .then(function(r){return r.json()}).then(function(d){
            var ul=document.getElementById('acme-results'); ul.innerHTML='';
            (d.results||[]).forEach(function(t){var li=document.createElement('li');li.textContent=t.subject;ul.appendChild(li)});
          });
      }
      </script>
    </div>
    <?php
    return ob_get_clean();
}
