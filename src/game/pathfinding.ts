import { ObstacleBox } from './types.ts';

export interface GridPoint {
  gx: number;
  gz: number;
}

export interface WorldPoint {
  x: number;
  z: number;
}

interface Node {
  gx: number;
  gz: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
  closed: boolean;
}

export class NavGrid {
  public minX: number;
  public maxX: number;
  public minZ: number;
  public maxZ: number;
  public cellSize: number;
  public cols: number;
  public rows: number;
  public walkable: Uint8Array; // 1 = walkable, 0 = blocked
  public obstacles: ObstacleBox[];

  constructor(
    obstacles: ObstacleBox[] = [],
    minX = -72,
    maxX = 72,
    minZ = -72,
    maxZ = 72,
    cellSize = 2.0
  ) {
    this.minX = minX;
    this.maxX = maxX;
    this.minZ = minZ;
    this.maxZ = maxZ;
    this.cellSize = cellSize;
    this.cols = Math.ceil((maxX - minX) / cellSize);
    this.rows = Math.ceil((maxZ - minZ) / cellSize);
    this.walkable = new Uint8Array(this.cols * this.rows);
    this.walkable.fill(1); // Default all walkable
    this.obstacles = obstacles;

    this.bakeObstacles(obstacles);
  }

  public worldToGrid(x: number, z: number): GridPoint {
    const gx = Math.floor((x - this.minX) / this.cellSize);
    const gz = Math.floor((z - this.minZ) / this.cellSize);
    return {
      gx: Math.max(0, Math.min(this.cols - 1, gx)),
      gz: Math.max(0, Math.min(this.rows - 1, gz)),
    };
  }

  public gridToWorld(gx: number, gz: number): WorldPoint {
    return {
      x: this.minX + (gx + 0.5) * this.cellSize,
      z: this.minZ + (gz + 0.5) * this.cellSize,
    };
  }

  public getIndex(gx: number, gz: number): number {
    return gz * this.cols + gx;
  }

  public isWalkable(gx: number, gz: number): boolean {
    if (gx < 0 || gx >= this.cols || gz < 0 || gz >= this.rows) return false;
    return this.walkable[this.getIndex(gx, gz)] === 1;
  }

  public setWalkable(gx: number, gz: number, value: boolean): void {
    if (gx >= 0 && gx < this.cols && gz >= 0 && gz < this.rows) {
      this.walkable[this.getIndex(gx, gz)] = value ? 1 : 0;
    }
  }

  /**
   * Bake obstacles into the grid with an inflation margin
   */
  public bakeObstacles(obstacles: ObstacleBox[], margin = 1.2): void {
    this.obstacles = obstacles;
    this.walkable.fill(1);

    // 1. Mark water boundary (radius > 68m)
    for (let gz = 0; gz < this.rows; gz++) {
      for (let gx = 0; gx < this.cols; gx++) {
        const wp = this.gridToWorld(gx, gz);
        const distFromCenter = Math.hypot(wp.x, wp.z);
        if (distFromCenter > 68) {
          this.setWalkable(gx, gz, false);
        }
      }
    }

    // 2. Mark obstacles (houses, rocks, trees)
    for (const obs of obstacles) {
      // Building and rocks need inflation so bot bounding radius doesn't clip
      const effectiveMargin = obs.type === 'tree' ? 0.6 : margin;
      const minX = obs.minX - effectiveMargin;
      const maxX = obs.maxX + effectiveMargin;
      const minZ = obs.minZ - effectiveMargin;
      const maxZ = obs.maxZ + effectiveMargin;

      const gStart = this.worldToGrid(minX, minZ);
      const gEnd = this.worldToGrid(maxX, maxZ);

      for (let gz = gStart.gz; gz <= gEnd.gz; gz++) {
        for (let gx = gStart.gx; gx <= gEnd.gx; gx++) {
          this.setWalkable(gx, gz, false);
        }
      }
    }
  }

  /**
   * Checks whether a straight line between two world points intersects any obstacle
   */
  public hasLineOfSight(x1: number, z1: number, x2: number, z2: number, sampleStep = 1.0): boolean {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.001) return true;

    const steps = Math.ceil(dist / sampleStep);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const sampleX = x1 + dx * t;
      const sampleZ = z1 + dz * t;
      const grid = this.worldToGrid(sampleX, sampleZ);
      if (!this.isWalkable(grid.gx, grid.gz)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Finds the nearest walkable grid cell if target is currently blocked
   */
  public findNearestWalkable(startGx: number, startGz: number, maxRadius = 8): GridPoint {
    if (this.isWalkable(startGx, startGz)) return { gx: startGx, gz: startGz };

    for (let r = 1; r <= maxRadius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r || Math.abs(dz) === r) {
            const gx = startGx + dx;
            const gz = startGz + dz;
            if (this.isWalkable(gx, gz)) {
              return { gx, gz };
            }
          }
        }
      }
    }
    return { gx: startGx, gz: startGz };
  }

  /**
   * A* Pathfinding Algorithm (8-directional with corner-cutting prevention)
   */
  public findPath(startWorld: WorldPoint, targetWorld: WorldPoint): WorldPoint[] {
    const startGrid = this.worldToGrid(startWorld.x, startWorld.z);
    const targetGrid = this.worldToGrid(targetWorld.x, targetWorld.z);

    // If start is blocked (e.g. spawn near rock), find nearest walkable
    const safeStart = this.findNearestWalkable(startGrid.gx, startGrid.gz);
    // If destination is inside a house, find nearest walkable entrance
    const safeTarget = this.findNearestWalkable(targetGrid.gx, targetGrid.gz);

    // If start and target are the same cell or line of sight is clear, return direct destination
    if (safeStart.gx === safeTarget.gx && safeStart.gz === safeTarget.gz) {
      return [{ x: targetWorld.x, z: targetWorld.z }];
    }

    if (this.hasLineOfSight(startWorld.x, startWorld.z, targetWorld.x, targetWorld.z)) {
      return [{ x: targetWorld.x, z: targetWorld.z }];
    }

    // Heuristic: Octile distance (admissible & consistent for 8-way movement)
    const SQRT2 = Math.SQRT2;
    const heuristic = (gx: number, gz: number): number => {
      const dx = Math.abs(gx - safeTarget.gx);
      const dz = Math.abs(gz - safeTarget.gz);
      return (dx + dz) + (SQRT2 - 2) * Math.min(dx, dz);
    };

    // Open set and Node lookup
    const nodes = new Map<number, Node>();
    const getNode = (gx: number, gz: number): Node => {
      const idx = this.getIndex(gx, gz);
      let node = nodes.get(idx);
      if (!node) {
        node = {
          gx,
          gz,
          g: Infinity,
          h: heuristic(gx, gz),
          f: Infinity,
          parent: null,
          closed: false,
        };
        nodes.set(idx, node);
      }
      return node;
    };

    const startNode = getNode(safeStart.gx, safeStart.gz);
    startNode.g = 0;
    startNode.f = startNode.h;

    // Simple priority queue using array
    const openList: Node[] = [startNode];

    // Neighbor offsets (dx, dz, cost)
    const neighbors = [
      { dx: 1, dz: 0, cost: 1 },
      { dx: -1, dz: 0, cost: 1 },
      { dx: 0, dz: 1, cost: 1 },
      { dx: 0, dz: -1, cost: 1 },
      { dx: 1, dz: 1, cost: SQRT2 },
      { dx: -1, dz: 1, cost: SQRT2 },
      { dx: 1, dz: -1, cost: SQRT2 },
      { dx: -1, dz: -1, cost: SQRT2 },
    ];

    let closestNode = startNode;
    let minH = startNode.h;
    let iterations = 0;
    const maxIterations = 600; // Fast budget

    while (openList.length > 0 && iterations++ < maxIterations) {
      // Find node with lowest f score
      let bestIdx = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[bestIdx].f) {
          bestIdx = i;
        }
      }

      const current = openList[bestIdx];
      openList.splice(bestIdx, 1);
      current.closed = true;

      // Track closest node in case complete path is unreachable
      if (current.h < minH) {
        minH = current.h;
        closestNode = current;
      }

      // Check destination reached
      if (current.gx === safeTarget.gx && current.gz === safeTarget.gz) {
        closestNode = current;
        break;
      }

      // Explore 8 neighbors
      for (const n of neighbors) {
        const nx = current.gx + n.dx;
        const nz = current.gz + n.dz;

        if (!this.isWalkable(nx, nz)) continue;

        // Prevent cutting corners through walls
        if (n.dx !== 0 && n.dz !== 0) {
          if (!this.isWalkable(current.gx + n.dx, current.gz) || !this.isWalkable(current.gx, current.gz + n.dz)) {
            continue;
          }
        }

        const neighborNode = getNode(nx, nz);
        if (neighborNode.closed) continue;

        const tentativeG = current.g + n.cost;
        if (tentativeG < neighborNode.g) {
          neighborNode.parent = current;
          neighborNode.g = tentativeG;
          neighborNode.f = tentativeG + neighborNode.h;

          if (!openList.includes(neighborNode)) {
            openList.push(neighborNode);
          }
        }
      }
    }

    // Reconstruct raw path from closestNode
    const rawPath: WorldPoint[] = [];
    let curr: Node | null = closestNode;
    while (curr) {
      rawPath.push(this.gridToWorld(curr.gx, curr.gz));
      curr = curr.parent;
    }
    rawPath.reverse();

    // Replace the last waypoint with the exact targetWorld point if safe
    if (rawPath.length > 0) {
      rawPath[rawPath.length - 1] = { x: targetWorld.x, z: targetWorld.z };
    }

    // Path smoothing / String pulling
    return this.smoothPath(startWorld, rawPath);
  }

  /**
   * Smooths the A* path by skipping intermediate waypoints if line of sight is clear
   */
  public smoothPath(startWorld: WorldPoint, rawPath: WorldPoint[]): WorldPoint[] {
    if (rawPath.length <= 2) return rawPath;

    const smoothed: WorldPoint[] = [];
    let currentPoint = startWorld;
    smoothed.push(currentPoint);

    let index = 0;
    while (index < rawPath.length - 1) {
      // Find furthest reachable waypoint with line of sight
      let furthest = index + 1;
      for (let next = rawPath.length - 1; next > index; next--) {
        if (this.hasLineOfSight(currentPoint.x, currentPoint.z, rawPath[next].x, rawPath[next].z)) {
          furthest = next;
          break;
        }
      }
      currentPoint = rawPath[furthest];
      smoothed.push(currentPoint);
      index = furthest;
    }

    return smoothed;
  }
}
