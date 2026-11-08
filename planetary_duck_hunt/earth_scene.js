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

  init(renderer=null, aspect=1) {
    super.init(renderer); // let the parent take care of basic bookeeping

    // init some shitty basics, lights, camera
    this.set_camera(new SceneBuilder.PerspectiveCamera({
      "aspect": aspect, // since my canvas is not square
    }))

    // add some light to the scene.
    this.add_light(new SceneBuilder.PointLight({"position": [0, 5, 5]}));

    // TODO: init wasm module here?
    // initialize all nodes, bookeeping, etc in the scene.
    // can give num boids -> comes from module?
    this.init_boids();
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
      boid.init(this.renderer.gl); // need gl context for mesh sadly, so passing from the renderer for now.
      
      // below is a proof of concept of positioning. obv will be set by wasm shtuff.
      const x = (Math.random() * 5) - 1; // -1 -> 1
      const y = (Math.random() * 5) - 1; // -1 -> 1
      let z = (Math.random() * 2) - 1; // -1 -> 1
      if (this.camera instanceof SceneBuilder.PerspectiveCamera) {
        // shove back the boid a bit -- z dimension matters here, if at z=0 it'll look like nothing's there.
        z = -(Math.random() * 10) - 10; // -10 -> -20
      } // end if
      boid.position = [x, y, z];
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