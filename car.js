var localStream;
var localVideo = document.getElementById("self");
var pc;
var socket;
var serverUri = "werbrtcspielewiese.posmich.c9.io/";

var pcConfig = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

var mediaConstraints = {"audio": false, "video": {"mandatory": {}, "optional": []}};

var sdpConstraints = {'mandatory': {
  'OfferToReceiveAudio' : false,
  'OfferToReceiveVideo' : true
}};

/****   STEP 1: create ws for signaling    ****/
socket = new WebSocket( 'ws://' + serverUri );


/****   STEP 2: create PeerConnection      ****/
try {
    // Create an RTCPeerConnection via the polyfill (adapter.js).
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = onIceCandidate;
    console.log('Created RTCPeerConnnection with:\n  config: \'' + JSON.stringify(pcConfig));
} catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.');
    return;
}

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

//     dataChannel = pc.createDataChannel("sendDataChannel", {reliable: true});



/****   STEP 3: obtaining local media      ****/

try {
    getUserMedia(mediaConstraints, onUserMediaSuccess, onUserMediaError);

    console.log('Requested access to local media with mediaConstraints:\n\\' + JSON.stringify(mediaConstraints) + '\'');
} catch (e) {
    alert('getUserMedia() failed. Is this a WebRTC capable browser?');
    console.log('getUserMedia failed with exception: ' + e.message);
}


function onUserMediaSuccess(stream) {
    console.log('User has granted access to local media.');
    // Call the polyfill wrapper to attach the media stream to this element.
    attachMediaStream(localVideo, stream);
    localVideo.style.opacity = 1;
    localStream = stream;

    console.log('Adding local stream.');
    pc.addStream(localStream);
}

function onUserMediaError(error) {
    console.log('Failed to get access to local media. Error code was ' + error.code);
    alert('Failed to get access to local media. Error code was ' + error.code + '.');
}





function setLocalAndSendMessage(sessionDescription) {
    // Set Opus as the preferred codec in SDP if Opus is present.
    // sessionDescription.sdp = preferOpus(sessionDescription.sdp);
    pc.setLocalDescription(sessionDescription);

    sendMessage({type:"answer",sdp:sessionDescription});
}


socket.onopen = function() {
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
    console.log("Processing:");
    console.log(message);
    if (message.type === 'offer') {
        // Set Opus in Stereo, if stereo enabled.
        // if (stereo)
        //  message.sdp = addStereo(message.sdp);
        pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        doAnswer();
    } else if (message.type === 'candidate') {
        var candidate = new RTCIceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
        pc.addIceCandidate(candidate);
    } else if (message.type === 'bye') {
        console.log("bye");
    }
}

function doAnswer() {
    pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
}

function sendMessage(message) {
    var msgString = JSON.stringify( message );
    console.log('C->S: ' + msgString);
    socket.send(msgString);
}
