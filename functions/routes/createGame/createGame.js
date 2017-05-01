const functions = require('firebase-functions');
const request = require('request-promise');

const secrets = require('../../secrets');
const GameHelper = require('../../game');
const validation = require('./validation');
const WaypointSelector = require('../../waypoint_selector');

const base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?types=point_of_interest"

function handleRequest(admin, req, res) {
    // Create holder for response data
    const response_holder = { errors: [], warnings: [] };

    // Respond only to post requests
    if (req.method !== 'POST') {
        console.log("Request was not POST, received <" + re.method + ">");
        response_holder.errors.push('This function only replies to POST messages.');
        return res.status(400).json(response_holder);
    }

    // Extract and validate body from request
    console.log("validating request");
    const valid_body = validation.gameCreate(response_holder, req);

    // Escape if validation failed
    if (!valid_body) {
        console.log("Received body was not valid");
        return res.status(400).json(response_holder);
    }

    // Fetch all game instances
    admin.database().ref('games/').once('value').then(function (data) {
        // Fetch games from data
        const games = data.val();

        // Generate id for 
        new_game_id = GameHelper.getRandomUniqueId(response_holder, games);
        if (!new_game_id) {
            console.warn("No free ids left, defaulting to 9999");
        }

        // Queue disconnect from other games
        disconnectPlayersFromOtherGames(admin, games, valid_body.host.user_id);

        // Create game out of config
        const game_obj = GameHelper.createGame(response_holder, valid_body.config, new_game_id);

        // Add provided player as the first player / host
        GameHelper.addPlayer(response_holder, game_obj, valid_body.host);

        // Perform database calls
        admin.database().ref('games/' + game_obj.game_id).set(game_obj).then(snapshot => {
            response_holder.game = game_obj;
            fetchWaypoints(admin, game_obj); // Async call to fetch waypoints for this game
            return res.status(200).json(response_holder);
        });
    });
}

function disconnectPlayersFromOtherGames(admin, games, user_id) {
    results = { errors: [], warnings: [] };

    for (let game in games) {
        // Skip if no player found
        if (!GameHelper.playerIsInGame(games[game], user_id)) { continue; }

        // Attempt to remove player from game (should not fail in normal cases)
        GameHelper.removePlayer(results, games[game], user_id);
        if (results.errors.length !== 0) { continue; }

        // Either update result or delete the game if no more players left in the game
        if (GameHelper.countCurrentPlayers(games[game]) === 0) {
            // No players, delete the game
            admin.database().ref('games/' + games[game].game_id).remove();
        }
        else {
            // More than one player left, just update the ref
            console.log("Removing player: " + user_id + " from game: " + game);
            admin.database().ref('games/' + games[game].game_id).set(games[game]);
        }
    }

    // Log errors if some happened
    if (results.errors.length !== 0) {
        console.error("Errors happened while processing request: " + JSON.stringify(results.errors));
    }
}

// Routine for fetching waypoints for a game
function fetchWaypoints(admin, game) {
    const final_url = base_url
        + '&key=' + secrets.places_api
        + '&location=' + game.location.latitude + ',' + game.location.longitude
        + '&radius='   + game.radius;
    console.log("Sending request to Places API, calling URL:" + final_url);

    request(final_url, { resolveWithFullResponse: true }).then(
        response => {
            if (response.statusCode === 200) {
                const data = JSON.parse(response.body);

                console.log("Answer from places API: " + response.body);

                // Get waypoints
                const waypoints = [];
                for (let i = 0; i < data.results.length; i++) {
                    waypoint = {
                        waypoint_id: i,
                        name: data.results[i].name,
                        location: data.results[i].geometry.location
                    };
                    waypoints.push(waypoint);
                }

                console.log("Before optimize: " + JSON.stringify(waypoints));

                // Select optimal nodes
                WaypointSelector.optimize(waypoints, game.waypoint_count);

                console.log("After optimize: " + JSON.stringify(waypoints));

                // Add waypoints to game
                game.waypoints = waypoints;
                game.current_state = 1;

                // Create game reference
                const game_db_ref = admin.database().ref('games/' + game.game_id);
                game_db_ref.update(game);
            }
            else {
                console.log('Invalid request: ' + response.statusCode);
                console.log(response);
            }
        }
    )
}

// Define functions to expose
module.exports = {
    handle: handleRequest
}