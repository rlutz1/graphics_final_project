import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";
import { BoidSceneNode } from "./boid_scene_node.js";

/**
 * a basic earth scene.
 */
export class EarthScene extends SceneBuilder.Scene {

  constructor() {
    super(); // takes care of base initialization fields.

    // do whatever y'all want here, but, like, this sorta shit. these are all the root nodes of a scene.
    // they can be a straight up scene node or group scene node, whatever makes more sense to yall.
    this.boids = null; // this will end up being a dummy root node to hold all the boids. easier access here though than going through root node list.
    // makes killing boids easier and also makes easy access to boid positions
    this.boidNodes = []
    this.lastFrameTime = null;
    // this.player = null;
    // this.ground = null;
    // this.sky = null;
    // ...
  }

  /**
   * init call for the scene. this allows construction of the scene
   * while deferring any heavy loading to the init call when the time
   * comes to actually use the scene. 
   * in this case, we're setting up the renderer through parent class,
   * setting camera, adding a basic point light, and initializing some shitty boids.
   */
  // MUST BE ASYNCHRONOUS FOR LOADING WASM
  async init(renderer=null, aspect=1) {
    super.init(renderer); // let the parent take care of basic bookeeping

    // init some shitty basics, lights, camera
    this.set_camera(new SceneBuilder.PerspectiveCamera({
      "aspect": aspect, // since my canvas is not square
    }))

    // add some light to the scene.
    this.add_light(new SceneBuilder.PointLight({"position": [0, 5, 5]}));

    this.Module = await createWASMModule();
    this.Module._initializeBoids();
    let numBoids = this.Module._getNumBoids();
    // initialize all nodes, bookeeping, etc in the scene.
    this.boidDim = this.Module._getDim();
    const numPositions = numBoids * this.boidDim;
    this.boidPositions = new Float32Array(this.Module.HEAPU8.buffer, this.Module._getBoidPositions(), numPositions);
    this.boidVelocities = new Float32Array(this.Module.HEAPU8.buffer, this.Module._getBoidVelocities(), numPositions);
    this.init_boids(numBoids);
  } // end function

  /**
   * initialize the boids scene nodes, grouped by a dummy node.
   * right now, they're just the baseline nodes, but if you need to do a like, 
   * class Boids extends SceneNode
   * and customize, go wild -- it's very possible this will be needed to 
   * do more interesting things in the update_transformation_matrix which by default just does a TRS.
   */
  init_boids(num_boids) {
    this.boids = new SceneBuilder.GroupSceneNode(); // grouper node to keep it a little more organized
    let boid;

    // making these here because these can be shared amongst all boids in this group,
    // avoiding buffer duplication
    const boid_mesh = new SceneBuilder.Mesh(this.renderer.gl, MeshBuilder.gen_cone_mesh()); // generate a basic cone mesh for now
    const boid_material = new SceneBuilder.Material({ // create a material (this is the constants for silver as place holder)
        "ka": [0.19225, 0.19225, 0.19225],
        "kd": [0.50754, 0.50754, 0.50754],
        "ks": [0.508273, 0.508273, 0.508273],
        "shininess": 51.2,
        "transparency": 1.0
    }); 

    for (let i = 0; i < num_boids; i++) {
      // the id -> can map to idx from wasm module, but for now, using i to illustrate.
      boid = new BoidSceneNode(`${i}`, "phong_basic"); // set up a simple hierarchy
      boid.init(boid_mesh, boid_material, null); // init the nodes with their assets
      
      // below is a proof of concept of positioning. obv will be set by wasm shtuff.
      const x = this.boidPositions[(i * this.boidDim)];
      const y = this.boidPositions[(i * this.boidDim) + 1];
      const z = this.boidPositions[(i * this.boidDim) + 2];

      /* GONNA HAVE TO ADDRESS THIS LATER AS IT INTERFERES WITH SIMUALATION
      if (this.camera instanceof SceneBuilder.PerspectiveCamera) {
        // shove back the boid a bit -- z dimension matters here, if at z=0 it'll look like nothing's there.
        z = -(Math.random() * 10) - 10; // -10 -> -20
      } // end if */

      boid.position = [x, y, z];
      this.boidNodes.push(boid);
      this.boids.add_child(boid); // add boid as child of a dummy grouper node
    } // end loop

    this.add_node(this.boids); // add grouper node as a root node of the scene.
  } // end function

  /**
   * called once every rendering call from index.html.
   * this is where any global game logic, scene component updates
   * should be occurring that need per-render-call updates.
   */
  render(keys_pressed={}) {
    console.log("EarthScene render called");
    const now = performance.now();

    if (this.lastFrameTime !== null) {
      console.log(this.boidPositions.slice(0, 3));
      const delT = (now - this.lastFrameTime) / 1000.0;
      console.log(this.boidPositions.slice(0, 3));
      this.Module._advanceBoids(delT);
      this.update_boids();
    }
    // yada yada, do whatever the scene needs to do at a global scale,
    // such as run collision detection with player, did i hit a boid, etc.
    this.lastFrameTime = now;
    super.render();  // let the renderer do it's draw thing
  } // end function

  // just grab new coordinates
  update_boids() {
    for (let i = 0; i < this.boidNodes.length; i++) {
      const offset = i * this.boidDim;

      this.boidNodes[i].position = [
        this.boidPositions[offset],
        this.boidPositions[offset + 1],
        this.boidPositions[offset + 2]
      ];
    }
}

} // end class