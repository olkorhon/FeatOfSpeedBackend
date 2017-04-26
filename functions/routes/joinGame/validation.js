var ValidationCore = require("../validation_core");

// ################################################################
// #### GameJoin              #####################################
function validateGameJoin(res, req) {
    // Extract body from request
    const json_body = req.body;

    // Validate body format
    ValidationCore.dataExistsAndIsDict(res, json_body);

    // Cannot continue if initial tests failed
    if (res.errors.length === 0) {
        // Check that the player is defined properly
        ValidationCore.assertValidUser(res, json_body, 'player');
    }

    // Extract player from json_body
    const player = json_body.player;

    // Extract game_id form request
    const game_id = req.query.game_id;
    if (!game_id) {
        res.errors.push('No game_id found, did you forget to pass it in the url?');
    }

    // Return a valid request body to caller, if possible
    if (res.errors.length !== 0) {
        return undefined;
    }
    else {
        return {
            player: player,
            game_id: game_id
        };
    }
}

// ################################################################
// #### Exports               #####################################
module.exports = { gameJoin: validateGameJoin };