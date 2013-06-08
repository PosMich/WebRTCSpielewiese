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

        try
            msg = JSON.parse(msg);
        catch e
            debug.error "unable to parse JSON!!!"

        try
            switch msg.type
                when "kill" then ...
                when "drive" then ...
                when "spd" then ...
                when "ice" then ...
                when "exit" then ...
        catch e
            debug.error


        for client in ws.clients
            client.send msg.utf8Data

###
db:
    car list
        id          string
        owner       req.user
        string      drive password
        string      kill password
        boolean     occupied

    client list


    type of messages:
        client --> server
            login
                id:   id
                type: drive/kill
                pw:   passphrase
            spd/ice
                type: spd/ice
                msg
            exit
                type: exit
                msg

        server --> client
            spd/ice
            exit

###

