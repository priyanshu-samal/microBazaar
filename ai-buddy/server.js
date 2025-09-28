require('dotenv').config()
const app=require('./src/app')
const http=require('http')
const {initSocketServer}=require('./src/sockets/socket.server')




const httpserver=http.createServer(app)
initSocketServer(httpserver)



httpserver.listen(3005,()=>{
    console.log('Ai buddy is running')
})
