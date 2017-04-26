var ValidationCore = require("../validation_core");

// ################################################################
// #### GameCreate            #####################################
function validateGameCreate(res, req) {
    // Extract game_id from request
    const game_id = req.query.game_id;
    if (!game_id) {
        res.errors.push('No game_id passed with request, did you remember to pass it in the request url?');
    }

    // Return a valid request body to caller, if possible
    if (res.errors.length !== 0) {
        return undefined;
    }
    else {
        return { game_id: game_id };
    }
}

// ################################################################
// #### Exports               #####################################
module.exports = { gameCreate: validateGameCreate };