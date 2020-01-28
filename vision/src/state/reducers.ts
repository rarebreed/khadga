/**
 * Reducers for our UI and models
 */
import { ModalState, ModalAction, SET_ACTIVE } from "./actions";
import { logger } from "../logger";

export const initialModalState = {
	isActive: false
};

export const modalReducer = ( previous: ModalState = initialModalState
														, action: ModalAction)
														: ModalState => {
	logger.log(`Current state for modalReducer ${JSON.stringify(previous, null, 2)}`, previous);
	switch (action.type) {
		case SET_ACTIVE:
			logger.log(`action.status = ${action.status}`);
			return {
				isActive: action.status
			};
			break;
		default:
			return previous;
	}
};