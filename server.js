"use strict";

process.title = 'network';
var express = require("express");
var app = express();
var port = process.env.PORT || 80;
var io = require('socket.io').listen(app.listen(port));
console.log("listening on port " + port);

var shared = require('./js/shared');
var game = new shared.game();


var users = [ ];

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});


app.use("/js", express.static(__dirname + '/js'));

io.sockets.on('connection', function (socket) {

    var user = {};
    user.socket = socket;
 
    console.log((new Date()) + ' Connection accepted.');

//    socket.on('cmd', processCommand);

    socket.on('disconnect', function(){
        console.log((new Date()) + " Peer disconnected.");
      });
});