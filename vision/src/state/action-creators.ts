import { ModalAction, SET_ACTIVE } from "./actions"
import redux from "redux";

export const setActive = (isActive: boolean): ModalAction => {
	return {
		type: SET_ACTIVE,
		status: isActive
	}
}