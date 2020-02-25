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
			})
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

		logger.debug(`Name: ${username}\nEmail: ${email}\nId: ${id}\nURL: ${url}`);
		const alreadyConnected = this.props.connectState.connected;


		let user = email.split("@")[0];
		user = user.replace(/[\.+]/, "_");
		logger.log(`Calling USER_LOGIN action with username ${user}`);
		this.props.setConnectedUsers( alreadyConnected
																, user.replace(/\s+/, "")
																, this.props.connectState.auth2
																, USER_LOGIN);
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
			<NavBarItem classStyle="login button"
								  data-onsuccess={ this.onSignIn }
									callback={ this.signIn }>
				<i className="google icon" />
			  Sign in with Google
			</NavBarItem>
	);

	signOutButton = (
		<NavBarItem classStyle="login button"
								callback={ this.signOut }>
				<i className="google icon" />
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