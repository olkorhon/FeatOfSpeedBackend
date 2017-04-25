const functions = require('firebase-functions');
const request = require('request-promise');

const game_helper = require('./game');
const joinHandler = require('./joinGame');
const leaveHandler = require('./leaveGame');
const createHandler = require('./createGame');
const validation = require('./validation');

const stampHandler = require('./routes/stampCheckpoint/stampCheckpoint');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.createGame = functions.https.onRequest((req, res) => {
    createHandler.handle(admin, req, res);
});

exports.joinGame = functions.https.onRequest((req, res) => {
    joinHandler.handle(admin, req, res);
});

exports.leaveGame = functions.https.onRequest((req, res) => {
    leaveHandler.handle(admin, req, res);
});

exports.stampGame = functions.https.onRequest((req, res) => {
    stampHandler.handle(admin, req, res);
});