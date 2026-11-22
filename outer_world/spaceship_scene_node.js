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
  constructor(id = "spaceship", shader_id = "spaceship_basic") {

    super(id, shader_id);
    this.position = [0, -0.4, -2];
    this.rotation = [0, 0, 0];
    this.scale = [0.8, 0.8, 0.8];
    this.velocity = [0.1, 0.1, 0.1]; // movement speed
    this.rotation_speed = 0.03; // turn speed
    this.center = [...this.position, 1];
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
    this.init_bounding_shape(); // initialize my bounders
    return this;
  } // end init

  update_transformation_matrix(M_parent) {
    const translation = translate(this.position);
    const rotation = rotate(this.rotation);
    const scale_mtx = scale(this.scale);

    const M_local = matMul(translation, rotation, scale_mtx);
    this.transformation_matrix = matMul(M_parent, M_local);
  } // end funcion

  init_bounding_shape() {
    // // TODO: must consider scale
    // let min_z = 1000000; // arbitrary
    // let max_z = -1000000;
    // for (let i = 2; i < this.mesh.vertices.length; i += 3) {
    //   if (this.mesh.vertices[i] < min_z) { min_z = this.mesh.vertices[i]; }
    //   else if (this.mesh.vertices[i] > max_z) { max_z = this.mesh.vertices[i]; }
    // }
    // console.log(min_z, max_z)

    // let min_y = 1000000; // arbitrary
    // let max_y = -1000000;
    // for (let i = 1; i < this.mesh.vertices.length; i += 3) {
    //   if (this.mesh.vertices[i] < min_y) { min_y = this.mesh.vertices[i]; }
    //   else if (this.mesh.vertices[i] > max_y) { max_y = this.mesh.vertices[i]; }
    // }
    // console.log(min_y, max_y)

    // let min_x = 1000000; // arbitrary
    // let max_x = -1000000;
    // for (let i = 0; i < this.mesh.vertices.length; i += 3) {
    //   if (this.mesh.vertices[i] < min_x) { min_x = this.mesh.vertices[i]; }
    //   else if (this.mesh.vertices[i] > max_x) { max_x = this.mesh.vertices[i]; }
    // }
    // console.log(min_x, max_x)


    this.bounding_shape = []
    // TODO
    const right_wing = new SceneBuilder.BoundingSphere({
      center_x:  0.675 * this.scale[0],
      center_y:  0 * this.scale[1],
      center_z:  (-1 + this.center[2]) * this.scale[2],
      radius: (0.7 * this.scale[0]) // TODO don't like this, for tesing only
    });
    const left_wing = new SceneBuilder.BoundingSphere({
      center_x:  -0.675 * this.scale[0],
      center_y:  0 * this.scale[1],
      center_z:  (-1 + this.center[2]) * this.scale[2],
      radius: (0.7 * this.scale[0]) // TODO don't like this, for tesing only
    });
    // TODO this needs to account for rotation here haha
    const nose = new SceneBuilder.BoundingSphere({
      center_x:  0 * this.scale[0],
      center_y:  0.2 * this.scale[1],
      center_z:  (-2.5 + this.center[2]) * this.scale[2],
      radius: (0.5 * this.scale[0]) 
    });

    this.bounding_shape.push(right_wing);
    this.bounding_shape.push(left_wing);
    this.bounding_shape.push(nose);
  }
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