import { SceneObjectNode, SceneObject } from '../scene_graph.js';
import { phong_frag_shader } from '../frag_shaders.js';
import { phong_vert_shader } from '../vert_shaders.js';
import { translate } from '../transitions.js';

export class SphereObject extends SceneObject {
//id, gl, vert_shader=null, frag_shader=null)
   /**
   * ----------------------------------
   * constructor and inits
   * ----------------------------------
   */
  constructor(id, gl, vert_shader=phong_vert_shader, frag_shader=phong_frag_shader) {
    super(id, gl, vert_shader, frag_shader);
    this.add_root(new SphereNode("sphere_root", gl, this.program));
    // console.log(this.roots)
  } // end constructor

  /**
   * ----------------------------------
   * basic functions
   * ----------------------------------
   */

} // end class

export class SphereNode extends SceneObjectNode {

   /**
   * ----------------------------------
   * constructor and inits
   * ----------------------------------
   */
  constructor(id, gl, program, base_color=[0.5, 0.5, 0.5], static_transforms=[translate([0, 0, -10])]) {
    const math_pack = gen_math_pack();
    const basic_colors = gen_colors(math_pack.vertices.length, base_color);
    super(
      id, 
      math_pack,  
      basic_colors, 
      static_transforms, 
      gl, 
      program
    ); // init the underlying node
  } // end constructor

} // end class

/**
 * ----------------------------------
 * basic functions
 * ----------------------------------
 */

/**
 * generate a math pack for the sphere:
 * vertices, index mapping, normals, tangents, texel mapping.
 */
function gen_math_pack() {
  const r = 1.0; // unit sphere-ish
  const h_step = 0.1; // horizontal resolution
  const v_step = 0.1; // vertical resolution

  // how many steps we are taking in that range.
  let h_steps = Math.round((2 * Math.PI) / h_step)
  let v_steps = Math.round(Math.PI / v_step)

  const vertices = [] // simple js array for collection of vertices
  const indices = [] // js array for collecting indices
  const norms = []; // norms for the planes
  const tangents = []; // for texture mapping; tangent to the minisurface
  const texels = []; // texture coordinates for sampling

  // ==================================
  //  GENERATE POINTS
  // ==================================

  vertices.push(0, r, 0) // save the north polar cap
  norms.push(0, 1, 0); // pointing straight up
  tangents.push(-1, 0, 0); // push the tangent at that point
  texels.push(0.5, 0.5); // grab the conversion to the texture map

  // generate the bands of the sphere
  for (let v_i = 1; v_i < v_steps; v_i++) { // for each vertical step
      // get our current v, which is the v in (h, v)
        const v = (v_i / v_steps) * Math.PI;
        const sin_v = Math.sin(v) // save for later
        const cos_v = Math.cos(v)

        for (let h_i = 0; h_i <= h_steps; h_i++) { // for each horizontal step
          const h = (h_i / h_steps) * 2 * Math.PI; // percent of steps, re-mapped to an angle

          // gather points
          const x = r * sin_v * Math.cos(h);
          const z = r * sin_v * Math.sin(h);
          const y = r * cos_v;

          vertices.push(x, y, z); // get vertex
          norms.push(x, y, z); // norm is just the point here 
          tangents.push(-z, 0, x); // basic tangent for this points
          texels.push(h_i / h_steps, v_i / v_steps); // do a very basic mapping pull
      } // end loop
    } // end loop
  
    vertices.push(0, -r, 0) // save the south polar cap
    norms.push(0, -1, 0); // pointing straight down
    tangents.push(1, 0, 0); // push the tangent at that point
    texels.push(0.5, 0.5); // grab the conversion to the texture map

    // ==================================
    //  GENERATE INDICES
    // ==================================

    let last_pt_index = (vertices.length / 3) - 1 // the LAST POINT in the list of vertices, so the south polar cap
    let lower_band = last_pt_index - h_steps // the min index of the band just "below" the south cap

    // set up the polar NORTH indices
    // set them up in a triangular way, all connecting to the south pole:
    //      \ | /
    //   -- pole --
    //      / | \
    for (let i = 1; i < h_steps; i++) { // for each horizontal step
                                // if h steps == 4, 
      indices.push(0, i, i + 1) // generally: n. pole, 1, 2; n. pole, 2, 3; n. pole, 3, 4
    } // end loop
    indices.push(0, h_steps, 1) // special case: final vertex wraps back to start: n. pole, 4, 1

    // set up the middle banding indeces (general case)
    // going to start from the upper band and "reach down" to the lower band below.
    // going in the motion:
    // bottom_left -- bottom_right
    //      |       /    |
    // top_left    -- top_right
    for (let band_walker = 1; band_walker < lower_band; band_walker += h_steps) {  // walk through all bands until reach south pole
      for (let i = 0; i < h_steps; i++) { // walk across the band, with special case on final setup
        const bottom_left = band_walker + i // the "bottom left" point
        const bottom_right = bottom_left + 1 // "bottom right" point
        const top_left = bottom_left + h_steps // the "top left" point
        const top_right = bottom_left + h_steps + 1 // "top right" point
        

        // add the two triangles this set of vertices makes.
        indices.push(
          bottom_left, top_left, top_right,
          bottom_left, bottom_right, top_right
        )
      } // end loop 

      // special last case: we need to wrap around slightly
      const bottom_left = band_walker + h_steps - 1 // final addition/point on band
      const bottom_right = band_walker // wrap around to the beginning of the band vertex
      const top_left = bottom_left + h_steps // still normal top left
      const top_right = bottom_right + h_steps // wrap around to the beginning of the lower band vertex
      
      // push the final index
      indices.push(
          bottom_left, top_left, top_right,
          bottom_left, bottom_right, top_right
        )
    } // end loop
  
    // in same way we set up the north pol, we set up the SOUTH pole indeces
    // with the last band.
    for (let i = lower_band; i < last_pt_index - 1; i++) {
      indices.push(last_pt_index, i, i + 1)
    } // end loop
    indices.push(last_pt_index, last_pt_index - 1, lower_band) // final point wrap around.

  // return as a js dict
  return {
    "vertices": new Float32Array(vertices), 
    "indices": new Uint16Array(indices),
    "norms": new Float32Array(norms),
    "tangents": new Float32Array(tangents),
    "texels": new Float32Array(texels)
  };
} // end function

/**
 * generate some initial color assignments of vertices
 */
function gen_colors(num_vertices, solid_color=[0.5, 0.5, 0.5]) {
  let sphere_color = []
  // use a solid color only.
  for (let v = 0; v < num_vertices; v++) {
      sphere_color.push(...solid_color)
  } // end loop
  return new Float32Array(sphere_color)
} // end function
