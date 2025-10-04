export interface SavedCameraState {
	position: [number, number, number];
	target: [number, number, number];
}

let camState: SavedCameraState | null = null;

export function setCameraState(state: SavedCameraState) {
	camState = state;
}

export function getCameraState(): SavedCameraState | null {
	return camState;
}

export function clearCameraState() {
	camState = null;
}
