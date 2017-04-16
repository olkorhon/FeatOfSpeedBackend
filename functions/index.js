const game_helper = require('./game');
const validation = require('./validation');
const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

/*
exports.addMessage = functions.https.onRequest((req, res) => {
	const original = req.query.text;
	
	admin.database().ref('/messages').push({original: original}).then(snapshot => {
		res.redirect(303, snapshot.ref);
	});
});
*/

exports.createGame = functions.https.onRequest((req, res) => 
{
	// Create holder for response data
	var response_data = {errors: [], warnings: []};	

	// Respond only to post requests
	if (req.method !== 'POST') {
		response_data.errors.push('This function only replies to POST messages.');
		return res.status(400).json(response_data);
	}
	
	// Extract body from request
	const json_body = req.body;
	validation.gameCreate(response_data, json_body);
	
	// Escape if validation failed
	if (response_data.errors.length !== 0) {
		return res.status(400).json(response_data);
	}
	
	// Extract config from json_package
	var config = json_body.config;

	// Create game out of config
	var game_obj = game_helper.createGame(response_data, config, "1234");

	// Add provided player as the first player / host
	game_helper.addPlayer(response_data, game_obj, json_body.host);

	// Perform database calls
	admin.database().ref('games/' + game_obj.game_id).once('value').then(function(data) {
		console.log('Old game: ' + data.val());
		admin.database().ref('games/' + game_obj.game_id).set(game_obj).then(snapshot => {
			response_data.game = game_obj;
			return res.status(200).json(response_data);
		});
	});
});


exports.joinGame = functions.https.onRequest((req, res) => 
{
	// Create holder for response data
	var response_data = {errors: [], warnings: []};

	// Respond only to post requests
	if (req.method !== 'POST') {
		response_data.errors.push('This function only replies to POST messages.');
		return res.status(400).json(response_data);
	}
	
	// Extract body from request
	const json_body = req.body;
	validation.gameJoin(response_data, json_body);
	
	// Escape if validation failed
	if (response_data.errors.length !== 0) {
		return res.status(400).json(response_data);
	}
	
	// Extract game_id form request
	var game_id = req.query.game_id;
	
	if (!game_id) {
		response_data.errors.push('No game_id found, did you forget to pass it in the url?');
		return res.status(400).json()
	}
	
	// Extract player from json_package
	var player = json_body.player;

	admin.database().ref('games/' + game_id).once('value').then(function(data) {
		var game_obj = data.val();
		console.log('Found game: ' + game_obj);
		
		if (game_obj) {
			game_helper.addPlayer(response_data, game_obj, player);
			
			if (response_data.errors.length === 0) {
				admin.database().ref('games/' + game_id).set(game_obj).then(snapshot => {
					response_data.game = game_obj;
					return res.status(200).json(response_data);
				});		
			}	
		} 
		else {
			response_data.errors.push('Could not find game with id: ' + game_id);
			res.status(404).json(response_data);
		}
	});
	
});

