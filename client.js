$(document).ready( function() {


	

	var serverUri = "werbrtcspielewiese.posmich.c9.io/";
	// var serverUri = "localhost";
	// var serverPort = 8080;

	var self_view = $( "#self" )[0];
	var remote_view = $( "#remote" )[0];

	var signalingChannel = new WebSocket("ws://" + serverUri);
	var config = { iceServers: [{ url: "stun:stun.l.google.com:19302" }] }

	var peerConnCar = null;
	var peerConnClient = null;



	client = function() {
		peerConnClient = new webkitRTCPeerConnection( config );
    	console.log( peerConnClient );

    	peerConnClient.onicecandidate = function( event ) {
      		console.log( "new ice candidate: " );
      		console.log( event.candidate );

      		signalingChannel.send(JSON.stringify({
				"candidate": event.candidate
			}));
      	}

    	peerConnClient.onaddstream = function( event ) {
      		console.log( "stream added" );
      		console.log( event );

      		remote_view.autoplay = true;
      		remote_view.src = URL.createObjectURL( event.stream );
  		}

  		peerConnClient.on("open", function() {
  			peerConnClient.createAnswer( peerConnClient.remoteDescription, gotDescriptionClient );
  		})

		// .dc = peerConn.createDataChannel( "controller" );

	};

	car = function() {
		peerConnCar = new webkitRTCPeerConnection( config );
    	console.log( peerConnCar );

    	peerConnCar.onicecandidate = function( event ) {
      		console.log( "new ice candidate: " );
      		console.log( event.candidate );

      		signalingChannel.send(JSON.stringify({
				"candidate": event.candidate
			}));
      	}

    // 	peerConn.onaddstream = function( event ) {
    //   		console.log( "stream added" );
    //   		console.log( event );

    //   		remote_view.src = URL.createObjectURL( event.stream );
  		// }

  		navigator.webkitGetUserMedia( { "audio": false, "video": true }, function( stream ) {

  			peerConnCar.addStream(stream);
  			peerConnCar.createOffer(gotDescriptionCar);
		  	
		});

		// car.dc = peerConnCar.createDataChannel( "controller" );

	}

	gotDescriptionCar = function( desc ) {
	   	peerConnCar.setLocalDescription( desc );
	   	signalingChannel.send( JSON.stringify( {"sdp": desc} ) );
	};

	gotDescriptionClient = function( desc ) {
	   	peerConnClient.setLocalDescription( desc );
	   	signalingChannel.send( JSON.stringify( {"sdp": desc} ) );
	};

	signalingChannel.onmessage = function( event ) {
		console.log( event );

		var signal = JSON.parse( event.data );
		if( signal.sdp )
			peerConnClient.setRemoteDescription( new RTCSessionDescription( signal.sdp ) );
		else
			peerConnCar.addIceCandidate( new RTCIceCandidate( signal.candidate ) );
	};

	$("#car").click( function(){
		console.log("call clicked.");
		car()
	} );

	$("#client").click( function(){
		client();
	} );

} )