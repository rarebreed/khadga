/**
 * This is a container for our local video stream
 *
 * It will be dynamically added into the DOM and will be moveable
 */

import React from "react";
import {connect, ConnectedProps} from "react-redux";

import {State} from "../../state/store";
import {webcamCamAction, videoRefAction,} from "../../state/action-creators";
import {WEBCAM_DISABLE} from "../../state/types";
import dragElement, {resizeElement} from "../../utils/utils";
import { LocalMediaStream, WebComm } from "../../state/communication";

const logger = console;

const mapStateToProps = (state: State) => {
  return {
    webcamActive: state.webcam.active,
    webcamId: state.webcam.videoId,
  };
};

const mapPropsToDispatch = {
  setWebcam: webcamCamAction,
  setVideo: videoRefAction
};

export interface StreamProps {
  kind: "local" | "remote",
  target: string,
  stream?: MediaStream,
  pos?: { top: string },
  webcomm: WebComm
}

const connector = connect(mapStateToProps, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector> & StreamProps;

/**
 * This component is for the local and remote webcam streams
 */
class VideoStream extends React.Component<PropsFromRedux> {
  myRef: React.RefObject<HTMLDivElement>;
  resizeRef: React.RefObject<HTMLImageElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  ready: boolean;
  stream: MediaStream | null;
  dimensions: { width: number, height: number }

  constructor(props: PropsFromRedux) {
    super(props);
    this.myRef = React.createRef();
    this.resizeRef = React.createRef();
    this.videoRef = React.createRef();
    this.ready = false;
    this.stream = props.stream ? props.stream : null;
    this.dimensions = { width: 640, height: 360 };
  }

  /**
   * Once the component has mounted, we need to get the MediaDevice and attach to our <video>
   * element
   */
  async componentDidMount() {
    logger.info("In componentDidMount for VideoStream")
    const uniqueHeaderId = `localVideoHeader-${this.props.target}`;
    const webcamId = `webcam-${this.props.target}`;

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
      logger.log("Loading video object for", this.props.kind);

      // Set the video ref to webcomm
      const video = this.videoRef.current;
      if (!this.props.webcomm) {
        alert("Please enable chat before using webcam");
        logger.log("webcomm = ", this.props.webcomm);
        this.disableCam();
        return;
      }

      // TODO: Present a list of options for the user
      //const mediaDevs = await noesis.list_media_devices();
      //logger.log(mediaDevs);

      if (video !== null) {
        video.srcObject = this.stream;
        video.play();
        logger.log("Attached video.srcObject to MediaStream for", this.props.target, this.stream);
      } else {
        alert("Video not available");
      }
    } else {
      alert("Video is not available.");
    }
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
    const uniqueLocalVidId = `localVideo-${this.props.target}`;
    const uniqueHeaderId = `localVideoHeader-${this.props.target}`;
    const webcamId = `webcam-${this.props.target}`;
    const pos = this.props.pos ? this.props.pos : { top: "0px" };
    const { width, height } = this.dimensions;

    return (
      <div>
        <div ref={ this.myRef } 
             className="localVideo" 
             id={ uniqueLocalVidId } 
             style={ pos }>
          <video width={`${width}px`} height={`${height}px`} id={ webcamId } ref={ this.videoRef }>
            No video stream available
          </video>
          <div className="localVideoHeader" id={ uniqueHeaderId }>
            <div className="video-header-section">
              <button className="webcam-button" onClick={ this.disableCam }>
                Turn Off
              </button>
              { this.props.target } Click here to move
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