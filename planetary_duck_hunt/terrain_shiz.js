import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";
import { mat4Identity, matMul, translate, rotate, scale, mat4FromRows, deg_to_rad } from '../util/transitions.js';
import { seededPerlin, initFbm, mulberry32, smoothstep, spherePointPicking } from "./noise.js";

/**
 * The terrain is a bumpy sphere (random bumps determined by a given seed)
 *  - dir is a unit vector from the planets center 
 *  - the surcafe point = dir * (radius + height_at(dir))
 * 
 * TO DO : add more items (player, cati, mointains , idk what else lol)
 * 
 */
export class BumpyLandSceneNode extends SceneBuilder.SceneNode {
  
  constructor(id="bumpyland", shader="bumpyland_basic", {
    radius=100,             // big so the surface looks flat-ish up close
    seed=412,               // select random seed,, pick what we like
    num_bumps=500,          // how many random bumps on the whole sphere
    bump_radius=[2, 9],     // [min, max] footprint radius of a bump (world units)
    bump_height=[0.4, 3.0], // [min, max] bump height
    dip=0.15,        // fraction of bumps that are dips instead
    roll_amplitude=1.2,     // height of the rolling base noise
    roll_wavelength=30,     // size of the rolling hills (world units)
    h_step=0.008,           // mesh resolution (angle step, like gen_sphere_mesh). smaller = more detail
    v_step=0.008,
    fog_color=[0.2, 0.2, 0.2], // will change based on planet
    fog_density=0.02,
    detail_strength=0.18,   // fine speckle in the shader (0 = off)
    show_pole_marker=true   // little cone at the north pole for orientation
  } = {}) {
    super(id, shader);

    this.position = [0, -radius, 0]; // want camera to sit at the surface 
    this.rotation = [0, 0, 0]; // leave as nothing for now
    this.orientation = mat4Identity();
    this.scale = [1, 1, 1];
    this.center = [...this.position, 1]; // leave center as static 
    this.velocity = [0, 0, 0]; 
    this.rotation_speed = 0.0; 

    this.radius = radius;
    this.seed = seed;
    this.roll_amplitude = roll_amplitude;
    this.roll_freq = radius/roll_wavelength;
    this.h_step = h_step;
    this.v_step = v_step;
    this.show_pole_marker = show_pole_marker;

    // info for the bumpy land shader 
    this.fog_color = fog_color;
    this.fog_density = fog_density;
    this.detail_strength = detail_strength;

    // create seeds w/ mulberry32 
    this.rng = mulberry32(seed);
    this.base_noise = initFbm(seededPerlin(seed)); // will have defualt fbm vals
    this.patch_noise = initFbm(seededPerlin(seed + 1), {octaves: 3}) // create differring patches,, may want to change or remove 
    
    this.bumps = this.gen_bumps(num_bumps, bump_radius, bump_height, dip);
  }

  /**
   * Distrubute bumps all over the planet (sphere)
   */
  gen_bumps(count, [r_min, r_max], [h_min, h_max], dip) {
    const bumps = [];
    for (let i = 0; i < count; i++){
        const dir = spherePointPicking(this.rng);
        const planet_r = r_min + this.rng() * (r_max - r_min);
        const angle = planet_r / this.radius; // arclength
        const cos_r = Math.cos(angle);
        let height = h_min + this.rng() * (h_max - h_min);

        bumps.push({ dir, cos_r, inv_span: 1 / (1 - cos_r), height });
    }
    return bumps;
  }

  /**
   * Determines height relative to the radius 
   */
  height_at(dir) {
    const x = dir[0], 
          y = dir[1],
          z = dir[2];

    const freq = this.roll_freq;

    let h = this.roll_amplitude * this.base_noise(x * freq, y * freq, z * freq);

    // creat normal distribution (bell shape) 1 @ peak & 0 @ edges 
    for (let i = 0; i < this.bumps.length; i++) {
        const b = this.bumps[i];
        const d = x * b.dir[0] + y * b.dir[1] + z * b.dir[2];
        if (d <= b.cos_r){
            continue; // outside the bump
        }
        const k = 1 - (1 - d) * b.inv_span;
        h += b.height * k * k;
    }
    return h;
  }

  /**
  * Creat color for terrain depending on the height and dir
  */
  color_at(dir, h) {
      const grass = [0.30, 0.50, 0.22];
      const dirt  = [0.40, 0.31, 0.20];
      const rock  = [0.52, 0.50, 0.46];
      const sand  = [0.74, 0.64, 0.42];

      // blend colors
      const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

      const p_freq = this.radius / 60;
      const patch = this.patch_noise(dir[0] * p_freq, dir[1] * p_freq, dir[2] * p_freq);


      // color changes depending on patch or height bounds 
      let m = mix(grass, sand, smoothstep(0.05, 0.25, patch));
      m = mix(m, dirt, smoothstep(0.0, -1.0, h));
      m = mix(m, rock, smoothstep(2.0, 3.8, h));
        
      return m;
  }

  /**
  * Surface point of dir
  */
  surface_point(dir){
      const r = this.radius + this.height_at(dir);
      return [dir[0] * r, dir[1] * r, dir[2] * r];
  }

  /**
   * Random surface point for scattering additional objects
   */
  random_surface_dir() {
  return spherePointPicking(this.rng);
  }

  /**
   * takes a vector relavent to the planet and converts it to a point on the actual planet
   * v = vector
   */
  vector_to_planet_point(v){
    const m = this.orientation; // planets rotation matrix

    // return dir ;; v = R * dir;; dir = R * v --> return dir
    return[m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
           m[4] * v[0] + m[5] * v[1] + m[6] * v[2],
           m[8] * v[0] + m[9] * v[1] + m[10] * v[2],]
  }

  /**
   * rotate the planet from the center by a given angle about a given axis
   * this will be used for walking --> walking == rolling planet
   */
  roll(axis, angle){
    // find the straight line length from origin to axis point
    const len = Math.hypot(axis[0], axis[1], axis[2]);
    if(len == 0 || angle == 0) return; // if no rotation or shifted axis

    // normalize
    const x = axis[0] / len;
    const y = axis[1] / len;
    const z = axis[2] / len;

    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const t = 1 - c;
    
    // rotation around arbitrary axis --> Rodrigues rotation formula
    // https://www.songho.ca/opengl/gl_rotate.html 
    const R = mat4FromRows(
      t * x * x + c    ,  t * x * y - s * z,  t * x * z + s * y,  0,
      t * x * y + s * z,  t * y * y + c    ,  t * y * z - s * x,  0,
      t * x * z - s * y,  t * y * z + s * x,  t * z * z + c    ,  0,
      0,                  0,                  0,                  1
    );

    // R * T_0 --> maintain current rotation --> hierarchy shiz 
    this.orientation = matMul(R, this.orientation);
    this.clean_orientation();

  }

  /**
   * Cleans up any rounding/skewing that would add up over time due to constant calling
   * ensures that the earth is sphereical with r 1 all around
   */
  clean_orientation() {
    const m = this.orientation;
    const a = [m[0], m[1], m[2]];
    const b = [m[4], m[5], m[6]];

    const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); 
                          return [v[0] / l, v[1] / l, v[2] / l];
    };

    // normalize the orientation and reassign to m --> this.orientation
    const c0 = norm(a);
    const d = c0[0] * b[0] + c0[1] * b[1] + c0[2] * b[2];
    const c1 = norm([b[0] - d * c0[0], b[1] - d * c0[1], b[2] - d * c0[2]]);
    const c2 = [ // c0 x c1
      c0[1] * c1[2] - c0[2] * c1[1],
      c0[2] * c1[0] - c0[0] * c1[2],
      c0[0] * c1[1] - c0[1] * c1[0]
    ]; 

    // reassign 
    m[0] = c0[0]; m[1] = c0[1]; m[2] = c0[2];
    m[4] = c1[0]; m[5] = c1[1]; m[6] = c1[2];
    m[8] = c2[0]; m[9] = c2[1]; m[10] = c2[2];
  }

  /**
   * Same basic update transformation but utilizes the orientation which is being updated w/ rotation
   */
  update_transformation_matrix(M){
    const matrix = matMul(translate(this.position), this.orientation, scale(this.scale));
    this.transformation_matrix = matMul(M,matrix);
  }
    
  /**
   * initialize the land mesh, material, textures, anything else
   */
  init(gl) {
    // generate a sphere with terrain 
    const base_mesh = MeshBuilder.gen_terrain_sphere_mesh(
        this.radius,
        this.h_step,
        this.v_step,
        (dir) => this.height_at(dir),      // the bumps
        (dir, h) => this.color_at(dir, h)  // the colors
    ); 
    
    // make dull
    const material = new SceneBuilder.Material({ 
      "ka": [0.3, 0.3, 0.3], 
      "kd": [0.7, 0.7, 0.7],
      "ks": [0.1, 0.1, 0.1], 
      "shininess": 8, 
      "transparency": 1
    });

    this.set_mesh(new SceneBuilder.Mesh(gl, base_mesh)).set_material(material); 
  } // end function

} // end class