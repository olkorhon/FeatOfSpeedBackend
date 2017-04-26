var ValidationCore = require("../validation_core");

// ################################################################
// #### GameCreate            #####################################
function validateGameCreate(res, req) {
    // Extract body from request
    const json_body = req.body;

    // Validate body format
    ValidationCore.dataExistsAndIsDict(res, json_body);

    // Cannot continue if initial tests failed
    if (res.errors.length === 0) {
        // Check that the game is defined properly
        ValidationCore.assertValidConfig(res, json_body, 'config');

        // Check that host is a valid user
        ValidationCore.assertValidUser(res, json_body, 'host');
    }

    // Extract config from json_body
    const config = json_body.config

    // Extract player from json_body
    const host = json_body.host;

    // Return a valid request body to caller, if possible
    if (res.errors.length !== 0) {
        return undefined;
    }
    else {
        return {
            host: host,
            config: config
        }
    }
}

// ################################################################
// #### Exports               #####################################
module.exports = { gameCreate: validateGameCreate };