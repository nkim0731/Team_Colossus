/*
* Socket logic interface for Group Chats or anything else if need
*/
const socketIo = require('socket.io');

module.exports = {
    initializeSocketIo: (server) => {
        const io = socketIo(server);
        
        // use socket io rooms for each group chat?
        // io.to('groupchat').emit(event)
        // a collection in messages db for a socket io room for a group chat
        io.on('connection', (socket) => {
            console.log('A user connected');
    
            socket.on('message', (data) => {
                // Broadcast the message to all connected clients
                io.emit('message', data);
            });
    
            socket.on('disconnect', () => {
            console.log('A user disconnected');
            });
        });
    },
};
  