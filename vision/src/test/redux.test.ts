import { createStore} from "redux";

import store from "../state/store";

import { logger } from "../logger";

test("Tests the store", () => {
	const stateStore = createStore(store.reducers);
	stateStore.dispatch({
		type: "SET_ACTIVE",
		status: true
	});

	let stateNow = stateStore.getState();
	logger.log(stateNow);
	expect(stateNow).toBeTruthy();

	stateStore.dispatch({
		type: "SET_ACTIVE",
		status: false
	});

	stateNow = stateStore.getState();
	logger.log(stateNow);
	expect(stateNow.modal.isActive).toBeFalsy();
});
