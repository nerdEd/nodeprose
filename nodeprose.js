var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');

var port = process.env.PORT || 3000;
app.listen(port);

function handler (req, res) {
  fs.readFile('./index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200);
      res.end(data);
  });
}

var writers = new Array();
var contributions = new Array();
var currentWriter;


io.sockets.on('connection', function (socket) {
  if(writers.length < 20) {
    writers.push(socket);
  }

  socket.on('message', function (data) {
    contributions.push(data.prose);
    io.sockets.emit('prose', data);
    io.sockets.emit('lockdown', {});
    if(contributions.length > 10) {
      io.sockets.emit('full_text', {full_text: contributions});
      writers = new Array();
      contributions = new Array();
    } else {
      var currentWriter = writers.pop();
      currentWriter.emit('write', {});
      writers.push(currentWriter);
    }
  });
});