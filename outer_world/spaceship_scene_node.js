import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";
import { mat4Identity, matMul, translate, rotate, scale } from '../util/transitions.js';

/**
 * SpaceshipSceneNode
 * A flyable spaceship that lives in the outer space scene.
 * Nose faces -Z (away from camera in third-person view).
 * Scale it via display_scale to fit whatever scene you drop it into.
 */
export class SpaceshipSceneNode extends SceneBuilder.SceneNode {
  constructor(id = "spaceship", shader_id = "planet_basic") {
    super(id, shader_id);
    this.position = [0, 0, -10];
    this.rotation = [0, 0, 0];
    this.scale = [0.8, 0.8, 0.8];
    this.velocity = [0.1, 0.1, 0.1]; // movement speed
    this.rotation_speed = 0.03; // turn speed
  }

  init(gl) {
    const mesh = new SceneBuilder.Mesh(
        gl,
        { ...MeshBuilder.gen_spaceship_mesh(), mapping: -1 }
    );
    const material = new SceneBuilder.PlanetMaterial({
      "ka":        [0.6, 0.6, 0.6],  // much higher ambient
      "kd":        [0.8, 0.8, 0.8],
      "ks":        [1.0, 1.0, 1.0],
      "shininess": 128,
      "metallic":  0.8,
      "emissive":  0.3,              // slight glow so colors show
      "flat":      false,
    });
    this.set_mesh(mesh).set_material(material);
    return this;
  } // end init

  update_transformation_matrix(M_parent) {
    const translation = translate(this.position);
    const rotation = rotate(this.rotation);
    const scale_mtx = scale(this.scale);

    const M_local = matMul(translation, rotation, scale_mtx);
    this.transformation_matrix = matMul(M_parent, M_local);
  } // end funcion
} // end class

/**
 * buildSpaceship
 * Convenience factory — creates the node, mesh, and material in one call.
 * Pass the renderer (for the gl context) and optional overrides.
 *
 * Usage in outer_space_scene.js:
 *   import { buildSpaceship } from "./spaceship_scene_node.js";
 *   const ship = buildSpaceship(this.renderer);
 *   this.add_node(ship);
 */
export function buildSpaceship(renderer, {
  position = [0, 0.5, -8],
  display_scale = 0.8,
  shader_id = "planet_basic",
} = {}) {

  const node = new SpaceshipSceneNode("spaceship", shader_id);
  node.position = position;
  node.display_scale = display_scale;

  const mesh = new SceneBuilder.Mesh(
      renderer.gl,
      MeshBuilder.gen_spaceship_mesh() // grey default color; pass [r,g,b] to tint
  );

  const material = new SceneBuilder.PlanetMaterial({
    "ka":        [0.6, 0.6, 0.6],  // much higher ambient
    "kd":        [0.8, 0.8, 0.8],
    "ks":        [1.0, 1.0, 1.0],
    "shininess": 128,
    "metallic":  0.8,
    "emissive":  0.3,              // slight glow so colors show
    "flat":      false,
  });

  node.set_mesh(mesh).set_material(material);
  return node;
} // end function