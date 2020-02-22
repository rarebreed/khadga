/**
 * This is a container for our local video stream
 *
 * It will be dynamically added into the DOM and will be moveable
 */

import React from "react";
import * as noesis from "@khadga/noesis";

const logger = console;

export class VideoStream extends React.Component {
	myRef: React.RefObject<HTMLDivElement>;
	videoRef: React.RefObject<HTMLVideoElement>;

	constructor(props: {}) {
		super(props);
		this.myRef = React.createRef();
		this.videoRef = React.createRef();

		this.disableCam.bind(this);
	}

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
			video.srcObject = cam;
			video.play();
		} else {
			alert("video is not available");
		}
	}

	disableCam = () => {
		logger.log(this.videoRef);
		if (this.videoRef  && this.videoRef.current !== null) {
			const video = this.videoRef.current;

			video.remove();
		}

		alert("TODO: Send action to set webcam state to disabled");
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

// Make the DIV element draggable:
// dragElement(document.getElementById("mydiv"));

export const dragElement = (elmnt: any) => {
	let pos1 = 0;
	let pos2 = 0;
	let pos3 = 0;
	let pos4 = 0;

	const helem = document.getElementById(elmnt.id + "Header");
  if (!helem) {
		elmnt.onmousedown = dragMouseDown;
	} else {
		helem.onmousedown = dragMouseDown;
	}

  function dragMouseDown(e: any) {
		logger.log(e);
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e: any) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
};