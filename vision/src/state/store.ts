import { combineReducers } from "redux"
import { modalReducer, initialModalState } from "./reducers"

export const state = {
	modal: initialModalState
}

/**
 * As we add new reducers, add them as key:val pairs
 */
export const reducers = combineReducers({
	modal: modalReducer
})

export default {
	state, reducers
}