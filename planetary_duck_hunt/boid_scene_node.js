import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";

/**
 * this is basically the body of the boid. you could add wings as children
 * or something (BoidWingSceneNode, for example), but this would be the base. 
 * this is what should get the flocking information from the C code:
 * idx, position, velocity, acceleration, etc. 
 */
export class BoidSceneNode extends SceneBuilder.SceneNode {
  constructor(id=null, shader_id="phong_basic") {
    super(id, shader_id); // takes care of some baseline stuff for now.
    // these are the hooks specific to the boid.
    // default super call sets up: this.position = [0, 0, 0]
    this.idx = null; // or this.idx = atoi(id), know what i mean?
    this.velocity = [0, 0, 0];
    this.acceleration = [0, 0, 0];

    this.init(); // init myself a mesh, etc....
  } // end constructor
  
  /**
   * --------------------------------------
   * functions
   * --------------------------------------
   */

  /**
   * change however you deem fit. can also set up a hierarchy here for wings or
   * WHATEVER.
   */
  init() {
    const boid_mesh = new SceneBuilder.Mesh(gl, MeshBuilder.gen_cone_mesh()); // generate a basic cone mesh for now
    const boid_material = new SceneBuilder.Material({ // create a material (this is the constants for silver as place holder)
        "ka": [0.19225, 0.19225, 0.19225],
        "kd": [0.50754, 0.50754, 0.50754],
        "ks": [0.508273, 0.508273, 0.508273],
        "shininess": 51.2,
        "transparency": 1.0
    }); 

    // set my mesh and material.
    this.set_mesh(boid_mesh).set_material(boid_material);
  } // end function

  /**
   * update my transformation dumbly, simply calculate:
   * M_world_child = M_world_parent * M_local_child.
   * if want to change, extend the SceneNode and override, but you MUST
   * set the transformation_matrix, otherwise nothing will happen/
   * incorrect renderiing.
   */
  update_transformation_matrix(M_parent) {
    // change any trajectory via this.
    // this is where you could have conditional
    // "if velocity is -x do this kind of rotation"
    // sort of things. 
    const translation = translate(this.position);
    const rotation = rotate(this.rotation);
    const scale_mtx = scale(this.scale);

    // my local transformations
    const M_local = matMul(translation, rotation, scale_mtx);

    // add my transformations to the world's
    this.transformation_matrix = matMul(M_parent, M_local);
  } // end function

} // end class