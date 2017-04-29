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

function getRandomUniqueId(res, games) {
    for (var i = 0; i < 10000; i++) {
        let free_found = false;
        for (var key in games) {
            if (i == key) {
                free_found = true;
            }
        }

        // Free id was found
        if (!free_found) {
            const str = "" + i;
            const pad = "0000";
            return pad.substring(0, pad.length - str.length) + i;
        }
    }

    // Not unique ids left
    res.errors.push("No open random ids found");
    return undefined;
}

function setReadiness(res, game, user_id) {
    // Get player
    player = getPlayer(game, user_id);

    // Set player readiness
    if (player) {
        player.ready = true;
    }
    else {
        res.errors.push("Could not set readiness, player fetch failed");
    }
}

function addStamp(res, game, user_id, waypoint_id) {
    const waypoint = getWaypoint(res, game, waypoint_id);
    const player = getPlayer(game, user_id);

    // Proceed if instances of user and waypoint can be found
    if (waypoint && player) {
        if (!hasPlayerVisitedWaypoint(player, waypoint_id)) {
            if (!player.visited_waypoints)
                player.visited_waypoints = [{ waypoint_id: waypoint_id, time: new Date() }];
            else {
                player.visited_waypoints.push({ waypoint_id: waypoint_id, time: new Date() });
            }
        }
        else {
            res.errors.push("Could not stamp waypoint: " + waypoint_id + ", player: " + user_id + " has already stamped this waypoint")
        }
    }
    else {
        // Log what went wrong
        if (!waypoint) {
            res.errors.push("No waypoint with id: " + waypoint_id + " was found");
        }
        if (!player) {
            res.errors.push("No user with id: " + user_id + " was found");
        }
    }
}

function getWaypoint(res, game, waypoint_id) {
    // Iterate through waypoints in a list and return True if an instance with matching id is found
    for (var i in game.waypoints) {
        if (game.waypoints[i].waypoint_id === waypoint_id) {
            return game.waypoints[i];
        }
    }

    // Waypoint not found
    res.errors.push("Could not find waypoint: " + waypoint_id + " in game: " + game.game_id);
    return undefined;
}

function hasPlayerVisitedWaypoint(player, waypoint_id) {
    for (var i in player.visited_waypoints) {
        if (player.visited_waypoints[i] === waypoint_id) {
            return true;
        }
    }

    return false;
}

function getPlayer(game, user_id) {
    // Check whether a player has ever been a part of this game
    for (var i in game.players) {
        if (game.players[i].user_id === user_id) {
            return game.players[i];
        }
    }

    // Player not found
    return undefined;
}

function addPlayer(res, game, player) {
    const existing_player = getPlayer(game, player.user_id);

    if (!existing_player) {
        // New player add without issues
        addTimeStamp(game);
        player.ready = false; // Set player as initially not ready
        player.visited_waypoints = []; // Initialize holder for visited waypoints for player
        player.currently_playing = true;
        game.players.push(player);
    }
    else if (!existing_player.currently_playing) {
        // Existing player, update playing status
        res.warnings.push("Player currently not playing, updating status");
        existing_player.currently_playing = true;
        existing_player.nickname = player.nickname;
    }
    else {
        // Player already part of this game no changes to db necessary
        res.warnings.push("Player already part of this game, no need to change values in database");
        existing_player.nickname = player.nickname; // Possibly nickname has been changed
    }
}

function countCurrentPlayers(game) {
    let active_players = 0;
    for (var i in game.players) {
        if (game.players[i].currently_playing) {
            active_players += 1;
        }
    }

    return active_players;
}

function removePlayer(res, game, user_id) {
	// Check that player has not already joined this game
	for (var i in game.players) {
		if (game.players[i].user_id === user_id) {
			// Stamp time
            addTimeStamp(game);
            game.players[i].currently_playing = false;
            return;
		}
	} 

	// Could not find player to remove
	res.errors.push("Player was not a member of this game, cannot remove");
}

function addTimeStamp(game) {
	game.last_edited = new Date();
}

function startGame(res, game) {
    if (game.current_state == 1) {
        game.current_state = 3;
    } else {
        res.errors.push("Cannot move to state 2 from state: " + game.current_state + ". Waiting for waypoints?");
    }
}

// Define functions to expose
module.exports = {
    createGame: createGame,
    addStamp: addStamp,
    startGame: startGame,
    addPlayer: addPlayer,
    getPlayer: getPlayer,
    removePlayer: removePlayer,
    setReadiness: setReadiness,
    getRandomUniqueId: getRandomUniqueId,
    countCurrentPlayers: countCurrentPlayers
};