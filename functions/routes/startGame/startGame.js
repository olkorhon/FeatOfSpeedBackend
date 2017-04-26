const game_helper = require('../../game');
const validation = require('./validation');
const functions = require('firebase-functions');
const request = require('request-promise');

const base_url = "https://maps.googleapis.com/maps/api/place/textsearch/json?types=point_of_interest"

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

    admin.database().ref('games/' + valid_body.game_id).once('value').then(function (data) {
        const game_obj = data.val();
        console.log('Found game: ' + game_obj);

        // Start the game
        game_helper.startGame(game_obj);

        // Create and update game reference
        const game_db_ref = admin.database().ref('games/' + valid_body.game_id);
        game_db_ref.update(game_obj);

        // Send response
        response_holder.game = game_obj;
        return res.status(200).json(response_holder);
    });
}

// Routine for fetching waypoints for a game
function fetchWaypoints(admin, game) {
    const final_url = base_url
        + '&key='      + secrets.places_api
        + '&location=' + game.location.longitude + ',' + game.location.latitude
        + '&radius='   + game.radius;

    request(final_url, { resolveWithFullResponse: true }).then(
        response => {
            if (response.statusCode === 200) {
                const data = JSON.parse(response.body);

                console.log(response.body);
                console.log(data);

                // Get waypoints
                const waypoints = [];
                if (data.results.length > game.checkpoint_count) {
                    // Too many, get enough waypoints
                    for (var i = 0; i < game.checkpoint_count; i++) {
                        data.results[i].checkpoint_id = "" + i; // Add an identifier to this checkpoint
                        waypoints.push(data.results[i]);
                    }
                }
                else {
                    // Not enough, get all waypoints
                    for (var i = 0; i < game.checkpoint_count; i++) {
                        data.results[i].checkpoint_id = "" + i; // Add an identifier to this checkpoint
                        waypoints.push(data.results[i]);
                    }
                }

                console.log("Waypoints: " + waypoints);

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