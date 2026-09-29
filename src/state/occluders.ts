import { insetsOf, NO_INSETS, type Box, type Insets } from '../scene/framing';

// Screen boxes of the text panels over the canvas, kept outside React: the camera reads the insets every frame and
// nothing re-renders when a panel moves or resizes.
const boxes = new Map<symbol, Box>();
let current: Insets = NO_INSETS;

function update() {
  current = insetsOf([...boxes.values()], innerWidth, innerHeight);
}

export const occluders = {
  insets: (): Insets => current,
  set(id: symbol, box: Box) {
    boxes.set(id, box);
    update();
  },
  remove(id: symbol) {
    if (boxes.delete(id)) update();
  },
};
