import { createStore} from "redux";

import store from "../state/store";
import { logger } from "../logger";
import { SET_ACTIVE
			 , SET_SIGNUP_EMAIL
			 , SET_SIGNUP_PASSWORD
			 , SET_SIGNUP_USERNAME
			 , USER_LOGIN,
			 USER_DISCONNECT
			 } from "../state/types";

test("Tests the store", () => {
	const stateStore = createStore(store.reducers);
	stateStore.dispatch({
		type: SET_ACTIVE,
		status: true
	});

	let stateNow = stateStore.getState();
	// logger.log(stateNow);
	expect(stateNow).toBeTruthy();

	stateStore.dispatch({
		type: "SET_ACTIVE",
		status: false
	});

	stateNow = stateStore.getState();
	expect(stateNow.modal.isActive).toBeFalsy();
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

	stateStore.dispatch({
		type: USER_LOGIN,
		username: "sean"
	});

	stateStore.dispatch({
		type: USER_LOGIN,
		username: "toner"
	});

	let stateNow = stateStore.getState();
	logger.log(stateNow);
	expect(stateNow.connectedUsers.includes("sean")).toBeTruthy();
	expect(stateNow.connectedUsers.includes("toner")).toBeTruthy();

	stateStore.dispatch({
		type: USER_DISCONNECT,
		username: "sean"
	});
	stateNow = stateStore.getState();
	logger.log(stateNow);
	expect(stateNow.connectedUsers.includes("sean")).toBeFalsy();
});

