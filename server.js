const port = process.env.PORT || 8000;
const io = require('socket.io').listen(port).sockets;
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://test:test1234@ds039351.mlab.com:39351/socket_io-crash-course', { useNewUrlParser: true }, (err, db) => {
  if(err) {
    throw err;
  } else {
    console.log('MongoDB Connected!');
    // Connect to Socket.io
    io.on('connection', socket => {
      let chat = db.collection('chats');
      // Create function to send status
      sendStatus = function(status) {
        socket.emit('status', status);
      };
      // Get chats from database
      chat.find().limit(10).sort({_id: 1}).toArray(function(err, res) {
        if(err) {
          throw err;
        } else {
          io.emit('output', res);
        };
      });
      // Handle input events
      socket.on('input', data => {
        const name = data.name;
        const message = data.message;
        // Input validation
        if(name === '' || message === '') {
          // Send error
          sendStatus('Please enter a name and a message.');
        } else {
          // Insert into the database
          chat.insert({name: name, message: message}, () => {
            io.emit('output', [data]);
            // Send status
            sendStatus({ message: 'Message sent!', clear: true });
          });
          console.log(data);
        };
      });
      // Handle clear
      socket.on('clear', data => {
        // Remove all chats
        chat.remove({}, () => {
          socket.emit('cleared')
        })
      });
    });
  }
});
