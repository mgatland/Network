"use strict";

process.title = 'network';
var express = require("express");
var app = express();
var port = process.env.PORT || 80;
var io = require('socket.io').listen(app.listen(port));
console.log("listening on port " + port);

var shared = require('./js/shared');

var users = [ ];

io.set('log level', 1); // reduce connection logging

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.use("/js", express.static(__dirname + '/js'));

io.sockets.on('connection', function (socket) {

    var user = {};
    user.socket = socket;
 
    console.log((new Date()) + ' Connection accepted.');

    console.log("Start new game.");
    var game = new shared.game();

    function sendUpdateToClient() {
        user.socket.emit('gamestate', game.serialise());
    }

    sendUpdateToClient();
    
    socket.on('disconnect', function(){
        console.log((new Date()) + " Peer disconnected.");
      });

    socket.on('buildElement', function (data) {
        game.buildElement( data.edge_coord, data.player_index, data.element_type);
        sendUpdateToClient();
    });

    socket.on('destroyElement', function (data) {
        game.destroyElement( data.edge_coord, data.player_index);
        sendUpdateToClient();
    });

    socket.on('nextPlayerTurn', function (data) {
        game.nextPlayerTurn();
        sendUpdateToClient();
    });
});