// Validates a game create request
function validateGameCreate(res, json_package) {
    existsAndIsDict(res, json_package);

    // Cannot continue if initial tests failed
    if (res.errors.length === 0) {
        // Check that the game is defined properly
        assertValidConfig(res, json_package, 'config');

        // Check that host is a valid user
        assertValidUser(res, json_package, 'host');
    }

    // Finally determine validness
    res.valid = (res.errors.length === 0);
}

// Validates a game join request
function validateGameJoin(res, json_package) {
    existsAndIsDict(res, json_package);

    // Cannot continue if initial tests failed
    if (res.errors.length === 0) {
        // Check that the player is defined properly
        assertValidUser(res, json_package, 'player');
    }

    // Finally determine validness
    res.valid = (res.errors.length === 0);
}


// Validates a game join request
function validateGameLeave(res, json_package) {
    existsAndIsDict(res, json_package);

    // Cannot continue if initial tests failed
    if (res.errors.length === 0) {
        // Check that the player is defined properly
        assertValidUser(res, json_package, 'player');
    }

    // Finally determine validness
    res.valid = (res.errors.length === 0);
}

// Check that config has necessary fields
function assertValidConfig(res, package, field_name="config", field_context=null) {
    // Make sure the field exists
    if (!package[field_name]) {
        res.errors.push(missingField(field_name, field_context));
    }
    else {
        // Status: config exists, good
        var config = package[field_name];

        // Check that config is a dictionary
        if (typeof(config) !== 'object') {
            res.errors.push(typeMismatch(type(config), '"object"', field_name, field_context));
        }
        else {
            // Status: config is a dictionary, good

            // Check that config contains valid coordinate "location" field
            assertValidCoordinate(res, config, 'location', field_name);

            // Check that config contains "size" field
            if (!config.size) {
                res.errors.push(missingField('size', field_name));
            }
            else if (config.size !== 'small' && config.size !== 'medium' && config.size !== 'large') { // Check that waypoints field is an integer
                res.errors.push(invalidContent(config.size, 'small | medium | large', 'size', field_name));
            }
        }
                
    }
}

// Check that user has necessary fields
function assertValidUser(res, package, field_name='user', field_context=null) {
    // Make sure the field exists
    if (!package[field_name]) {
        res.errors.push(missingField(field_name, field_context));
    }
    else {
        // Status: Player exists, good
        var user = package[field_name]

        // Check that user is a dictionary
        if (typeof(package) !== 'object') {
            res.errors.push(typeMismatch(typeof(package), '"object"', field_name, field_context));
        }
        else {
            // Status player is dictionary, good

            // Todo, further validation for ID
            // Check that user has "id" field
            if (!user.user_id) {
                res.errors.push(missingField('user_id', field_name));
			}
            
            // Check that user has "nickname" field
            else if (!user.nickname) {
                res.errors.push(missingField('nickname', field_name));
            }
        }
    }
}


// Check that dict has a valid coordinate field
function assertValidCoordinate(res, package, field_name=null, field_context=null) {
    if (!package[field_name]) {
        res.errors.push(missingField(field_name, field_context));
    }
	else {
        // Status: field exists
        if (typeof(package[field_name]) !== 'object') {
            res.errors.push(typeMismatch(typeof(package[field_name]), '"object"', field_name, field_context));
        }
        else {
            // Status: field is a dictionary
            if (!package[field_name].longitude) {
                res.errors.push(missingField('longitude', field_name));
            }
            else if (!isNumeric(package[field_name].longitude)) { // Check that longitude field is a number
                res.errors.push(typeMismatch(typeof(package[field_name].longitude), '"Something numeric"', 'longitude', field_name));
            }

            if (!package[field_name].latitude) {
                res.errors.push(missingField('latitude', field_name));
            }
            else if (!isNumeric(package[field_name].latitude)) { // Check that latitude field is a number
                res.errors.push(typeMismatch(typeof(package[field_name].latitude), '"Something numeric"', 'latitude', field_name));
            }
        }
	}
}


// Check whether a number is numeric
function isNumeric(number) {
	return !isNaN(number) && isFinite(number);
}

// Checks that provided package axists and is of type dict
function existsAndIsDict(res, package, field_name=null, field_context=null) {
    // Check that json_package is not null
    if (!package) {
        res.errors.push(nullReference(field_name, field_context));
    }

    // Check that json_package is a dictionary
    else if (typeof(package) !== 'object') {
        res.errors.push(typeMismatch(typeof(package), '"object"', field_name, field_context));
    }
}


// Returns a formatted error message for invalid content
function invalidContent(value, should_be, field_name, field_context=None) {
    if (!field_context) {
        return error('invalidContent', 'field "' + field_name + '" should be one of the following values: ' + should_be + ', received: ' + value);
	}
    else {
        return error('invalidContent', 'field "' + field_context + '" has field "' + field_name + '" that should be one of the following values: ' + should_be + ', received: ' + value);
    }
}

// Returns a formatted error message for a missing field
function missingField(field_name, field_context=undefined) {
	if (!field_context) {
        return error('missingField', 'request does not define mandatory field "' + field_name + '"');
    }
    else {
        return error('missingField', 'field "' + field_context + '" does not define mandatory field "' + field_name + '"');
    }
}

// Returns a formatted error message for type mismatch
function typeMismatch(current_type, target_type, field_name=undefined, field_context=undefined) {
    if (!field_name && !field_context) {
        return error('typeMismatch', 'request is of type ' + current_type + ', it should be of type ' + target_type);
    }
    if (!field_context) {
        return error('typeMismatch', 'field "' + field_name + '" is of type ' + current_type + ', it should be of type ' + target_type);
    }
    else {
        return error('typeMismatch', 'field "' + field_context + '" has field "' + field_name + '" that is of type ' + current_type + ', it should be of type ' + target_type);
    }
}

// Returns a formatted error message for null reference
function nullReference(field_name=undefined, field_context=undefined) {
	if (!field_name && !field_context) {
        return error('nullReference', 'request cannot be null');
    }
    if (!field_context) {
        return error('nullReference', 'field "' + field_name + '" cannot be null');
    }
    else {
        return error('nullReference', 'field ' + field_context + ' has field "' + field_name + '" that cannot be null');
    }
}

// Define functions to expose
module.exports = {
	gameCreate: validateGameCreate,
	gameJoin  : validateGameJoin,
	gameLeave : validateGameLeave
}

// Base method for error calls
function error(error_type, msg) {
    return error_type + ': ' + msg;
}


// Simple testing script
console.log(validateGameCreate({errors:[], warnings:[]}, {
	config: {
		game_id:'1234',
		location:{
			latitude:953,
			longitude:6356 },
		size:'small'
	},
	host: {
		user_id:'2564',
		nickname:5
	}
}));




