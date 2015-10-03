"use strict";

process.title = 'network';
var express = require("express");
var app = express();
var port = process.env.PORT || 8080;
var io = require('socket.io').listen(app.listen(port));
console.log("listening on port " + port);

var shared = require('./js/shared');

//user.state
var stateNew = 0; //hasn't chosen a game type yet
var statePlaying = 1;
var stateWaiting = 2;

var users = [ ];

io.set('log level', 1); // reduce connection logging

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.use("/js", express.static(__dirname + '/js'));
app.use("/models", express.static( __dirname + '/models'));

io.sockets.on('connection', function (socket) {

    var user = {};
    user.socket = socket;
    user.state = stateNew;
    user.game = null;
    user.others = [];
    user.localPlayers = [];
    users.push(user);
    console.log((new Date()) + ' Connection accepted.');
    console.log("There are " + users.length + " users");

    console.log("Start new game.");

    function sendUpdateToClients() {
        var data = user.game.serialise();
        user.socket.emit('gamestate', data);
        user.others.forEach(function (other) {
            other.socket.emit('gamestate', data); //TODO: hide cards from opponent
        });
    }
    
    function sendMessageTo(who, msg) {
        who.socket.emit('message', msg);
    }

    socket.on('startLocalGame', function() {
        if (user.state !== stateNew) return;
        user.state = statePlaying;
        user.game = new shared.game();
        user.socket.emit('localPlayers', [0, 1]);
        user.localPlayers = [0,1];
        sendUpdateToClients();
    })

    function findWaitingUser() {
        return shared.find_if(users, function(usr) {
            return (usr.state === stateWaiting);
        });
    }

   socket.on('startNetworkGame', function() {
        if (user.state !== stateNew) return;

        var other = findWaitingUser();
        if (!other) {
            user.state = stateWaiting;
            sendMessageTo(user, "Waiting for opponent...");
        } else {
            console.log(other);
            other.state = statePlaying;
            user.state = statePlaying;

            user.game = new shared.game();
            other.game = user.game;

            other.socket.emit('localPlayers', [0]);
            other.localPlayers = [0];
            user.socket.emit('localPlayers', [1]);
            user.localPlayers = [1];

            other.others.push(user);
            user.others.push(other);

            sendMessageTo(other, ''); //clear the waiting for opponent message
            
            sendUpdateToClients(); 
        }
    })

    socket.on('disconnect', function(){
        users = users.filter(function(element) { element !== user });
        console.log((new Date()) + " Peer disconnected.");
        console.log("There are " + users.length + " users");
      });

    function isMyTurn() {
        if (user.game === null) return false;
        if (user.localPlayers.indexOf(user.game.last_player_index) < 0) return false;
        return true;
    }

    socket.on('buildElement', function (data) {
        if (!isMyTurn()) return;
        user.game.buildElement( data.edge_coord, data.player_index, data.element_type);
        sendUpdateToClients();
    });

    socket.on('destroyElement', function (data) {
        if (!isMyTurn()) return;
        user.game.destroyElement( data.edge_coord, data.player_index);
        sendUpdateToClients();
    });

    socket.on('nextPlayerTurn', function (data) {
        if (!isMyTurn()) return;
        user.game.nextPlayerTurn();
        sendUpdateToClients();
    });
});