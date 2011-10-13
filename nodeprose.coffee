express = require('express')
app = express.createServer()
io = require('socket.io').listen(app)
_ = require('underscore')

app.configure ->
  app.use express.static(__dirname + '/public')

io.configure ->
  io.set 'transports', [ 'xhr-polling' ]
  io.set 'polling duration', 10

app.get '/', (req, res) ->
  res.render 'index.jade'

port = process.env.PORT || 3000
app.listen port

np = {}

np.resetAll = ->
  np.writers = new Array()
  np.readers = new Array()
  np.contributions = new Array()

np.currentWriter = ->
  np.writers[0]

np.addWriter = (writer) ->
  writer.emit 'write', {} if np.writers.length == 0
  np.writers.push writer
  
np.removeWriter = (writer) ->
  np.selectNextWriter() if np.currentWriter() == writer
  np.writers = _.without(np.writers, writer)

np.selectNextWriter = ->
  return if np.writers.length == 0
  currentWriter = np.writers.pop()
  currentWriter.emit 'write', {}
  np.writers.unshift currentWriter

np.resetAll()
io.sockets.on 'connection', (socket) ->
  np.addWriter(socket)

  socket.on 'disconnect', (socket) ->
    np.removeWriter socket
  
  socket.on 'message', (data) ->
    np.contributions.push data.prose

    waitingWriters = _.without(np.writers, socket)
    _.map waitingWriters, (writer) ->
      writer.emit 'prose', {}

    if np.contributions.length > 9
      io.sockets.emit 'full_text', full_text: np.contributions
      np.resetAll()
    else
      np.selectNextWriter()
