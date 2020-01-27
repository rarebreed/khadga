/**
 * Reducers for our UI and models
 */
import { ModalState, ModalAction, SET_ACTIVE } from "./actions";

export const initialModalState = {
	isActive: false
}

export const modalReducer = ( previous: ModalState = initialModalState
														, action: ModalAction)
														: ModalState => {
	console.log(previous)
	switch (action.type) {
		case SET_ACTIVE:
			return {
				isActive: action.status
			}
			break;
		default:
			return previous
	}
}