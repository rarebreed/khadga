/**
 * This is a container for our local video stream
 *
 * It will be dynamically added into the DOM and will be moveable
 */

import React from "react";
import { connect, ConnectedProps } from "react-redux";

import * as noesis from "@khadga/noesis";
import { State } from "../../state/store";
import { webcamCamAction, videoRefAction,  } from "../../state/action-creators";
import { WEBCAM_DISABLE } from "../../state/types";
import dragElement, { resizeElement } from "../../utils/utils";

const logger = console;

const mapStateToProps = (state: State) => {
	return {
		webcamActive: state.webcam.active,
		webcamId: state.webcam.videoId,
		videoRef: state.videoRef.videoRefId
	};
};

const mapPropsToDispatch = {
	setWebcam: webcamCamAction,
	video: videoRefAction
};

const connector = connect(mapStateToProps, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

/**
 * This component is for the local and remote webcam streams
 */
class VideoStream extends React.Component<PropsFromRedux> {
	myRef: React.RefObject<HTMLDivElement>;
	resizeRef: React.RefObject<HTMLImageElement>;

	constructor(props: PropsFromRedux) {
		super(props);
		this.myRef = React.createRef();
		this.resizeRef = React.createRef();

		this.disableCam.bind(this);
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

		if (this.props.videoRef !== null) {
			logger.log("Loading video object");
/* 			const camProm = noesis.get_media_stream() as Promise<MediaStream>;
			const cam = await camProm; */
			const constraints: MediaStreamConstraints = {
				audio: true,
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 }
				}
			};

			const cam = await navigator.mediaDevices.getUserMedia(constraints);
			const video = this.props.videoRef.current;

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
		logger.log(this.props.videoRef);
		if (this.props.videoRef  && this.props.videoRef.current !== null) {
			const video = this.props.videoRef.current;

			video.remove();
			video.srcObject = null;
		}

		this.props.setWebcam({ active: false }, WEBCAM_DISABLE);
		this.props.video(null, "REMOVE_VIDEO_REF");
	}

	render() {
		return (
			<div>
				<div ref={ this.myRef } id="localVideo">
					<video width="1280px" height="720px" id="webcam" ref={ this.props.videoRef }>
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
							<i ref={ this.resizeRef } className="fas fa-compress" style={ { color: "black"}}></i>
						</div>
					</div>
			  </div>
			</div>
		);
	}
}

export default connector(VideoStream);