/**
 * This is a container for our local video stream
 *
 * It will be dynamically added into the DOM and will be moveable
 */

import React from "react";
import {connect, ConnectedProps} from "react-redux";

import * as noesis from "@khadga/noesis";
import {State} from "../../state/store";
import {webcamCamAction, videoRefAction,} from "../../state/action-creators";
import {WEBCAM_DISABLE} from "../../state/types";
import dragElement, {resizeElement} from "../../utils/utils";
import { LocalMediaStream } from "../../components/webrtc/communication";

const logger = console;

const mapStateToProps = (state: State) => {
  return {
    webcamActive: state.webcam.active,
    webcamId: state.webcam.videoId,
    webcamTarget: state.webcam.target,
    webcomm: state.webcomm.webcomm
  };
};

const mapPropsToDispatch = {
  setWebcam: webcamCamAction,
  setVideo: videoRefAction
};

interface LocalProps {
  kind: "local" | "remote",
  target: string,
  stream?: MediaStream
}

const connector = connect(mapStateToProps, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector> & LocalProps;

/**
 * This component is for the local and remote webcam streams
 */
class VideoStream extends React.Component<PropsFromRedux> {
  myRef: React.RefObject<HTMLDivElement>;
  resizeRef: React.RefObject<HTMLImageElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  ready: boolean;
  stream: MediaStream | null;

  constructor(props: PropsFromRedux) {
    super(props);
    this.myRef = React.createRef();
    this.resizeRef = React.createRef();
    this.videoRef = React.createRef();
    this.ready = false;
    this.stream = props.stream ? props.stream : null;
  }

  /**
   * Once the component has mounted, we need to get the MediaDevice and attach to our <video>
   * element
   */
  async componentDidMount() {
    const uniqueHeaderId = `localVideoHeader-${this.props.webcamTarget}`;
    const webcamId = `webcam-${this.props.webcamTarget}`;

    if (this.myRef.current) {
      dragElement(this.myRef.current, uniqueHeaderId);
    } else {
      logger.error("No drag div element yet");
    }

    if (this.resizeRef.current) {
      resizeElement(this.resizeRef.current, webcamId);
    } else {
      logger.error("No resize element yet");
    }

    if (this.videoRef !== null) {
      logger.log("Loading video object");

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: {
          width: {ideal: 1280},
          height: {ideal: 720}
        }
      };

      // For local video, this.stream should be null, and we will create the cam ourself
      // For remote video, the stream will have been created by the WebComm, and sent to the
      // streamRemote$ stream that the ChatContainer is subscribed to.  It will pick up the
      // MediaStream and pass it to our constructor
      if (this.stream === null) {
        const cam = await navigator.mediaDevices.getUserMedia(constraints);
        this.stream = cam;
      }

      if (!this.setupMediaStream(this.stream)) {
        logger.error("No RTCPeerConnection yet in webcomm.  No tracks added");
      }

      // Set the video ref to webcomm
      const video = this.videoRef.current;
      if (this.props.webcomm) {
        if (this.props.kind === "local") {
          logger.info("Adding mediastream to streamLocal$");
          this.props.webcomm.streamLocal$.next(new LocalMediaStream(this.stream));
        }
        if (this.props.kind === "remote") {
          logger.log("Added media stream to remote video");
        }
        this.ready = true;
      } else {
        alert("Please enable chat before using webcam");
        logger.log("webcomm = ", this.props.webcomm);
      }

      if (!this.ready) {
        this.disableCam();
        return;
      }

      // TODO: Present a list of options for the user
      //const mediaDevs = await noesis.list_media_devices();
      //logger.log(mediaDevs);

      if (video !== null) {
        video.srcObject = this.stream;
        video.play();
      } else {
        alert("Video not available");
      }
    } else {
      alert("Video is not available.");
    }
  }

  /**
   * Sets up the MediaStream by adding tracks to the RTCPeerConnection
   */
  setupMediaStream = (stream: MediaStream) => {
    if (!this.props.webcomm) {
      logger.error("No webcomm yet for setupMediaStream");
      return false;
    }
    const { webcomm } = this.props;
    stream.getTracks().forEach((track) => {
      if(!webcomm.peer) {
        return false;
      }
      logger.log(`Adding track to stream`, track);
      webcomm.peer.addTrack(track, stream)
    });
    return true;
  }

  /**
   * When user clicks the "Turn Off" button, remove the webcam and MediaStream
   */
  disableCam = () => {
    logger.log(this.videoRef);
    if (this.videoRef  && this.videoRef.current !== null) {
      const video = this.videoRef.current;

      video.remove();
      video.srcObject = null;
    }

    this.props.setWebcam({active: false}, WEBCAM_DISABLE);
    this.props.setVideo(null, "REMOVE_VIDEO_REF");
    this.stream = null;
    if (this.props.webcomm) {
      this.props.webcomm.streamLocal$.next(new LocalMediaStream(null));
    }
  }

  render() {
    const uniqueLocalVidId = `localVideo-${this.props.webcamTarget}`;
    const uniqueHeaderId = `localVideoHeader-${this.props.webcamTarget}`;
    const webcamId = `webcam-${this.props.webcamTarget}`;

    return (
      <div>
        <div ref={ this.myRef } className="localVideo" id={ uniqueLocalVidId }>
          <video width="800px" height="450px" id={ webcamId } ref={ this.videoRef }>
            No video stream available
          </video>
          <div className="localVideoHeader" id={ uniqueHeaderId }>
            <div className="video-header-section">
              <button className="webcam-button" onClick={ this.disableCam }>
                Turn Off
              </button>
              { this.props.webcamTarget } Click here to move
            </div>

            <div className="video-header-section webcam-resize justify-right">
              <i ref={ this.resizeRef } className="fas fa-compress" style={ {color: "black"}}></i>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connector(VideoStream);