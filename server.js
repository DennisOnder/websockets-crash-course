const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(9000).sockets;

// Connect to MongoDB
const mongoURI = 'mongodb://root:root123@ds039351.mlab.com:39351/socket_io-crash-course';
mongo.connect(mongoURI, { useNewUrlParser: true }, (err, client) => {
  if(err) {
    throw err;
  } else {
    console.log('Database connected');
  }
  // Connect to Socket.io
  client.on('connection', (socket) => {
    let chat = client.db.collection('chats');
    // Create function to send status
    const sendStatus = function(s) {
      socket.emit('status', s)
    }
    // Get chats from collection
    chat.find().limit(100).sort({ _id: 1 }).toArray(function(err, res) {
      if(err) {
        throw err;
      }
      // Emit the messages
      socket.emit('output', res);
    });
    // Handle input events
    socket.on('input', (data) => {
      const name = data.name;
      const message = data.message;
      // Check for name and message
      if(name === '' || message === '') {
        // Send error status
        sendStatus('Please enter a name and message.');
      } else {
        // Insert message to database
        chat.insert({name: name, message: message}, () => {
          client.emit('output', [data]);
          // Send status object
          sendStatus({message: 'Message sent.', clear: true});
        })
      }
    });
    socket.on('clear', (data) => {
      // Remove all chats from collection
      chat.remove({}, () => {
        // Emit cleared
        socket.emit('cleared');
      })
    })
  });
});