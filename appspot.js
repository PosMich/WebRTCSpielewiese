  var localVideo;
	// var miniVideo;
	var remoteVideo;
	var localStream;
	var remoteStream;

	var pc;
	var socket;
	var xmlhttp;

	var started = false;
	var turnDone = true; // trying without turn
	var channelReady = false;
	var signalingReady = false;

  var roomLink = "asdf324"

    var serverUri = "werbrtcspielewiese.posmich.c9.io/";


	var msgQueue = [];

	var sdpConstraints = {'mandatory': {
		'OfferToReceiveAudio' : false,
		'OfferToReceiveVideo' : true
	}};

	var initiator = 0;
	var pcConfig = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
	var pcConstraints = {"optional": [{"DtlsSrtpKeyAgreement": true}]};
	var offerConstraints = {"optional": [], "mandatory": {}};
	var mediaConstraints = {"audio": false, "video": {"mandatory": {}, "optional": []}};
  	// var turnUrl = '';
	var me = '41609730';
	var roomKey = '68951688';

	function initialize() {
		localVideo = $( "#self" )[0];
    localVideo.autoplay = true;
		localVideo.addEventListener( 'loadedmetadata', function() {
			//window.onresize();
		});

		remoteVideo = $( "#remote" )[0];
    remoteVideo.autoplay = true;
		resetStatus();
		openChannel();
		// maybeRequestTurn();
		doGetUserMedia();
		signalingReady = initiator;
	}

	function resetStatus() {
	    if (!initiator) {
	    	setStatus('Waiting for someone to join: \
	                <a href=' + roomLink + '>' + roomLink + '</a>');
	    } else {
	    	setStatus('Initializing...');
	    }
	}

  function websocket() {

  }

	function setStatus(state) {
    	document.getElementById('footer').innerHTML = state;
  	}

      console.log('Opening channel.');
      socket = new WebSocket( 'ws://' + serverUri );

      socket.onopen = function() {
        console.log('Channel opened.');
        channelReady = true;
        maybeStart();
      };

      socket.onmessage = function(message) {
        console.log('S->C: ' + message.data);
        var msg = JSON.parse(message.data);
        // Since the turn response is async and also GAE might disorder the
        // Message delivery due to possible datastore query at server side,
        // So callee needs to cache messages before peerConnection is created.
        if (!initiator && !started) {
            if (msg.type === 'offer') {
              console.log("offer");
              // Add offer to the beginning of msgQueue, since we can't handle
              // Early candidates before offer at present.
              msgQueue.unshift(msg);
              // Callee creates PeerConnection
              signalingReady = true;
              maybeStart();
            } else {
              msgQueue.push(msg);
            }
        } else {
            processSignalingMessage(msg);
        }
      };

      socket.onerror = function() {
        console.log('Channel error.');
      };

      socket.onclose = function() {
        console.log('Channel closed.');
      };

  	function openChannel() {



  	}

  	function maybeStart() {
      console.log("maybeStart");
      console.log("started: "+started);
      console.log("signalingReady: "+signalingReady);
      console.log("localStream: "+localStream);
      console.log("channelReady: "+channelReady);
      console.log("turnDone: "+turnDone);
    	if (!started && signalingReady &&
        	localStream && channelReady && turnDone) {
          console.log("try");
      		setStatus('Connecting...');
      		console.log('Creating PeerConnection.');
      		createPeerConnection();
      		console.log('Adding local stream.');
      		pc.addStream(localStream);
      		started = true;

	      	if (initiator)
	        	doCall();
	      	else
	        	calleeStart();
    	}
  	}

  	function createPeerConnection() {
    	try {
      		// Create an RTCPeerConnection via the polyfill (adapter.js).
      		pc = new RTCPeerConnection(pcConfig, pcConstraints);
      		pc.onicecandidate = onIceCandidate;
      		console.log('Created RTCPeerConnnection with:\n' +
                  '  config: \'' + JSON.stringify(pcConfig) + '\';\n' +
                  '  constraints: \'' + JSON.stringify(pcConstraints) + '\'.');
    	} catch (e) {
      		console.log('Failed to create PeerConnection, exception: ' + e.message);
      		alert('Cannot create RTCPeerConnection object; \
            	WebRTC is not supported by this browser.');
        	return;
    	}
    	pc.onaddstream = onRemoteStreamAdded;
    	pc.onremovestream = onRemoteStreamRemoved;
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

  	function onRemoteStreamAdded(event) {
    	console.log('Remote stream added.');
    	reattachMediaStream(miniVideo, localVideo);
    	attachMediaStream(remoteVideo, event.stream);
    	remoteStream = event.stream;
    	waitForRemoteVideo();
  	}

  	function onRemoteStreamRemoved(event) {
    	console.log('Remote stream removed.');
	}

	function waitForRemoteVideo() {
    	// Call the getVideoTracks method via adapter.js.
    	videoTracks = remoteStream.getVideoTracks();
    	if (videoTracks.length === 0 || remoteVideo.currentTime > 0) {
      		transitionToActive();
    	} else {
      		setTimeout(waitForRemoteVideo, 100);
    	}
  	}

  	function transitionToActive() {
    	// remoteVideo.style.opacity = 1;
    	// card.style.webkitTransform = 'rotateY(180deg)';
    	setTimeout(function() { localVideo.src = ''; }, 500);
    	setTimeout(function() { remoteVideo.style.opacity = 1; }, 1000);
    	// Reset window display according to the asperio of remote video.
    	//window.onresize();
    	setStatus('<input type=\'button\' id=\'hangup\' value=\'Hang up\' \
        	      onclick=\'onHangup()\' />');
  	}

	function doCall() {
    	var constraints = mergeConstraints(offerConstraints, sdpConstraints);
    	console.log('Sending offer to peer, with constraints: \n' +
                '  \'' + JSON.stringify(constraints) + '\'.')
    	pc.createOffer(setLocalAndSendMessage, null, constraints);
  	}

  	function calleeStart() {
    	// Callee starts to process cached offer and other messages.
    	while (msgQueue.length > 0) {
      		processSignalingMessage(msgQueue.shift());
    	}
  	}


  	function mergeConstraints(cons1, cons2) {
    	var merged = cons1;
    	for (var name in cons2.mandatory) {
      		merged.mandatory[name] = cons2.mandatory[name];
    	}
    	merged.optional.concat(cons2.optional);
    	return merged;
  	}

  	function setLocalAndSendMessage(sessionDescription) {
    	// Set Opus as the preferred codec in SDP if Opus is present.
    	// sessionDescription.sdp = preferOpus(sessionDescription.sdp);
    	pc.setLocalDescription(sessionDescription);
      if (initiator) {
    	   sendMessage({type:"offer",sdp:sessionDescription});
       } else {
          sendMessage({type:"answer",sdp:sessionDescription});
       }
  	}

  	function sendMessage(message) {
    	var msgString = JSON.stringify( message );
    	console.log('C->S: ' + msgString);
      socket.send(msgString);
    	// NOTE: AppRTCClient.java searches & parses this line; update there when
    	// changing here.
    	/*path = '/message?r=' + roomKey + '&u=' + me;
    	var xhr = new XMLHttpRequest();
    	xhr.open('POST', path, true);
    	xhr.send(msgString);*/
  	}

  	function processSignalingMessage(message) {
    	if (!started) {
      		console.log('peerConnection has not been created yet!');
      		return;
    	}

    	if (message.type === 'offer') {
      		// Set Opus in Stereo, if stereo enabled.
      		// if (stereo)
        	//	message.sdp = addStereo(message.sdp);
  			pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
  			doAnswer();
    	} else if (message.type === 'answer') {
      		// Set Opus in Stereo, if stereo enabled.
      		// if (stereo)
        	//		message.sdp = addStereo(message.sdp);
      		pc.setRemoteDescription(new RTCSessionDescription(message));
    	} else if (message.type === 'candidate') {
      		var candidate = new RTCIceCandidate({sdpMLineIndex: message.label,
                                           candidate: message.candidate});
     		pc.addIceCandidate(candidate);
    	} else if (message.type === 'bye') {
      		onRemoteHangup();
    	}
  	}

  	function doAnswer() {
    	console.log('Sending answer to peer.');
    	pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
  	}

  	function onRemoteHangup() {
    	console.log('Session terminated.');
    	initiator = 0;
    	transitionToWaiting();
    	stop();
  	}

  	function onHangup() {
    	console.log('Hanging up.');
    	transitionToDone();
    	stop();
    	// will trigger BYE from server
    	socket.close();
  	}

  	function stop() {
    	started = false;
    	signalingReady = false;
    	isAudioMuted = false;
    	isVideoMuted = false;
    	pc.close();
    	pc = null;
    	msgQueue.length = 0;
  	}

  	function transitionToWaiting() {
    	// card.style.webkitTransform = 'rotateY(0deg)';
    	// setTimeout(function() {
     	//             localVideo.src = miniVideo.src;
     	//             miniVideo.src = '';
     	//             remoteVideo.src = '' }, 500);
    	// miniVideo.style.opacity = 0;
    	// remoteVideo.style.opacity = 0;
    	resetStatus();
  	}

  	function transitionToDone() {
    	// localVideo.style.opacity = 0;
    	// remoteVideo.style.opacity = 0;
    	// miniVideo.style.opacity = 0;
    	setStatus('You have left the call. <a href=' + roomLink + '>\
              Click here</a> to rejoin.');
  }


  	function doGetUserMedia() {
    	// Call into getUserMedia via the polyfill (adapter.js).
    	try {
      		getUserMedia(mediaConstraints, onUserMediaSuccess,
                   	onUserMediaError);
      		console.log('Requested access to local media with mediaConstraints:\n' +
                  	'  \'' + JSON.stringify(mediaConstraints) + '\'');
    	} catch (e) {
      		alert('getUserMedia() failed. Is this a WebRTC capable browser?');
      		console.log('getUserMedia failed with exception: ' + e.message);
    	}
  	}

  	function onUserMediaSuccess(stream) {
    	console.log('User has granted access to local media.');
    	// Call the polyfill wrapper to attach the media stream to this element.
    	attachMediaStream(localVideo, stream);
    	localVideo.style.opacity = 1;
    	localStream = stream;
    	// Caller creates PeerConnection.
    	maybeStart();
  	}

  	function onUserMediaError(error) {
    	console.log('Failed to get access to local media. Error code was ' +
                	error.code);
    	alert('Failed to get access to local media. Error code was ' +
          			error.code + '.');
  	}

$(function() {
    $("#start").click(function() {
      initiator = 1;
      initialize();
    })
    $("#client").click(function() {
      initiator = 0;
      initialize();
    })
})