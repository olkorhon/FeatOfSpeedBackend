const game_helper = require('./game');
const validation = require('./validation');
const functions = require('firebase-functions');
const request = require('request-promise');
const secrets = require('./secrets');

const base_url = "https://maps.googleapis.com/maps/api/place/textsearch/json?types=point_of_interest"

function handleRequest(admin, req, res) {
    // Create holder for response data
    const response_data = { errors: [], warnings: [] };

    // Respond only to post requests
    if (req.method !== 'POST') {
        response_data.errors.push('This function only replies to POST messages.');
        return res.status(400).json(response_data);
    }

    // Extract body from request
    const json_body = req.body;
    validation.gameCreate(response_data, json_body);

    // Escape if validation failed
    if (response_data.errors.length !== 0) {
        return res.status(400).json(response_data);
    }

    // Extract config from json_package
    const config = json_body.config;

    // Create game out of config
    const game_obj = game_helper.createGame(response_data, config, "1234");

    // Add provided player as the first player / host
    game_helper.addPlayer(response_data, game_obj, json_body.host);

    // Perform database calls
    admin.database().ref('games/' + game_obj.game_id).once('value').then(function (data) {
        console.log('Old game: ' + data.val());
        admin.database().ref('games/' + game_obj.game_id).set(game_obj).then(snapshot => {
            response_data.game = game_obj;
            fetchWaypoints(admin, game_obj);
            return res.status(200).json(response_data);
        });
    });
}

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
                if (data.results.length > game.checkpoints) {
                    // Too many, get enough waypoints
                    for (var i = 0; i < game.checkpoints; i++) {
                        waypoints.push(data.results[i]);
                    }
                }
                else {
                    // Not enough, get all waypoints
                    for (var i = 0; i < game.checkpoints; i++) {
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