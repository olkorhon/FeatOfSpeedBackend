const GameHelper = require('../../game');
const validation = require('./validation');
const functions = require('firebase-functions');
const request = require('request-promise');

function handleRequest(admin, req, res) {
    // Create holder for response data
    var response_holder = { errors: [], warnings: [] };

    // Respond only to post requests
    if (req.method !== 'POST') {
        console.log("Request was not POST, received <" + re.method + ">");
        response_holder.errors.push('This function only replies to POST messages.');
        return res.status(400).json(response_holder);
    }

    // Extract body from request
    const valid_body = validation.gameJoin(response_holder, req);

    // Escape if validation failed
    if (!valid_body) {
        return res.status(400).json(response_holder);
    }

    // Fetch all game instances
    admin.database().ref('games/').once('value').then(function (data) {
        // Fetch games from data
        const games = data.val();

        // Handle joining first
        if (!games[valid_body.game_id]) {
            joinGame(admin, response_holder, games[valid_body.game_id], valid_body.player, snapshot => {
                response_holder.game = games[valid_body.game_id];
                return res.status(200).json(response_holder);
            });
        } else {
            response_holder.errors.push('Could not find game with id: ' + valid_body.game_id);
            return res.status(400).json(response_holder);
        }

        // Disconnect from other games
        for (let game in games) {
            // Skip the game we just joined
            if (games[game].game_id !== valid_body.game_id) {
                disconnectFromGame(admin, response_holder, games[game], valid_body.user_id);
            }
        }
    });

    if (response_holder.errors.length !== 0) {
        console.error("Errors happened while processing request: " + JSON.stringify(response_holder.errors));
    }
}

function joinGame(admin, res, game, player, next) {
    // Add player to game locally
    GameHelper.addPlayer(res, game, player);

    // If no errors happened, upload local game to firebase
    if (res.errors.length === 0) {
        admin.database().ref('games/' + valid_body.game_id).set(game_obj).then(next);
    }
}

function disconnectFromGame(admin, res, game, user_id) {
    // Other games, attempt to leave
    if (!GameHelper.playerIsInGame(game, user_id)) { return; }

    // Attempt to remove player from game (should not fail in normal cases)
    GameHelper.removePlayer(response_holder, game, user_id);

    // Either update result or delete the game if no more players left in the game
    if (GameHelper.countCurrentPlayers(game) === 0) {
        // No players, delete the game
        admin.database().ref('games/' + game.game_id).remove();
    }
    else {
        // More than one player left, just update the ref
        console.log("Removing player: " + user_id + " from game: " + game.game_id);
        admin.database().ref('games/' + game.game_id).set(game);
    }
}

// Define functions to expose
module.exports = {
    handle: handleRequest
}