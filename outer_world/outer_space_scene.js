import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";

export class OuterSpaceScene extends SceneBuilder.Scene {
  
  constructor() {
      super(); // takes care of base initialization fields.
  
      // do whatever y'all want here, but, like, this sorta shit. these are all the root nodes of a scene.
      // they can be a straight up scene node or group scene node, whatever makes more sense to yall.

      // WIP
      this.solar_system = null; // the root
      // this.planets = null; 
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
  
      // initialize the solar system
      this.init_solar_system();

      // init some shitty basics, lights, camera
      this.set_camera(new SceneBuilder.PerspectiveCamera({
        "aspect": aspect, // since my canvas is not square
      }))
  
      // add sun point light and directional light.
      this.add_light(new SceneBuilder.SunLight({"position": this.solar_system.sun.position}));
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
    */
    init_solar_system() {
      // TODO
      this.solar_system = {};
      // tester: 
      const sun = new SceneBuilder.SceneNode("sun", "planet_basic");
      const mesh = new SceneBuilder.Mesh(this.renderer.gl, MeshBuilder.gen_planet_mesh(
        2.5, 30, 30
      )); // generate a basic planet mesh
      const material = new SceneBuilder.PlanetMaterial({ // create a material -- constants from liz's file
          "ka": [0.2, 0.2, 0.2], 
          "kd": [0.2, 0.2, 0.2],
          "ks": [0.2, 0.2, 0.2], 
          "shininess": 1, 
          "metallic": 0,
          "emissive": 1.0, 
          "flat": false
      });

      sun.set_mesh(mesh).set_material(material);
      sun.position = [0, 0, -10]; // set an initial position

      this.solar_system.sun = sun; // for easy access more than anything
      console.log(material);
      this.add_node(sun); // add as a root rn

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