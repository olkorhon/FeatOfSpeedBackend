import logging

import json

import game
from validation import validateGameCreate
from validation import validateGameJoin
from validation import validateGameLeave

from google.appengine.ext import ndb

import webapp2

class MyHandler(webapp2.RequestHandler):
    def get(self):
        game_inst = game.Game.get_by_id(1234)
        self.response.write(json.dumps({"element":game_inst.to_dict()}))

class CreateGame(webapp2.RequestHandler):
    def post(self):
        logging.info('Game creation request received.')

        # We already know that we're going to return json
        self.response.content_type = 'application/json'

        # Initialize response data dictionary
        response_data = {}

        # Parse body to json
        try:
            json_package = json.loads(self.request.body)
        except:
            self.response.write(json.dumps({"errors":["Data received was not proper JSON"]}))
            return

        # Add request to response
        response_data['request'] = json_package

        # Validate json_package and report errors if they happened
        result = validateGameCreate(json_package)
        if not result['valid']:
            response_data['errors'] = result['errors']
            writeResponse(self.response, response_data, 400)
            return

        # Initialize holder for errors
        errors = []

        inst = game.createNewGame(
            1234,
            game.Location(longitude=json_package['config']['location']['longitude'],
                     latitude=json_package['config']['location']['latitude']),
            json_package['config']['waypoints'],
            json_package['config']['radius'])

        response_data['game'] = inst.to_dict()
        return writeResponse(self.response, response_data, 200)


class JoinGame(webapp2.RequestHandler):
    def get(self, game_id):
        self.response.write('Please do not');


    def post(self, game_id):
        logging.info('Game join request received.')

        # We already know that we're going to return json
        self.response.content_type = 'application/json'

        # Initialize response data dictionary
        response_data = {}

        # Parse body to json
        try:
            json_package = json.loads(self.request.body)
        except:
            self.response.write(json.dumps({"errors": ["Data received was not proper JSON"]}))
            return

        # Add request to response
        response_data['request'] = json_package

        # Validate json_package and report errors if they happened
        result = validateGameJoin(json_package)
        if not result['valid']:
            response_data['errors'] = result['errors']
            writeResponse(self.response, response_data, 400)
            return

        # Initialize holder for errors
        errors = []
        response_data['errors'] = errors
        player = json_package['player']

        # Check to see if the game exists
        game_query = game.Game.gql("WHERE game_id = :1", game_id)
        matching_games = game_query.fetch(1)

        # No game, request has failed, go home people
        if len(matching_games) == 0:
            errors.append("No matching game found")
            writeResponse(self.response, response_data, 400)
            return

        # Check to see if this player can join it
        join_result = game.canJoinGame(errors, matching_games[0], player['user_id'])

        # Cannot join, request has failed, go home people
        if not join_result:
            writeResponse(self.response, response_data, 400)
            return

        # All is good?
        if not game.playerInGame(matching_games[0], player['user_id']):
            # New player, register with the game
            logging.info('New player joining')
            add_result = game.addPlayerToGame(errors, matching_games[0], game.Player(user_id=player['user_id'], nickname=player['nickname']))

            # Something funny went wrong with player add, should not happen
            if add_result == False:
                writeResponse(self.response, response_data, 500)
                return
        else:
            logging.info('Existing player joining')
            errors.append("Player was already in the game")

        # Add the game info to the join response
        response_data['game'] = matching_games[0].to_dict()

        # Everything is ok
        writeResponse(self.response, response_data, 200)

class LeaveGame(webapp2.RequestHandler):
    def post(self, game_id):
        logging.info('Game join request received.')

        # We already know that we're going to return json
        self.response.content_type = 'application/json'

        # Initialize response data dictionary
        response_data = {}

        # Parse body to json
        try:
            json_package = json.loads(self.request.body)
        except:
            self.response.write(json.dumps({"errors": ["Data received was not proper JSON"]}))
            return

        # Add request to response
        response_data['request'] = json_package

        # Validate json_package and report errors if they happened
        result = validateGameLeave(json_package)
        if not result['valid']:
            response_data['errors'] = result['errors']
            writeResponse(self.response, response_data, 400)
            return

        # Initialize holder for errors
        errors = []
        response_data['errors'] = errors
        player = json_package['player']

        # Check to see if the game exists
        game_query = game.Game.gql("WHERE game_id = :1", game_id)
        matching_games = game_query.fetch(1)

        # No game, request has failed, go home people
        if len(matching_games) == 0:
            errors.append("No matching game found")
            writeResponse(self.response, response_data, 400)
            return

        # Check to see if this player can join it
        player_in_game = game.playerInGame(matching_games[0], player['user_id'])

        # Cannot join, request has failed, go home people
        if not player_in_game:
            errors.append("Cannot leave, not part of the game")
            writeResponse(self.response, response_data, 400)
            return

        remove_result = game.removePlayerFromGame(errors, matching_games[0], player['user_id'])

        # All is good?
        if remove_result == False:
            writeResponse(self.response, response_data, 500)
            return

        # Add the game info to the join response
        response_data['game'] = matching_games[0].to_dict()

        # Everything is ok
        writeResponse(self.response, response_data, 200)


app = webapp2.WSGIApplication([
    webapp2.Route(r'/', handler=MyHandler),
    webapp2.Route(r'/Game', handler=CreateGame),
    webapp2.Route(r'/Game/Join/<game_id>', handler=JoinGame),
    webapp2.Route(r'/Game/Leave/<game_id>', handler=LeaveGame)
], debug=True)

def writeResponse(response, json_body, status):
    response.status = status
    response.write(json.dumps(json_body))
