import logging
import webapp2

from google.appengine.ext import ndb

# Sub model for players
# user_id       : global indentifier for the device the player is linked to
# avatar   : index of the avatar that is assigned for this player
# nickname : user friendly name for this player
class Player(ndb.Model):
    user_id = ndb.StringProperty(indexed=True, required=True)
    nickname = ndb.StringProperty(indexed=False, required=True)


# Sub model for representing locations
class Location(ndb.Model):
    longitude = ndb.FloatProperty(indexed=False, required=True)
    latitude = ndb.FloatProperty(indexed=False, required=True)


# A single game state with unique id. Also has waypoints, radius and list of players
# id        : global identifier for this game
# location  : coordinates to the center of the game
# waypoints : how many waypoints will be generated for this game
# radius    : how big the playing area will be in meters

class Game(ndb.Model):
    # Static variables
    STATE_LOBBY = 0
    STATE_STARTING = 1
    STATE_RUNNING = 2
    STATE_ENDED = 3

    # Properties
    game_id = ndb.StringProperty(indexed=True)
    location = ndb.StructuredProperty(Location)
    radius = ndb.FloatProperty(indexed=False, required=True)
    waypoints = ndb.IntegerProperty(indexed=False, required=True)
    current_state = ndb.IntegerProperty(indexed=True, required=True)
    players = ndb.StructuredProperty(Player, repeated=True)


def createNewGame(game_id, location, waypoints, radius):
    # Instantiate Game
    game = Game(
        id=game_id,
        game_id=str(game_id),
        radius=radius,
        location=location,
        waypoints=waypoints,
        current_state=Game.STATE_LOBBY,
        players=[])

    # Save game into database
    game.put()
    logging.info('Game created with id:{}, waypoints:{}, radius:{}'.format("sas", game.waypoints, game.radius))

    return game


def canJoinGame(errors, game, player):
    # Check that game has not yet ended
    if game.current_state == Game.STATE_ENDED:
        errors.append("Game has already ended")
        return False

    # If game is in lobby, anyone can join
    if game.current_state == Game.STATE_LOBBY:
        return True

    # Can join if already part of the game
    if playerInGame(game, player):
        return True

    # If the situation is something else, joining is not possible
    errors.append("Cannot join this game, it is already running and you are not part of this game.")
    return False


# Adds a new player to this game
def addPlayerToGame(errors, game, player):
    players = game.players
    if playerInGame(game, player.user_id):
        errors.append("This player has already joined the game, id:" + player.user_id)
        return False

    # Looks good, add player to game
    game.players.append(player)
    game.put()
    return True


# Remove player from game
def removePlayerFromGame(errors, game, player_id):
    players = game.players
    for i in range(len(game.players)):
        if game.players[i].user_id == player_id:
            del game.players[i]
            game.put()
            return True

    # Could not find player, cannot remove
    errors.append("This player has already joined the game, id:" + player_id)
    return False


# Checks whether a player_id exists in this game
def playerInGame(game, player_id):
    for existing_player in game.players:
        if existing_player.user_id == player_id:
            return True
    return False
