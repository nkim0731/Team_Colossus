/*
* Socket logic interface for Group Chats
*/
const socketIo = require('socket.io');
const db = require('../Databases/Database.js');

const allowedOrigins = [
    'http://10.0.2.2:3000',
    '0.0.0.0',
]

class ChatManager {
    constructor(server) {
        this.initSocketIo(server);
    }

    closeSocket() {
        console.log('closing socket server');
        if (this.io) this.io.close();
    }
    
    // ChatGPT usage: Partial
    initSocketIo(server) {
        // ChatGPT usage: Yes
        this.io = socketIo(server, {
            cors: {
                origin: allowedOrigins,
                methods: ['GET', 'POST'],
            }
        });
        
        // ChatGPT usage: Partial
        this.io.on('connection', (socket) => {
            console.log('A user connected');

            // ChatGPT usage: Yes
            socket.on('joinChatroom', async (username, chatName) => {
                // validate user is a part of the chatroom
                const user = await db.getUser(username);
                const chatExists = user.events.some(e => e.eventName === chatName);

                if (chatExists) { // validate chat exists within user events array
                    socket.join(chatName);
                    socket.chatName = chatName;
                    socket.emit('chatJoined');
                }
            });

            // ChatGPT usage: Yes
            socket.on('leaveChatroom', () => {
                if (socket.chatName) {
                    socket.leave(socket.chatName);
                    socket.chatName = null;
                    socket.emit('chatLeft');
                }
            });

            // ChatGPT usage: Partial
            socket.on('sendMessage', async (message, sender) => { // message string and username
                if (socket.chatName) {
                    // format timestamp string
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    const seconds = String(now.getSeconds()).padStart(2, '0');

                    let messageObj = {
                        sender,
                        message,
                        timestamp: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
                    }
                    // Broadcast the message to all sockets in the chatroom except the sender
                    socket.to(socket.chatName).except(socket.id).emit('message', messageObj);
                    await db.addMessage(socket.chatName, messageObj); // store message in database
                    socket.emit('messageSent', `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
                }
            });

            // ChatGPT usage: Yes
            socket.on('disconnect', () => {
                console.log('A user disconnected');
                if (socket.chatName) {
                    socket.leave(socket.chatName);
                }
            });
        });
    }
}

function initializeChatManager(server) {
    return new ChatManager(server);
}
  
module.exports = initializeChatManager;