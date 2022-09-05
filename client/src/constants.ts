/**
 * Max acceptable distance between a click's origin and destination
 * when ignoring the y dimension of the points
 */
const MAX_CLICKABLE_DIST = 20;

/**
 * Names of in-world objects with special effects
 */
const EFFECTS_OBJECT_NAMES = {
  WALL: 'wall',
  PANEL: 'panel',
  PLACEMENT_MARKER: 'placement-marker'
}

/**
 * Names of in-world objects that are clickable
 */
const CLICKABLE_OBJECT_NAMES = [EFFECTS_OBJECT_NAMES.WALL,
    EFFECTS_OBJECT_NAMES.PANEL];

export { MAX_CLICKABLE_DIST, EFFECTS_OBJECT_NAMES, CLICKABLE_OBJECT_NAMES};
