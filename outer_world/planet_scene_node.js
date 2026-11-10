import * as SceneBuilder from "../util/scene_graph.js";

/**
 * just a small wrapper
 */
export class PlanetData {
  constructor({
    name="Mercury", 
    radius_km=2439.7,  
    distance_km=57909227,   
    color=[0.651, 0.557, 0.380], 
    orbit_period=88, 
    texture="./textures/mercury.jpg"
    }={}
  ) {
    this.name = name;
    this.radius_km = radius_km;
    this.distance_km = distance_km;
    this.color = color;
    this.orbit_period = orbit_period;
    this.texture = texture;
  }
} // end class

/**
 * a little planet scene node at a baseline
 */
export class PlanetSceneNode extends SceneBuilder.SceneNode {
  constructor(id="planet", shader_id="planet_basic", data=null) {
    super(id, shader_id); // takes care of some baseline stuff for now.

    // default super call sets up: this.position = [0, 0, 0]
    // this.velocity = [0, 0, 0];
    // this.acceleration = [0, 0, 0];

    this.data = data; // grab the general data pack.
  } // end constructor


  /*
  // create planet orbiting 
  const angle = (day / planet.data.orbitPeriod) * 2 * Math.PI;
  let planetMatrix = mat4RotateY(objectRotation, angle);

  // translate planet by distance scaling and draw
  planetMatrix = mat4Translate(planetMatrix, [displayDistance(planet.data), 0, 0]);
  planetMatrices.push(planetMatrix);
  */

} // end class

export class SunSceneNode extends SceneBuilder.SceneNode {
  constructor(id="sun", shader_id="planet_basic", data=null) {
    super(id, shader_id); // takes care of some baseline stuff for now.
    this.data = data; // can hand off a data pack as well
  } // end constructor
} // end class

/**
 * just placing these constants here.
 */
export const SUN_DATA = {
  sun: new PlanetData({name: "Sun", radius_km: 695700, distance_km: null, color: [0.949, 0.686, 0.169], orbit_period: null})
};

export const PLANET_DATA = {
  mercury: new PlanetData({name: "Mercury", radius_km: 2439.7, distance_km: 57909227, color: [0.651, 0.557, 0.380], orbit_period: 88}),
  venus: new PlanetData({name: "Venus", radius_km: 6051.8, distance_km: 108209475, color: [0.922, 0.651, 0.545], orbit_period: 224.7}),
  earth: new PlanetData({name: "Earth",   radius_km: 6371.0,  distance_km: 149598262,  color: [0.404, 0.804, 0.890], orbit_period: 365.2}),
  mars: new PlanetData({name: "Mars",    radius_km: 3389.5,  distance_km: 227943824,  color: [0.812, 0.176, 0.114], orbit_period: 687}),
  jupiter: new PlanetData({name: "Jupiter", radius_km: 69911,   distance_km: 778340821,  color: [0.878, 0.875, 0.761], orbit_period: 4331}),
  saturn: new PlanetData({name: "Saturn",  radius_km: 58232,   distance_km: 1426666422, color: [0.902, 0.882, 0.604], orbit_period: 10747}),
  uranus: new PlanetData({name: "Uranus",  radius_km: 25362,   distance_km: 2870658186, color: [0.443, 0.694, 0.780], orbit_period: 30589}),
  neptune: new PlanetData({name: "Neptune", radius_km: 24622,   distance_km: 4498396441, color: [0.196, 0.376, 0.439], orbit_period: 59800})
};