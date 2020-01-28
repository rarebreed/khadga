import { ModalAction, SET_ACTIVE } from "./actions";

export const setActive = (isActive: boolean): ModalAction => {
	return {
		type: SET_ACTIVE,
		status: isActive
	};
};