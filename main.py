import logging

import json

from flask import Flask
from flask import request

from game import Game
from game_manager import GameManager
from game_manager import Player
from validation import validateGameCreate
from validation import validateGameJoin

app = Flask(__name__)
app.debug = True


game_manager = GameManager()


# Define routes
@app.route('/Game/', methods=['POST'])
def CreateGame():
    logging.info('Game creation request received.')
    response = {}

    # Requests should be json
    if type(request.json) is dict:
        # Validate create request
        result = validateGameCreate(request.json)

        # Report errors if they happened
        if not result['valid']:
            response['request'] = request.json
            response['errors'] = result['errors']
            return app.response_class(json.dumps(response), content_type='application/json'), 400
        else:
            # Initialize holder for errors
            errors = []

            # Try to create a new game
            game = game_manager.createGame(errors, request.json['config'], request.json['host'])
            if game == None:
                return app.response_class(json.dumps({'errors': errors}), content_type='application/json'), 400

            response['game'] = game.toDict()

            # Add errors to package
            if len(errors) > 0:
                response['errors'] = errors

            # Return the new game to host
            return app.response_class(json.dumps(response)), 200
    else:
        return "Send json with waypoints and radius please."


@app.route('/Game/<game_id>', methods=['POST'])
def JoinGame(game_id):
    logging.info('Game join request received.')
    response = {}

    # Requests should be json
    if type(request.json) is dict:
        # Validate join request
        result = validateGameJoin(request.json)
        if not result['valid']:
            # Validation failed, provide hints for client
            response['request'] = request.json
            response['errors'] = result['errors']
            return app.response_class(json.dumps(response), content_type='application/json'), 400
        else:
            # Initialize holder for errors
            errors = []

            player = request.json['player']

            # Check to see if the game exists
            game = game_manager.getGame(errors, game_id)

            # No game, request has failed, go home people
            if game == None:
                return app.response_class(json.dumps({'errors': errors})), 400

            # Check to see if this player can join it
            join_result = game.canJoin(errors, player['user_id'])

            # Cannot join, request has failed, go home people
            if not join_result:
                return app.response_class(json.dumps({'errors': errors})), 400

            # All is good?
            if not game.playerInGame(player['user_id']):
                logging.info('New player joining')
                # New player, register with the game
                add_result = game.addPlayer(errors, Player(player['user_id'], 0, player['nickname']))

                # Something funny went wrong with player add, should not happen
                if add_result == False:
                    return app.response_class(json.dumps({'errors': errors})), 500
            else:
                logging.info('Existing player joining')

            response['game'] = game.toDict()

            # Add errors to package
            if len(errors) > 0:
                response['errors'] = errors

            # Everything is ok
            return app.response_class(json.dumps(response)), 200


@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500

def error(error_type, location, msg):
    return '{}, {}: {}'.format(location, error_type, msg)
