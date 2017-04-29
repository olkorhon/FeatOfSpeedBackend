const secrets = require('../../secrets');
const game_helper = require('../../game');
const validation = require('./validation');
const functions = require('firebase-functions');
const request = require('request-promise');

const base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?types=point_of_interest"

function handleRequest(admin, req, res) {
    // Create holder for response data
    const response_holder = { errors: [], warnings: [] };

    // Respond only to post requests
    if (req.method !== 'POST') {
        response_holder.errors.push('This function only replies to POST messages.');
        return res.status(400).json(response_holder);
    }

    // Extract body from request
    const valid_body = validation.gameCreate(response_holder, req);

    // Escape if validation failed
    if (!valid_body) {
        return res.status(400).json(response_holder);
    }

    admin.database().ref('games/').once('value').then(function (data) {
        // Get all games
        const games = data.val();

        try {
            new_game_id = game_helper.getRandomUniqueId(response_holder, games);
            console.log("ID generated: " + new_game_id);
        }
        catch (e) {
            new_game_id = "1234";
            console.log("Could not fetch id:" + e);
        }

        // Queue disconnect from other games
        try {
            disconnectPlayersFromOtherGames(admin, games, valid_body.host.user_id);
        }
        catch (e) {
            console.log("Could not disconnect from other games: " + e);
        }

        // Create game out of config
        const game_obj = game_helper.createGame(response_holder, valid_body.config, new_game_id);

        // Add provided player as the first player / host
        game_helper.addPlayer(response_holder, game_obj, valid_body.host);

        // Perform database calls
        admin.database().ref('games/' + game_obj.game_id).once('value').then(function (data) {
            console.log('Found game: ' + data.val());
            admin.database().ref('games/' + game_obj.game_id).set(game_obj).then(snapshot => {
                response_holder.game = game_obj;
                fetchWaypoints(admin, game_obj); // Async call to fetch waypoints for this game
                return res.status(200).json(response_holder);
            });
        });
    });
}

function disconnectPlayersFromOtherGames(admin, games, user_id) {
    results = { errors: [], warnings: [] };

    console.log(user_id);
    console.log("Disconnect player from: " + JSON.stringify(games));
    for (var game in games) {
        // If player is in this game, remove it
        let player = game_helper.getPlayer(games[game], user_id);

        if (player !== undefined) {
            game_helper.removePlayer(results, games[game], user_id);
            if (results.errors.length === 0) {
                let current_players = game_helper.countCurrentPlayers(games[game]);

                // Either update result or delete the game if the last player left
                if (current_players === 0) {
                    admin.database().ref('games/' + games[game].game_id).remove();
                }
                else {
                    admin.database().ref('games/' + games[game].game_id).set(games[game]).then(snapshot => {
                        console.log("Player: " + user_id + ", removed from game: " + game);
                    });
                }
            } else {
                console.log(JSON.stringify(results.errors));
            }
        }
    }
}

// Routine for fetching waypoints for a game
function fetchWaypoints(admin, game) {
    const final_url = base_url
        + '&key=' + secrets.places_api
        + '&location=' + game.location.latitude + ',' + game.location.longitude
        + '&radius='   + game.radius;
    console.log("Sending request to Places API, calling URL:" + final_url);

    request(final_url, { resolveWithFullResponse: true }).then(
        response => {
            if (response.statusCode === 200) {
                const data = JSON.parse(response.body);

                console.log("Answer from places API: " + response.body);

                // Get waypoints
                const waypoints = [];
                if (data.results.length > game.waypoint_count) {
                    // Too many, get enough waypoints
                    for (var i = 0; i < game.waypoint_count; i++) {
                        waypoint = {
                            waypoint_id: i,
                            name: data.results[i].name,
                            location: data.results[i].geometry.location
                        };
                        waypoints.push(waypoint);
                    }
                }
                else {
                    // Not enough, get all waypoints
                    for (var i = 0; i < data.results.length; i++) {
                        waypoint = {
                            waypoint_id: i,
                            name: data.results[i].name,
                            location: data.results[i].geometry.location
                        };
                        waypoints.push(waypoint);
                    }
                }

                // Add waypoints to game
                game.waypoints = waypoints;
                game.current_state = 1;

                // Create game reference
                const game_db_ref = admin.database().ref('games/' + game.game_id);
                game_db_ref.update(game);
            }
            else {
                console.log('Invalid request: ' + response.statusCode);
                console.log(response);
            }
        }
    )
}

// Define functions to expose
module.exports = {
    handle: handleRequest
}