import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";

export class EarthScene extends SceneBuilder.Scene {

  constructor() {
    super(); // takes care of base initialization fields.

    // do whatever y'all want here, but, like, this sorta shit. these are all the root nodes of a scene.
    this.boids = null;
    // this.player = null;
    // this.ground = null;
    // this.sky = null;
  }

  init(renderer=null) {
    // TODO: init wasm module here?
    // initialize all nodes, bookeeping, etc in the scene.
    this.init_boids();

    super.init(renderer); // let the parent take care of basic bookeeping
  } // end function

  /**
   * initialize the boids scene nodes, grouped by a dummy node.
   * right now, they're just the baseline nodes, but if you need to do a like, 
   * class Boids extends SceneNode
   * and customize, go wild -- it's very possible this will be needed to 
   * do more interesting things in the update_transformation_matrix which by default just does a TRS.
   */
  init_boids(num_boids=5) {
    // const boid_group = new SceneBuilder.SceneNode("boid_group");
    const boid_mesh = new SceneBuilder.Mesh(gl, MeshBuilder.gen_cone_mesh()); // generate a basic cone mesh for now
    const boid_material = new SceneBuilder.Material({ // create a material (this is the constants for silver as place holder)
        "ka": [0.19225, 0.19225, 0.19225],
        "kd": [0.50754, 0.50754, 0.50754],
        "ks": [0.508273, 0.508273, 0.508273],
        "shininess": 51.2,
        "transparency": 1.0
    });

    let boid = null;
    for (let i = 0; i < num_boids; i++) {
      // the id -> can map to idx from wasm module, but for now, using i to illustrate.
      boid = new SceneBuilder.SceneNode(`${i}`, "phong_basic"); // set up a simple hierarchy
      boid.set_mesh(boid_mesh).set_material(boid_material)
    } // end loop

  } // end function

  render(keys_pressed={}) {
    // yada yada, do whatever the scene needs to do at a global scale,
    // such as run collision detection with player, did i hit a boid, etc.
   
    super.render();  // let the renderer do it's draw thing
  } // end function

} // end class