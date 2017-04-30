var ValidationCore = require("../validation_core");

// ################################################################
// #### GameLeave             #####################################
function validateGameLeave(res, req) {
    // Extract player_id from request
    const user_id = req.query.user_id;
    if (!user_id) {
        res.errors.push('No user_id passed with request, did you remember to pass it in the request url?');
    }

    // Return a valid request body to caller, if possible
    if (res.errors.length !== 0) {
        return undefined;
    }
    else {
        return {
            user_id: user_id
        };
    }
}

// ################################################################
// #### Exports               #####################################
module.exports = { gameLeave: validateGameLeave };