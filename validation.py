import numbers

# Validates a game create request
def validateGameCreate(json_package):
    context = "GameValidation"
    result = {'errors':[]}
    existsAndIsDict(result, json_package)

    # Cannot continue if initial tests failed
    if len(result['errors']) == 0:
        # Check that the game is defined properly
        assertValidConfig(result, json_package, 'config')

        # Check that host is a valid user
        assertValidUser(result, json_package, 'host')

    # Finally return results
    result['valid'] = len(result['errors']) == 0
    return result


# Validates a game join request
def validateGameJoin(json_package):
    context = "JoinValidation"
    result = {'errors': []}
    existsAndIsDict(result, json_package)

    # Cannot continue if initial tests failed
    if len(result['errors']) == 0:
        # Check that the player is defined properly
        assertValidUser(result, json_package, 'player')

    # Finally return results
    result['valid'] = len(result['errors']) == 0
    return result

# Validates a game join request
def validateGameLeave(json_package):
    context = "JoinValidation"
    result = {'errors': []}
    existsAndIsDict(result, json_package)

    # Cannot continue if initial tests failed
    if len(result['errors']) == 0:
        # Check that the player is defined properly
        assertValidUser(result, json_package, 'player')

    # Finally return results
    result['valid'] = len(result['errors']) == 0
    return result


# Check that config has necessary fields
def assertValidConfig(result, package, field_name="config", field_context=None):
    # Make sure the field exists
    if field_name not in package:
        result['errors'].append(missingField(field_name, field_context))
    else:
        # Status: config exists, good
        config = package[field_name]

        # Check that config is a dictionary
        if type(config) is not dict:
            result['errors'].append(typeMismatch(type(config), '<dict>', field_name, field_context))
        else:
            # Status: config is a dictionary, good

            # Check that config contains valid coordinate "location" field
            assertValidCoordinate(result, config, 'location', field_name)

            # Check that config contains "waypoints" field
            if 'waypoints' not in config:
                result['errors'].append(missingField('waypoints', field_name))
            elif type(config['waypoints']) is not int: # Check that waypoints field is an integer
                result['errors'].append(typeMismatch(type(config['waypoints']), '<int>', field_name, field_context))

            # Check that config contains "radius" field
            if 'radius' not in config:
                result['errors'].append(missingField('radius', field_name))
            elif not isinstance(config['radius'], numbers.Number): # Check that radius field is a number
                result['errors'].append(typeMismatch(type(config['radius']), '<int, float, etc.>', field_name, field_context))


# Check that user has necessary fields
def assertValidUser(result, package, field_name="user", field_context=None):
    # Make sure the field exists
    if field_name not in package:
        result['errors'].append(missingField(field_name, field_context))
    else:
        # Status: Player exists, good
        user = package[field_name]

        # Check that user is a dictionary
        if type(package) is not dict:
            result['errors'].append(typeMismatch(type(package), '<dict>', field_name, field_context))
        else:
            # Status player is dictionary, good

            # Todo, further validation for ID
            # Check that user has "id" field
            if 'user_id' not in user:
                result['errors'].append(missingField('user_id', field_name))

            # Check that user has "nickname" field
            elif 'nickname' not in user:
                result['errors'].append(missingField('nickname', field_name))


# Check that dict has a valid coordinate field
def assertValidCoordinate(result, package, field_name=None, field_context=None):
    if field_name not in package:
        result['errors'].append(missingField(field_name, field_context))
    else:
        # Status: field exists

        if type(package[field_name]) is not dict:
            result['errors'].append(typeMismatch(type(package[field_name]), 'dict', field_name, field_context))
        else:
            # Status: field is a dictionary
            if 'longitude' not in package[field_name]:
                result['errors'].append(missingField('longitude', field_name))
            elif not isinstance(package[field_name]['longitude'], numbers.Number): # Check that longitude field is a number
                result['errors'].append(typeMismatch(type(package[field_name]['longitude']), '<int, float, etc.>', 'longitude', field_name))

            if 'latitude' not in package[field_name]:
                result['errors'].append(missingField('latitude', field_name))
            elif not isinstance(package[field_name]['latitude'], numbers.Number):  # Check that latitude field is a number
                result['errors'].append(typeMismatch(type(package[field_name]['latitude']), '<int, float, etc.>', 'latitude', field_name))


# Checks that provided package axists and is of type dict
def existsAndIsDict(result, package, field_name=None, field_context=None):
    # Check that json_package is not null
    if package == None:
        result['errors'].append(nullReference(field_name, field_context))

    # Check that json_package is a dictionary
    elif type(package) is not dict:
        result['errors'].append(typeMismatch(type(package), '<dict>', field_name, field_context))


# Returns a formatted error message for a missing field
def missingField(field_name, field_context=None):
    if field_context == None:
        return error('missingField', 'request does not define mandatory field "{}"'.format(field_name))
    else:
        return error('missingField', 'field "{}" does not define mandatory field "{}"'.format(field_context, field_name))


# Returns a formatted error message for type mismatch
def typeMismatch(current_type, target_type, field_name=None, field_context=None):
    if field_name == None and field_context == None:
        return error('typeMismatch', 'request is of type {}, it should be of type {}'.format(current_type, target_type))
    if field_context == None:
        return error('typeMismatch', 'field "{}" is of type {}, it should be of type {}'.format(field_name, current_type, target_type))
    else:
        return error('typeMismatch', 'field "{}" has field "{}" that is of type {}, it should be of type {}'.format(field_context, field_name, current_type, target_type))


# Returns a formatted error message for null reference
def nullReference(field_name=None, field_context=None):
    if field_name == None and field_context == None:
        return error('nullReference', 'request cannot be null')
    if field_context == None:
        return error('nullReference', 'field "{}" cannot be null'.format(field_name))
    else:
        return error('nullReference', 'field "{}" has field "{}" that cannot be null'.format(field_context, field_name))


# Base method for error calls
def error(error_type, msg):
    return '{}: {}'.format(error_type, msg)
