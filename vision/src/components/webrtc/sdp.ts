/**
 * Describes the SDP (Session Description Protocol)
 */

interface SDPMessage {
	type: "video-offer" | "video-answer",
	sender: string,  // sender's username
	target: string,  // target's username
	sdp: string
}

interface ICECandidateMessage {
	type: "new-ice-candidate",
	target: string,   // username of person that we want to negotiate with
	candidate: string // sdp candidate string describing offered protocol
}

const invite = (media: MediaStream) => {
	const rtcConn = new RTCPeerConnection();
	media.getTracks().forEach(track => {
		rtcConn.addTrack(track, media);
	});
	
};