import React from "react";
import {connect, ConnectedProps} from "react-redux";

import {NavBarItem} from "../components/navbar-item";
import {State} from "../state/store";
import {logger} from "../logger";
import {
  createLoginAction,
  webcamCamAction,
} from "../state/action-creators";
import {
  USER_LOGIN,
  USER_LOGOUT,
  AUTH_CREATED,
  makeLoginArgs,
  WEBCAM_DISABLE
} from "../state/types";
import { WebComm } from "../state/communication";

interface JWTResponse {
  token: string,
  expiry: number,
  body?: string
}

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

interface LoginParams {
  uname: string,
  first: string,
  last: string,
  email: string,
  token: string
}

interface LoggedInState {
  username: string,
  timeout: number,
  timerCB: number | null
}

const mapPropsToState = (state: State) => {
  logger.debug("state is: ", state);
  return {
    connectState: state.connectState,
    webcam: state.webcam
  };
};

const mapPropsToDispatch = {
  setConnectedUsers: createLoginAction,
  setWebcam: webcamCamAction
};

const connector = connect(mapPropsToState, mapPropsToDispatch);
type PropsFromRedux = ConnectedProps<typeof connector> & {
  webcomm: WebComm
};

class GoogleAuth extends React.Component<PropsFromRedux, LoggedInState> {
  constructor(props: PropsFromRedux) {
    super(props);

    this.state = {
      timeout: 15 * 60 * 1000,
      username: "",
      timerCB: null
    };
  }

  componentDidMount() {
    // Read the cookie and check the expiration time.  The actual JWT is protected by a httpOnly
    // flag so we can only read our expiration time
    this.validateCookie();

    const wg: WindowGABI = window;
    if (wg.gapi) {
      logger.debug("gapi is", wg.gapi);
      wg.gapi.load("auth2", () => {
        const auth2 = wg.gapi.auth2.init({
          client_id: "261855978313-003phramc3mt34d9gnvt2dmkp69ip4eu.apps.googleusercontent.com",
          fetch_basic_profile: true,
          scope: "profile"
        });
        auth2.isSignedIn.listen(this.authListener);

        const args = makeLoginArgs(this.props.connectState);
        this.props.setConnectedUsers(args[0], args[1], auth2, AUTH_CREATED);
      });
    }
  }

  /**
   * Sets the redux store state when a user logs in
   */
  authListener = () => {
    const oldState = this.props.connectState.loggedIn;
    let newState: boolean = oldState;
    if (this.props.connectState.auth2) {
      newState = this.props.connectState.auth2.isSignedIn.get();
    }

    logger.log("In authListener, New state is ", newState);

    // If the oldstate was the same as the newstate, we don't need to do anything
    if (oldState === newState) {
      return;
    }

    // Otherwise, we need to set our new state
    const action = newState ? USER_LOGIN : USER_LOGOUT;
    const alreadyConnected = this.props.connectState.connected;
    this.props.setConnectedUsers(
      alreadyConnected,
      this.props.connectState.username,
      this.props.connectState.auth2,
      action);
  }

  static cookieExpireTime = () => {
    const expires = GoogleAuth.checkCookie("expiry");
    let expDate = Date.now() - 1;
    if (expires.length > 0) {
      logger.log(`Cookie expires at ${expires[0]}`);
      expDate = Date.parse(expires[0]);
    }
    return expDate
  }

  validateCookie = () => {
    let expDate = GoogleAuth.cookieExpireTime();

    const user = GoogleAuth.checkCookie("khadga_user");
    let username = "";
    if (user.length > 0) {
      username = user[0];
    }

    if (expDate > Date.now()) {
      // TODO: make a call to /login to get a fresh JWT
      logger.log(`Calling USER_LOGIN action with username ${username}`);
      this.props.setConnectedUsers( 
        this.props.connectState.connected,
        username.replace(/\s+/, ""),
        this.props.connectState.auth2,
        USER_LOGIN
      );
      logger.log("Session validated with existing JWT");
      return;
    }
  }

  /**
   * Looks at our cookie and sees if our JWT is still valid
   */
  static checkCookie = (cname: string) => {
    return document.cookie.split(";")
      .map(c => c.trim())
      .map((c) => {
        if (c === cname) {
          logger.log("cookie: ", c);
        }
        return c;
      })
      .filter(c => c.includes(cname))
      .map(c => c.split("=")[1].trim());
  }

  /**
   * Handler for the login button'
   *
   * When the user clicks this button, we will make a request to the google auth API
   */
  onSignIn = (googleUser: any) => {
    const profile = googleUser.getBasicProfile();
    const firstName = profile.getGivenName() as string;
    const lastName = profile.getFamilyName() as string;
    const username: string = profile.getName();
    const email: string = profile.getEmail();
    const id = profile.getId();
    const url: string = profile.getImageUrl();

    let user = email.split("@")[0];
    user = user.replace(/[.+]/, "_");

    logger.debug(`Name: ${username}\nEmail: ${email}\nId: ${id}\nURL: ${url}`);
    logger.info(`Full name is ${firstName} ${lastName}`);
    const alreadyConnected = this.props.connectState.connected;

    logger.log("Getting auth response");
    try {
      const authResp = googleUser.getAuthResponse();
      logger.log("auth: ", authResp);
      this.getJWT({
        uname: username,
        first: firstName,
        last: lastName,
        email,
        token: authResp.id_token
      }).then((_) => {
        GoogleAuth.checkCookie("expiry");
      }).catch((ex) => {
        logger.error(ex);
        this.signOut();
      });
    } catch (ex) {
      logger.error(ex);
    }

    logger.log(`Calling USER_LOGIN action with username ${user}`);
    this.props.setConnectedUsers( alreadyConnected
      , user.replace(/\s+/, "")
      , this.props.connectState.auth2
      , USER_LOGIN);

    // TODO: We should look at the existing cookie, and modify what's needed. Eventually, if we use
    // custom headers for JWT, we can sign the header with the user's public key and safely store
    // the JWT token in the cookie. If an attacker somehow sniffed or stole the JWT, they would
    // also need access to the private key (which if they have, all bets are off anyway)
  }

  /**
   * Takes the id_token from our Google Auth and passes it to khadga to get a JWT
   *
   * Note that we are **not** using the id_token from Google.  The reason is to avoid overhead with
   * passing between khadga and mimir to do validation on every request.
   *
   * @param googleToken
   */
  async getJWT(login: LoginParams): Promise<string> {
    const origin = window.location.host;
    const {uname, email, token, first, last} = login;

    logger.log(`origin is: https://${origin}/login`);
    const resp = await fetch(`https://${origin}/login`, {
      method: "POST",
      cache: "no-cache",
      credentials: "same-origin",  // Setting this to same-origin to allow cookies
      headers: {
        "Content-Type": "application/json"
      },
      redirect: "follow",
      // Same as LoginParams in khadga code
      body: JSON.stringify({
        uname,
        first,
        last,
        email,
        token
      })
    });

    // Should have the JWT now if credentials now
    if (resp.status !== 200) {
      throw new Error(`Could not get JWT token: ${await resp.text()}`);
    }

    const jwt = await resp.text();
    return jwt;
  }

  signIn = () => {
    logger.debug("Clicked login");

    if (this.props.connectState.auth2 !== null) {
      this.props.connectState.auth2.signIn()
        .then(this.onSignIn);

      // FIXME: This will keep refreshing the user forever.  We need to be able to stop this.  I
      // think the best way to do this is through an Observable that watches activity on the page.
      // If it doesn't get any activity within 15min, logout.
      logger.log("Setting up jwt refresher");
      const timeout = window.setInterval(() => {
        logger.log("refreshing JWT");
        this.signIn();
      }, this.state.timeout);
      this.setState({ timerCB: timeout });

      // This is the workaround for now to stop infinite refreshes.  Ideally, we need a way to track
      // activity, and if there is no activity then clear the interval
      window.setTimeout(() => {
        if (this.state.timerCB) window.clearInterval()
      }, 60 * 60 * 1000)
    } else {
      alert("No Google Auth instance. Please refresh the page");
    }
  }

  signOut = () => {
    logger.log("Signing out.  cookies = ", document.cookie);
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
          this.props.webcomm.signout$.next(true);
          this.props.setWebcam({active: false}, WEBCAM_DISABLE);
        });
    }
    if (this.state.timeout !== null) {
      window.clearInterval(this.state.timeout);
    }
    logger.log("After signout, cookies = ", document.cookie);
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