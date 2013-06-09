
$(function() {
    var localstream;

    var vid1 = document.getElementById("self");
    var vid2 = document.getElementById("remote");
    var serverUri = "werbrtcspielewiese.posmich.c9.io/";
    // var serverUri = "localhost";
    // var serverPort = 8080;


    var ws = new WebSocket("ws://" + serverUri);

    function gotStream(stream){
        console.log("Received local stream");
        vid1.autoplay = true;
        vid1.src = webkitURL.createObjectURL(stream);
        //$("#self").attr("src",webkitURL.createObjectURL(stream));
        localstream = stream;
    }

    function start() {
        console.log("Requesting local stream");
        navigator.webkitGetUserMedia({audio:true, video:true},gotStream, function() {});
    }

    function call() {
        console.log("Starting call");

        // temporary hacks to cope with API change
        if (!!localstream.videoTracks && !localstream.getVideoTracks) {
            localstream.getVideoTracks = function(){
                return this.videoTracks;
            }
        }
        if (!!localstream.audioTracks && !localstream.getAudioTracks) {
            localstream.getAudioTracks = function(){
                return this.audioTracks;
            }
        }
        ///////////////////////////////////////////

        if (localstream.getVideoTracks().length > 0)
            console.log('Using Video device: ' + localstream.getVideoTracks()[0].label);
        if (localstream.getAudioTracks().length > 0)
            console.log('Using Audio device: ' + localstream.getAudioTracks()[0].label);

        var servers = { iceServers: [{ url: "stun:stun.l.google.com:19302" }] };

        window.pc1 = new webkitRTCPeerConnection(servers);
        console.log("Created local peer connection object pc1");
        pc1.onicecandidate = iceCallback1;
        pc1.onaddstream = gotRemoteStream;


        //window.pc2 = new webkitRTCPeerConnection(servers);
        //console.log("Created remote peer connection object pc2");
        //pc2.onicecandidate = iceCallback2;
        //pc2.onaddstream = gotRemoteStream;

        //pc1.addStream(localstream);
        //console.log("Adding Local Stream to peer connection");

        pc1.createOffer(gotDescription1);
    }

    function gotDescription1(desc){
        pc1.setLocalDescription(desc);
        console.log("Offer from pc1 \n" + desc);
        ws.send({type:"sdp", content:"desc"});
        //pc2.setRemoteDescription(desc);
        //pc2.createAnswer(gotDescription2);
    }

    // function gotDescription2(desc){
    //     pc2.setLocalDescription(desc);
    //     console.log("Answer from pc2 \n" + desc.sdp);
    //     pc1.setRemoteDescription(desc);
    // }

    function hangup() {
        console.log("Ending call");
        pc1.close();
        //pc2.close();
        pc1 = null;
        //pc2 = null;
    }

    function gotRemoteStream(e){
        vid2.src = webkitURL.createObjectURL(e.stream);
        console.log("Received remote stream");
    }

    function iceCallback1(event){
        ws.send({type:"ice", content: event.candidate});
        /*
        if (event.candidate) {
            pc2.addIceCandidate(new RTCIceCandidate(event.candidate));
            console.log("Local ICE candidate: \n" + event.candidate.candidate);
        }*/
    }

    // function iceCallback2(event){
    //     if (event.candidate) {
    //         pc1.addIceCandidate(new RTCIceCandidate(event.candidate));
    //         console.log("Remote ICE candidate: \n " + event.candidate.candidate);
    //     }
    // }


    $("#start").click(function() {
        start();
    });
    $("#call").click(function() {
        call();
    });
});