import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateNavigationPluginAsync } from '@babylonjs/addons/navigation/factory/factory.single-thread';
import type { RecastNavigationJSPluginV2 } from '@babylonjs/addons/navigation/plugin/RecastNavigationJSPlugin';
import * as Core from '@recast-navigation/core';
import * as Generators from '@recast-navigation/generators';
import createWasm from '@recast-navigation/wasm/wasm';
import wasmUrl from '../node_modules/@recast-navigation/wasm/dist/recast-navigation.wasm.wasm?url';
import type { NavAgent, Navigation, Vec } from './gameplay';

const finite = (p: Vec) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
const horizontal = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.z - b.z);
let initialization: Promise<void> | undefined;

/** Owns a single static navmesh; every actor carries its current polygon reference. */
export class NavigationService implements Navigation {
  static activeInstances = 0;
  private disposed = false;
  private constructor(private readonly plugin: RecastNavigationJSPluginV2) {}

  static async create(meshes: AbstractMesh[]): Promise<NavigationService> {
    initialization ??= (async () => {
      await Core.init((() => createWasm({ locateFile: () => wasmUrl })) as typeof createWasm);
    })().catch(error => { initialization = undefined; throw error; });
    await initialization;
    const plugin = await CreateNavigationPluginAsync({ instance: { ...Core, ...Generators } });
    try {
      if (!meshes.length || meshes.some(mesh => !(mesh instanceof Mesh))) throw new Error('Navigation requires geometry meshes');
      const result = plugin.createNavMesh(meshes as Mesh[], {
        cs: 0.1, ch: 0.05,
        // Recast uses voxel counts, not metres, for clearance and climb.
        walkableRadius: 3, walkableHeight: 36, walkableClimb: 2,
        walkableSlopeAngle: 45, maxEdgeLen: 120, maxSimplificationError: 0.5,
        minRegionArea: 1, mergeRegionArea: 20, maxVertsPerPoly: 6,
        detailSampleDist: 6, detailSampleMaxError: 1,
        tileSize: 0, maxObstacles: 0, keepIntermediates: false,
      });
      if (!result) throw new Error('Navigation mesh generation failed');
      NavigationService.activeInstances++;
      return new NavigationService(plugin);
    } catch (error) { plugin.dispose(); throw error; }
  }

  private complete(status: number): boolean {
    return !(status & (Core.Detour.DT_PARTIAL_RESULT | Core.Detour.DT_BUFFER_TOO_SMALL | Core.Detour.DT_OUT_OF_NODES));
  }

  private validateAgent(agent: NavAgent): boolean {
    if (this.disposed || !finite(agent.position) || !agent.ref || !this.plugin.navMesh?.isValidPolyRef(agent.ref)) return false;
    const closest = this.plugin.navMeshQuery.closestPointOnPoly(agent.ref, agent.position);
    return closest.success && horizontal(closest.closestPoint, agent.position) < 0.002
      && Math.abs(closest.closestPoint.y - agent.position.y) < 0.15;
  }

  spawn(point: Vec): NavAgent {
    if (this.disposed || !finite(point)) throw new Error('Invalid navigation point');
    const nearest = this.plugin.navMeshQuery.findNearestPoly(point, { halfExtents: { x: 0.08, y: 0.15, z: 0.08 } });
    // Only tolerate float rounding horizontally, and voxelized floor height vertically.
    if (!nearest.success || !nearest.nearestRef || !nearest.isOverPoly
      || horizontal(point, nearest.nearestPoint) > 0.002 || Math.abs(point.y - nearest.nearestPoint.y) > 0.15) {
      throw new Error('Point is outside the walkable navigation surface');
    }
    return { position: { ...nearest.nearestPoint }, ref: nearest.nearestRef };
  }

  path(agent: NavAgent, target: Vec): Vec[] {
    if (!this.validateAgent(agent)) throw new Error('Invalid current navigation polygon');
    const end = this.spawn(target);
    const query = this.plugin.navMeshQuery;
    const corridor = query.findPath(agent.ref, end.ref, agent.position, end.position, { maxPathPolys: 512 });
    try {
      if (!corridor.success || !this.complete(corridor.status) || !corridor.polys.size
        || corridor.polys.get(corridor.polys.size - 1) !== end.ref) throw new Error('Target is unreachable');
      const straight = query.findStraightPath(agent.position, end.position, corridor.polys, { maxStraightPathPoints: 512 });
      try {
        const count = straight.straightPathCount;
        if (!straight.success || !this.complete(straight.status) || !count
          || !(straight.straightPathFlags.get(count - 1) & Core.Detour.DT_STRAIGHTPATH_END)) throw new Error('Incomplete navigation path');
        const points: Vec[] = [];
        for (let i = 0; i < count; i++) points.push({
          x: straight.straightPath.get(i * 3), y: straight.straightPath.get(i * 3 + 1), z: straight.straightPath.get(i * 3 + 2),
        });
        if (points.some(p => !finite(p)) || horizontal(points[count - 1], end.position) > 0.002) throw new Error('Incomplete navigation endpoint');
        return points.slice(1);
      } finally {
        straight.straightPath.destroy(); straight.straightPathFlags.destroy(); straight.straightPathRefs.destroy();
      }
    } finally { corridor.polys.destroy(); }
  }

  move(agent: NavAgent, delta: Vec): boolean {
    if (!finite(delta) || !this.validateAgent(agent)) return false;
    const length = Math.hypot(delta.x, delta.z);
    // The motor only accepts bounded incremental steps, never a destination jump.
    if (length < 1e-9 || length > 0.25 || Math.abs(delta.y) > 1e-9) return false;
    const query = this.plugin.navMeshQuery;
    const result = query.moveAlongSurface(agent.ref, agent.position, {
      x: agent.position.x + delta.x, y: agent.position.y, z: agent.position.z + delta.z,
    }, { maxVisitedSize: 32 });
    if (!result.success || !this.complete(result.status) || !result.visited.length || !finite(result.resultPosition)) return false;
    const ref = result.visited[result.visited.length - 1];
    // Detour can round a curved contour step outward by fractions of a mm.
    // Match validateAgent's 2 mm surface tolerance; retain the bounded step,
    // visited-polygon checks and height checks, without any global snapping.
    const surfaceTolerance = 0.002;
    if (!ref || !this.plugin.navMesh?.isValidPolyRef(ref)
      || horizontal(agent.position, result.resultPosition) > length + surfaceTolerance) return false;
    const floor = query.getPolyHeight(ref, result.resultPosition);
    let position = { ...result.resultPosition, y: floor.height };
    if (!floor.success) {
      // Detour's height query can classify an exact contour vertex as outside.
      // Resolve that boundary on the polygon already visited by this move;
      // never search for a different polygon or snap a destination globally.
      const boundary = query.closestPointOnPoly(ref, result.resultPosition);
      if (!boundary.success || horizontal(boundary.closestPoint, result.resultPosition) > 0.0001) return false;
      position = { ...boundary.closestPoint };
    }
    if (!finite(position) || Math.abs(position.y - agent.position.y) > 0.15
      || horizontal(agent.position, position) > length + surfaceTolerance) return false;
    agent.position = position;
    agent.ref = ref;
    return true;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    NavigationService.activeInstances--;
    this.plugin.dispose();
  }
}
