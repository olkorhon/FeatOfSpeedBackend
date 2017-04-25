var ValidationCore = require("../validation_core");

// Validates a game join request
function validateStampCheckpoint(res, req) {
    // Extract body from request
    const json_body = req.body;

    // Validate body format
    ValidationCore.dataExistsAndIsDict(res, json_body);

    // Cannot continue if data is not parceable to dict
    if (res.errors.length === 0) {
        // Check that the player is defined properly
        ValidationCore.assertValidUser(res, json_body, 'player');
    }

    // Extract player from json_package
    const player = json_body.player;

    // Extract game_id from request
    const game_id = req.query.game_id;
    if (!game_id) {
        res.errors.push('No game_id passed with request, did you remember to pass it in the request url?');
    }

    // Extract checkpoint_id from request
    const checkpoint_id = req.query.checkpoint_id;
    if (!checkpoint_id && checkpoint_id !== 0) {
        res.errors.push('No checkpoint_id passed with request, did you remember to pass it in the request url?');
    }

    // Return a valid request body to caller, if possible
    if (res.errors.length !== 0) {
        return undefined;
    }    
    else {
        return {
            player: player,
            game_id: game_id,
            checkpoint_id: checkpoint_id
        }
    }
}

// ################################
// #### Exports               #####
// ################################
module.exports = { validate: validateStampCheckpoint };


// ################################
// #### Simple testing script #####
// ################################
const result = { errors: [], warnings: [] };
const request = {
    body: {
        player: {
            user_id: '2564',
            nickname: 5
        }
    },
    query: {
        game_id: "1234",
        checkpoint_id: "1"
    }
};

validateStampCheckpoint(result, request)
console.log(result);