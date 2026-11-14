import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";
import * as PlanetBuilder from "./planet_scene_node.js";
import { matMul, multiplyMat4Vec4 } from '../util/transitions.js';


export class OuterSpaceScene extends SceneBuilder.Scene {
  
  constructor() {
      super(); // takes care of base initialization fields.

      this.solar_system = null; // the solar system in an accessible way.
      this.day = 0; // days passing.
      this.days_per_second = 30; // how to register how many days occur in a second for planet orbits
      this.distance_const = 35; // a constant used in distance normalization.
      this.old_x = 0; // TESTING
      this.old_y = 0; // TESTING
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

      // init sun and planets
      const sun = this.init_sun();
      const planets = this.init_planets();
     
      this.solar_system.sun = sun; // for easy access more than anything
      this.solar_system.planets = planets; // can make this more specific if needed

      this.normalize_distance(); // normalize the distances of all planets for viewing pleasure
      this.normalize_radii(); // same thing here.

      // rendering requirements: 
      this.add_node(sun); // add as a root so that it behaves as the "origin" of this scene
      planets.forEach((p) => {
        // add all planets as children of the sun for positioning to carry through when moving scene.
        sun.add_child(p);
      });

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
        p.display_distance = Math.sqrt(normalizedDistance) * this.distance_const;
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
        p.display_radius = Math.sqrt(normalized_radius);
      });
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
      sun.light = this.sun_light; // a little dirty, but easy access from sun to change direction.
      return sun;
    } // end function
  
    /**
     * called once every rendering call from index.html.
     * this is where any global game logic, scene component updates
     * should be occurring that need per-render-call updates.
     */
    render(frontend_data={}) {
      // yada yada, do whatever the scene needs to do at a global scale,
      // such as run collision detection with player, did i hit a boid, etc.

      // update the time on all planets so orbits can be updated correctly
      if (frontend_data.delta_time) {
        this.day = (frontend_data.delta_time * this.days_per_second);
        this.solar_system.planets.forEach((p) => {
          p.update_orbit(this.day);
        });
      } // end if

      // TODO: the light position that goes with sun needs to be bound to the sun's new position!!!!!!!!!
      // TODO: everything needs to have some sort of relative position tracking for collision detection (ASSUMEDLY)

      /**
       * w/s are a move forward/back.
       * a/d are left/right rotation
       * mouse on screen registers only up/down tilt, turning y position on canvas to a degree in radians.
       */

      // left rotate
      if (frontend_data.a) {
        this.camera.rotate = [
          this.camera.rotate[0],
          (this.camera.rotate[1] - 0.03) % (2 * Math.PI), 
          this.camera.rotate[2]
        ]
      } // end if

      // right rotate
      if (frontend_data.d) {
        this.camera.rotate = [
          this.camera.rotate[0],
          (this.camera.rotate[1] + 0.03) % (2 * Math.PI),
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
      // and calculating R(y)*R(x)*[0, 0, -1]
      // and that flips the direction in which to move the scene in terms of tranlation
      // with consideration to your current orientation, giving impression you are moving in direction you're pointed in.
      const forward_x = -Math.sin(yaw) * Math.cos(pitch);
      const forward_y = Math.sin(pitch);
      const forward_z = Math.cos(yaw) * Math.cos(pitch); // flipping sign on this

      // just fuckin around don't worry about this: 
      // const forward_x = -Math.sin(yaw);
      // const forward_y = Math.sin(pitch) * Math.cos(yaw);
      // const forward_z = Math.cos(pitch) * Math.cos(yaw);

      // FOR IF YOU'RE GROUNDED ON A PLANE -- great for planet probably
      // const forward_x = -Math.sin(yaw);
      // const forward_y = 0;
      // const forward_z = Math.cos(yaw);

      // forward motion -- 0.1 is speed
      if (frontend_data.w) {
        // move things backward
        this.camera.translate = [
          this.camera.translate[0] + (0.1 * forward_x),
          this.camera.translate[1] + (0.1 * forward_y),
          this.camera.translate[2] + (0.1 * forward_z)
        ];
      } // end if

      // backward motion -- 0.1 is speed
      if (frontend_data.s) {
        // move things forward
        this.camera.translate = [
          this.camera.translate[0] - (0.1 * forward_x),
          this.camera.translate[1] - (0.1 * forward_y),
          this.camera.translate[2] - (0.1 * forward_z)
        ];
      } // end if
      
      super.update_all_transformations(); // update all the transformation nodes, using the oberridenguy below.

      // update the sun light position as the sun moves.
      this.sun_light.position = [this.solar_system.sun.center[0], this.solar_system.sun.center[1], this.solar_system.sun.center[2]];

      // centers have been updated by the above iteration.
      // should be able to very basically see if i run into something.
      this.check_for_planet_collision();

      // render call!
      super.render([0, 0, 0]);  // let the renderer do it's draw thing
    } // end function

    /**
     * this is basically a tester for now.
     * check to see if any planet or sun position is within [1, 1, 1] of me at [0, 0, 0]
     * and simply print to console.
     */
    check_for_planet_collision() {
      const sun = this.solar_system.sun;
      const planets = this.solar_system.planets;

      // radius of sun is 2.5, this is dirty, but you get it, testing.
      if (Math.abs(sun.center[0]) < 2.5 && Math.abs(sun.center[1]) < 2.5 && Math.abs(sun.center[2]) < 2.5) {
        console.log(`hit ${sun.data.name}`)
      } // end if

      // not accounting for special radius's below, won't be perfect:
      planets.forEach((p) => {
        if (Math.abs(p.center[0]) < 1 && Math.abs(p.center[1]) < 1 && Math.abs(p.center[2]) < 1) {
        console.log(`hit ${p.data.name}`)
      } // end if
      }) // end loop

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
      const new_center_mtx = matMul(
        // this.camera.get_projection_matrix(), // this is not wanted for this center point updating.
        this.camera.get_view_matrix(),
        parent.transformation_matrix
      );

      // parent.center = new_center; // set the new center.
      parent.center = multiplyMat4Vec4(new_center_mtx, [0, 0, 0, 1]);

      // if (parent instanceof(PlanetBuilder.SunSceneNode)) {console.log(parent.center);
      

      if (parent.children) {
        parent.children.forEach((c) => { // drill down the tree
          this.update_transformations(c, parent.transformation_matrix);
        });
      } // end if
    } // end function


} // end class
