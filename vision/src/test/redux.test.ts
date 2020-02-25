import { createStore} from "redux";
import WebSocket from "ws";

import store from "../state/store";
import { logger } from "../logger";
import { SET_SIGNUP_ACTIVE
	     , SET_SIGNUP_EMAIL
       , SET_SIGNUP_PASSWORD
	     , SET_SIGNUP_USERNAME
	     , USER_LOGIN
			 , USER_LOGOUT
			 , SET_LOGIN_PASSWORD
			 , SET_LOGIN_USERNAME
			 , USER_CONNECTION_EVT
			 , WEBCAM_DISABLE
			 } from "../state/types";
import { websocketAction
			 , createLoginAction
			 , webcamCamAction
			 } from "../state/action-creators";
import { stat } from "fs";

test("Tests the store", () => {
	const stateStore = createStore(store.reducers);
	stateStore.dispatch({
		type: SET_SIGNUP_ACTIVE,
		status: true
	});

	let stateNow = stateStore.getState();
	// logger.log(stateNow);
	expect(stateNow.modal.signup.isActive).toBeTruthy();
	expect(stateNow.modal.login.isActive).toBeFalsy();

	stateStore.dispatch({
		type: "SET_LOGIN_ACTIVE",
		status: true
	});

	stateNow = stateStore.getState();
	expect(stateNow.modal.signup.isActive).toBeTruthy();
});

test("Tests the signupReducer", () => {
	const stateStore = createStore(store.reducers);
	stateStore.dispatch({
		type: SET_SIGNUP_EMAIL,
		form: {
			name: "Email",
			value: "foobar@gmail.com"
		}
	});

	let stateNow = stateStore.getState();
	expect(stateNow.signup.email).toBe("foobar@gmail.com");

	stateStore.dispatch({
		type: SET_SIGNUP_USERNAME,
		form: {
			name: "Username",
			value: "foobar"
		}
	});

	stateNow = stateStore.getState();
	expect(stateNow.signup.username).toBe("foobar");

	stateStore.dispatch({
		type: SET_SIGNUP_PASSWORD,
		form: {
			name: "Password",
			value: "%$(!jk8Y*"
		}
	});

	stateNow = stateStore.getState();
  expect(stateNow.signup.password).toBe("%$(!jk8Y*");
});

test("Tests adding user to connectedUsers", () => {
	const stateStore = createStore(store.reducers);

	let action = createLoginAction([], "SeanToner", null, USER_LOGIN);
	stateStore.dispatch(action);

	action = createLoginAction([], "toner", null, USER_LOGIN);
	stateStore.dispatch(action);

	let stateNow = stateStore.getState();

	logger.log(stateNow);
	expect(stateNow.connectState.connected.length).toEqual(0);
	expect(stateNow.connectState.loggedIn).toBeTruthy();
	expect(stateNow.connectState.username).toEqual("toner");

	action = createLoginAction([], "", null, USER_LOGOUT);
	stateStore.dispatch(action);

	stateNow = stateStore.getState();
	logger.log("Called USER_DISCONNECT");
	logger.log(stateNow);
	expect(stateNow.connectState.connected.includes("toner")).toBeFalsy();
	expect(stateNow.connectState.loggedIn).toBeFalsy();
});

test("User connection event inserts into connected only if user logged in", () => {
	const stateStore = createStore(store.reducers);
	let stateNow = stateStore.getState();
	const now = Array.from(stateNow.connectState.connected);

	let action = createLoginAction(now, "henry", null, USER_CONNECTION_EVT);
	stateStore.dispatch(action);

	stateNow = stateStore.getState();
	expect(stateNow.connectState.connected.length).toEqual(0);

	action = createLoginAction(stateNow.connectState.connected, "toner", null, USER_LOGIN);
	stateStore.dispatch(action);
	stateNow = stateStore.getState();

	action = createLoginAction(now, "toner", null, USER_CONNECTION_EVT);
	stateStore.dispatch(action);
	stateNow = stateStore.getState();
	expect(stateNow.connectState.connected.includes("toner")).toBeTruthy();

});

test("Test loginFormReducer", () => {
	const stateStore = createStore(store.reducers);

	stateStore.dispatch({
		type: SET_LOGIN_PASSWORD,
		form: {
			name: "Password",
			value: "foobar"
		}
	});

	let stateNow = stateStore.getState();
	expect(stateNow.login.password).toBe("foobar");

	stateStore.dispatch({
		type: SET_LOGIN_PASSWORD,
		form: {
			name: "Password",
			value: "xxyy"
		}
	});

	stateNow = stateStore.getState();
	expect(stateNow.login.password).toBe("xxyy");

  stateStore.dispatch({
		type: SET_LOGIN_USERNAME,
		form: {
			name: "Username",
			value: "johndoe"
		}
	});

	stateNow = stateStore.getState();
	expect(stateNow.login.username).toBe("johndoe");
});

// FIXME: Create a test fixture that starts up a mock server for websocket testing
test.skip("Tests that user signs in, clicks Chat, then logs out", async () => {
	// First sign in
	const stateStore = createStore(store.reducers);
	const action = createLoginAction([], "SeanToner", null, USER_LOGIN);
	stateStore.dispatch(action);

	// Simulate clicking chat
	const sock = new WebSocket("ws://localhost:7001/chat/SeanToner");
	sock.on("close", (code, reason) => {
		logger.log(`Closed from server: ${code}, ${reason}`);
	});

	const prom = new Promise((resolve, reject) => {
		sock.on("open", () => {
			sock.send(JSON.stringify({
				sender: "SeanToner",
				recipients: [],
				body: "Hello Sean!!",
				event_type: "MESSAGE"
			}));
			resolve();
		});

		sock.on("error", (err) => {
			reject(err);
		});
	});

	await prom;

	const sockaction = websocketAction(sock);
	stateStore.dispatch(sockaction);

	let stateNow = stateStore.getState();
	logger.log(`State is now: `, stateNow);

	// Now log out
	const signoutAction = createLoginAction(
		[],
		"SeanToner",
		null,
		USER_LOGOUT
	);

	stateStore.dispatch(signoutAction);
	logger.log("After USER_DISCONNECT action");
	stateNow = stateStore.getState();
	logger.log(stateNow.connectState);

	// Disconnect the websocket and webcam.  This is what the GoogleAuth client does
	// Unfortunately, it can take longer to establish the connection handshake than by the
	// time we get here.
	if (sock) {
		try {
			sock.close();
		} catch (ex) {
			logger.log(ex);
		}
	}
	const sockAction = websocketAction(null);
	stateStore.dispatch(sockAction);

	logger.log("After WEBSOCKET_DISABLE action");
	stateNow = stateStore.getState();
	logger.log(stateNow);

	const webcamAction = webcamCamAction({ active: false }, WEBCAM_DISABLE);
	stateStore.dispatch(webcamAction);

	logger.log("After WEBCAM_DISABLE action");
	stateNow = stateStore.getState();
	logger.log(stateNow);
});

// TODO: Add enzyme to do component level testing