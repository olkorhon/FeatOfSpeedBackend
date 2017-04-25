const game_helper = require('./game');
const validation = require('./validation');
const functions = require('firebase-functions');
const request = require('request-promise');

function handleRequest(admin, req, res) {
    // Create holder for response data
    var response_data = { errors: [], warnings: [] };

    // Respond only to post requests
    if (req.method !== 'POST') {
        response_data.errors.push('This function only replies to POST messages.');
        return res.status(400).json(response_data);
    }

    // Extract body from request
    const json_body = req.body;
    validation.gameJoin(response_data, json_body);

    // Escape if validation failed
    if (response_data.errors.length !== 0) {
        return res.status(400).json(response_data);
    }

    // Extract game_id form request
    var game_id = req.query.game_id;

    if (!game_id) {
        response_data.errors.push('No game_id found, did you forget to pass it in the url?');
        return res.status(400).json();
    }

    // Extract player from json_package
    var player = json_body.player;

    admin.database().ref('games/' + game_id).once('value').then(function (data) {
        var game_obj = data.val();
        console.log('Found game: ' + game_obj);

        if (game_obj) {
            game_helper.addPlayer(response_data, game_obj, player);

            if (response_data.errors.length === 0) {
                admin.database().ref('games/' + game_id).set(game_obj).then(snapshot => {
                    response_data.game = game_obj;
                    return res.status(200).json(response_data);
                });
            }
            else {
                // No player was added, but not really a crippling error
                res.status(200).json(response_data);
            }
        }
        else {
            response_data.errors.push('Could not find game with id: ' + game_id);
            res.status(404).json(response_data);
        }
    });
}

// Define functions to expose
module.exports = {
    handle: handleRequest
}