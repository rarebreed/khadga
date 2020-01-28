/**
 * This module will store the various Actions
 */
export const SET_ACTIVE = 'SET_ACTIVE';


export interface ModalState {
	isActive: boolean
}

export interface ModalAction {
	type: typeof SET_ACTIVE,
	status: boolean
}
