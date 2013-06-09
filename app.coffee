http = require "http"
WebSocketServer = require("ws").Server
debug = require "./debug"

server = http.createServer((req, res) ->
    res.writeHead 200, 'Content-Type': 'text/plain'
    res.end 'Hello World\n'
).listen(process.env.PORT, process.env.IP, ->
    debug.info "Server started "+process.env.IP+":"+process.env.PORT
)

var carList = {};

var clientList = {};


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
                when "kill"
                    debug.info "login kill!!!"
                    debug.info "id: "+id
                    debug.info "pw: "+pw
                when "drive"
                    debug.info "login drive!!!"
                    debug.info "id: "+id
                    debug.info "pw: "+pw
                when "sdp"
                    debug.info "sdp msg!!!"
                    debug.info "msg: "
                    console.log msg.content
                when "ice"
                    debug.info "ice msg!!!"
                    debug.info "msg: "
                    console.log msg.content
                when "exit"
                    debug.info "exit msg"
                else
                    debug.error "wasn't able to detect type of msg: "+msg.type
        catch e
            debug.error

###
        for client in ws.clients
            client.send msg.utf8Data


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
            sdp/ice
                type: spd/ice
                content
            exit
                type: exit

        server --> client
            spd/ice
            exit

###

