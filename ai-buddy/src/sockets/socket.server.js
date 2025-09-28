const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const agent = require('../agent/agent');
const { HumanMessage } = require("@langchain/core/messages");



async function initSocketServer(httpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    })

    io.use((socket, next) => {

        const cookies = socket.handshake.headers?.cookie;

        const { token } = cookies ? cookie.parse(cookies) : {};

        if (!token) {
            return next(new Error('Token not provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            socket.user = decoded;
            socket.token = token;

            next()

        } catch (err) {
            next(new Error('Invalid token'));
        }

    })

    io.on('connection', (socket) => {

        console.log(socket.user, socket.token)

        let messages = [];


        socket.on('message', async (data) => {
            console.log("--- Message received ---", data);
            try {

                messages.push(new HumanMessage({ content: data }));

                console.log("Before agent.invoke");
                const agentResponse = await agent.invoke({
                    messages: messages
                }, {
                    configurable: {
                        socket: socket,
                        token: socket.token
                    }
                });
                console.log("After agent.invoke", agentResponse);

                messages = agentResponse.messages;

                const lastMessage = agentResponse.messages[agentResponse.messages.length - 1]

                socket.emit('message', lastMessage.content)
            } catch (error) {
                console.error("Error during agent invocation:", error);
                socket.emit('error', "An error occurred.");
            }
        })

    })

}


module.exports = { initSocketServer };