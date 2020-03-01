import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { NavBarItem } from "../components/navbar-item";
import { State } from "../state/store";
import { logger } from "../logger";
import { createLoginAction
			 , websocketAction
			 , webcamCamAction
			 } from "../state/action-creators";
import { USER_LOGIN
			 , USER_LOGOUT
			 , AUTH_CREATED
			 , makeLoginArgs,
			 WEBCAM_DISABLE
			 } from "../state/types";

// Hack to get typescript to understand something injected into global window
interface GAPI {
	gapi?: any;
}

type WindowGABI = Window & GAPI;

interface GoogleProfile {
	profile: string,  // = googleUser.getBasicProfile();
	username: string, // = profile.getName();
	email: string,    // = profile.getEmail();
	id: string,       // = profile.getId();
	url: string       // = profile.getImageUrl();
	login_time: Date
}

interface LoggedInState {
	username: string,
	auth2: any | null
}

const mapPropsToState = (state: State) => {
	logger.debug("state is: ", state);
	return {
		connectState: state.connectState,
		socket: state.websocket.socket,
		webcam: state.webcam
	};
};

const mapPropsToDispatch = {
	setConnectedUsers: createLoginAction,
	setWebsocket: websocketAction,
	setWebcam: webcamCamAction
};

const connector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

class GoogleAuth extends React.Component<PropsFromRedux, LoggedInState> {
	componentDidMount() {
		// TODO: Read the cookie and make a call to our database.  Check when last user logout time was
		// if it's within 15min, allow user to sign back in automatically.

		const wg: WindowGABI = window;
		if (wg.gapi) {
			logger.debug(`gapi is`, wg.gapi);
			wg.gapi.load("auth2", () => {
				const auth2 = wg.gapi.auth2.init({
					client_id: '261855978313-003phramc3mt34d9gnvt2dmkp69ip4eu.apps.googleusercontent.com',
					fetch_basic_profile: true,
					scope: "profile"
				});
				auth2.isSignedIn.listen(this.authListener);

				const args = makeLoginArgs(this.props.connectState);
				this.props.setConnectedUsers(args[0], args[1], auth2, AUTH_CREATED);
			});
		}
	}

	authListener = () => {
		const oldState = this.props.connectState.loggedIn;
		let newState: boolean = oldState;
		if (this.props.connectState.auth2) {
			newState = this.props.connectState.auth2.isSignedIn.get();
		}

		logger.log(`In authListener, New state is `, newState);

		// If the oldstate was the same as the newstate, we don't need to do anything
		if (oldState === newState) {
			return;
		}

		// Otherwise, we need to set our new state
		const action = newState ? USER_LOGIN : USER_LOGOUT;
		const alreadyConnected = this.props.connectState.connected;
		this.props.setConnectedUsers( alreadyConnected
																, this.props.connectState.username
																, this.props.connectState.auth2
																, action);
	}

	/**
	 * Handler for the login button'
	 *
	 * When the user clicks this button, we will make a request to the google auth API
	 */
	onSignIn = (googleUser: any) => {
		const profile = googleUser.getBasicProfile();
		const username: string = profile.getName();
		const email: string = profile.getEmail();
		const id = profile.getId();
		const url: string = profile.getImageUrl();
		const userProfile: GoogleProfile = {
			profile, username, email, id, url,
			login_time: new Date(Date.now())
		};

		logger.debug(`Name: ${username}\nEmail: ${email}\nId: ${id}\nURL: ${url}`);
		const alreadyConnected = this.props.connectState.connected;

		logger.log("Getting auth response");
		try {
			const authResp = googleUser.getAuthResponse();
			logger.log("auth: ", authResp);
		} catch (ex) {
			logger.error(ex);
		}

		let user = email.split("@")[0];
		user = user.replace(/[\.+]/, "_");
		logger.log(`Calling USER_LOGIN action with username ${user}`);
		this.props.setConnectedUsers( alreadyConnected
																, user.replace(/\s+/, "")
																, this.props.connectState.auth2
																, USER_LOGIN);

		// TODO: We should look at the existing cookie, and modify what's needed. Eventually, if we use
		// custom headers for JWT, we can sign the header with the user's public key and safely store
		// the JWT token in the cookie. If an attacker somehow sniffed or stole the JWT, they would
		// also need access to the private key (which if they have, all bets are off anyway)
		document.cookie = JSON.stringify(userProfile);
	}

	signIn = () => {
		logger.debug("Clicked login");

		if (this.props.connectState.auth2 !== null) {
			this.props.connectState.auth2.signIn()
				.then(this.onSignIn);
		} else {
			logger.log("No this.auth2 instance");
		}
	}

	signOut = () => {
		logger.log("Signed out");
		if (this.props.connectState.auth2) {
			this.props.connectState.auth2.signOut()
			  .then(() => {
					logger.log("User has been signed out");

					// Setup our login information
					this.props.setConnectedUsers(
						[],
						this.props.connectState.username,
						this.props.connectState.auth2,
						USER_LOGOUT
					);

					// Disconnect the websocket and webcam.  We have to do cleanup here, because the reducer
					// is supposed to be side-effect free
					if (this.props.socket) {
						this.props.socket.close();
					}
					this.props.setWebsocket(null);

					this.props.setWebcam({ active: false }, WEBCAM_DISABLE);
				});
		}
	}

	signInButton = (
		<a className="button"
		   data-onsuccess={ this.onSignIn }
			 onClick={ this.signIn }>
			{/* <NavBarItem classStyle="navbar-item button"
								  >
			  Sign in with Google
			</NavBarItem> */}
			Sign in with Google
		</a>

	);

	signOutButton = (
		<NavBarItem classStyle="navbar-item button"
								callback={ this.signOut }>
			  Logout
		</NavBarItem>
	);

	render() {
		return (
			this.props.connectState.loggedIn ? this.signOutButton : this.signInButton
		);
	}
}

export default connector(GoogleAuth);