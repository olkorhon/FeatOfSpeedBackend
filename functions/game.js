// Game states
// 0. LobbyNoWaypoints
// 1. LobbyWaypoints
// 2. Starting
// 3. Started
// 4. Ended

function createGame(res, config, game_id) {
	var game = {};
	
	// Stamp time
	addTimeStamp(game);
	
	// Set id
	game.game_id = game_id;
	
	// Initial state
	game.current_state = 0;
	
	// Set location
	game.location = config.location;
	
	// Parse size
	if (config.size === 'small') {
		game.radius = 500;
		game.checkpoints = 4;
	}
	else if (config.size === 'medium') {
		game.radius = 1250;
		game.checkpoints = 6;
	}
	else if (config.size === 'large') {
		game.radius = 2500;
		game.checkpoints = 8;
	}
	else {
		// Debug setting
		console.log('Validation has failed, size was something unexpected, received: ' + config.size);
		res.warnings.push('Validation has failed, size was something unexpected, received: ' + config.size);
		game.radius = 1;
		game.checkpoints = 1;
	}
	
	// Initialize players
	game.players = [];
    game.player_history = [];

	return game;
}

function setReadiness(res, game, user_id)
{
    //for 
}

function addPlayer(res, game, player)
{
	// Check that player has not already joined this game
    for (var i in game.players) {
        console.log('Comparing: ' + game.players[i].user_id + ':' + player.user_id);

		if (game.players[i].user_id === player.user_id) {
			return res.errors.push("This user is already a member of this game.");
		}
	} 

	// Stamp time
	addTimeStamp(game);

	// Player was not found, add it	
    game.players.push(player);
    game.player_history.push(player.user_id);
}

function removePlayer(res, game, user_id) 
{
	// Check that player has not already joined this game
	for (var i in game.players) {
		if (game.players[i].user_id === user_id) {
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
	createGame: createGame,
	addPlayer  : addPlayer,
	removePlayer : removePlayer
}

