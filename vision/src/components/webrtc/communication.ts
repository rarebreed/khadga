import {
  Subject,
  Subscription,
  of,
  BehaviorSubject,
} from "rxjs";
import {
  map,
  flatMap,
  catchError,
  combineLatest,
  retry,
  tap
} from "rxjs/operators";

import {
  WsMessage,
  makeChatMessage,
  CHAT_MESSAGE_ADD,
  WsCommand,
  MessageEvent as MsgEvent
} from "../../state/message-types";
import {
  createLoginAction,
  chatMessageAction,
  webcamCamAction,
  remoteVideoAction
} from "../../state/action-creators";
import { USER_CONNECTION_EVT } from "../../state/types";
import { shuffle, take } from "../../utils/utils";

const logger = console;
const log = logger.log;

export interface WSSetup {
  auth: any,
  loginAction: typeof createLoginAction,
  chatAction: typeof chatMessageAction,
}

export interface ConnectionEvent {
  connected_users: string[]
}

type Hdlr = (msg: WsMessage<any>) => void;

interface SockSubj {
  sock$: Subject<string>;
  subscription: Subscription
}

/**
 * Type alias for the remote media streams
 */
type RemoteMediaStreams = Map<string, MediaStream | null>

export class LocalMediaStream {
  stream: MediaStream | null;

  constructor(stream: MediaStream | null) {
    this.stream = stream;
  }
}

/**
 * This class holds all the data and functionality for communication between clients
 * 
 * This includes both the websocket for chatting, and a Ref for the webcam elements
 */
export class WebComm {
  user: string;                       // Holds username
  targets$: Subject<string>;  // Usernames that user clicks to do video chat with
  socket: WebSocket;                  // websocket object
  send$: Subject<string>;             // Helper to let other clients send to websocket
  peer: RTCPeerConnection | null;     // FIXME: make this a map of RTCPeers for multiple connections    
  #commHandlers: Map<string, Hdlr>;   // Map of handlers for CommandRequest messages
  streamLocal$: BehaviorSubject<LocalMediaStream>; // Subject of local videocam streams
  streamRemotes$: BehaviorSubject<RemoteMediaStreams>; // Subject for remote vid streams
  cmdHandler: CommandHandler;         // A map of string to handler functions
  transceiver: RTCRtpTransceiver | null; // transceiver to control send/rcv messages
  videoOfferSubscription: Subscription | null; // Subscription to cancel Video Offer
  webcamDispatch: typeof webcamCamAction;
  remoteVideoDispatch: typeof remoteVideoAction;
  evtMediaStream$: Subject<MediaStream>;
  evtNegotiation$: Subject<Event>;

  constructor(
    user: string,
    webcamDispath: typeof webcamCamAction,
    remoteVideoDispatch: typeof remoteVideoAction,
  ) {
    this.user = user;
    this.targets$ = new Subject();
    this.socket = this.createSocket();
    this.send$ = new Subject();
    this.peer = null;
    this.#commHandlers = new Map();
    this.streamLocal$ = new BehaviorSubject(new LocalMediaStream(null));
    this.transceiver = null;
    this.videoOfferSubscription = null;
    this.webcamDispatch = webcamDispath;
    this.remoteVideoDispatch = remoteVideoDispatch;
    this.evtMediaStream$ = new Subject();
    this.evtNegotiation$ = new Subject();


    const initRemoteStream: RemoteMediaStreams = new Map();
    this.streamRemotes$ = new BehaviorSubject(initRemoteStream);

    this.cmdHandler = new CommandHandler(this);
    this.setupCmdHandlers();

    // When we get event from handleTrackEvent, it will push a MediaStream into evtMediaStream$.  We
    // combine this with our latest target value.  Then, we push the map of {target:stream} to
    // streamRemotes$.
    this.evtMediaStream$.pipe(
      combineLatest(this.targets$)
    ).subscribe({
      next: ([stream, target]) => {
        logger.info("Got track event: ", target, stream);
        let obj: Map<string, MediaStream> = new Map();
        obj.set(target, stream);
        // this.streamRemotes$.next(obj);
        this.remoteVideoDispatch(obj, "REMOTE_EVENT");
      }
    });

    this.targets$.subscribe(targ => logger.info("Target was added", targ));
  }

  createSocket = () => {
    const origin = window.location.host;
    // FIXME:  Add JWT token
    const url = `wss://${origin}/chat/${this.user}`;
    logger.log(`Connecting to ${url}`);
    return new WebSocket(url);
  }

  /**
   * Creates a Subject that takes strings that are pre-subscribed to be sent by socket
   * 
   * Instead of handing out references to the socket, we hand this out instead and user can do this:
   * 
   * ```typescript
   * let { sock$, subscription } = webcomm.makeSocketStream();
   * sock$.next("hello world");
   * subscription.unsubscribe();
   * ```
   */
  makeSocketStream = () => {
    const socket = this.socket;
    if (!socket) {
      return null;
    }

    let sock$: Subject<string> = new Subject();
    let subscription = sock$.subscribe(msg => socket.send(msg));
    return {sock$, subscription};
  }

  /**
   * Handles Websocket intialization when the user selects Menu -> Chat
   */
  socketSetup = (props: WSSetup) => {
    this.socket.onmessage = (evt: MessageEvent) => {
      const msg: WsMessage<any> = JSON.parse(evt.data);
      const auth = props.auth;
  
      logger.debug("Got message: ", msg);
  
      switch (msg.event_type) {
      case "Disconnect":
      case "Connect":
        logger.log("Got websocket event", msg);
        const {connected_users} = msg.body as ConnectionEvent;
        props.loginAction(connected_users, "", auth, USER_CONNECTION_EVT);
        break;
      case "Data":
        logger.log("Got websocket event", msg);
        break;
      case "Message":
        logger.log("Got websocket event", msg);
        props.chatAction(makeChatMessage(msg), CHAT_MESSAGE_ADD);
        break;
      case "CommandRequest":
        // Pass it to the commandHandler
        this.commandHandler(msg).catch(logger.error);
        break;
      default:
        logger.log("Unknown message type", msg.event_type);
      }
    };
  }

  /**
   * Dynamically adds handlers for commands
   */
  addCmdHdlr = (action: string, handler: Hdlr) => {
    this.#commHandlers.set(action, handler);
  }

  commandHandler = async (msg: WsMessage<any>) => {
    const cmd = msg.body as WsCommand<any>;
    logger.debug("command is =", cmd);

    const hdlr = this.#commHandlers.get(cmd.cmd.op);
    if (!hdlr) {
      logger.warn(`No handler for ${cmd.cmd.op}.  No action taken`);
      return;
    }
    hdlr(msg);
  }

  /**
   * Sets up our initial commandHandlers
   * 
   * Later, we can dynamically add handlers
   */
  setupCmdHandlers = () => {
    this.addCmdHdlr("Ping", this.cmdHandler.initPingRequestHandler);
    this.addCmdHdlr("SDPOffer", this.cmdHandler.handleVideoOfferMsg);
    this.addCmdHdlr("SDPAnswer", this.cmdHandler.handleVideoAnswerMsg);
    this.addCmdHdlr("IceCandidate", this.cmdHandler.handleNewICECandidateMsg);
  }

  /**
   * This is the main function that sets up the RTCPeerConnection, which in turn sets up our ICE
   * establishment
   */
  createPeerConnection = () => {
    let urls = [
      "stun:stun.l.google.com:19305",
      "stun:stun1.l.google.com:19305",
      "stun:stun2.l.google.com:19305",
      "stun:stun3.l.google.com:19305",
      "stun:stun4.l.google.com:19305",
    ];

    // pick 2 at random
    shuffle(urls);
    urls = take(urls)(2)

    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls
        }
      ]
    });

    if (!peer) {
      throw new Error("Unable to create RTCPeerConnection");
    }

    peer.onicecandidate = this.handleICECandidateEvent;
    peer.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    peer.onicegatheringstatechange = this.handleICEGatheringStateChangeEvent;
    peer.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    peer.onnegotiationneeded = this.handleNegotiationNeededEvent;
    peer.ontrack = this.handleTrackEvent;

    this.negotiationTargetSetup(peer);
    return peer;
  }

  handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      logger.debug("*** Outgoing ICE candidate: " + event.candidate.candidate);

      this.targets$.subscribe({
        next: (receiver) => {
          if (receiver === "") {
            logger.debug("Dummy value for target");
            return;
          }
          const mesg = makeWsICECandMsg(this.user, receiver, {
            type: "new-ice-candidate",
            candidate: JSON.stringify(event.candidate)
          });

          this.socket.send(JSON.stringify(mesg));
        },
        error: err => logger.error(err),
        complete: () => logger.log("User subject has completed")
      });
    } else {
      logger.warn("no candidate in event");
    }
  };

  negotiationTargetSetup = (peer: RTCPeerConnection) => {
    const { socket } = this;

    const handle$ = this.evtNegotiation$.pipe(
      combineLatest(this.targets$),
      flatMap(([_, receiver]) => {
        logger.log("Creating offer for: ", receiver);
        return peer.createOffer().then((offer) => {
          return {
            receiver,
            offer
          };
        });
      }),
      map((state) => {
        const {offer, receiver} = state;
        if (peer.signalingState !== "stable") {
          logger.log("     -- The connection isn't stable yet; postponing...");
          return of(state);
        }

        // Establish the offer as the local peer's current description.
        logger.log("---> Setting local description to the offer");
        return peer.setLocalDescription(offer).then((_) => {
          return state;
        });
      }),
      flatMap(state => state),
      map((state) => {
        const {offer, receiver} = state;
        // Send the offer to the remote peer.  This will be received by the websocket handler
        logger.log("---> Sending the offer to the remote peer");
        let sdp = new RTCSessionDescription({
          type: "offer",
          sdp: JSON.stringify(peer.localDescription)
        });
        logger.log("---> sdp is ", sdp);
        const msg = makeWsSDPMessage(this.user, receiver, sdp);
        socket.send(JSON.stringify(msg));
        return true;
      }),
      catchError((err) => {
        logger.error("Error occurred while handling the negotiationneeded event:", err);
        return of(false);
      })
    );

    handle$.subscribe({
      next: res => logger.info(`Negotiation success was ${res}`)
    });
  }

  handleNegotiationNeededEvent = (evt: Event) => {
    const {peer, socket} = this;
    if (!peer) {
      logger.error("RTCPeerConnection not setup yet");
      return;
    }
    logger.log("*** Negotiation needed");
    this.evtNegotiation$.next(evt);
  }

  handleICEConnectionStateChangeEvent = (event: Event) => {
    const {peer} = this;
    if (!peer) {
      logger.error("RTCPeerConnection not created yet");
      return;
    }
    logger.log("*** ICE connection state changed to " + peer.iceConnectionState);

    switch (peer.iceConnectionState) {
    case "closed":
    case "failed":
    case "disconnected":
      this.closeVideoCall();
      break;
    }
  }


  /** 
   * Handle the |icegatheringstatechange| event. This lets us know what the ICE engine is currently 
   * working on: "new" means no networking has happened  yet, "gathering" means the ICE engine is 
   * currently gathering candidates, and "complete" means gathering is complete. Note that the 
   * engine can alternate between "gathering" and "complete" repeatedly as needs and
   * circumstances change.
   * 
   * We don't need to do anything when this happens, but we log it to the console so you can see 
   * what's going on when playing with the sample.
   */
  handleICEGatheringStateChangeEvent = (event: Event) => {
    if (!this.peer) {
      logger.error("No RTCPeerConnection yet");
      return;
    }
    logger.log("*** ICE gathering state changed to: " + this.peer.iceGatheringState);
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
  handleSignalingStateChangeEvent = (event: Event) => {
    if (!this.peer) {
      logger.error("No RTCPeerConnection yet");
      return;
    }

    logger.log("*** WebRTC signaling state changed to: " + this.peer.signalingState);
    switch (this.peer.signalingState) {
    case "closed":
      this.closeVideoCall();
      break;
    }
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
  handleTrackEvent = (event: RTCTrackEvent) => {
    // Here, we add the stream to the remote-video html element.  We need to tell the chat container
    // to add the remote-video element and display it and add the stream
    logger.log("Handling track event.  Sending stream to remote");
    this.evtMediaStream$.next(event.streams[0]);
  }

  /**
   * Closes the RTCPeerConnection
   */
  closeVideoCall = () => {
    const localVideo = document.getElementById("local_video") as HTMLVideoElement;
    logger.log("Closing the call");
  
    // Close the RTCPeerConnection
    if (!this.peer) {
      logger.error("RTCPeerConnection was null");
      return;
    }
    logger.log("--> Closing the peer connection");
  
    // Disconnect all our event listeners; we don't want stray events
    // to interfere with the hangup while it's ongoing.
    this.peer.ontrack = null;
    this.peer.onicecandidate = null;
    this.peer.oniceconnectionstatechange = null;
    this.peer.onsignalingstatechange = null;
    this.peer.onicegatheringstatechange = null;
    this.peer.onnegotiationneeded = null;
  
    // Stop all transceivers on the connection
    this.peer.getTransceivers().forEach((transceiver) => {
      transceiver.stop();
    });
  
    // Stop the webcam preview as well by pausing the <video>
    // element, then stopping each of the getUserMedia() tracks
    // on it.
    if (localVideo && localVideo.srcObject) {
      localVideo.pause();
      const stream = localVideo.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  
    // Close the peer connection
    this.peer.close();
    this.peer = null;
    this.webcamDispatch({ active: false }, "WEBCAM_DISABLE");
  };

  handleGetUserMediaError = (e: Error) => {
    logger.error(e);
    switch (e.name) {
    case "NotFoundError":
      alert("Unable to open your call because no camera and/or microphone" +
          "were found.");
      break;
    case "SecurityError":
    case "PermissionDeniedError":
      // Do nothing; this is the same as the user canceling the call.
      break;
    default:
      alert("Error opening your camera and/or microphone: " + e.message);
      break;
    }
  
    // Make sure we shut down our end of the RTCPeerConnection so we're
    // ready to try again.
    this.closeVideoCall();
  }
}

export interface ICECandidateMessage {
  type: "new-ice-candidate",
  candidate: string // sdp candidate string describing offered protocol
}

export const makeWsICECandMsg = (sender: string, reciever: string, cand: ICECandidateMessage) => {
  const msg: WsMessage<string> = {
    sender,
    recipients: [ reciever ],
    time: Date.now(),
    body: JSON.stringify({
      cmd: {
        op: "IceCandidate",
        id: "",
        ack: true
      },
      args: JSON.stringify(cand)
    }),
    event_type: "CommandRequest"
  };
  return msg;
};

export const makeWsSDPMessage = (
  sender: string,
  receiver: string,
  sdp: RTCSessionDescription,
  kind: "SDPOffer" | "SDPAnswer" = "SDPOffer"
) => {
  let wscmd: WsCommand<RTCSessionDescription>;

  const msg: WsMessage<string> = {
    sender,
    recipients: [ receiver ],
    event_type: "CommandRequest",
    body: JSON.stringify({
      cmd: {
        op: kind,
        id: "",
        ack: kind === "SDPOffer" ? true : false
      },
      args: JSON.stringify(sdp)
    }),
    time: Date.now()
  };
  return msg;
};

export const makeGenericMsg = <T>(
  sender: string,
  receiver: string,
  event_type: MsgEvent,
  args: T,
  op: string,
  ack: boolean
) => {
  const msg: WsMessage<string> = {
    sender,
    recipients: [ receiver ],
    event_type,
    body: JSON.stringify({
      cmd: {
        op,
        id: "",
        ack,
      },
      args
    }),
    time: Date.now()
  };
  return msg;
}

class CommandHandler {
  webcomm: WebComm;
  streamLocalConfigured: boolean;

  constructor(wc: WebComm) {
    this.webcomm = wc;
    this.streamLocalConfigured = false;
  }

  /**
   * Handles a Ping type of WsCommand, used as a keep alive mechanism
   *
   * @param socket
   */
  initPingRequestHandler = async (msg: WsMessage<any>) => {
    const cmd = msg.body as WsCommand<any>;
    const args = cmd.args as string[];
    const replyMsg: WsMessage<string> = {
      sender: msg.sender,
      recipients: msg.recipients,
      event_type: "CommandReply",
      time: Date.now(),
      body: JSON.stringify({
        cmd: {
          op: "pong",
          ack: false,
          id: this.webcomm.user
        },
        args
      })
    };
    this.webcomm.socket.send(JSON.stringify(replyMsg));
    logger.debug("Sent reply: ", replyMsg);
  }

  /**
   * Configures the wecomm.streamLocal$ stream for handing incoming SDPOffer messages
   */
  private streamLocalConfig = (peer: RTCPeerConnection | null) => {
    // This is all some ugliness to make the compiler happy
    if (peer === null) {
      throw new Error("Unable to create RTCPeerConnection");
    }
    this.streamLocalConfigured = true;
    const finalPeer = peer;

    // The WebComm dynamically gets MediaStream's as they are created and destroyed.  So we have to
    // subscribe to the stream of them.
    const sdp$ = this.webcomm.streamLocal$.pipe(
      tap(lstream => logger.info("lstream is", lstream)),
      flatMap((lstream) => {
        if (lstream.stream === null) {
          logger.log("Creating media stream");
          return navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
          }).then(stream => {
            return {
              preset: false,
              stream
            }
          });
        } else {
          return of({ preset: true, stream: lstream.stream });
        }
      }),
      map((res) => {
        if (!res.preset) {
          this.webcomm.streamLocal$.next(new LocalMediaStream(res.stream));
          this.webcomm.webcamDispatch({ active: true }, "WEBCAM_ENABLE");
          logger.log("Resetting media stream");
          throw res.stream;
        }
        return res.stream
      }),
      retry(1),
      map((stream) => {
        try {
          logger.log("Adding track for transceiver");
          stream.getTracks().forEach((track) => {
            this.webcomm.transceiver = finalPeer.addTransceiver(track, {streams: [ stream ] });
          });
        } catch (err) {
          this.webcomm.handleGetUserMediaError(err);
          return false;
        }
        return true;
      }),
      flatMap((success) => {
        if (!success) {
          return of(null);
        }
        log("---> Creating and sending answer to caller");
        return finalPeer.createAnswer();   
      }),
      flatMap((desc) => {
        if (desc === null) {
          return of(null);
        }
        const prom = finalPeer.setLocalDescription(desc);
        return prom;
      }),
      combineLatest(this.webcomm.targets$)
    );

    this.webcomm.videoOfferSubscription = sdp$.subscribe({
      next: ([ _, target ]) => {
        if (target === "") {
          logger.error("No targets added yet.  Waiting for real target");
          return;
        }
        if (!finalPeer.localDescription) {
          logger.error("RTCPeerConnection does not have a local description yet");
          return;
        }
        logger.log("Local peer description: ", finalPeer.localDescription)
        // Create the SDPMessage with the SDPAnswer
        const msg = makeWsSDPMessage(
          this.webcomm.user,
          target,
          finalPeer.localDescription,
          "SDPAnswer");
        this.webcomm.socket.send(JSON.stringify(msg));
      },
      error: logger.error,
      complete: () => logger.info("videoRefLocal$ is complete")
    });
  }

  /**
   * This is a handler for a WsCommand of SDPOffer
   * 
   * We will get this when the remote client sends us an SDPOffer message over the websocket.  Upon
   * receipt we will do several things:
   * 
   * - Create a RTCPeerConnection if one does not already exist
   * - Add the sender of the message to our target$ stream
   * - Create a RTCSessionDescription and set it to our peer
   */
  handleVideoOfferMsg = async (msg: WsMessage<any>) => {
    let {peer} = this.webcomm;
    if (!peer) {
      logger.info("No RTCPeerConnection yet");
      peer = this.webcomm.createPeerConnection();
    }
    if (!this.streamLocalConfigured) {
      logger.log("Calling streamLocalConfig()");
      this.streamLocalConfig(peer)
    }

    // This is all some ugliness to make the compiler happy
    if (peer === null) {
      throw new Error("Unable to create RTCPeerConnection");
    }
    this.webcomm.peer = peer;

    logger.log("Received video chat offer from ", msg.sender);
    this.webcomm.targets$.next(msg.sender);  // Add this user to our target stream
    let args = JSON.parse(msg.body.args);
    let sdp = JSON.parse(args.sdp);

    const desc = new RTCSessionDescription({
      type: sdp.type,
      sdp: sdp.sdp
    });

    if (peer.signalingState !== "stable") {
      // Set the local and remove descriptions for rollback; don't proceed until returned
      logger.log("  - But the signaling state isn't stable, so triggering rollback");
      await Promise.all([
        peer.setLocalDescription({type: "rollback"}),
        peer.setRemoteDescription(desc)
      ]);
      return false;
    } else {
      logger.log("  - Setting remote description");
      await peer.setRemoteDescription(desc);
    }
    
    return true;
  }

  /**
   * Handler for when the callee has returned back an SDPAnswer message
   */
  handleVideoAnswerMsg = async (msg: WsMessage<WsCommand<string>>) => {
    if (!this.webcomm.peer) {
      logger.error("No RTCPeerConnection yet");
      return;
    }
    log("*** Call recipient has accepted our call");
  
    // Configure the remote description, which is the SDP payload in our "video-answer" message.
    const sdp: RTCSessionDescription = JSON.parse(msg.body.args) as RTCSessionDescription;
    logger.log("SDP Answer is: ", sdp);
  
    var desc = new RTCSessionDescription(sdp);
    await this.webcomm.peer.setRemoteDescription(desc).catch(logger.error);
  }

  handleNewICECandidateMsg = async (msg: WsMessage<WsCommand<string>>) => {
    if (!this.webcomm.peer) {
      logger.error("No RTCPeerConnection yet");
      return;
    }

    let candidate = JSON.parse(msg.body.args);
    candidate = JSON.parse(candidate.candidate);
    // logger.log("candidate", candidate);
    candidate = new RTCIceCandidate(candidate);
  
    logger.debug("*** Adding received ICE candidate: " + JSON.stringify(candidate));
    try {
      await this.webcomm.peer.addIceCandidate(candidate)
    } catch(err) {
      logger.error(err);
    }
  }
}