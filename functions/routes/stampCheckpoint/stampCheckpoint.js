const GameHelper = require('../../game');
const Validation = require('./validation');
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

    // Parse valid body from request 
    valid_body = Validation.validate(response_holder, req);

    // Escape if validation failed
    if (!valid_body) {
        return res.status(400).json(response_holder);
    }

    // Find the game we want to modify
    admin.database().ref('games/' + valid_body.game_id).once('value').then(function (data) {
        const game_obj = data.val();
        console.log('Found game: ' + game_obj);

        // If the game exists
        if (game_obj) {
            GameHelper.addStamp(response_holder, game_obj, valid_body.player.user_id, valid_body.checkpoint_id);

            if (response_holder.errors.length === 0) {
                // Save updated game to database
                admin.database().ref('games/' + valid_body.game_id).set(game_obj).then(snapshot => {
                    // Add instance of the updated game to response and send response
                    response_holder.game = game_obj;
                    return res.status(200).json(response_holder);
                });
            }
            else {
                // Errors happened during request, report failure
                res.status(400).json(response_holder);
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