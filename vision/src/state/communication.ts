import {
  Observable,
  Subject,
  Subscription,
  of,
  BehaviorSubject
} from "rxjs";
import {
  map,
  flatMap,
  catchError,
  withLatestFrom,
  tap
} from "rxjs/operators";
// import { createStore, StoreEnhancer } from "redux";

import {
  WsMessage,
  makeChatMessage,
  CHAT_MESSAGE_ADD,
  WsCommand,
  MessageEvent as MsgEvent
} from "./message-types";
import {
  createLoginAction,
  chatMessageAction,
  webcamCamAction,
  remoteVideoAction
} from "./action-creators";
import { USER_CONNECTION_EVT } from "./types";
import { shuffle, take } from "../utils/utils";

// import { reducers } from "../state/store";
// type WindowWithDevTools = Window & {
//   __REDUX_DEVTOOLS_EXTENSION__: () => StoreEnhancer<unknown, {}>
//  };

// const isReduxDevtoolsExtenstionExist = (
//   arg: Window | WindowWithDevTools
// ): arg is WindowWithDevTools  => {
//   return  "__REDUX_DEVTOOLS_EXTENSION__" in arg;
// };

// const foo = isReduxDevtoolsExtenstionExist(window) ?
//   window.__REDUX_DEVTOOLS_EXTENSION__() : undefined;
// const store = createStore(reducers, foo);
// type StoreType = typeof store;

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

/** Type alias for a function that handles incoming WsMessages */
type Hdlr = (msg: WsMessage<any>) => void;

/** Type alias for the remote media streams */
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
 * @field user$: Holds username
 * @field targets$: usernames that user clicks to do video chat with
 * @field socket$: websocket object
 * @field send$: Helper to let other clients send to websocket
 * @field peer: FIXME make this a map of RTCPeerConnections
 * @field #commHandlers: Map of handlers for CommandRequest messages
 * @field streamLocal$: stream of local videocam streams
 * @field streamRemotes$: stream of remote videocam streams
 * @field cmdHandler: A map of string to handler functions to handle websocket messages
 * @field transceiver: transceiver to control send/rcv messages
 * @field videoOfferSubscription: Subscription to cancel Video Offer
 * @field webcamDispatch: dispatch function to set webcam state in redux
 * @field remoteVideoDispatch: typeof remoteVideoAction;
 * @field evtMediaStream$: stream of events for
 * @field evtNegotiation$: Subject<Event>;
 * @field evtVideoOffer$: Subject<string>;
 * @field evtIceCandidate$: Subject<RTCPeerConnectionIceEvent>
 */
export class WebComm {
  user$: Subject<string>;
  targets$: Subject<string>;
  socket$: Subject<WebSocket>;
  send$: Subject<string>;
  peer: RTCPeerConnection | null;
  #commHandlers: Map<string, Hdlr>;
  streamLocal$: BehaviorSubject<LocalMediaStream>;
  streamRemotes$: BehaviorSubject<RemoteMediaStreams>;
  cmdHandler: CommandHandler;
  transceiver: RTCRtpTransceiver | null;
  videoOfferSubscription: Subscription | null;
  webcamDispatch: typeof webcamCamAction;
  remoteVideoDispatch: typeof remoteVideoAction;
  evtMediaStream$: Subject<MediaStream>;
  evtNegotiation$: Subject<Event>;
  evtVideoOffer$: Subject<WsMessage<WsCommand<string>>>;
  evtIceCandidate$: Subject<RTCIceCandidate | null>
  iceEvtSub: Subscription;
  signout$: Subject<boolean>;
  ping$: Subject<WsMessage<any>>;
  currentUser: string;
  testSock: WebSocket;

  constructor(
    webcamDispath: typeof webcamCamAction,
    remoteVideoDispatch: typeof remoteVideoAction,
    //store: StoreType
  ) {
    this.user$ = new Subject();
    this.targets$ = new Subject();  // Stream of remote usernames
    this.socket$ = new Subject(); 
    this.peer = null;
    this.#commHandlers = new Map();
    this.streamLocal$ = new BehaviorSubject(new LocalMediaStream(null));
    this.transceiver = null;
    this.videoOfferSubscription = null;
    this.signout$ = new Subject();
    this.ping$ = new Subject();
    this.currentUser = "";
    this.testSock = new WebSocket("ws://localhost:13172")

    /** Helper for sending over the websocket */
    const { sock$, subscription: socksub } = this.makeSocketStream();
    this.send$ = sock$;

    /** Dispatches to hook into redux */
    this.webcamDispatch = webcamDispath;
    this.remoteVideoDispatch = remoteVideoDispatch;

    /** Streams that have events from various RTC state */
    this.evtMediaStream$ = new Subject();
    this.evtNegotiation$ = new Subject();
    this.evtVideoOffer$ = new Subject();
    this.evtIceCandidate$ = new Subject();
    this.iceEvtSub = this.configIceCandidateEventStream();

    const initRemoteStream: RemoteMediaStreams = new Map();
    this.streamRemotes$ = new BehaviorSubject(initRemoteStream);

    this.cmdHandler = new CommandHandler(this);
    this.setupCmdHandlers();

    this.initHandleTrackEvent();
    this.initWebsockOnUser();
    this.initSignoutStream();
    
  }

  initSignoutStream = () => {
    this.signout$.pipe(
      withLatestFrom(this.socket$)
    ).subscribe({
      next: ([res, socket]) => {
        if (!res) return
        socket.close();
        this.user$.next("");
      }
    });
  }

  /**
   * Once we get a new user pushed to user$, we need to create a websocket
   */
  initWebsockOnUser = () => {
    this.user$.subscribe({
      next: (user) => {
        logger.log("In user$, got user", user)
        if (user === "") {
          this.currentUser = user;
          return;
        }
        if (user !== this.currentUser) {
          logger.log("Setting user to ", user);
          this.currentUser = user;
          this.createSocket(user);
        } else {
          logger.warn("Same user, reusing existing socket");
        }
      }
    });
  }

  /**
   * When we get event from handleTrackEvent, it will push a MediaStream into evtMediaStream$.  We
   * combine this with our latest target value.  Then, we push the map of {target:stream} to
   * streamRemotes$.
   */
  initHandleTrackEvent = () => {
    this.evtMediaStream$.pipe(
      withLatestFrom(this.targets$)
    ).subscribe({
      next: ([stream, target]) => {  
        const localStream = this.streamLocal$.value.stream;
        if (localStream && localStream.id === stream.id) {
          logger.log("Event was for local stream, returning");
          return;
        }
        logger.info("Got track event for", target, stream);
        let obj: Map<string, MediaStream> = new Map();
        obj.set(target, stream);
        
        // Send event to dispatch so that the VideoStream component will update
        this.remoteVideoDispatch(obj, "REMOTE_EVENT");
      }
    });
  }

  createSocket = (user: string) => {
    const origin = window.location.host;
    // FIXME:  Add JWT token
    const url = `wss://${origin}/chat/${user}`;
    logger.log(`Connecting to ${url}`);
    this.socket$.next(new WebSocket(url));
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
    let sock$: Subject<string> = new Subject();
    let msgSock$ = sock$.pipe(
      withLatestFrom(this.socket$)
    )
    let subscription = msgSock$.subscribe(([msg, socket]) => socket.send(msg));
    return {sock$, subscription};
  }

  /**
   * Handles Websocket intialization when the user selects Menu -> Chat
   * 
   * This is where we sort out the messages received by the websocket.
   */
  socketSetup = (props: WSSetup) => {
    this.socket$.subscribe({
      next: (socket) => {
        socket.onmessage = (evt: MessageEvent) => {
          const msg: WsMessage<any> = JSON.parse(evt.data);
          const auth = props.auth;
      
          // Log the events separately, so we dont get a flood of messages from Ping/Pong events
          switch (msg.event_type) {
          case "Disconnect":
          case "Connect":
            logger.log(`Got ${msg.event_type} websocket event`, msg);
            const {connected_users} = msg.body as ConnectionEvent;
            logger.log("Connected users: ", connected_users);
            props.loginAction(connected_users, "", auth, USER_CONNECTION_EVT);
            logger.log(`loginAction is`, props.loginAction);
            break;
          case "Data":
            logger.log(`Got ${msg.event_type} websocket event`, msg);
            break;
          case "Message":
            logger.log(`Got ${msg.event_type} websocket event`, msg);
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
      }, 
      error: (err) => logger.error(err),
      complete: () => logger.info("this.socket$ got complete event")
    })
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
   * Later, we can dynamically add handlers.  This is why we do it this way instead of as a switch
   * statement.
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

    // pick 2 at random since you get a warning in the DOM if you use more than 2
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

  configIceCandidateEventStream = () => {
    let userAndTarget$ = this.targets$.pipe(
      withLatestFrom(this.user$)
    );

    const iceHandler$ = this.evtIceCandidate$.pipe(
      withLatestFrom(userAndTarget$),
      map(([candidate, [receiver, user]]) => {
        if (receiver === "") {
          logger.debug("Dummy value for target");
          return null;
        }
        if (candidate === null) {
          logger.debug("No candidate in event");
          return null;
        }
        const mesg = makeWsICECandMsg(user, receiver, {
          type: "new-ice-candidate",
          candidate: JSON.stringify(candidate)
        });
        return mesg
      })
    )

    return iceHandler$.subscribe({
      next: (msg) => {
        if (msg === null) {
          logger.debug("Unable to create new-ice-candidate message");
          return;
        }
        this.send$.next(JSON.stringify(msg));
      },
      error: err => logger.error(err),
      complete: () => logger.log("User subject has completed")
    });
  }

  handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      logger.debug("*** Outgoing ICE candidate: " + event.candidate.candidate);
      this.evtIceCandidate$.next(event.candidate)
    } else {
      logger.warn("no candidate in event", event);
    }
  };

  negotiationTargetSetup = (peer: RTCPeerConnection) => {
    const { send$ } = this;

    const userAndTarget$ = this.targets$.pipe(
      withLatestFrom(this.user$)
    )

    const handle$ = this.evtNegotiation$.pipe(
      withLatestFrom(userAndTarget$),
      flatMap(([_, [sender, user]]) => {
        logger.log("Creating offer for: ", sender);
        return peer.createOffer().then((offer) => {
          return { sender, user, offer };
        });
      }),
      map((state) => {
        const { offer } = state;
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
        const { sender, user } = state;
        // Send the offer to the remote peer.  This will be received by the remote websocket
        logger.log(`---> Sending the offer to the remote peer ${sender}`);
        logger.debug("---> peer.localDescription", peer.localDescription);
        let sdp = new RTCSessionDescription({
          type: "offer",
          sdp: JSON.stringify(peer.localDescription)
        });
        logger.debug("---> sdp is ", sdp);
        const msg = makeWsSDPMessage(user, sender, sdp);
        send$.next(JSON.stringify(msg));
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
    const {peer} = this;
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
    logger.log("Handling track event.  Sending MediaStream to remote", event.type);
    event.streams.forEach(stream => {
      this.evtMediaStream$.next(stream);
    });
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

/**
 * Creates Websocket messages to be sent to remote user
 * 
 * @param sender 
 * @param receiver 
 * @param sdp 
 * @param kind 
 */
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
  logger.debug("Created SDPOffer message", msg);
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

/**
 * Handler for websocket messages
 */
class CommandHandler {
  webcomm: WebComm;
  streamLocalConfigured: boolean;

  constructor(wc: WebComm) {
    this.webcomm = wc;
    this.streamLocalConfigured = false;
    this.setupPingSubscription();
  }

  /**
   * Sets up the stream that receives CommandRequest of Ping type
   * 
   * We do all the setup of what the stream does here to avoid cluttering the constructor
   */
  private setupPingSubscription = () => {
    this.webcomm.ping$.pipe(
      withLatestFrom(this.webcomm.user$)
    ).subscribe({
      next: ([msg, user]) => {
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
              id: user
            },
            args
          })
        };
        this.webcomm.send$.next(JSON.stringify(replyMsg));
        logger.debug("Sent reply: ", replyMsg);
      }
    });
  }

  /**
   * Handles a Ping type of WsCommand, used as a keep alive mechanism
   *
   * @param socket
   */
  initPingRequestHandler = async (msg: WsMessage<any>) => {
    this.webcomm.ping$.next(msg);
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
    const sdp$: Observable<{
      msg: WsMessage<WsCommand<string>>,
      success: boolean
    }> = this.webcomm.evtVideoOffer$.pipe(
      withLatestFrom(this.webcomm.streamLocal$),
      // At this point, we should have a valid MediaStream.  Create 
      flatMap(([msg, { stream }]) => {
        let args = JSON.parse(msg.body.args);
        let sdp = JSON.parse(args.sdp);
    
        logger.debug("Args in message from SDPOffer", args);
        const desc = new RTCSessionDescription(sdp);
    
        if (peer.signalingState !== "stable") {
          // Set the local and remove descriptions for rollback; don't proceed until returned
          logger.log("  - But the signaling state isn't stable, so triggering rollback");
          return Promise.all([
            peer.setLocalDescription({type: "rollback"}),
            peer.setRemoteDescription(desc)
          ]).then(_ => {
            return { stream, msg }
          });
        } else {
          logger.log("  - Setting remote description");
          return peer.setRemoteDescription(desc).then(() => {
            return { stream , msg }
          });
        }
      }),
      tap(({ stream, msg }) => {
        logger.log("streamLocalConfig: message is", msg, "stream is ", stream);
      }),
      // Check if our current MediaStream is null.  If it is, create one, and restart
      flatMap(({ stream, msg }) => {
        if (stream === null) {
          logger.log("Creating local media stream");
          return navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then(stream => {
              return { preset: false, stream, msg }
            });
        } else {
          return of({ preset: true, stream, msg });
        }
      }),
      map((res) => {
        if (!res.preset) {
          // Add this to our strealLocal so that <VideoStream /> can pick it up
          this.webcomm.streamLocal$.next(new LocalMediaStream(res.stream));
          this.webcomm.webcamDispatch({ active: true }, "WEBCAM_ENABLE");
          logger.debug("Resetting media stream");
        }
        return res
      }),
      map(({ stream, msg }) => {
        try {
          logger.log("Adding track for transceiver");
          stream.getTracks().forEach((track) => {
            this.webcomm.transceiver = finalPeer.addTransceiver(track, {streams: [ stream ] });
          });
        } catch (err) {
          this.webcomm.handleGetUserMediaError(err);
          return {
            msg,
            success: false
          };
        }
        return {
          msg,
          success: true
        };
      }),
      flatMap((res) => {
        const { msg, success} = res;
        if (!success) {
          logger.log("Unable to add tracks to transceiver");
          return of({ msg, description: null});
        }
        log("---> Creating and sending answer to caller");
        return finalPeer.createAnswer().then(description => {
          return { msg, description }
        });   
      }),
      flatMap(({ msg, description}) => {
        if (description === null) {
          return of({ msg, success: false});
        }
        return finalPeer.setLocalDescription(description).then(() => {
          return { msg, success: true}
        });
      })
    );

    const userAndSdp$ = sdp$.pipe(
      withLatestFrom(this.webcomm.user$)
    )

    this.webcomm.videoOfferSubscription = userAndSdp$.subscribe({
      next: ([{msg, success}, user]) => {
        if (!success) {
          logger.error("Unable to make SDP Message");
          return;
        }
        if ( msg.sender === "") {
          logger.error("No targets added yet.  Waiting for real target");
          return;
        }
        if (!finalPeer.localDescription) {
          logger.error("RTCPeerConnection does not have a local description yet");
          return;
        }
        logger.debug("Sending SDPAnswer with peer description: ", finalPeer.localDescription)
        
        // Create the SDPMessage with the SDPAnswer
        const mesg = makeWsSDPMessage(
          user,
          msg.sender,
          finalPeer.localDescription,
          "SDPAnswer");
        this.webcomm.send$.next(JSON.stringify(mesg));
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
  handleVideoOfferMsg = async (msg: WsMessage<WsCommand<string>>) => {
    let {peer} = this.webcomm;
    if (!peer) {
      logger.info("No RTCPeerConnection yet...creating");
      peer = this.webcomm.createPeerConnection();
    }
    if (!this.streamLocalConfigured) {
      logger.debug("Calling streamLocalConfig()");
      this.streamLocalConfig(peer)
    }

    // This is all some ugliness to make the compiler happy
    if (peer === null) {
      throw new Error("Unable to create RTCPeerConnection");
    }
    this.webcomm.peer = peer;

    logger.log("Received video chat offer from ", msg.sender);
    // Trigger our stream handler by pushing in the sender to the evtVideoOffer$ stream
    this.webcomm.evtVideoOffer$.next(msg); 
    // Update the latest target which is the message sender
    this.webcomm.targets$.next(msg.sender);
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
    logger.debug("SDP Answer is: ", sdp);
  
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
    candidate = new RTCIceCandidate(candidate);
  
    logger.debug("*** Adding received ICE candidate: ", candidate);
    try {
      await this.webcomm.peer.addIceCandidate(candidate)
    } catch(err) {
      logger.warn(err);
    }
  }

  handleEditorMsg = (msg: WsMessage<WsCommand<string>>) => {

  }
}

/**
 this.evtTrack$.pipe(
      withLatestFrom(this.targets$)
    ).subscribe({
      next: ([event, target]) => {
        const { track } = event;

        const fn = (s: MediaStream, kind: string) => {
          logger.log(`Got track event for ${kind} MediaStream`, s.id);
            log("Checking stream", s.id);
            if(s.getTracks().filter(t => t.id === track.id).length) {
              logger.log("Track already exists on ", s.id);
              return false;
            }
            if (this.peer) {
              logger.log("Adding track to peer", track);
              this.peer.addTrack(track);
              return true
            } else {
              logger.error("No RTCPeerConnection to add Track to");
              return false
            }
        }

        event.streams.forEach(stream => {
          const localStream = this.streamLocal$.value.stream;
          if (localStream && localStream.id === stream.id) {
            // FIXME: Do we need to update the VideoStream component if fn returns true?
            fn(stream, "local");
          } else {
            // Check the new track, and if we added it, send a new REMOTE_EVENT to update component
            if (fn(stream, "remote")) {
              let obj: Map<string, MediaStream> = new Map();
              obj.set(target, stream);
              // Send event to dispatch so that the VideoStream component will update
              this.remoteVideoDispatch(obj, "REMOTE_EVENT");
            }
          }
        })
      }
    });
 */