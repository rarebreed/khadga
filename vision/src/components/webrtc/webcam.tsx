/**
 * This is a container for our local video stream
 *
 * It will be dynamically added into the DOM and will be moveable
 */

import React from "react";
import { connect, ConnectedProps } from "react-redux";

import * as noesis from "@khadga/noesis";
import { State } from "../../state/store";
import { webcamCamAction } from "../../state/action-creators";
import { WEBCAM_DISABLE } from "../../state/types";
import dragElement, { resizeElement } from "../../utils/utils";

const logger = console;

const mapStateToProps = (state: State) => {
	return {
		webcamActive: state.webcam.active,
		webcamId: state.webcam.videoId
	};
};

const mapPropsToDispatch = {
	setWebcam: webcamCamAction
};

const connector = connect(mapStateToProps, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

/**
 * This component is for the local and remote webcam streams
 */
class VideoStream extends React.Component<PropsFromRedux> {
	myRef: React.RefObject<HTMLDivElement>;
	videoRef: React.RefObject<HTMLVideoElement>;
	resizeRef: React.RefObject<HTMLImageElement>;

	constructor(props: PropsFromRedux) {
		super(props);
		this.myRef = React.createRef();
		this.videoRef = React.createRef();
		this.resizeRef = React.createRef();

		this.disableCam.bind(this);
	}

	/**
	 * Once the component has mounted, we need to get the MediaDevice and attach to our <video> element
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

		if (this.videoRef.current !== null) {
			logger.log("Loading video object");
/* 			const camProm = noesis.get_media_stream() as Promise<MediaStream>;
			const cam = await camProm; */
			let constraints: MediaStreamConstraints = {
				audio: true,
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 }
				}
			};

			if (this.props.webcamId) {
				constraints = {
					video: { deviceId: this.props.webcamId },
					audio: true
				};
			}

			const cam = await navigator.mediaDevices.getUserMedia(constraints);
			const video = this.videoRef.current;

			// TODO: Present a list of options for the user
			const mediaDevs = noesis.list_media_devices();
			logger.log(mediaDevs);

			video.srcObject = cam;
			video.play();
		} else {
			alert("video is not available");
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
		}

		this.props.setWebcam({ active: false }, WEBCAM_DISABLE);
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
							<i ref={ this.resizeRef } className="fas fa-compress" style={ { color: "black"}}></i>
						</div>
					</div>
			  </div>
			</div>
		);
	}
}

export default connector(VideoStream);