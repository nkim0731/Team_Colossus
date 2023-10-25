/*
* Socket logic interface for Group Chats or anything else if need
*/
const socketIo = require('socket.io');

const chatrooms = {}; // courses

module.exports = {
    initializeSocketIo: (server) => {
        const io = socketIo(server);
        
        // a collection in messages db for a socket io room for a group chat
        // could also be a messages collection with and array of objects represnting a message
        io.on('connection', (socket) => {
            console.log('A user connected');
    
            socket.on('joinChatroom', (chatroomId) => {
                // Create or join the chatroom
                socket.join(chatroomId);
          
                // Store the user and chatroom association
                socket.chatroomId = chatroomId;
            });

            socket.on('leaveChatroom', () => {
                if (socket.chatroomId) {
                    socket.leave(socket.chatroomId);
                    socket.chatroomId = null;
                }
            });

            socket.on('sendMessage', (message) => {
                if (socket.chatroomId) {
                    io.to(socket.chatroomId).emit('message', message); // broadcast message
                }
            });

            socket.on('disconnect', () => {
                console.log('A user disconnected');
                if (socket.chatroomId) {
                    socket.leave(socket.chatroomId);
                }
            });
        });
    },
};