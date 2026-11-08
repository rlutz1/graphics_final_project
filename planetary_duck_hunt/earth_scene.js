import * as SceneBuilder from "../util/scene_graph.js";
import { BoidSceneNode } from "./boid_scene_node.js";

export class EarthScene extends SceneBuilder.Scene {

  constructor() {
    super(); // takes care of base initialization fields.

    // do whatever y'all want here, but, like, this sorta shit. these are all the root nodes of a scene.
    // they can be a straight up scene node or group scene node, whatever makes more sense to yall.
    this.boids = null;
    // this.player = null;
    // this.ground = null;
    // this.sky = null;
    // ...
  }

  init(renderer=null) {
    // TODO: init wasm module here?
    // initialize all nodes, bookeeping, etc in the scene.
    // can give num boids -> comes from module?
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
    this.boids = new SceneBuilder.GroupSceneNode(); // grouper node to keep it a little more organized
    let boid;

    for (let i = 0; i < num_boids; i++) {
      // the id -> can map to idx from wasm module, but for now, using i to illustrate.
      boid = new BoidSceneNode(`${i}`, "phong_basic"); // set up a simple hierarchy
      this.boids.add_child(boid); // add boid as child of a dummy grouper node
    } // end loop

    this.add_node(this.boids); // add grouper node as a root node of the scene.
  } // end function

  render(keys_pressed={}) {
    // yada yada, do whatever the scene needs to do at a global scale,
    // such as run collision detection with player, did i hit a boid, etc.
   
    super.render();  // let the renderer do it's draw thing
  } // end function

} // end class