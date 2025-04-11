// Wrap everything in a jQuery check
if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(function($) {
        console.log('Script.js loaded with jQuery:', $.fn.jquery);
        jQuery(document).ready(function($) {
            console.log('Document ready - script loaded'); 
            
            
            $('#cps-search-form').on('submit', function(e) {
                e.preventDefault();
                console.log('Form submitted');
                const playerName = $('#cps-player-name').val().trim();
                console.log('Searching for:', playerName);
                
                if (playerName.length < 2) {
                    $('#cps-results-container').html('<p>Please enter at least 2 characters.</p>');
                    return;
                }
        
                // Show loading
                $('#cps-results-container').html(`
                    <div class="cps-loading">
                        <div class="loading-spinner"></div>
                        <p>Searching for "${playerName}"...</p>
                    </div>
                `);
                console.log('Initiating search for:', playerName); 
        
                $.ajax({
                    url: cps_ajax.ajax_url,
                    method: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'cps_search_players',
                        player_name: playerName,
                        security: cps_ajax.nonce
                    },
                    success: function(response) {
                        console.log('API Response:', response); 
                        if (response.success && response.data && Array.isArray(response.data.data)) {
                            const players = response.data.data;
                            console.log('Players found:', players); 
                            if (players.length === 0) {
                                $('#cps-results-container').html(`<p>No players found for "${playerName}".</p>`);
                                return;
                            }
        
                            let html = '<div class="cps-grid">';
                            players.forEach(player => {
                                console.log('Processing player:', player); 
                                html += `
                                    <div class="cps-player-card" data-player-id="${player.id}">
                                        <h3>${player.name || 'Unknown'}</h3>
                                        <p><strong>Country:</strong> ${player.country || 'N/A'}</p>
                                        ${player.role ? `<p><strong>Role:</strong> ${player.role}</p>` : ''}
                                        <div class="player-buttons">
                                            <button class="btn blue view-details" data-player-id="${player.id}">
                                                View Player Details
                                            </button>
                                        </div>
                                    </div>
                                `;
                            });
                            html += '</div>';
                            $('#cps-results-container').html(html);
                            
                            initPlayerDetailButtons();
                        } else {
                            console.log('No players found in response');
                            $('#cps-results-container').html('<p>No players found.</p>');
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('AJAX Error:', status, error); 
                        $('#cps-results-container').html(`
                            <div class="cps-error">
                                <p>⚠️ Error fetching players. Try again later.</p>
                                <p><small>${error}</small></p>
                            </div>
                        `);
                    }
                });
            });
        
            function initPlayerDetailButtons() {
                $('.view-details').on('click', function(e) {
                    e.preventDefault();
                    const playerId = $(this).data('player-id');
                    console.log('Fetching details for player ID:', playerId); 
                    fetchPlayerDetails(playerId);
                });
            }
        
            function fetchPlayerDetails(playerId) {
                $('#cps-results-container').html(`
                    <div class="cps-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading player details...</p>
                    </div>
                `);
        
                console.log('Initiating player details fetch for ID:', playerId);
        
                $.ajax({
                    url: 'https://api.cricapi.com/v1/players_info',
                    method: 'GET',
                    dataType: 'json',
                    data: {
                        apikey: '23853bc0-52f1-498c-985e-2faa764e23c4',
                        id: playerId
                    },
                    success: function(response) {
                        console.log('Player details API response:', response);
                        if (response.status === "success" && response.data) {
                            displayPlayerDetails(response.data);
                        } else {
                            console.log('No detailed information available');
                            $('#cps-results-container').html(`
                                <div class="cps-error">
                                    <p>⚠️ No detailed information available</p>
                                    <button class="btn back-to-results">Back to Results</button>
                                </div>
                            `);
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Player details AJAX Error:', status, error);
                        console.error('Response:', xhr.responseText); 
                        $('#cps-results-container').html(`
                            <div class="cps-error">
                                <p>⚠️ Failed to load player details</p>
                                <p><small>${error}</small></p>
                                <button class="btn back-to-results">Back to Results</button>
                            </div>
                        `);
                    }
                });
            }
        
            function displayPlayerDetails(player) {
                let html = `
                    <div class="player-detail-view">
                        <button class="btn back-to-results">← Back to Results</button>
                        <h2>${player.name || 'Unknown Player'}</h2>
                        
                        <div class="tabs">
                            <button class="tab-btn active" data-tab="basic">Basic Info</button>
                            <button class="tab-btn" data-tab="stats">Statistics</button>
                        </div>
                        
                        <div id="basic-tab" class="tab-content active">
                            ${createBasicInfoTable(player)}
                        </div>
                        
                        <div id="stats-tab" class="tab-content">
                            ${createStatsTables(player)}
                        </div>
                    </div>
                `;
        
                $('#cps-results-container').html(html);
                
                // Tab switching functionality
                $('.tab-btn').on('click', function() {
                    $('.tab-btn').removeClass('active');
                    $(this).addClass('active');
                    
                    $('.tab-content').removeClass('active');
                    $(`#${$(this).data('tab')}-tab`).addClass('active');
                });
                
                $('.back-to-results').on('click', function() {
                    $('#cps-search-form').trigger('submit');
                });
            }
        
            function createBasicInfoTable(player) {
                return `
                    <table class="data-table">
                        <tr><th>Player ID</th><td>${player.id || 'N/A'}</td></tr>
                        <tr><th>Country</th><td>${player.country || 'N/A'}</td></tr>
                        <tr><th>Role</th><td>${player.role || 'N/A'}</td></tr>
                        <tr><th>Date of Birth</th><td>${player.dateOfBirth || 'N/A'}</td></tr>
                        <tr><th>Batting Style</th><td>${player.battingStyle || 'N/A'}</td></tr>
                        <tr><th>Bowling Style</th><td>${player.bowlingStyle || 'N/A'}</td></tr>
                        ${player.teams ? `<tr><th>Teams</th><td>${player.teams.join(', ')}</td></tr>` : ''}
                    </table>
                `;
            }
        
            function createStatsTables(player) {
                let html = '';
                
                if (player.stats && Array.isArray(player.stats)) {
                    // Group stats by type and match format
                    const statsGroups = {};
                    player.stats.forEach(stat => {
                        const key = `${stat.fn}_${stat.matchtype}`;
                        if (!statsGroups[key]) {
                            statsGroups[key] = [];
                        }
                        statsGroups[key].push(stat);
                    });
                    
                    // Create tables for each group
                    for (const [key, stats] of Object.entries(statsGroups)) {
                        const [type, format] = key.split('_');
                        const title = `${type.charAt(0).toUpperCase() + type.slice(1)} (${format})`;
                        
                        html += `<h3>${title}</h3><table class="data-table"><tbody>`;
                        
                        stats.forEach(stat => {
                            html += `<tr><th>${stat.stat}</th><td>${stat.value}</td></tr>`;
                        });
                        
                        html += `</tbody></table>`;
                    }
                } else {
                    html = '<p>No statistics available for this player.</p>';
                }
                
                return html;
            }
        
            // Auto-run if ?player_name exists in URL
            const urlParams = new URLSearchParams(window.location.search);
            const paramName = urlParams.get('player_name');
            if (paramName && paramName.length > 1) {
                $('#cps-player-name').val(paramName);
                $('#cps-search-form').trigger('submit');
            }
        });
    });
} else {
    console.error('jQuery still not loaded!');
    // Optional: Retry loading jQuery
}