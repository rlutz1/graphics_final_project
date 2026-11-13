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
       * a and s can rotate the camera around y axis,
       * which effectively is rotating things the opposite 
       * direction around y
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
      if (frontend_data.mouse_y !== undefined) {
        const h = 600; // hardcoded: current height of canvas
        const normalized_y = (2 * frontend_data.mouse_y / h) - 1; // normalize to [-1, 1]
        const max_pitch = Math.PI / 2 - 0.01; // - 0.01 to avoid a wrap around
        this.camera.rotate[0] = normalized_y * max_pitch; // flip y so pos moves down, neg moves up, make a degree in radians
      } // end if

      const yaw = this.camera.rotate[1]; // the rotation around the y axis
      const pitch = this.camera.rotate[0]; // the rotation around the x axis

      // the calculations of how to move forward considering the direction of
      // my camera view at this moment.
      // includes up/down direction in the motion
      const forward_x = -Math.sin(yaw) * Math.cos(pitch);
      const forward_y = Math.sin(pitch);
      const forward_z = Math.cos(yaw) * Math.cos(pitch);

      // FOR IF YOU'RE GROUNDED ON A PLANE -- great for planet probably
      // const forward_x = -Math.sin(yaw);
      // const forward_y = 0;
      // const forward_z = Math.cos(yaw);

      // forward motion -- 0.1 is speed
      if (frontend_data.w) {
        this.camera.translate = [
          this.camera.translate[0] + (0.1 * forward_x),
          this.camera.translate[1] + (0.1 * forward_y),
          this.camera.translate[2] + (0.1 * forward_z)
        ];
      } // end if

      // backward motion -- 0.1 is speed
      if (frontend_data.s) {
        this.camera.translate = [
          this.camera.translate[0] - (0.1 * forward_x),
          this.camera.translate[1] - (0.1 * forward_y),
          this.camera.translate[2] - (0.1 * forward_z)
        ];
      } // end if
        
      // render call!
      super.render([0, 0, 0]);  // let the renderer do it's draw thing
    } // end function


} // end class
