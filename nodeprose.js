var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , _  = require('underscore');

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

var nodeprose = {}

nodeprose.writers = new Array();
nodeprose.readers = new Array();
nodeprose.contributions = new Array();
nodeprose.currentWriter;

nodeprose.resetAll = function() {
  nodeprose.writers = new Array();
  nodeprose.readers = new Array();
  nodeprose.contributions = new Array();
}

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

io.sockets.on('connection', function (socket) {
  if(nodeprose.writers.length == 0) {
    nodeprose.writers.push(socket);
    socket.emit('write', {});
  } else if(nodeprose.writers.length < 21) {
    nodeprose.writers.push(socket);
  } else {
    nodeprose.readers.push(socket);
  }

  socket.on('disconnect', function(socket) {
    if(nodeprose.writers[0] === socket) {
      selectNextWriter();
    }
    nodeprose.writers = _.without(nodeprose.writers, socket);
  });

  socket.on('message', function (data) {
    nodeprose.contributions.push(data.prose);
    io.sockets.emit('prose', data);
    io.sockets.emit('lockdown', {});
    if(nodeprose.contributions.length > 10) {
      io.sockets.emit('full_text', {full_text: nodeprose.contributions});
      nodeprose.resetAll();
    } else {
      var currentWriter = nodeprose.writers.shift();
      currentWriter.emit('write', {});
      nodeprose.writers.push(currentWriter);
    }
  });
});
