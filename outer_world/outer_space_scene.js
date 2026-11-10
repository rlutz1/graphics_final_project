import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";
import * as PlanetBuilder from "./planet_scene_node.js";

export class OuterSpaceScene extends SceneBuilder.Scene {
  
  constructor() {
      super(); // takes care of base initialization fields.
      // WIP
      this.solar_system = null; // the solar system in an accessible way.
      this.day = 0; // days passing.
      this.days_per_second = 30; // how to register how many days occur in a second for planet orbits
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
      this.set_camera(new SceneBuilder.PerspectiveCamera({
        "aspect": aspect, // since my canvas is not square
      }))
  
      // add sun point light and directional light.
      this.add_light(new SceneBuilder.SunLight({"position": this.solar_system.sun.position}));
      // this.add_light(new SceneBuilder.SunLight({"position": [0, 5, 20]})); // testing
      this.add_light(new SceneBuilder.FillLight());
    } // end function

    /**
     * 
     */
    /*
    // build buffers for each hierarchy peice
    const sphereSteps = 30;   // vSteps and uSteps for the planets 
    const orbitSteps = 60;    // orbit steps

    // texture mapping consts
    const BUMP_MAPPING = 0;    
    const NORMAL_MAPPING = 1; 
    const NO_MAPPING = 2;     
    const COLOR_MAPPING = 3;  

    const panelTexture = loadTexture("textures/brick.png");
    const sunGif = loadGifTexture("textures/sun.gif"); // sun texture

    // sun == root 
    const sun = {
        data: SUN,
        sphere: makeShapeBuffers(makePlanet(displayRadius(SUN), sphereSteps, sphereSteps, SUN.color, 1, 1)),
        material: SUN_MATERIAL,
        texture: sunGif.texture,
        mapping: COLOR_MAPPING,
    };
 
    // each planet + orbit
    const planets = [];
    for(let i = 0; i < PLANETS.length; i++){
        const planet = PLANETS[i];

        const alt = (i % 2 === 0); // even / odd alt for apply bump mapping 
 
        planets.push({
            data: planet,
            sphere: makeShapeBuffers(makePlanet(displayRadius(planet), sphereSteps, sphereSteps, planet.color, 1, 1)),
            texture: loadTexture(planet.texture),
            orbit: makeShapeBuffers(makeOrbit(displayDistance(planet), orbitSteps), gl.LINE_LOOP),
            material: MATERIAL,
            mapping: alt ? BUMP_MAPPING : NORMAL_MAPPING,
        });
    }
 
    // make satellite
    const satBody = makeShapeBuffers(makeSatelliteBody());
    const satPanel = makeShapeBuffers(makeSolarPanels());

    // materials for orbit & sat
    const orbitMaterial = ORBIT_MATERIAL;
    const satBodyMaterial = MATERIAL;
    const satPanelMaterial = MATERIAL;
 
    // return data structures 
    return {sun, planets, satBody, satPanel, orbitMaterial, satBodyMaterial, satPanelMaterial, sunGif, panelTexture  };


    // stored data need for the sun and planets
    // data from these websites 
    // https://rgbcolorpicker.com/0-1
    // https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html
    // https://solarsystem.nasa.gov/planet-compare/

    // textures from : https://www.solarsystemscope.com/textures/

    const SUN = { name: "Sun", radiusKm: 695700, color: [0.949, 0.686, 0.169] };
    
    
    */
    init_solar_system() {
      this.solar_system = {}; // for readability -- to actually render, add root nodes/hierarchy

      // init sun and planets
      const sun = this.init_sun();
      const planets = this.init_planets();
     
      this.solar_system.sun = sun; // for easy access more than anything
      this.solar_system.planets = planets; // can make this more specific if needed

      this.add_node(sun); // add as a root so that it behaves as the "origin" of this scene
      planets.forEach((p) => {
        // add all planets as children of the sun for positioning to carry through when moving scene.
        sun.add_child(p);
      });

    } // end function

    init_planets() {
      const planets = [];

      // for now, same mesh and material for all.
      const mesh = new SceneBuilder.Mesh(this.renderer.gl, MeshBuilder.gen_planet_mesh(
          1, // radius -- placeholder!
          30, 30, // vSteps, uSteps
        )); // generate a basic planet mesh
        const material = new SceneBuilder.PlanetMaterial({ // create a material -- constants from liz's file
            "ka": [0.2, 0.2, 0.2], 
            "kd": [0.5, 0.5, 0.5],
            "ks": [0.8, 0.8, 0.8], 
            "shininess": 1, 
            "metallic": 0,
            "emissive": 1.0, 
            "flat": false
        });

      for (const [planet, data] of Object.entries(PlanetBuilder.PLANET_DATA)) {
        const new_planet = new PlanetBuilder.PlanetSceneNode(planet.name, "planet_basic", data);        
        new_planet.set_mesh(mesh).set_material(material); // TODO: texture set here.
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
      )); // generate a basic planet mesh
      const material = new SceneBuilder.PlanetMaterial({ // create a material -- constants from liz's file
          "ka": [0.2, 0.2, 0.2], 
          "kd": [0.5, 0.5, 0.5],
          "ks": [0.8, 0.8, 0.8], 
          "shininess": 1, 
          "metallic": 0,
          "emissive": 1.0, 
          "flat": false
      });

      sun.set_mesh(mesh).set_material(material); // TODO: texture set here.
      sun.position = [0, 0, -50]; // set an initial position
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

      // update the time on all planets so rotations can be udpated correctly
      if (frontend_data.delta_time) {
        this.day = (frontend_data.delta_time * this.days_per_second);
        this.solar_system.planets.forEach((p) => {
          p.update_orbit(this.day);
        });
      } // end if
     
      super.render();  // let the renderer do it's draw thing
    } // end function


} // end class