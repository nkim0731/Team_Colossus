/*
* Socket logic interface for Group Chats or anything else if need
*/
const socketIo = require('socket.io');
const db = require('../Databases/Database.js');

class ChatManager {
    constructor(server) {
        this.initSocketIo(server);
    }
    
    initSocketIo(server) {
        const io = socketIo(server);

        io.on('connection', (socket) => {
            console.log('A user connected');

            socket.on('joinChatroom', (chatroomId) => {
                // create/join the chatroom
                socket.join(chatroomId);
                socket.chatroomId = chatroomId;
                // console.log(`joined chatroom ${chatroomId}`)
            });

            socket.on('leaveChatroom', () => {
                if (socket.chatroomId) {
                    socket.leave(socket.chatroomId);
                    socket.chatroomId = null;
                }
            });

            socket.on('sendMessage', (message, sender) => { // message string and username
                if (socket.chatroomId) {
                    let messageObj = {
                        sender: sender,
                        message: message,
                        timestamp: new Date(),
                    }
                    io.to(socket.chatroomId).emit('message', messageObj); // broadcast message to chatroom
                    db.addMessage(socket.chatroomId, messageObj); // store message in database
                }
            });

            socket.on('disconnect', () => {
                console.log('A user disconnected');
                if (socket.chatroomId) {
                    socket.leave(socket.chatroomId);
                }
            });
        });
    }
}

module.exports = ChatManager;