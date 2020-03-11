/**
 * This module describes the SDP (Session Description Protocol) and how to get ICE working
 */
import React from "react";
import { Subject, of } from "rxjs";
import { flatMap, map, catchError } from "rxjs/operators";
import { WsMessage, WsCommand } from "../../state/message-types";
const logger = console;

export interface SDPMessage {
	type: "offer" | "video-answer",
	sdp: string
}

export const makeWsSDPMessage = (sender: string, receiver: string, sdp: RTCSessionDescription) => {
	const msg: WsMessage<WsCommand<RTCSessionDescription>> = {
		sender,
		recipients: [receiver],
		event_type: "CommandRequest",
		body: {
			cmd: {
				op: "SDPOffer",
				id: "",
				ack: true
			},
			args: sdp
		},
		time: Date.now()
	};
	return msg;
};

export interface ICECandidateMessage {
	type: "new-ice-candidate",
	candidate: string // sdp candidate string describing offered protocol
}

export const makeWsICECandMsg = (sender: string, reciever: string, cand: ICECandidateMessage) => {
	const msg: WsMessage<WsCommand<ICECandidateMessage>> = {
		sender,
		recipients: [reciever],
		time: Date.now(),
		body: {
			cmd: {
				op: "IceCandidate",
				id: "",
				ack: true
			},
			args: cand
		},
		event_type: "CommandRequest"
	};
	return msg;
};

const closeVideoCall = (peer: RTCPeerConnection | null) => {
	const localVideo = document.getElementById("local_video") as HTMLVideoElement;
  logger.log("Closing the call");

  // Close the RTCPeerConnection
  if (peer) {
    logger.log("--> Closing the peer connection");

    // Disconnect all our event listeners; we don't want stray events
    // to interfere with the hangup while it's ongoing.
    peer.ontrack = null;
    peer.onicecandidate = null;
    peer.oniceconnectionstatechange = null;
    peer.onsignalingstatechange = null;
    peer.onicegatheringstatechange = null;
    // peer.onnotificationneeded = null;

    // Stop all transceivers on the connection
    peer.getTransceivers().forEach(transceiver => {
      transceiver.stop();
    });

    // Stop the webcam preview as well by pausing the <video>
    // element, then stopping each of the getUserMedia() tracks
    // on it.
    if (localVideo && localVideo.srcObject) {
			localVideo.pause();
			const stream = localVideo.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }

    // Close the peer connection
    peer.close();
    peer = null;
  }
};

export interface RTCSetup {
	sockSubj: Subject<string>;  // used to send messages
	connectSubj: Subject<[string, string]>;  // Gets sender, receiver
	videoRef: React.RefObject<HTMLVideoElement>;
}

/**
 * This is the main function that sets up the RTCPeerConnection, which in turn sets up our ICE
 * establishment
 *
 * We're using a plain old function here rather than a Class.  We're encapsulating the functions
 * inside the main function and taking advantage of the power of higher order functions.
 *
 * When the app wants to make a RTC connection, it will submit an event to the connectSubj stream.
 * The function will subscribe to this stream and generate an SDP offer.  This offer will then be
 * sent out to the sockSubj.  The subscriber to the sockSubj will then take the message and forward
 * it to the recipient listed.
 */
export const createPeerConnection = (peer$: Subject<RTCPeerConnection>, args: RTCSetup) => {
	logger.log("Setting up a connection...");

	const handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
		if (event.candidate) {
			logger.log("*** Outgoing ICE candidate: " + event.candidate.candidate);

			args.connectSubj.subscribe({
				next: ([sender, receiver]) => {
					const mesg = makeWsICECandMsg(sender, receiver, {
						type: "new-ice-candidate",
						candidate: JSON.stringify(event.candidate)
					});

					args.sockSubj.next(JSON.stringify(mesg));
				},
				error: (err) => logger.error(err),
				complete: () => logger.log("User subject has completed")
			});
		} else {
			logger.warn("no candidate in event");
		}
	};

	/**
	 * Handle |iceconnectionstatechange| events. This will detect
	 * when the ICE connection is closed, failed, or disconnected.
	 *
	 * This is called when the state of the ICE agent changes.
	 */
	const handleICEConnectionStateChangeEvent = (event: Event) => {
		peer$.subscribe({
			next: (peer) => {
				logger.log("*** ICE connection state changed to " + peer.iceConnectionState);

				switch(peer.iceConnectionState) {
					case "closed":
					case "failed":
					case "disconnected":
						closeVideoCall(peer);
						break;
				}
			},
			error: (err) => logger.error("Error getting peer: ", err),
			complete: () => logger.log("Peer subject completed")
		});
	};

	const handleICEGatheringStateChangeEvent = (event: Event) => {
		peer$.subscribe({
			next: (peer) => {
				logger.log("*** ICE gathering state changed to: " + peer.iceGatheringState);
			}
		});
	};

	/**
	 * Set up a |signalingstatechange| event handler. This will detect when
	 * the signaling connection is closed
	 *
	 * NOTE: This will actually move to the new RTCPeerConnectionState enum
	 * returned in the property RTCPeerConnection.connectionState when
	 * browsers catch up with the latest version of the specification!
	 * @param event
	 */
	const handleSignalingStateChangeEvent = (event: Event) => {
		peer$.subscribe({
			next: (peer) => {
				logger.log("*** WebRTC signaling state changed to: " + peer.signalingState);
				switch(peer.signalingState) {
					case "closed":
						closeVideoCall(peer);
						break;
				}
			},
			error: (err) => logger.error(err),
			complete: () => logger.log("Subj completed")
		});
	};

	/**
	 * Called by the WebRTC layer to let us know when it's time to
	 * begin, resume, or restart ICE negotiation.
	 */
	const handleNegotiationNeededEvent = () => {
		logger.log("*** Negotiation needed");
    const handle$ = peer$.pipe(
			flatMap((peer) => {
				return peer.createOffer().then(offer => {
					return {
						peer,
						offer
					};
				});
			}),
			map((state) => {
				const {peer, offer} = state;
				if (peer.signalingState !== "stable") {
					logger.log("     -- The connection isn't stable yet; postponing...");
					return of(state);
				}

				// Establish the offer as the local peer's current
				// description.
				logger.log("---> Setting local description to the offer");
				return peer.setLocalDescription(offer).then(_ => {
					return state;
				});
			}),
			flatMap(state => state),
			map((state) => {
				const { peer } = state;
				// Send the offer to the remote peer.
				logger.log("---> Sending the offer to the remote peer");
				args.connectSubj.subscribe({
					next: ([s, r]) => {
						const msg = makeWsSDPMessage(s, r, new RTCSessionDescription({
							type: "offer",
							sdp: JSON.stringify(peer.localDescription)
						}));

						args.sockSubj.next(JSON.stringify(msg));
					},
					error: (err) => logger.error(err),
					complete: () => logger.log("User subject is completed")
				});
				return true;
			}),
			catchError((err) => {
				logger.error("Error occurred while handling the negotiationneeded event:", err);
				return of(false);
			})
		);

		handle$.subscribe({
			next: res => {
				logger.log("handle negotiation was successful? ", res);
			},
			error: err => logger.error(err),
			complete: () => logger.info("Handler has completed")
		});
	};

 /**
  * Called by the WebRTC layer when events occur on the media tracks
  * on our WebRTC call. This includes when streams are added to and
  * removed from the call.
  *
  * track events include the following fields
  *
  * RTCRtpReceiver       receiver
  * MediaStreamTrack     track
  * MediaStream[]        streams
  * RTCRtpTransceiver    transceiver
  *
  * In our case, we're just taking the first stream found and attaching
  * it to the <video> element for incoming media.
  */
	function handleTrackEvent(event: RTCTrackEvent) {
		logger.log("*** Track event");
		if (args.videoRef.current) {
			args.videoRef.current.srcObject = event.streams[0];
		}
	}

  peer$.subscribe({
		next: (peer) => {
			// Set up event handlers for the ICE negotiation process.
			peer.onicecandidate = handleICECandidateEvent;
			peer.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
			peer.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
			peer.onsignalingstatechange = handleSignalingStateChangeEvent;
			peer.onnegotiationneeded = handleNegotiationNeededEvent;
			peer.ontrack = handleTrackEvent;
		}
	});
};
