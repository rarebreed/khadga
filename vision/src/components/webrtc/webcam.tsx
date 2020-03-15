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

const logger = console;

const mapStateToProps = (state: State) => {
  return {
    webcamActive: state.webcam.active,
    webcamId: state.webcam.videoId,
    webcomm: state.webcomm.webcomm
  };
};

const mapPropsToDispatch = {
  setWebcam: webcamCamAction,
  setVideo: videoRefAction
};

interface LocalProps {
  kind: "local" | "remote",
  target: string
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
    this.stream = null;
  }

  /**
   * Once the component has mounted, we need to get the MediaDevice and attach to our <video>
   * element
   */
  async componentDidMount() {
    if (this.myRef.current) {
      dragElement(this.myRef.current);
    } else {
      logger.error("No drag div element yet");
    }

    if (this.resizeRef.current) {
      resizeElement(this.resizeRef.current);
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

      const cam = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = cam;
      const video = this.videoRef.current;

      // Set the video ref to webcomm
      if (this.props.webcomm) {
        if (this.props.kind === "local") {
          this.props.webcomm.streamLocal$.next(cam);
        }
        if (this.props.kind === "remote") {
          logger.log("Adding video ref remote to webcomm");
          const refremote = new Map();
          refremote.set(this.props.target, cam);
          this.props.webcomm.streamRemote$.next(refremote);
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
      const mediaDevs = await noesis.list_media_devices();
      logger.log(mediaDevs);

      if (video !== null) {
        video.srcObject = cam;
        video.play();
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
      this.props.webcomm.streamLocal$.next(null);
    }
  }

  render() {
    return (
      <div>
        <div ref={ this.myRef } id="localVideo">
          <video width="1280px" height="720px" id="webcam" ref={ this.videoRef }>
            No video stream available
          </video>
          <div id="localVideoHeader">
            <div className="video-header-section">
              <button className="webcam-button" onClick={ this.disableCam }>
                Turn Off
              </button>
              Click here to move
            </div>

            <div id="webcam-resize" className="video-header-section justify-right">
              <i ref={ this.resizeRef } className="fas fa-compress" style={ {color: "black"}}></i>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connector(VideoStream);