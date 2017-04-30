// Game states
// 0. LobbyNoWaypoints
// 1. LobbyWaypoints
// 2. Starting
// 3. Started
// 4. Ended

function createGame(res, config, game_id) {
	var game = {};
	
    addTimeStamp(game); 	          // Stamp time
    game.game_id = game_id; 	      // Set id
    game.current_state = 0; 	      // Initial state
    game.location = config.location;  // Set location
	
	// Parse size
	if (config.size === 'small') {
		game.radius = 500;
		game.waypoint_count = 4;
	}
	else if (config.size === 'medium') {
		game.radius = 1250;
        game.waypoint_count = 6;
	}
	else if (config.size === 'large') {
		game.radius = 2500;
        game.waypoint_count = 8;
	}
	else {
		// Debug setting
		console.log('Validation has failed, size was something unexpected, received: ' + config.size);
		res.warnings.push('Validation has failed, size was something unexpected, received: ' + config.size);
		game.radius = 1;
		game.waypoint_count = 1;
	}
	
	// Initialize players
    game.players = [];

    // Initialize waypoints
    game.waypoints = []

	return game;
}

// Returns a guaranteed random padded code between values 0000 and 9999
function getRandomUniqueId(res, games) {
    const pad = "0000";

    // Go through all possible codes in order
    for (let i = 0; i < 10000; i++) {
        // Format integer into a padded code
        let str = pad + i;
        let key_candidate = str.substring(str.length - pad.length);

        // Check every game to make sure this code is unique
        let free_found = true;
        for (let key in games) {
            if (key_candidate === key) {
                free_found = false;
                break;
            }
        }

        // return key_candidate if it was unique 
        if (free_found === true) {
            return key_candidate;
        }
    }

    // Not unique ids left
    res.errors.push("No open random ids found");
    return undefined;
}

function setReadiness(res, game, user_id) {
    // Set player readiness
    if (playerIsInGame(game, user_id)) {
        res.updated = true;
        addTimeStamp(game);

        getPlayer(res, game, user_id).ready = true;
    }
    else {
        res.errors.push("Could not set readiness, player fetch failed");
    }
}

function addStamp(res, game, user_id, waypoint_id) {
    const waypoint = getWaypoint(res, game, waypoint_id);

    res.warnings.push(JSON.stringify(waypoint));

    let player = undefined;
    if (playerIsInGame(game, user_id)) {
        player = getPlayer(res, game, user_id);
    }

    // Proceed if instances of user and waypoint can be found
    if (waypoint && player) {
        if (isWaypointVisitedByPlayer(player, waypoint_id)) {
            res.warnings.push("Could not stamp waypoint: " + waypoint_id + ", player: " + user_id + " has already stamped this waypoint")
            return;
        }

        // Mark res updated as true
        res.updated = true;
        addTimeStamp(game);

        // Make sure player defines array <visited_waypoints> and push new waypoint
        if (!player.visited_waypoints) { player.visited_waypoints = []; }
        player.visited_waypoints.push({ waypoint_id: waypoint_id, time: new Date() });
    }
    else {
        // No waypoint found
        if (!waypoint) {
            res.errors.push("No waypoint with id: " + waypoint_id + " was found");
        }

        // No player found
        if (!player) {
            res.errors.push("No user with id: " + user_id + " was found");
        }
    }
}

function addPlayer(res, game, player) {
    const existing_player = getPlayer(res, game, player.user_id);

    if (!existing_player) {
        // New player add without issues
        res.updated = true;
        addTimeStamp(game);

        player.ready = false; // Set player as initially not ready
        player.visited_waypoints = []; // Initialize holder for visited waypoints for player
        player.currently_playing = true;
        game.players.push(player);
    }
    else if (!existing_player.currently_playing) {
        res.warnings.push("Player currently not playing, updating status");

        // Existing player, update playing status
        res.updated = true;
        addTimeStamp(game);
  
        existing_player.currently_playing = true;
        existing_player.nickname = player.nickname;
    }
    else {
        res.warnings.push("Player already part of this game, no need to change values in database");

        // Player already part of this game no changes to db necessary
        existing_player.nickname = player.nickname; // Possibly nickname has been changed
    }
}

function removePlayer(res, game, user_id) {
    if (playerIsInGame(game, user_id)) {
        res.updated = true;
        addTimeStamp(game);

        getPlayer(res, game, user_id).currently_playing = false;
        return;
    }
    else {
        // Could not find player to remove
        res.errors.push("Player was not a member of this game, cannot remove");
    }
}

function startGame(res, game) {
    if (game.current_state == 1) {
        res.updated = true;
        game.current_state = 3;
    }
    else {
        res.errors.push("Cannot move to state 2 from state: " + game.current_state + ". Waiting for waypoints?");
    }
}

function countCurrentPlayers(game) {
    let active_players = 0;

    // Go through all players in game and count those who are currently playing
    for (let i in game.players) {
        if (game.players[i].currently_playing) {
            active_players += 1;
        }
    }

    return active_players;
}

function getWaypoint(res, game, waypoint_id) {
    // Iterate through waypoints in a list and return True if an instance with matching id is found
    for (let i in game.waypoints) {
        res.warnings.push(JSON.stringify(game.waypoints[i].waypoint_id));
        res.warnings.push(waypoint_id);

        if (game.waypoints[i].waypoint_id == waypoint_id) {
            return game.waypoints[i];
        }
    }

    // Waypoint not found
    res.warnings.push("Could not find waypoint: " + waypoint_id + " in game: " + game.game_id);
    return undefined;
}

function isWaypointVisitedByPlayer(player, waypoint_id) {
    // Go through all waypoints a player has visited
    for (let i in player.visited_waypoints) {
        if (player.visited_waypoints[i] === waypoint_id) {
            return true;
        }
    }

    // No waypoint found in players visited_waypoints
    return false;
}

function playerIsInGame(game, user_id) {
    // Iterate over players in game and return true if matching user_id is found
    for (let player in game.players) {
        if (game.players[player].user_id === user_id) {
            return true;
        }
    }

    // No matching user_id found
    return false;
}

function getPlayer(res, game, user_id) {
    // Check whether a player has ever been a part of this game
    for (let i in game.players) {
        if (game.players[i].user_id === user_id) {
            return game.players[i];
        }
    }

    // Player not found
    res.warnings.push("Cannot find user with id: " + user_id + " from game: " + game.game_id);
    return undefined;
}

function addTimeStamp(game) {
	game.last_edited = new Date();
}



// Define functions to expose
module.exports = {
    createGame: createGame,
    startGame: startGame,
    addStamp: addStamp,
    addPlayer: addPlayer,
    getPlayer: getPlayer,
    removePlayer: removePlayer,
    setReadiness: setReadiness,
    getRandomUniqueId: getRandomUniqueId,
    countCurrentPlayers: countCurrentPlayers,
    playerIsInGame: playerIsInGame
};