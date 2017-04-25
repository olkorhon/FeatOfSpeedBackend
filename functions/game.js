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
		game.checkpoint_count = 4;
	}
	else if (config.size === 'medium') {
		game.radius = 1250;
		game.checkpoint_count = 6;
	}
	else if (config.size === 'large') {
		game.radius = 2500;
		game.checkpoint_count = 8;
	}
	else {
		// Debug setting
		console.log('Validation has failed, size was something unexpected, received: ' + config.size);
		res.warnings.push('Validation has failed, size was something unexpected, received: ' + config.size);
		game.radius = 1;
		game.checkpoint_count = 1;
	}
	
	// Initialize players
	game.players = [];
    game.player_history = [];

    // Initialize checkpoints
    game.checkpoints = []

	return game;
}

function setReadiness(res, game, user_id)
{
    // Get player
    player = getPlayer(res, game, user_id);

    // Set player readiness
    if (player) {
        player.ready = true;
    }
    else {
        res.errors.push("Could not set readiness, player fetch failed");
    }
}

function addStamp(res, game, user_id, checkpoint_id) {
    const waypoint = getWaypoint(res, game, checkpoint_id);
    const player = getPlayer(res, game, user_id);

    // Proceed if instances of user and checkpoint can be found
    if (waypoint && player) {
        if (!hasPlayerVisitedCheckpoint(player, checkpoint_id)) {
            if (!player.visited_checkpoints)
                player.visited_checkpoints = [{ checkpoint_id: checkpoint_id, time: new Date() }];
            else {
                player.visited_checkpoints.push({ checkpoint_id: checkpoint_id, time: new Date() });
            }
        }
        else {
            res.errors.push("Could not stamp checkpoint: " + checkpoint_id + ", player: " + user_id + " has already stamped this checkpoint")
        }
    }
    else {
        // Log what went wrong
        if (!waypoint) {
            res.errors.push("No waypoint with id: " + checkpoint_id + " was found");
        }
        if (!player) {
            res.errors.push("No user with id: " + user_id + " was found");
        }
    }
}

function getWaypoint(res, game, checkpoint_id) {
    // Iterate through checkpoints in a list and return True if an instance with matching id is found
    for (var i in game.waypoints) {
        if (game.waypoints[i].checkpoint_id === checkpoint_id) {
            return game.waypoints[i];
        }
    }

    // Checkpoint not found
    res.errors.push("Could not find checkpoint: " + checkpoint_id + " in game: " + game.game_id);
    return undefined;
}

function hasPlayerVisitedCheckpoint(player, checkpoint_id) {
    for (var i in player.visited_checkpoints) {
        if (player.visited_checkpoints[i] === checkpoint_id) {
            return true;
        }
    }

    return false;
}

function getPlayer(res, game, user_id) {
    // Check whether a player has ever been a part of this game
    for (var i in game.players) {
        if (game.player_history[i].user_id === user_id) {
            return game.player_history[i];
        }
    }

    // Player not found
    res.errors.push("Could not find player: " + user_id + " in game: " + game.game_id);
    return undefined;
}
function isPlayerInGame(res, game, user_id) {
    // Check whether a player is currently in game
    for (var i in game.players) {
        if (game.players[i] === user_id) {
            return true;
        }
    }

    // Player not found
    return false;
}

function addPlayer(res, game, player)
{
    const player_exists = isPlayerInGame(res, game, player.user_id);
    const player_history = getPlayer(res, game, player.user_id);

    if (!player_exists && !player_history) {
        // New player add without issues
        addTimeStamp(game);
        player.ready = false; // Set player as initially not ready
        player.visited_checkpoints = []; // Initialize holder for visited checkpoints for player
        game.player_history.push(player);
        game.players.push(player.user_id);
    }
    else if (!player_exists) {
        // A player who was a member of this game rejoined
        addTimeStamp(game);
        game.players.push(player.user_id);
    }
    else if (!player_history) {
        // Error state, player who is a part of this game exists without a history
        res.errors.push("Very weird stuff happening, player found in the game but has no history");
    }
    else {
        // Player already part of this game no changes to db necessary
        res.warnings.push("Player already part of this game, no need to change values in database");
    }
}

function removePlayer(res, game, user_id) 
{
	// Check that player has not already joined this game
	for (var i in game.players) {
		if (game.players[i] === user_id) {
			// Stamp time
			addTimeStamp(game);
			return game.players.splice(i, 1);
		}
	} 

	// Could not find player to remove
	res.errors.push("Player was not a member of this game, cannot remove");
}

function addTimeStamp(game) {
	game.last_edited = new Date();
}

// Define functions to expose
module.exports = {
	createGame  : createGame,
	addPlayer   : addPlayer,
    removePlayer: removePlayer,
    setReadiness: setReadiness,
    addStamp    : addStamp
}