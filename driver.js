
var localStream;
var remoteVideo = document.getElementById("remote");
var controlChannel;
var pc;
var socket;
var serverUri = "werbrtcspielewiese.posmich.c9.io/";

var pcConfig = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

var offerConstraints = {"optional": [], "mandatory": {'OfferToReceiveAudio' : false,'OfferToReceiveVideo' : true }};

/****   STEP 1: create ws for signaling    ****/
socket = new WebSocket( 'ws://' + serverUri );



function onIceCandidate(event) {
    if (event.candidate) {
        sendMessage({type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate});
    } else {
        console.log('End of candidates.');
    }
}

function onRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    console.log(remoteVideo);
    console.log(event.stream);
    attachMediaStream(remoteVideo, event.stream);
    remoteStream = event.stream;
    waitForRemoteVideo();
}

function waitForRemoteVideo() {
    console.log("wait for remote video");
    // Call the getVideoTracks method via adapter.js.
    videoTracks = remoteStream.getVideoTracks();
    if (videoTracks.length === 0 || remoteVideo.currentTime > 0) {
        console.log("got remote video");
    } else {
        setTimeout(waitForRemoteVideo, 100);
    }
}

function onRemoteStreamRemoved(event) {
    console.log('Remote stream removed.');
}


function doCall() {
    console.log('Sending offer to peer, with constraints: \n')
    pc.createOffer(setLocalAndSendMessage, null, offerConstraints);
}


function setLocalAndSendMessage(sessionDescription) {
    // Set Opus as the preferred codec in SDP if Opus is present.
    // sessionDescription.sdp = preferOpus(sessionDescription.sdp);
    pc.setLocalDescription(sessionDescription);
    sendMessage({type:"offer",sdp:sessionDescription});
}



socket.onopen = function() {
    console.log("socket connection established");
    /****   STEP 2: create PeerConnection      ****/
    try {
        // Create an RTCPeerConnection via the polyfill (adapter.js).
        pc = new RTCPeerConnection(pcConfig);
        pc.onicecandidate = onIceCandidate;

        console.log('Created RTCPeerConnnection with:\n  config: \'' + JSON.stringify(pcConfig) + '\';\n');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.');
        return;
    }

    pc.onaddstream = onRemoteStreamAdded;
    pc.onremovestream = onRemoteStreamRemoved;
    controlChannel = pc.createDataChannel("control");
    setInterval(function(){
        controlChannel.send("asdfasdf");
    }, 500);
    doCall();
};

socket.onmessage = function(message) {
    console.log('S->C: ' + message.data);
    var msg = JSON.parse(message.data);
    processSignalingMessage(msg);
};

socket.onerror = function() {
    console.log('Channel error.');
};

socket.onclose = function() {
    console.log('Channel closed.');
};



function processSignalingMessage(message) {
    if (message.type === 'answer') {
        console.log("setRemoteDescription");
        pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
    } else if (message.type === 'candidate') {
        var candidate = new RTCIceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
        pc.addIceCandidate(candidate);
    } else if (message.type === 'bye') {
        console.log("bye");
    }
}


function sendMessage(message) {
    var msgString = JSON.stringify( message );
    console.log('C->S: ' + msgString);
    socket.send(msgString);
}

