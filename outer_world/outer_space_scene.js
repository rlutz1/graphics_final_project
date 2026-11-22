import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";
import * as PlanetBuilder from "./planet_scene_node.js";
import * as SpaceshipBuilder from "./spaceship_scene_node.js";
import { matMul, multiplyMat4Vec4 } from '../util/transitions.js';
import { buildSpaceship } from "./spaceship_scene_node.js";


export class OuterSpaceScene extends SceneBuilder.Scene {
  
  constructor() {
    super(); // takes care of base initialization fields.

    this.solar_system = null; // the solar system in an accessible way.
    this.day = 0; // days passing.
    this.days_per_second = 10; // how to register how many days occur in a second for planet orbits
    this.distance_const = 35; // a constant used in distance normalization.
    this.game_over = false;
    this.bounce_dir = [0, 0, 0];
    this.bounce_speed = [10, 10, 10];
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

    // initialize the solar system
    this.init_solar_system();

    // init some shitty basics, lights, camera
    // this.set_camera(new SceneBuilder.PerspectiveCamera({
    //   "aspect": aspect, // since my canvas is not square
    // }))
    this.set_camera(new SceneBuilder.SpaceCamera({
      "aspect": aspect, // since my canvas is not square
    }))

    this.sun_light = new SceneBuilder.SunLight({"position": this.solar_system.sun.position});
    this.fill_light = new SceneBuilder.FillLight();
    // add sun point light and directional light.
    this.add_light(this.sun_light);
    this.add_light(this.fill_light);
  } // end function
  
  
  /**
   * basic top level, to be added on to initialization of all things in the solar system.
   */
  init_solar_system() {
    this.solar_system = {}; // for readability -- to actually render, add root nodes/hierarchy

    // init sun and planets, etc
    const sun = this.init_sun();
    this.solar_system.sun = sun; // for easy access more than anything
    
    const planets = this.init_planets();
    this.solar_system.planets = planets; // can make this more specific if needed
    
    const spaceship = this.init_spaceship();
    this.spaceship = spaceship; // again, easy access if needed.
    
    const asteroid_belt = this.init_asteroid_belt();
    this.solar_system.asteroid_belt = asteroid_belt; // asteroid belt 

    const random_obstacles = this.init_random_obstacles();
    this.solar_system.random_obstacles = random_obstacles; // a grouper node with random obstacles
    
    const background = this.init_background();
    this.solar_system.background = background; // the background mimcry

    this.normalize_distance(); // normalize the distances of all planets for viewing pleasure
    this.normalize_radii(); // same thing here.

    // rendering requirements: 
    this.add_node(sun); // add as a root so that it behaves as the "origin" of this scene
    planets.forEach((p) => {
      // add all planets as children of the sun for positioning to carry through when moving scene.
      sun.add_child(p);
    });
    asteroid_belt.forEach((a) => {
      // add all asteroids as children of the sun for positioning to carry through when moving scene.
      sun.add_child(a);
    });
    this.add_node(spaceship); // spaceship to daddy sceen
    this.add_node(random_obstacles); // these can be their own root nodes
    this.add_node(background); // background
  } // end function

  /**
   * grab from liz: normalize the distance from sun of each 
   * planet with respect to the max distance so she looks much better.
   */
  normalize_distance() {
    let max_distance = 0;
    for(let i = 0; i < this.solar_system.planets.length; i++){
      const distance = this.solar_system.planets[i].data.distance_km;
      if(distance > max_distance){
          max_distance = distance;
      } // end if
    } // end loop

    this.solar_system.planets.forEach((p) => {
      const normalizedDistance = p.data.distance_km / max_distance;
      p.update_display_distance(Math.sqrt(normalizedDistance) * this.distance_const);
    });

    this.solar_system.asteroid_belt.forEach((a) => {
      const normalizedDistance = a.data.distance_km / max_distance;
      a.update_display_distance(Math.sqrt(normalizedDistance) * this.distance_const);
    });
  } // end function

  /**
   * grab from liz: normalize the radius's of the planets with
   * respect to the largest one, leaving the sun always largest with
   * radius 2.
   */
  normalize_radii() {
    let max_radius = 0;
    for(let i = 0; i < this.solar_system.planets.length; i++){
      const radius = this.solar_system.planets[i].data.radius_km;
      if(radius > max_radius){
          max_radius = radius;
      } // end if
    } // end loop

    this.solar_system.planets.forEach((p) => {
      const normalized_radius = p.data.radius_km / max_radius;
      p.update_radius(Math.sqrt(normalized_radius));
    });

    this.solar_system.asteroid_belt.forEach((a) => {
      const normalized_radius = a.data.radius_km / max_radius;
      a.update_radius(Math.sqrt(normalized_radius));
    });
  } // end function

  /**
   * create a new grouper node for all the randoms
   */
  init_random_obstacles() {
    const mesh = new SceneBuilder.Mesh(this.renderer.gl, MeshBuilder.gen_planet_mesh(
      1, // radius -- placeholder!
      30, 30, // vSteps, uSteps
      [0.2, 0.4, 0.9], 
      0 // adding a texture bump mapping to these
    )); // generate a basic planet mesh
    const material = new SceneBuilder.PlanetMaterial({ // create a material -- constants from liz's file
      "ka": [0.3, 0.3, 0.3], 
      "kd": [0.5, 0.5, 0.5],
      "ks": [0.3, 0.3, 0.3], 
      "shininess": 20, 
      "metallic": 0,
      "emissive": 0, 
      "flat": false
    });
    const texture = new SceneBuilder.Texture(this.renderer.gl, "./outer_world/textures/asteroid.jpg"); // todo -- pull this out
    const random_group = new SceneBuilder.GroupSceneNode();
    random_group.set_mesh(mesh).set_material(material).set_texture(texture);
    return random_group; // grouper node to keep it a little more organized
  } // end function

  /**
   * initialize the background mimckry
   */
  init_background() {
    // TODO: not great to use basic spaceship
    // const background = new PlanetBuilder.BackgroundSceneNode("background", "spaceship_basic");
    const background = new PlanetBuilder.BackgroundSceneNode("background", "space_background_basic");
    const mesh = new SceneBuilder.Mesh(this.renderer.gl, MeshBuilder.gen_sphere_mesh(
      1, // radius -- placeholder!
      0.05, 0.05, // vSteps, uSteps
      [0.5, 0.5, 0.5]
    )); // generate a basic sphere mesh
    const material = new SceneBuilder.PlanetMaterial({ // create a material -- constants from liz's file
      "ka": [0.7, 0.7, 0.7], 
      "kd": [0.85, 0.85, 0.85],
      "ks": [0.5, 0.5, 0.5], 
      "shininess": 40
    });
    const texture = new SceneBuilder.Texture(this.renderer.gl, "./outer_world/textures/stars_color.jpg");

    background.set_mesh(mesh).set_material(material).set_texture(texture); 
    background.scale = [75, 75, 75] // BIG BOY
    background.bounding_shape.radius = 75; // update this as well
    background.center = this.spaceship.center;
    
    return background;
  } // end function 

  /**
   * initialize the asteroid belt babies
   */
  init_asteroid_belt() {
    const asteroids = [];

    // TODO: may switch to diff mesh for all so that colors can be diff, but
    // if texture mapping, color shouldn't matter, so same mesh is fine!

    // for now, same mesh and material for all.
    const mesh = new SceneBuilder.Mesh(this.renderer.gl, MeshBuilder.gen_planet_mesh(
        1, // radius -- placeholder!
        30, 30, // vSteps, uSteps
        [0.2, 0.4, 0.9], 
        0 // adding a texture bump mapping to these
      )); // generate a basic planet mesh
      const material = new SceneBuilder.PlanetMaterial({ // create a material -- constants from liz's file
          "ka": [0.3, 0.3, 0.3], 
          "kd": [0.5, 0.5, 0.5],
          "ks": [0.3, 0.3, 0.3], 
          "shininess": 20, 
          "metallic": 0,
          "emissive": 0, 
          "flat": false
      });

    for (let i = 0; i < 100; i++) {
      const new_asteroid = new PlanetBuilder.AsteroidObstacle(); 
      const texture = new SceneBuilder.Texture(this.renderer.gl, new_asteroid.data.texture_path); // todo -- pull this out
      new_asteroid.set_mesh(mesh).set_material(material).set_texture(texture); // TODO: texture set here.
      asteroids.push(new_asteroid);
    } // end loop
    return asteroids;
  } // end function

  /**
   * just a little method to wrap up the planet creation as a generality.
   * can tune as needed.
   */
  init_planets() {
    const planets = [];

    // TODO: may switch to diff mesh for all so that colors can be diff, but
    // if texture mapping, color shouldn't matter, so same mesh is fine!

    // for now, same mesh and material for all.
    const mesh = new SceneBuilder.Mesh(this.renderer.gl, MeshBuilder.gen_planet_mesh(
        1, // radius -- placeholder!
        30, 30, // vSteps, uSteps
        [0.2, 0.4, 0.9], 
        0 // adding a texture bump mapping to these
      )); // generate a basic planet mesh
      const material = new SceneBuilder.PlanetMaterial({ // create a material -- constants from liz's file
        "ka": [0.3, 0.3, 0.3], 
        "kd": [0.85, 0.85, 0.85],
        "ks": [0.5, 0.5, 0.5], 
        "shininess": 40, 
        "metallic": 0,
        "emissive": 0, 
        "flat": false
      });

    for (const [planet, data] of Object.entries(PlanetBuilder.PLANET_DATA)) {
      const texture = new SceneBuilder.Texture(this.renderer.gl, data.texture_path);
      const new_planet = new PlanetBuilder.PlanetSceneNode(planet.name, "planet_basic", data);        
      new_planet.set_mesh(mesh).set_material(material).set_texture(texture); // TODO: texture set here.
      planets.push(new_planet);
    } // end loop
    return planets;
  } // end function

  /**
   * initialize the sun specifically
   */
  init_sun() {
    const sun = new PlanetBuilder.SunSceneNode(
      "Sun", 
      "planet_basic", 
      PlanetBuilder.SUN_DATA.sun
    );
    const mesh = new SceneBuilder.Mesh(this.renderer.gl, MeshBuilder.gen_planet_mesh(
      2.5, // radius (pulled from liz's stuff)
      30, 30, // vSteps, uSteps
      PlanetBuilder.SUN_DATA.sun.color, 
      0 // color for now, texture later! TODO
    )); // generate a basic planet mesh
    const material = new SceneBuilder.PlanetMaterial({ // create a material -- constants from liz's file
      "ka": [0.0, 0.0, 0.0], 
      "kd": [0.0, 0.0, 0.0],
      "ks": [0.0, 0.0, 0.0], 
      "shininess": 1, 
      "metallic": 0,
      "emissive": 1.0, 
      "flat": false
    });
    const texture = new SceneBuilder.VideoTexture(this.renderer.gl, PlanetBuilder.SUN_DATA.sun.texture_path);

    sun.set_mesh(mesh).set_material(material).set_texture(texture); // TODO: texture set here.
    return sun;
  } // end function

  /**
   * right now this is wrapper only in order to keep any hierarchy
   * or building complexity in the spaceship node implementation.
   */
  init_spaceship() {
    const spaceship = new SpaceshipBuilder.SpaceshipSceneNode();
    spaceship.init(this.renderer.gl);
    return spaceship;
  } // end function

  /**
   * called once every rendering call from index.html.
   * this is where any global game logic, scene component updates
   * should be occurring that need per-render-call updates.
   */
  render(frontend_data={}) {
    // yada yada, do whatever the scene needs to do at a global scale,
    // such as run collision detection with player, did i hit a boid, etc.
    if (!this.game_over) {
      // update the time on all planets so orbits can be updated correctly
      if (frontend_data.delta_time) {
        this.day = (frontend_data.delta_time * this.days_per_second);
        this.solar_system.planets.forEach((p) => {
          p.update_orbit(this.day);
        });
        this.solar_system.asteroid_belt.forEach((a) => {
          a.update_orbit(this.day);
        });

        const clean_up = []
        this.solar_system.random_obstacles.children.forEach((o) => {
          if (o.dead) {
            clean_up.push(o);
          } else {
            o.update_trajectory(this.day);
          } // end if
        });
        for (const dead_obstacle of clean_up) {
          this.solar_system.random_obstacles.remove_child(dead_obstacle);
          // console.log("removing")
        } // end loop
      } // end if

      if (Math.random() > 0.95) {
        // add a random obtacle to the scene for EXCITMENT
        const new_obstacle = new PlanetBuilder.RandomAsteroidObstacle();
        new_obstacle.lifetime += this.day; // when they die and can be removed from the scnee for funsies
        new_obstacle
          .set_mesh(this.solar_system.random_obstacles.mesh)
          .set_material(this.solar_system.random_obstacles.material)
          .set_texture(this.solar_system.random_obstacles.textures);
        // const init_position = [
        //   (Math.random() * 20) + 50, 
        //   (Math.random() * 20) + 50, 
        //   (Math.random() * 20) + 50
        // ];
        const theta = Math.random() * (2 * Math.PI);
        const phi =  Math.random() * (Math.PI);
        const init_position = [ // init position on the circumference of the background
          this.solar_system.background.scale[0] * Math.sin(phi) * Math.cos(theta),
          this.solar_system.background.scale[1] * Math.sin(phi) * Math.sin(theta),
          this.solar_system.background.scale[2] * Math.cos(phi),
        ];
        
        new_obstacle.position = init_position;
        // new_obstacle.set_trajectory([
        //   this.spaceship.position[0] - init_position[0],
        //   this.spaceship.position[1] - init_position[1],
        //   this.spaceship.position[2] - init_position[2]
        // ]);

        // rando trajectory
        new_obstacle.set_trajectory([
          Math.random() - init_position[0],
          Math.random() - init_position[1],
          Math.random() - init_position[2]
        ]);
        this.solar_system.random_obstacles.add_child(new_obstacle);
      } // end if

      // need to now deal with dynamic input affecting the 
      // world/"moving the spaceship" and hitting things.
      // TODO: don't need to update_all_transforms every time, it's over kill, replace with necessary center changer only.
      if (this.spaceship.hit_recovery) {
        // update the recovery timer 
        this.spaceship.recovery_timer += frontend_data.time_since_last_render;
        if (this.spaceship.recovery_timer >= this.spaceship.recovery_time_limit) { 
          this.spaceship.hit_recovery = false; // reset the state
          this.spaceship.recovery_timer = 0; // reset the recovery timer to 0 for next hit.
        } // end if

        // moving everything away from me in the direction identified by the normal of the collision detector.
        // not accounting for direction of the movement of the object right now.
        this.camera.translate = [
          this.camera.translate[0] - (this.bounce_dir[0] * this.bounce_speed[0] * frontend_data.time_since_last_render),
          this.camera.translate[1] - (this.bounce_dir[1] * this.bounce_speed[1] * frontend_data.time_since_last_render),
          this.camera.translate[2] - (this.bounce_dir[2] * this.bounce_speed[2] * frontend_data.time_since_last_render)
        ];

        // dampen down with each render to come to a clean slowing.
        const dampen = 0.99;
        this.bounce_speed = [
          this.bounce_speed[0] * dampen,
          this.bounce_speed[1] * dampen,
          this.bounce_speed[2] * dampen
        ];

        // we can have this on if we want to allow movement during the hit period! just leaving here for testing for a minute.
        // this.handle_input(frontend_data); // figure out how to move based on input
        // // carry out all updates from last time
        // super.update_all_transformations(); // update all the transformation nodes, using the override guy below.
        // // update the sun light position as the sun moves.
        // this.sun_light.position = [this.solar_system.sun.center[0], this.solar_system.sun.center[1], this.solar_system.sun.center[2]];

        // THIS WILL BE CHANGED TO SCENE TRANSITION AND NEED TO HANDLE SOME STUFF
        this.handle_planet_collisions(); // deal with planet collisions (including sun) as their own thing.
       
        // carry out all updates from last time
        super.update_all_transformations(); // update all the transformation nodes, using the override guy below.
        // update the sun light position as the sun moves.
        this.sun_light.position = [this.solar_system.sun.center[0], this.solar_system.sun.center[1], this.solar_system.sun.center[2]];
      } else {
        // this.bounce_speed = [0.2, 0.2, 0.2]; // reset
        this.bounce_speed = [10, 10, 10];
        this.handle_input(frontend_data); // figure out how to move based on input
        // carry out all updates from last time
        super.update_all_transformations(); // update all the transformation nodes, using the override guy below.
        // update the sun light position as the sun moves.
        this.sun_light.position = [this.solar_system.sun.center[0], this.solar_system.sun.center[1], this.solar_system.sun.center[2]];

        this.bounce_dir = this.handle_obstacle_collisions(); // also need to see if i hit an obstacle and do state changes/camera changes
        // TODO: the planet collision will trigger transitions, will merge and handle when time comes.
        // carry out all updates from last time
        // super.update_all_transformations(); // update all the transformation nodes, using the override guy below.
        // // update the sun light position as the sun moves.
        // this.sun_light.position = [this.solar_system.sun.center[0], this.solar_system.sun.center[1], this.solar_system.sun.center[2]];


        // THIS WILL BE CHANGED TO SCENE TRANSITION STUFF LATER
        this.handle_planet_collisions(); // deal with planet collisions (including sun) as their own thing.
        // carry out all updates from last time
        super.update_all_transformations(); // update all the transformation nodes, using the override guy below.
        // update the sun light position as the sun moves.
        this.sun_light.position = [this.solar_system.sun.center[0], this.solar_system.sun.center[1], this.solar_system.sun.center[2]];
      } // end if

      // render call!
      super.render([0, 0, 0]);  // let the renderer do it's draw thing
    } // end if
    
  } // end function

  /**
   * normal movement through the scene because i haven't been hit by anything.
   */
  handle_input(frontend_data) {
    // w/s are a move forward/back.
    // a/d are left/right rotation
    // mouse on screen registers only up/down tilt, turning y position on canvas to a degree in radians.

    // left rotate
    if (frontend_data.a) {
      this.camera.rotate = [
        this.camera.rotate[0],
        (this.camera.rotate[1] - this.spaceship.rotation_speed) % (2 * Math.PI), 
        this.camera.rotate[2]
      ]
    } // end if

    // right rotate
    if (frontend_data.d) {
      this.camera.rotate = [
        this.camera.rotate[0],
        (this.camera.rotate[1] + this.spaceship.rotation_speed) % (2 * Math.PI),
        this.camera.rotate[2]
      ]
    } // end if

    // set the pitch angle to an angle that is specified by the y coordinate of the mouse
    if (frontend_data.mouse_y) {
      const normalized_y = (2 * frontend_data.mouse_y / frontend_data.canvas_height) - 1; // normalize to [-1, 1]
      const max_pitch = Math.PI / 2 - 0.01; // - 0.01 to avoid a wrap around
      this.camera.rotate[0] = normalized_y * max_pitch; // make a degree in radians
    } // end if

    const yaw = this.camera.rotate[1]; // the rotation around the y axis, left/right motion
    const pitch = this.camera.rotate[0]; // the rotation around the x axis, up/down tilting

    // the calculations of how to move forward considering the direction of
    // my camera view at this moment. includes up/down/left/right direction in the motion.
    // can derive from using direction vector [0, 0, -1] (always move in negative z)
    // and calculating R(y)*R(x)*[0, 0, -1]*V
    // and that flips the direction in which to move the scene in terms of tranlation
    // with consideration to your current orientation, giving impression you are moving in direction you're pointed in.
    // this is the DIRECTION * HOW MUCH you should move the scene in.
    let forward_x = -Math.sin(yaw) * Math.cos(pitch) * this.spaceship.velocity[0];
    let forward_y = Math.sin(pitch) * this.spaceship.velocity[1];
    let forward_z = Math.cos(yaw) * Math.cos(pitch) * this.spaceship.velocity[2]; // flipping sign on this

    // forward motion
    if (frontend_data.w) {
      // move things backward
      this.camera.translate = [
        this.camera.translate[0] + forward_x,
        this.camera.translate[1] + forward_y,
        this.camera.translate[2] + forward_z
      ];
    } // end if

    // backward motion
    if (frontend_data.s) {
      // move things forward
      this.camera.translate = [
        this.camera.translate[0] - forward_x,
        this.camera.translate[1] - forward_y,
        this.camera.translate[2] - forward_z
      ];
    } // end if
  } // end function

  /**
   * check for collision with obstacles in the scene.
   */
  handle_obstacle_collisions() {
    const obstacle_collide = this.obstacle_collision_check();
    if (obstacle_collide) {
      this.spaceship.health -= 1;
      if (this.spaceship.health == 0) { this.game_over = true; return;}
      this.spaceship.hit_recovery = true;
      this.spaceship.recovery_timer = 0;

      const normal = obstacle_collide.normal; // the surface normal as calculated between bounding sphere centers; the DIRECTION to push 
      return normal;
    } // end if
    return null;
  } // end function

  /**
   * handle a planet collision. this will end up triggering a scene transition.
   * so needs to be accounted for at a later point. removing this to clean out the 
   * scene render call a bit.
   */
  handle_planet_collisions() {
    // now, if a planet does collide, we want to alter the direction vector a bit
    // planet_collide, if not null, returns the normalized directional vector
    // from centroid A -> B (A is spaceship, B is a planet/sun).
    // so we're going to subtract out the part of movement we don't want from the current
    // Ry*Rx*[0, 0, -1]*V direction
    // lets see if we collided with a planet
    const planet_collide = this.spaceship_planet_collision_check();

    if (planet_collide) { 
      const normal = planet_collide.normal; // the surface normal as calculated between bounding sphere centers; the DIRECTION to push 
      const penetration = planet_collide.overlap; // this is HOW MUCH we should push in the norm direction

      // simply correct the position here before we apply the rotation of the direction vector
      // this will push the scene in the opposing direction
      this.camera.translate = [
        this.camera.translate[0] - normal[0] * penetration,
        this.camera.translate[1] - normal[1] * penetration,
        this.camera.translate[2] - normal[2] * penetration
      ];
     
    } // end if
  } // end function

  /**
   * checking all the obstacles for a collision
   */
  obstacle_collision_check() {
    const asteroids = this.solar_system.asteroid_belt;
    const randoms = this.solar_system.random_obstacles.children;
    
    // randoms....

    // check for asteroid collision with ship
    let n = []; let overlap = 0; let intersect = false;
    for (const shape of this.spaceship.bounding_shape) {
      for (const a of asteroids) {
        if (shape.intersect(a.bounding_shape)) {
          console.log(`hit ${a.data.name}`)
          const d = [
            shape.center_x - a.bounding_shape.center_x, 
            shape.center_y - a.bounding_shape.center_y, 
            shape.center_z - a.bounding_shape.center_z, 
          ];
          const d_mag = Math.sqrt(d[0]*d[0] + d[1]*d[1] + d[2]*d[2]);
          const overlap_temp = shape.radius + a.bounding_shape.radius - d_mag;
          if (overlap_temp > overlap) { 
            overlap = overlap_temp;
            n = [d[0]/d_mag, d[1]/d_mag, d[2]/d_mag]; 
          } 
          intersect = true;
        } // end if
      } // end loop
    } // end loop

    if (intersect) { return {normal: n, overlap: overlap}; }

    for (const shape of this.spaceship.bounding_shape) {
      for (const a of randoms) {
        if (shape.intersect(a.bounding_shape)) {
          console.log(`hit ${a.id}`)
          const d = [
            shape.center_x - a.bounding_shape.center_x, 
            shape.center_y - a.bounding_shape.center_y, 
            shape.center_z - a.bounding_shape.center_z, 
          ];
          const d_mag = Math.sqrt(d[0]*d[0] + d[1]*d[1] + d[2]*d[2]);
          const overlap_temp = shape.radius + a.bounding_shape.radius - d_mag;
          if (overlap_temp > overlap) { 
            overlap = overlap_temp;
            n = [d[0]/d_mag, d[1]/d_mag, d[2]/d_mag]; 
          } 
          intersect = true;
        } // end if
      } // end loop
    } // end loop

    if (intersect) { return {normal: n, overlap: overlap}; }

    return null;
  } // end function

  /**
   * this is basically a tester for now.
   * check to see if any planet or sun position is within [1, 1, 1] of me at [0, 0, 0]
   * and simply print to console.
   */
  spaceship_planet_collision_check() {
    const sun = this.solar_system.sun;
    const planets = this.solar_system.planets;

    // check for sun collision with ship
    let n = []; let overlap = 0; let intersect = false;
    for (const shape of this.spaceship.bounding_shape) {
      if (shape.intersect(sun.bounding_shape)) {
        console.log("spaceship hit sun");
        const d = [
          shape.center_x - sun.bounding_shape.center_x, 
          shape.center_y - sun.bounding_shape.center_y, 
          shape.center_z - sun.bounding_shape.center_z, 
        ];
        const d_mag = Math.sqrt(d[0]*d[0] + d[1]*d[1] + d[2]*d[2]);
        const overlap_temp = shape.radius + sun.bounding_shape.radius - d_mag;
        if (overlap_temp > overlap) { 
          overlap = overlap_temp;
          n = [d[0]/d_mag, d[1]/d_mag, d[2]/d_mag]; 
        } 
        intersect = true;
      } // end if
    } // end loop

    if (intersect) { return {normal: n, overlap: overlap}; }

    // check for planet collisions
    for (const shape of this.spaceship.bounding_shape) {
      for (const p of planets) {
        if (shape.intersect(p.bounding_shape)) {
          console.log(`hit ${p.data.name}`)
          const d = [
            shape.center_x - p.bounding_shape.center_x, 
            shape.center_y - p.bounding_shape.center_y, 
            shape.center_z - p.bounding_shape.center_z, 
          ];
          const d_mag = Math.sqrt(d[0]*d[0] + d[1]*d[1] + d[2]*d[2]);
          const overlap_temp = shape.radius + p.bounding_shape.radius - d_mag;
          if (overlap_temp > overlap) { 
            overlap = overlap_temp;
            n = [d[0]/d_mag, d[1]/d_mag, d[2]/d_mag]; 
          } 
          intersect = true;
        } // end if
      } // end loop
    } // end loop

    if (intersect) { return {normal: n, overlap: overlap}; }

    return null;
  } // end function


  /**
   * update all transformations in the tree, working your way down.
   * render will call this automatically, but moving it here because
   * position updates are a pain if i can't tweak this! easiest solution for now!
   */
  update_transformations(parent, M_parent) {
    parent.update_transformation_matrix(M_parent);

    // change from super implementation.
    // i need to internally track a position of a node, likely for some basic
    // collision detection && lighting change!
    // everything but the player will need position updates, and that requires ALL transformation matrices.
    // i don't love this -- likely some cleanup of calculation duplication wanted here, but testing
    // to make sure this works at all.
    if (!(parent.id === this.spaceship.id) && !(parent instanceof(SceneBuilder.GroupSceneNode))) { // important! all nodes in spaceship should have this id for now...
      const position_transforms = matMul(
        // this.camera.get_projection_matrix(), // this is not wanted for this center point updating.
        this.camera.get_view_matrix(),
        parent.transformation_matrix
      );

      // update the center point and any other things that could effect.
      parent.update_bounding_shape(position_transforms);
    } // end if
    

    if (parent.children) {
      parent.children.forEach((c) => { // drill down the tree
        this.update_transformations(c, parent.transformation_matrix);
      });
    } // end if
  } // end function


} // end class
