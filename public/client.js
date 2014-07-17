$(document).ready(function() {
  var loc = document.location;
  var port = document.location.port;
  var url = loc.protocol + "//" + loc.hostname ;
  if(port.length > 0) {
    url = url + ":" + port;
  }

  var socket = io.connect(url);

  socket.on('prose', function(data) {
    $('#dump').append("<p>---------------------------------------</p>");
  });

  socket.on('full_text', function(data) {
    var dump = $('#dump');
    dump.empty();
    _.each(data.full_text, function(contri) {
      dump.append("<p>" + contri + "</p>");
    });
  });

  socket.on('write', function(data) {
    $('#dump p:last-child').html(data.lastMessage);
    $('#proseUpdater').show();
  });

  $('#proseUpdater').bind('click', function() {
    var proseContainer = $('#prose')[0];
    var proseValue = proseContainer.value;
    proseContainer.value = '';
    socket.emit('message', {prose: proseValue});
    $('#dump').append("<p>" + proseValue + "</p>");

    $('#proseUpdater').hide();
    return false;
  });
});
