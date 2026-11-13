import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";
import * as PlanetBuilder from "./planet_scene_node.js";

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
  
      // add sun point light and directional light.
      this.add_light(new SceneBuilder.SunLight({"position": this.solar_system.sun.position}));
      // this.add_light(new SceneBuilder.SunLight({"position": [0, 5, 20]})); // testing
      this.add_light(new SceneBuilder.FillLight());
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
       * w will always move you -z direction,
       * which effectively moves all things in space in pos z.
       */


      

      /**
       * a and s can rotate the camera around y axis,
       * which effectively is rotating things the opposite 
       * direction around y
       * 
       * TODO: this should wrap -- potential for overflow technically.
       */
      if (frontend_data.a) {
        this.camera.rotate = [
          this.camera.rotate[0],
          (this.camera.rotate[1] - 0.03) % (2 * Math.PI),
          this.camera.rotate[2]
        ]
      } // end if

      if (frontend_data.d) {
        this.camera.rotate = [
          this.camera.rotate[0],
          (this.camera.rotate[1] + 0.03) % (2 * Math.PI),
          this.camera.rotate[2]
        ]
      } // end if









      
      let new_x = 0;
      let old_x = this.old_x;

      // let last_mouse_y = this.last_mouse_y;
      // let curr_mouse_x = null; let curr_mouse_y = null;
      // first movement
      if (frontend_data.mouse_x) { // have registered mouse movement
        const h = 600; const w = 1200; // hardcoded for a moment.
        new_x = (((2 * frontend_data.mouse_x) / w - 1)) * (Math.PI / 2);
      } // end if

      // if there is a difference between the two values (we moved the mouse)
      if (Math.abs(new_x - old_x) > 0.001) {
        let dr = 0;
        const r = this.camera.rotate[1];
        if ((new_x >= 0 && old_x >= 0) || (new_x < 0 && old_x < 0)) {
          // both positive or negative
          dr = new_x - old_x;
        } else { // signs are changing
          dr = (-old_x) + new_x;
        }
        // // little more of a y rotation
        // const theta = Math.atan(norm_x/norm_y);
        // const half_theta = theta / 2;
        this.camera.rotate = [
          this.camera.rotate[0],
          // -half_theta,
          this.camera.rotate[1] + dr, 
          // norm_x * 0.5,
          this.camera.rotate[2]
        ]
      } 

      this.old_x = new_x;







      let new_y = 0;
      let old_y = this.old_y;

      // let last_mouse_y = this.last_mouse_y;
      // let curr_mouse_x = null; let curr_mouse_y = null;
      // first movement
      if (frontend_data.mouse_y) { // have registered mouse movement
        const h = 600; const w = 1200; // hardcoded for a moment.
        new_y = -(((2 * frontend_data.mouse_y) / h - 1)) * (Math.PI / 2);
      } // end if

      // if there is a difference between the two values (we moved the mouse)
      if (Math.abs(new_y - old_y) > 0.001) {
        let dr = 0;
        if ((new_y >= 0 && old_y >= 0) || (new_y < 0 && old_y < 0)) {
          // both positive or negative
          dr = new_y - old_y;
        } else { // signs are changing
          dr = (-old_y) + new_y;
        }
        // // little more of a y rotation
        // const theta = Math.atan(norm_x/norm_y);
        // const half_theta = theta / 2;
        this.camera.rotate = [
          this.camera.rotate[0] + dr,
          this.camera.rotate[1], 
          this.camera.rotate[2]
        ]
      } 

      this.old_y = new_y;


    if (frontend_data.w) {
        const theta_xz = this.camera.rotate[1]; // amount in deg that i've rotated the scene around y axis -> xz motion
        const theta_yz = this.camera.rotate[0]; // amount in deg i've rotated te scene around the x axis -> yz motion

        // i have rotated theta degrees around the y axis.
        // if i want to move forward, it should be relative to
        // how much i have rotated.
        // so i need to move sin(theta)*speed in appropriate x direction
        // and cos(theta)*speed in appropriate z direction, 
        // (trust, have some basic trig skills lol),
        // so the roots in scene should move the opposite directions
        const sin_xz = Math.sin(theta_xz); 
        const cos_xz = Math.cos(theta_xz);  

        // now, consider the up motion angle
        const sin_yz = Math.sin(theta_yz)

        this.camera.translate = [
          this.camera.translate[0] - (0.1 * sin_xz), // move things opposing x direction
          this.camera.translate[1] - (0.1 * sin_yz), // move things in opposing y direction
          this.camera.translate[2] + (0.1 * cos_xz) // move things "backward"
        ]
      } // end if

      if (frontend_data.s) {
        // same as above but opposite
        const theta_xz = this.camera.rotate[1]; // amount in deg that i've rotated the scene
        const theta_yz = this.camera.rotate[0]; // amount in deg i've rotated te scene around the x axis -> yz motion
        const sin_yz = Math.sin(theta_yz)
        const sin_xz = Math.sin(theta_xz); 
        const cos_xz = Math.cos(theta_xz);  
        this.camera.translate = [
          this.camera.translate[0] + (0.1 * sin_xz), // move things opposing x directio
          this.camera.translate[1] + (0.1 * sin_yz),
          this.camera.translate[2] - (0.1 * cos_xz) // move things "backward"
        ]
      } // end if


      /**
       * moving things in and out of scene to mimic
       * the movement of the camera to a different angular direction.
       */
      // if (frontend_data.mouse_x && frontend_data.mouse_y) {
      //   const h = 600; const w = 1200;
      //   // const z = this.solar_system.sun.position[2];
      //   // this.solar_system.sun.position = [
      //   //   ((frontend_data.mouse_x / (w * w)) - (w / 2)) / z,
      //   //   ((frontend_data.mouse_y / (h * h)) - (h / 2)) / z,
      //   //   z
      //   // ]
      //   this.solar_system.sun.position = [
      //     -(((2 * frontend_data.mouse_x) / w - 1) * (w / 2)) / Math.abs(z),
      //     -(((2 * frontend_data.mouse_y) / h - 1) * (h / 2)) / Math.abs(z),
      //     z
      //   ]
      //   console.log(this.solar_system.sun.position)
      // } else {
      //   this.solar_system.sun.position = [
      //     this.solar_system.sun.position[0],
      //     this.solar_system.sun.position[1],
      //     z
      //   ]
      // }
      

     
      super.render([0, 0, 0]);  // let the renderer do it's draw thing
    } // end function


} // end class
