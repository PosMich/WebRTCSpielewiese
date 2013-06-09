
$(function() {
    var localstream;
    var pc;

    var vid1 = document.getElementById("self");
    vid1.autoplay = true;
    var vid2 = document.getElementById("remote");
    vid2.autoplay = true;
    var serverUri = "werbrtcspielewiese.posmich.c9.io/";

    var ws = new WebSocket("ws://" + serverUri);
    var servers = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

    // run start(true) to initiate a call
    function start(isCaller) {
        pc = new webkitRTCPeerConnection(servers);

        // send any ice candidates to the other peer
        pc.onicecandidate = function (evt) {
            ws.send(JSON.stringify({type: "ice", content: evt.candidate }));
        };

        // once remote stream arrives, show it in the remote video element
        pc.onaddstream = function (evt) {
            vid2.src = URL.createObjectURL(evt.stream);
        };

        // get the local stream, show it in the local video element and send it
        navigator.webkitGetUserMedia({ "audio": true, "video": true }, function (stream) {
            vid1.src = URL.createObjectURL(stream);
            pc.addStream(stream);

            if (isCaller)
                pc.createOffer(gotDescription);
            else
                pc.createAnswer(pc.remoteDescription, gotDescription);

            function gotDescription(desc) {
                pc.setLocalDescription(desc);
                ws.send(JSON.stringify({type: "sdp", content: desc }));
            }
        });
    }

    ws.onmessage = function (evt) {
        if (!pc)
            start(false);

        var signal = JSON.parse(evt.data);
        if (signal.sdp)
            pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        else
            pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    };


/*

    ws.onmessage = function(evt) {
        var data = evt.data;
        try {
            data = JSON.parse(data);
         } catch (e) {
            console.log(e);
        }

        console.log(data);

        switch(data.type) {
            case "ice":
                if (data.content==null)
                    break;
                console.log("addIceCandidate");
                pc1.addIceCandidate(new RTCIceCandidate(data.content));
                break;
            case "sdp":
                if (data.content==null)
                    break;
                console.log("sdp");
                pc1.setRemoteDescription(data.content);
                break;
            default:
                break;
        }
    }
*/
    $("#start").click(function() {
        start(false);
    });
    $("#call").click(function() {
        start(true);
    });
});