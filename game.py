import logging
from game_manager import Player


# A single game state with unique id. Also has waypoints, radius and list of players
# id        : global identifier for this game
# location  : coordinates to the center of the game
# waypoints : how many waypoints will be generated for this game
# radius    : how big the playing area will be in meters
class Game(object):
    STATE_LOBBY = 0
    STATE_STARTING = 1
    STATE_RUNNING = 2
    STATE_ENDED = 3

    def __init__(self, game_id, location, waypoints, radius):
        self.current_state = Game.STATE_LOBBY

        self.game_id = game_id
        self.location = location
        self.waypoints = waypoints
        self.radius = radius

        # Initialize container for players
        self._players = {}
        logging.info('Game created with id:{}, waypoints:{}, radius:{}'.format(self.game_id, self.waypoints, self.radius))

    def toDict(self):
        return {'state'         : self.current_state,
                'game_id'       : self.game_id,
                'location'      : self.location,
                'waypoint_count': self.waypoints,
                'radius'        : self.radius,
                'players'       : self._playersToDict()}

    def _playersToDict(self):
        result = []
        for key in self._players:
            result.append({'user_id' : self._players[key].user_id,
                           'avatar'  : self._players[key].avatar,
                           'nickname': self._players[key].nickname})

        return result

    def canJoin(self, errors, user_id):
        # Check that game has not yet ended
        if self.current_state == Game.STATE_ENDED:
            errors.append("Game has already ended")
            return False

        # If game is in lobby, anyone can join
        if self.current_state == Game.STATE_LOBBY:
            return True

        # Can join if already part of the game
        if playerInGame(user_id):
            return True

        # If the situation is something else, joining is not possible
        errors.append("Cannot join this game, it is already running and you are not part of this game.")
        return False


    # Adds a new player to this game
    def addPlayer(self, errors, player):
        if player.user_id not in self._players:
            self._players[player.user_id] = player
            return True
        else:
            errors.append("This player has already joined the game, id:" + player.user_id)
            return False


    # Checks whether a player_id exists in this game
    def playerInGame(self, player_id):
        return player_id in self._players
