import * as SceneBuilder from "../util/scene_graph.js";
import * as PlanetBuilder from "./planet_scene_node.js"
import { mat4Identity, matMul, translate, rotate, scale, mat4FromRows, multiplyMat4Vec4 } from '../util/transitions.js';

/**
 * obstacles to throw on the scene.
 */

export class ObstacleSceneNode extends SceneBuilder.SceneNode {
  constructor(id="obstacle", shader_id="planet_basic") {
    super(id, shader_id);
  }
} // end class

/**
 * for a basic asteroid creation.
 * treated like tiny rocky planets
 * 
 * width: 15,000,000,000  (~150e+8 km)
 * dist from sun: 329,100,000 km (3.291e+8 km)
 */
export class AsteroidObstacle extends PlanetBuilder.PlanetSceneNode {
  constructor(id="asteroid", shader_id="planet_basic", data=null) {
    super(id, shader_id, data);
  }
}