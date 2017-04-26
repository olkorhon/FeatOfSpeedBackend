const functions = require('firebase-functions');
const request = require('request-promise');

const joinHandler = require('./routes/joinGame/joinGame');
const leaveHandler = require('./routes/leaveGame/leaveGame');
const createHandler = require('./routes/createGame/createGame');
const stampHandler = require('./routes/stampCheckpoint/stampCheckpoint');
const announceReadyHandler = require('./routes/announceReady/announceReady');
const startHandler = require('./routes/startGame/startGame');

//const validation = require('./validation');

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

exports.announceReadiness = functions.https.onRequest((req, res) => {
    announceReadyHandler.handle(admin, req, res);
});

exports.startGame = functions.https.onRequest((req, res) => {
    startHandler.handle(admin, req, res);
});