import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";
import { BoidSceneNode } from "./boid_scene_node.js";
import { BumpyLandSceneNode } from "./terrain_shiz.js"; // import terrain for the land 
import { multiplyMat4Vec4 } from "../util/transitions.js"; 

/**
 * a basic earth scene.
 */
export class EarthScene extends SceneBuilder.Scene {

  constructor() {
    super(); // takes care of base initialization fields.
    this.name = "Earth";

    this.boids = null; // dummy root node to hold all the boids
    // ADDED BY THEO TO HOLD BOIDS AND ANIMATE MOVEMENT
    this.boidNodes = [];
    this.deadBirds = [];
    this.lastFrameTime = null;
    
    // init fields for the earth terrain
    this.terrain = null; // dummy root for terrain
    this.sky_color = [0.5, 0.7, 0.92] // set sky color
    this.eye_height = 1.5; // how high camera floats ** MAY WANT TO CHANGE
    this.walk_speed = 10.0; // ??? test see if good 
    this.turn_speed = 2; // test val
    this.last_time = null;

    // create a sun w/ set position --> test and change later
    this.sun = null; // for light source
    this.sun_pos = [100, 100, 100]; //sun position in sky

    this.cleared = false; // for basic game logic
    this.totalBoids = Infinity; // same here
    this.boidsLeft = this.totalBoids;
    this.totalBoidsUiEl = null; // ui updater im allowed to have
  }

  /**
   * init call for the scene. this allows construction of the scene
   * while deferring any heavy loading to the init call when the time
   * comes to actually use the scene. 
   * in this case, we're setting up the renderer through parent class,
   * setting camera, adding a basic point light, and initializing some shitty boids.
   */
  // THEO MADE ASYNCHRONOUS TO LOAD BOIDS
  async init(renderer=null, aspect=1) {
    super.init(renderer); // let the parent take care of basic bookeeping

    // init some shitty basics, lights, camera
    this.set_camera(new SceneBuilder.SpaceCamera({
      "aspect": aspect, // since my canvas is not square
      "fov": Math.PI / 3, // make it a bit wider --> can change but want to try
      "far": 400 // test and change if needed 
    }))

    // add some light to the scene --> use sun & sun position
    this.sun = this.add_light(new SceneBuilder.PointLight({"position": [...this.sun_pos]}))
    
    // init the terrain 
    this.init_terrain();
    
    // ADDED BY THEO TO INIT BOIDS
    this.Module = await createWASMModule();
    this.Module._initializeBoids();
    this.totalBoids = this.Module._getNumBoids();
    this.boidDim = this.Module._getDim();
    const numPositions = this.totalBoids * this.boidDim;
    this.boidPositions = new Float32Array(this.Module.HEAPU8.buffer, this.Module._getBoidPositions(), numPositions);
    this.boidVelocities = new Float32Array(this.Module.HEAPU8.buffer, this.Module._getBoidVelocities(), numPositions);
    this.init_boids(this.totalBoids);

    this.totalBoidsUiEl.innerText = `Birds Remaining: ${this.totalBoids}`; // all boids still here
    this.boidsLeft = this.totalBoids; // for the ui stuff
    this.initialized = true; // set for transition logic in index.html
  } // end function

  /**
   * Initialize the terrain as a new BumpyLand
   * This will create new bumpy land node, build mesh, & add node
   * Once Terrain is init, the camera can be "positioned" @ origin based
   * on terrain ground level
   */
  init_terrain() {
    // allocate new bumby land for eath to terrain
    this.terrain = new BumpyLandSceneNode("earth", "bumpyland_basic"); // do ,{} inside to add specs later
    // init & build mesh from bumpyland
    this.terrain.init(this.renderer.gl); 
    // add terrain to the scene 
    this.add_node(this.terrain);

    // call function to shift camera to ground level
    this.camera_level();
  }

  /**
   * Shift the planent up/down based on height of the terrain at location
   * Takes eye-height into consideration
   */
  camera_level(){
    // find current point on planet under the camera
    const point_under_cam = this.terrain.vector_to_planet_point([0, 1, 0]); 
    const ground = this.terrain.radius + this.terrain.height_at(point_under_cam);
    this.terrain.position = [0, -(ground + this.eye_height), 0]; // shift planet based on terrain and eye height
  }


/**
   * turning & looking --> same from outer space
   * a/d change yaw ;; mouse changes pitch
   */
  update_perspective(frontend_data, dt) {
    let pitch = this.camera.rotate[0];
    let yaw = this.camera.rotate[1];

    // if(frontend_data.a) yaw -= this.turn_speed * dt; // turning left
    // if(frontend_data.d) yaw += this.turn_speed * dt; // turn right

    // yaw %= 2 * Math.PI;

    // y of the mouse on the canvas --> allow looking up or down 
    if(frontend_data.mouse_y !== undefined){
      const normalized_y = (2 * frontend_data.mouse_y / frontend_data.canvas_height) - 1;
      const max_pitch = Math.PI / 2 - 0.01;
      pitch = normalized_y * max_pitch;
    }

    if (frontend_data.mouse_x !== undefined) {
      const normalized_x = (2 * frontend_data.mouse_x / frontend_data.canvas_width) - 1;
      const max_pitch = Math.PI - 0.01;
      yaw = normalized_x * max_pitch;
    }

    this.camera.rotate = [pitch, yaw, 0];
  }

  /**
   * Update the terrain (ROLL) when walking 
   * Same idea with outterspace but plannet needs to roll not shift
   */
  walk_update(frontend_data, dt){
    let direction = 0;
    if (frontend_data.w) direction -= 1;
    if (frontend_data.s) direction += 1;
    if (direction === 0) return;
    const pitch = this.camera.rotate[0];
    const yaw = this.camera.rotate[1];

    const forward = [Math.sin(yaw), 0, -Math.cos(yaw)]; //where the camera faces 

    const forward_x = -Math.sin(yaw) * Math.cos(pitch);
    const forward_y = Math.sin(pitch);
    const forward_z = Math.cos(yaw) * Math.cos(pitch); // flipping sign on this

    // const axis = [-forward[2], 0, forward[0]]; // forward x up 
    // const axis = [forward_x, 0, forward_z]
    const axis = [-forward_z, 0, forward_x]

    const angle = direction * (this.walk_speed * dt) / this.terrain.radius;

    // call roll to account for walking 
    this.terrain.roll(axis, angle);
  }

  /**
   * Update the light relative to position of the camera
   * the camera is constantly moving thus the light will need to change in acordance 
   */
  update_sun(){
    const view = this.camera.get_view_matrix();
    const p = multiplyMat4Vec4(view, [...this.sun_pos, 1]);
    this.sun.position = [p[0], p[1], p[2]];
  }

  /**
   * initialize the boids scene nodes, grouped by a dummy node.
   * right now, they're just the baseline nodes, but if you need to do a like, 
   * class Boids extends SceneNode
   * and customize, go wild -- it's very possible this will be needed to 
   * do more interesting things in the update_transformation_matrix which by default just does a TRS.
   */
  // COMPLETELY REPLACED BY THEO
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
    const texture = new SceneBuilder.Texture(this.renderer.gl, "./textures/skin.png");

    for (let i = 0; i < num_boids; i++) {
      boid = new BoidSceneNode(`${i}`, "texture_bump_mapping_basic"); // set up a simple hierarchy
      boid.init(boid_mesh, boid_material, texture); // init the nodes with their assets
      
      
      const x = this.boidPositions[(i * this.boidDim)];
      const y = this.boidPositions[(i * this.boidDim) + 1];
      const z = this.boidPositions[(i * this.boidDim) + 2];

      const vx = this.boidVelocities[(i * this.boidDim)];
      const vy = this.boidVelocities[(i * this.boidDim) + 1];
      const vz = this.boidVelocities[(i * this.boidDim) + 2];

      const scale = 1.5;

      boid.position = [scale*x, y+(this.terrain.radius+1), scale* z];
      boid.rotation = this.velocityToRotation(vx, vy, vz);
      this.boidNodes.push(boid);
      this.boids.add_child(boid); // add boid as child of a dummy grouper node
    } // end loop

    this.terrain.add_child(this.boids);
  } // end function
  // HELPER ADDED BY THEO TO ROTATE CONES
  velocityToRotation(vx, vy, vz) {
    const mag = Math.sqrt(vx*vx + vy*vy + vz*vz);

    if (mag < 1e-6) return null;

    // Normalize velocity
    vx /= mag;
    vy /= mag;
    vz /= mag;

    // Rotate around X to account for vertical component
    const rx = Math.atan2(vz, Math.sqrt(vx*vx + vy*vy));

    // Rotate around Z to account for horizontal direction
    const rz = -Math.atan2(vx, vy);

    return [rx, 0, rz];
  }

  /**
   * creating earth terrain (trying to atleast :P)
   * will create a sphere from the scenebuilder and need to adjust the mesh 
   * to create bumps 
   * will probably add functions to scene builder for the bumbs and landscape stuff 
   */

  /**
   * called once every rendering call from index.html.
   * this is where any global game logic, scene component updates
   * should be occurring that need per-render-call updates.
   */
  // THEO modified a bit here, mostly changed camera mechanics, then reverted 
  // back cause im too stupid 
  render(frontend_data={}) {

    if (frontend_data.leave) { // a button to be pressed
      // if not cleared completely on leave, make sure to free and leave.
      if (!this.cleared) {
        this.Module._freeBoids(); // CLEAR MEMORY!!
      } // end if
      this.is_over = true; // set flag for index.html to switch
      this.initialized = false; // this isn't really used rn, but keeping here.
    } else {
       const now = performance.now();

      if (this.lastFrameTime !== null) {
        const delT = (now - this.lastFrameTime) / 1000.0;
        this.Module._advanceBoids(delT);
        this.update_boids();
        this.update_dead_birds(delT);

        this.update_perspective(frontend_data, delT);
        this.walk_update(frontend_data, delT);
        this.camera_level();
        this.update_sun();
      }

      this.lastFrameTime = now;
      super.update_all_transformations(); // update all transformation nodes.
      if (frontend_data.shoot) this.shoot();
      this.totalBoidsUiEl.innerText = `Birds Remaining: ${this.boidsLeft}`; // update ui on bird hit      
      super.render(this.sky_color);  // let the renderer do it's draw thing
    } // end if

    // ADDED FOR BASIC GAME LOGIC LOOP!
    // if we cleared on this loop, set the flag and clear all memory only once on this clearing
    if (!this.cleared && this.deadBirds.length == this.totalBoids) { this.cleared = true; this.Module._freeBoids(); }
    
  } // end function

  /**
   * to be called on transition hook. clears memory and shit from scene.
   * really important ones:
   * freeBoids && is_over! the others are, meh, optional really right now.
   */
  clear() {
    
  } // end function
  

  // BIRD BUSINESS (just grab positions/velocities from heap)
  update_boids() {
    for (let i = 0; i < this.boidNodes.length; i++) {
      if (!this.boidNodes[i]) continue;
      const offset = i * this.boidDim;

      const scale = 4;
      this.boidNodes[i].position = [
        this.boidPositions[offset]*scale,
        this.boidPositions[offset + 1]+(this.terrain.radius+1),
        this.boidPositions[offset + 2]*scale
      ];

      this.boidNodes[i].velocity = [
        this.boidVelocities[offset],
        this.boidVelocities[offset + 1],
        this.boidVelocities[offset + 2]
      ];

      const [vx, vy, vz] = this.boidNodes[i].velocity;

      const rot = this.velocityToRotation(vx, vy, vz);

      if (rot !== null) {
        this.boidNodes[i].rotation = rot;
      }
    }
  }



  // SHOOTING FUNCTIONS ADDED BY THEO
  rayHitsSphere(origin, direction, center, radius) {
    const oc = [
      origin[0] - center[0],
      origin[1] - center[1],
      origin[2] - center[2]
    ];

    const b = 2 * (
      oc[0] * direction[0] +
      oc[1] * direction[1] +
      oc[2] * direction[2]
    );

    const c =
      oc[0] * oc[0] +
      oc[1] * oc[1] +
      oc[2] * oc[2] -
      radius * radius;

    const discriminant = b*b - 4*c;

    if (discriminant < 0) return null;

    const t = (-b - Math.sqrt(discriminant)) / 2;

    return t >= 0 ? t : null;
  }

  shoot() {
    const origin = [0,0,0];
    const direction = this.get_shoot_direction();

    let closestBird = null;
    let closestDistance = Infinity;

    for (let i = 0; i < this.boidNodes.length; i++) {
      const bird = this.boidNodes[i];

      if (!bird) continue;

      const matrix = bird.transformation_matrix;

      const center = [
        matrix[12],
        matrix[13],
        matrix[14]
      ];

      const distance = this.rayHitsSphere(
        origin,
        direction,
        center,
        0.5
      );

      if (distance !== null && distance < closestDistance) {
        closestDistance = distance;
        closestBird = i;
      }
    }

    if (closestBird !== null) {
      const bird = this.boidNodes[closestBird];

      this.deadBirds.push({
        node: bird,
        velocity: [0, 0, 0],
        fallSpeed: 0
      });

      this.boidNodes[closestBird] = null;

      console.log("another opp down", closestBird);
      this.boidsLeft -= 1; // for ui stuff
    }

  }

  update_dead_birds(delT) {
    const groundY = this.terrain.radius;

    for (const dead of this.deadBirds) {
      dead.fallSpeed += 9.8 * delT;

      dead.node.position[1] -= dead.fallSpeed * delT;

      // Stop when the bird reaches the ground
      if (dead.node.position[1] <= groundY) {
        dead.node.position[1] = groundY;
        dead.fallSpeed = 0;
      }
    }
}

  get_shoot_direction() {
    const pitch = this.camera.rotate[0];
    const yaw = this.camera.rotate[1];

    return [
      Math.sin(yaw) * Math.cos(pitch),
      -Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch)
    ];
  }
} // end class