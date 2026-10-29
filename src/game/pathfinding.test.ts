import test from 'node:test';
import assert from 'node:assert/strict';
import { NavGrid } from './pathfinding.ts';
import { ObstacleBox } from './types.ts';

test('NavGrid converts between world and grid coordinates accurately', () => {
  const grid = new NavGrid([], -50, 50, -50, 50, 2.0);
  const gp = grid.worldToGrid(0, 0);
  assert.equal(gp.gx, 25);
  assert.equal(gp.gz, 25);

  const wp = grid.gridToWorld(25, 25);
  assert.equal(wp.x, 1); // cell center of 0 to 2 is 1
  assert.equal(wp.z, 1);
});

test('Obstacle baking marks cells as non-walkable', () => {
  const wall: ObstacleBox = {
    minX: -4,
    maxX: 4,
    minZ: -4,
    maxZ: 4,
    height: 4,
    type: 'building',
  };

  const grid = new NavGrid([wall], -30, 30, -30, 30, 2.0);
  const centerGrid = grid.worldToGrid(0, 0);
  assert.equal(grid.isWalkable(centerGrid.gx, centerGrid.gz), false);

  const farGrid = grid.worldToGrid(20, 20);
  assert.equal(grid.isWalkable(farGrid.gx, farGrid.gz), true);
});

test('A* pathfinding navigates around a building blocking direct path', () => {
  // A large cube house placed right at x: [-6, 6], z: [-6, 6]
  const house: ObstacleBox = {
    minX: -6,
    maxX: 6,
    minZ: -6,
    maxZ: 6,
    height: 4,
    type: 'building',
  };

  const grid = new NavGrid([house], -40, 40, -40, 40, 2.0);

  const start = { x: 0, z: -15 };
  const target = { x: 0, z: 15 };

  // Direct line of sight must be blocked
  assert.equal(grid.hasLineOfSight(start.x, start.z, target.x, target.z), false);

  // Find A* path
  const path = grid.findPath(start, target);
  assert.ok(path.length >= 2, 'Path should contain multiple waypoints');

  // Verify none of the waypoints or segments intersect the house
  for (const wp of path) {
    const gp = grid.worldToGrid(wp.x, wp.z);
    // Waypoints should be on walkable cells
    assert.equal(grid.isWalkable(gp.gx, gp.gz), true);
  }

  // End of path should reach the target
  const endPoint = path[path.length - 1];
  assert.equal(endPoint.x, target.x);
  assert.equal(endPoint.z, target.z);
});

test('A* pathfinding handles direct clear paths efficiently', () => {
  const grid = new NavGrid([], -40, 40, -40, 40, 2.0);
  const start = { x: -10, z: -10 };
  const target = { x: 10, z: 10 };

  const path = grid.findPath(start, target);
  assert.equal(path.length, 1);
  assert.equal(path[0].x, target.x);
  assert.equal(path[0].z, target.z);
});

test('findNearestWalkable finds an alternate point when target is inside building', () => {
  const rock: ObstacleBox = {
    minX: 10,
    maxX: 14,
    minZ: 10,
    maxZ: 14,
    height: 3,
    type: 'rock',
  };

  const grid = new NavGrid([rock], -30, 30, -30, 30, 2.0);
  const insideGrid = grid.worldToGrid(12, 12);
  assert.equal(grid.isWalkable(insideGrid.gx, insideGrid.gz), false);

  const nearest = grid.findNearestWalkable(insideGrid.gx, insideGrid.gz);
  assert.equal(grid.isWalkable(nearest.gx, nearest.gz), true);
});
