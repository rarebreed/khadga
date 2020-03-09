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
import dragElement from "../../utils/utils";

const logger = console;

const mapStateToProps = (state: State) => {
	return {
		webcamActive: state.webcam.active
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

	constructor(props: PropsFromRedux) {
		super(props);
		this.myRef = React.createRef();
		this.videoRef = React.createRef();

		this.disableCam.bind(this);
	}

	/**
	 * Once the component has mounted, we need to get the MediaDevice and attach to our <video> element
	 */
	async componentDidMount() {
		if (this.myRef.current) {
			dragElement(this.myRef.current);
		} else {
			logger.error("No element yet");
		}

		if (this.videoRef.current !== null) {
			logger.log("Loading video object");
			const camProm = noesis.get_media_stream() as Promise<MediaStream>;
			const cam = await camProm;
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
					<div id="localVideoHeader">Click here to move
					  <button onClick={ this.disableCam }>
							Turn Off
						</button>
					</div>
					<video id="webcam" ref={ this.videoRef }>No video stream available</video>
			  </div>
			</div>
		);
	}
}

export default connector(VideoStream);