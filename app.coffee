http = require "http"
WebSocketServer = require("ws").Server
debug = require "./debug"

server = http.createServer((req, res) ->
    res.writeHead 200, 'Content-Type': 'text/plain'
    res.end 'Hello World\n'
).listen(process.env.PORT, process.env.IP, ->
    debug.info "Server started "+process.env.IP+":"+process.env.PORT    
)



wss = new WebSocketServer(server: server)
wss.on "connection", (ws) ->
    debug.info "new ws connection from "
    ws.on "close", ->
        debug.info "ws connection closed "

    ws.on "message", (msg) ->
        debug.info 'ws received: '+msg
        for client in ws.clients
            client.send msg.utf8Data
