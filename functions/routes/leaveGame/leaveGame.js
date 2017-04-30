const GameHelper = require('../../game');
const validation = require('./validation');
const functions = require('firebase-functions');
const request = require('request-promise');

function handleRequest(admin, req, res) {
    // Create holder for response data
    let response_holder = { errors: [], warnings: [] };

    // Respond only to post requests
    if (req.method !== 'POST') {
        response_holder.errors.push('This function only replies to POST messages.');
        return res.status(400).json(response_holder);
    }

    // Extract body from request
    const valid_body = validation.gameLeave(response_holder, req);

    // Escape if validation failed
    if (!valid_body) {
        return res.status(400).json(response_holder);
    }

    // Fetch all game instances
    admin.database().ref('games/').once('value').then(function (data) {
        // Fetch games from data
        const games = data.val();

        // Disconnect from all games
        for (let game in games) {
            // Skip the game we just joined
            disconnectFromGame(admin, response_holder, games[game], valid_body.user_id);
        }

        // WARNING player might still be in the game for a while before firebase updates
        if (response_holder.errors.length === 0) {
            return res.status(200).json(response_holder);
        }
        else {
            return res.status(400).json(response_holder);
        }
    });

    // Log errors to console aswell if they happened
    if (response_holder.errors.length !== 0) {
        console.error("Errors happened while processing request: " + JSON.stringify(response_holder.errors));
    }
}

function disconnectFromGame(admin, res, game, user_id) {
    // Other games, attempt to leave
    if (!GameHelper.playerIsInGame(game, user_id)) { return; }

    // Attempt to remove player from game (should not fail in normal cases)
    res.updated = false;
    GameHelper.removePlayer(res, game, user_id);

    // Either update result or delete the game if no more players left in the game
    if (GameHelper.countCurrentPlayers(game) === 0) {
        // No players, delete the game
        admin.database().ref('games/' + game.game_id).remove();
    }
    else {
        // More than one player left, just update the ref
        if (res.updated) {
            console.log("Removing player: " + user_id + " from game: " + game.game_id);
            admin.database().ref('games/' + game.game_id).set(game);
        }
    }
}

// Define functions to expose
module.exports = {
    handle: handleRequest
}