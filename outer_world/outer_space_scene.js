import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";

export class OuterSpaceScene extends SceneBuilder.Scene {
  
  constructor() {
      super(); // takes care of base initialization fields.
  
      // do whatever y'all want here, but, like, this sorta shit. these are all the root nodes of a scene.
      // they can be a straight up scene node or group scene node, whatever makes more sense to yall.

      // WIP
      this.sun = null;
      this.earth = null; 
      // this.
     
    }
  
    /**
     * init call for the scene. this allows construction of the scene
     * while deferring any heavy loading to the init call when the time
     * comes to actually use the scene. 
     * in this case, we're setting up the renderer through parent class,
     * setting camera, adding a basic point light, and initializing some shitty boids.
     */
    init(renderer=null, aspect=1) {
      super.init(renderer); // let the parent take care of basic bookeeping
  
      // // init some shitty basics, lights, camera
      // this.set_camera(new SceneBuilder.PerspectiveCamera({
      //   "aspect": aspect, // since my canvas is not square
      // }))
  
      // // add some light to the scene.
      // this.add_light(new SceneBuilder.PointLight({"position": [0, 5, 5]}));
  
      // // TODO: init wasm module here?
      // // initialize all nodes, bookeeping, etc in the scene.
      // // can give num boids -> comes from module?
      // this.init_boids();
    } // end function
  
    /**
     * called once every rendering call from index.html.
     * this is where any global game logic, scene component updates
     * should be occurring that need per-render-call updates.
     */
    render(keys_pressed={}) {
      // yada yada, do whatever the scene needs to do at a global scale,
      // such as run collision detection with player, did i hit a boid, etc.
     
      super.render();  // let the renderer do it's draw thing
    } // end function


} // end class