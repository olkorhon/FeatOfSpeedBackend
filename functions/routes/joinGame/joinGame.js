const game_helper = require('../../game');
const validation = require('./validation');
const functions = require('firebase-functions');
const request = require('request-promise');

function handleRequest(admin, req, res) {
    // Create holder for response data
    var response_holder = { errors: [], warnings: [] };

    // Respond only to post requests
    if (req.method !== 'POST') {
        response_holder.errors.push('This function only replies to POST messages.');
        return res.status(400).json(response_holder);
    }

    // Extract body from request
    const valid_body = validation.gameJoin(response_holder, req);

    // Escape if validation failed
    if (!valid_body) {
        return res.status(400).json(response_holder);
    }

    admin.database().ref('games/' + valid_body.game_id).once('value').then(function (data) {
        const game_obj = data.val();
        console.log('Found game: ' + game_obj);

        if (game_obj) {
            game_helper.addPlayer(response_holder, game_obj, valid_body.player);

            if (response_holder.errors.length === 0) {
                admin.database().ref('games/' + valid_body.game_id).set(game_obj).then(snapshot => {
                    response_holder.game = game_obj;
                    return res.status(200).json(response_holder);
                });
            }
            else {
                // No player was added, but not really a crippling error
                res.status(200).json(response_holder);
            }
        }
        else {
            response_holder.errors.push('Could not find game with id: ' + valid_body.game_id);
            res.status(404).json(response_holder);
        }
    });
}

// Define functions to expose
module.exports = {
    handle: handleRequest
}