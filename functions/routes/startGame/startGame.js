const GameHelper = require('../../game');
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
        GameHelper.startGame(response_holder, game_obj);

        // Add starting time
        game_obj.start_time = new Date();

        if (response_holder.errors.length === 0) {

            // Create and update game reference
            const game_db_ref = admin.database().ref('games/' + valid_body.game_id);
            game_db_ref.update(game_obj).then(snaphost => {
                response_holder.game = game_obj;
                return res.status(200).json(response_holder);
            });
        }
        else {
            return res.status(400).json(response_holder);
        }
    });
}

// Define functions to expose
module.exports = {
    handle: handleRequest
}