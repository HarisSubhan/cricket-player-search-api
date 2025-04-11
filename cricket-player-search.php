<?php
/*
Plugin Name: Cricket Player Search
Description: Search for cricket players via CricAPI
Version: 1.3
Author: Your Name
*/



defined('ABSPATH') or die('Direct access not allowed');

class CricketPlayerSearch {
    private $api_key = '23853bc0-52f1-498c-985e-2faa764e23c4';
    
    public function __construct() {
        add_action('wp_head', function() {
            wp_deregister_script('jquery');
            wp_register_script('jquery', includes_url('js/jquery/jquery.min.js'), [], '3.7.1');
            wp_enqueue_script('jquery');
        }, 1);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts'], 20);
        add_shortcode('cricket_player_search', [$this, 'search_form_shortcode']);
        add_action('wp_ajax_cps_search_players', [$this, 'search_players']);
        add_action('wp_ajax_nopriv_cps_search_players', [$this, 'search_players']);
    }

    public function enqueue_scripts() {
        wp_enqueue_script('jquery');
        wp_enqueue_script(
            'cps-script', 
            plugins_url('js/script.js', __FILE__), 
            ['jquery'], // ← Ensures jQuery loads first
            '1.3',
            true // ← Load in footer
        );
        
        wp_localize_script('cps-script', 'cps_ajax', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('cps_search_nonce')
        ]);
        // add_action('wp_print_scripts', function() {
        //     echo '<script>console.log("jQuery Version:", jQuery?.fn?.jquery || "jQuery not loaded");</script>';
        // });
    }

    public function search_form_shortcode() {
        ob_start(); ?>
        <script>
    (function() {
        if (typeof jQuery === 'undefined') {
            var script = document.createElement('script');
            script.src = '<?php echo includes_url("js/jquery/jquery.min.js"); ?>';
            script.onload = function() {
                console.log('jQuery manually loaded:', jQuery.fn.jquery);
                initCricketPlugin();
            };
            document.head.appendChild(script);
        } else {
            console.log('jQuery already loaded:', jQuery.fn.jquery);
            initCricketPlugin();
        }

        function initCricketPlugin() {
            // Your plugin initialization code here
            jQuery(document).ready(function($) {
                console.log('Plugin initialized with jQuery:', $.fn.jquery);
                // Existing form code...
            });
        }
    })();
    </script>
        <div class="cricket-player-search">
            <form id="cps-search-form">
                <input type="text" id="cps-player-name" name="player_name" 
                       placeholder="E.g. Kohli, Smith, Sharma..." required>
                <button type="submit">Search</button>
            </form>
            <div id="cps-results-container">
                <div class="cps-help-text">
                    <p>Enter a cricket player's name to search</p>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    // Add to your plugin class
public function player_details_endpoint() {
    register_rest_route('cricket/v1', '/player/(?P<id>\w+)', [
        'methods' => 'GET',
        'callback' => [$this, 'get_player_details'],
        'permission_callback' => '__return_true'
    ]);
}

public function get_player_details($request) {
    $player_id = $request->get_param('id');
    $api_url = "https://api.cricapi.com/v1/players_info?apikey={$this->api_key}&id={$player_id}";
    
    $response = wp_remote_get($api_url, [
        'timeout' => 15,
        'sslverify' => false
    ]);
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', $response->get_error_message());
    }
    
    return json_decode(wp_remote_retrieve_body($response), true);
}

    public function search_players() {
        check_ajax_referer('cps_search_nonce', 'security');

        if (!isset($_POST['player_name']) || empty(trim($_POST['player_name']))) {
            wp_send_json_error(['message' => 'Please enter a player name']);
            return;
        }

        $player_name = sanitize_text_field($_POST['player_name']);
        $api_url = "https://api.cricapi.com/v1/players?apikey={$this->api_key}&offset=0&search=".urlencode($player_name);
        
        $response = wp_remote_get($api_url, [
            'timeout' => 15,
            'sslverify' => false,
            'headers' => ['Accept' => 'application/json']
        ]);
        
        if (is_wp_error($response)) {
            wp_send_json_error([
                'message' => 'API Connection Failed',
                'error' => $response->get_error_message()
            ]);
            return;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (!isset($data['data'])) {
            wp_send_json_error([
                'message' => 'Invalid API response',
                'response' => $data
            ]);
            return;
        }
        
        wp_send_json_success([
            'data' => $data['data'],
            'info' => $data['info'] ?? ''
        ]);
    }
}

new CricketPlayerSearch();