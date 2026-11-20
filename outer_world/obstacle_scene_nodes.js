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

