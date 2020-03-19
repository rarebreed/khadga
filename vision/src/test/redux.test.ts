import {createStore} from "redux";
import WebSocket from "ws";
import { BehaviorSubject } from "rxjs";
import { combineLatest, map } from "rxjs/operators";

import store from "../state/store";
import {logger} from "../logger";
import {USER_LOGIN
  , USER_LOGOUT
  , USER_CONNECTION_EVT
  , WEBCAM_DISABLE
} from "../state/types";
import {websocketAction
  , createLoginAction
  , webcamCamAction
  , selectUserAction
} from "../state/action-creators";

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

  // First, we add henry
  let action = createLoginAction(now, "henry", null, USER_CONNECTION_EVT);
  stateStore.dispatch(action);
  stateNow = stateStore.getState();
  logger.log("Adding henry with USER_CONNECTION_EVENT: ", stateNow);
  expect(stateNow.connectState.connected.length).toEqual(0);

  action = createLoginAction(stateNow.connectState.connected, "toner", null, USER_LOGIN);
  stateStore.dispatch(action);
  stateNow = stateStore.getState();
  logger.log("Adding toner with USER_LOGIN: ", stateNow);

  action = createLoginAction([ "toner" ], "toner", null, USER_CONNECTION_EVT);
  stateStore.dispatch(action);
  stateNow = stateStore.getState();
  logger.log("After USER_CONNECTION_EVENT: ", stateNow);
  expect(stateNow.connectState.connected.includes("toner")).toBeTruthy();

});

// FIXME: Create a test fixture that starts up a mock server for websocket testing
test.skip("Tests that user signs in, clicks Chat, then logs out", async () => {
  // First sign in
  const stateStore = createStore(store.reducers);
  const action = createLoginAction([], "SeanToner", null, USER_LOGIN);
  stateStore.dispatch(action);

  // Simulate clicking chat
  const sock = new WebSocket("wss://localhost:7001/chat/SeanToner");
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
  logger.log("State is now: ", stateNow);

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

  const webcamAction = webcamCamAction({active: false}, WEBCAM_DISABLE);
  stateStore.dispatch(webcamAction);

  logger.log("After WEBCAM_DISABLE action");
  stateNow = stateStore.getState();
  logger.log(stateNow);
});

test("Tests the selected users", () => {
  const stateStore = createStore(store.reducers);
  let action = selectUserAction("SeanToner", "ADD_USER");
  stateStore.dispatch(action);

  let stateNow = stateStore.getState();
  expect(stateNow.selectedUsers.includes("SeanToner")).toBeTruthy();

  action = selectUserAction("foobar", "ADD_USER");
  stateStore.dispatch(action);
  stateNow = stateStore.getState();
  expect(stateNow.selectedUsers.includes("foobar")).toBeTruthy();

  action = selectUserAction("SeanToner", "REMOVE_USER");
  stateStore.dispatch(action);
  stateNow = stateStore.getState();
  expect(stateNow.selectedUsers.includes("SeanToner")).toBeFalsy();
});

// TODO: Add enzyme to do component level testing