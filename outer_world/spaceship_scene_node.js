import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";
import { mat4Identity, matMul, translate, rotate, scale, deg_to_rad } from '../util/transitions.js';

/**
 * SpaceshipSceneNode
 * A flyable spaceship that lives in the outer space scene.
 * Nose faces -Z (away from camera in third-person view).
 * Scale it via display_scale to fit whatever scene you drop it into.
 */
export class SpaceshipSceneNode extends SceneBuilder.SceneNode {
  
  constructor(id="spaceship", shader="spaceship_basic") {
    super(id, shader);

    this.position = [0, 0, -5]; // base translation to my place in world
    this.rotation = [deg_to_rad(20), 0, 0]; // rotation for effect
    this.scale = [0.8, 0.8, 0.8]; // scale down

    this.center = [...this.position, 1]; // this will ALWAYS be static on scene!
    this.velocity = [0.1, 0.1, 0.1]; // velocity in each direction (can tweak of course :) )
    this.rotation_speed = 0.03; // controls the rotation speed left/right 

    // TODO
    this.bounding_shape = new SceneBuilder.BoundingSphere({
      center_x:  this.center[0],
      center_y:  this.center[1],
      center_z:  this.center[2],
      radius: 0.5 // TODO don't like this, for tesing only
    });
  }

  init(gl) {
    const mesh = new SceneBuilder.Mesh(
        gl,
        { ...MeshBuilder.gen_spaceship_mesh(), mapping: -1 }
    );
    const material = new SceneBuilder.Material({
      "ka":        [0.6, 0.6, 0.6],
      "kd":        [0.8, 0.8, 0.8],
      "ks":        [1.0, 1.0, 1.0],
      "shininess": 128
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
  shader_id = "spaceship_basic",
} = {}) {

  const node = new SpaceshipSceneNode("spaceship", shader_id);
  node.position = position;
  node.display_scale = display_scale;

  const mesh = new SceneBuilder.Mesh(
      renderer.gl,
      MeshBuilder.gen_spaceship_mesh() // grey default color; pass [r,g,b] to tint
  );

  const material = new SceneBuilder.Material({
    "ka":        [0.6, 0.6, 0.6],
    "kd":        [0.8, 0.8, 0.8],
    "ks":        [1.0, 1.0, 1.0],
    "shininess": 128
  });

  node.set_mesh(mesh).set_material(material);
  return node;
} // end function