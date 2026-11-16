
/**
 * generate a sphere mesh programmatically.
 * if anything else needed, add it here!
 */

/**
 * basic sphere mesh generation (dont @me i know it's a pile of trash)
 */
export function gen_sphere_mesh(
  r=1.0, // radius
  h_step=0.1, // horizontal "resolution"
  v_step=0.1, // vertical "resolution"
  color=[0.5, 0.5, 0.5]
) {
  // how many steps we are taking in that range.
  let h_steps = Math.round((2 * Math.PI) / h_step)
  let v_steps = Math.round(Math.PI / v_step)

  const vertices = [] // simple js array for collection of vertices
  const indices = [] // js array for collecting indices
  const normals = []; // normals for the planes
  const tangents = []; // for texture mapping; tangent to the minisurface
  const texels = []; // texture coordinates for sampling
  const colors = []; // basic colors of the primitive mesh

  // ==================================
  //  GENERATE POINTS
  // ==================================

  vertices.push(0, r, 0) // save the north polar cap
  normals.push(0, 1, 0); // pointing straight up
  tangents.push(-1, 0, 0); // push the tangent at that point
  texels.push(0.5, 0.5); // grab the conversion to the texture map
  colors.push(...color); // baseline color

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
      normals.push(x, y, z); // norm is just the point here 
      tangents.push(-z, 0, x); // basic tangent for this points
      texels.push(h_i / h_steps, v_i / v_steps); // do a very basic mapping pull
      colors.push(...color); // baseline color
    } // end loop
  } // end loop

  vertices.push(0, -r, 0) // save the south polar cap
  normals.push(0, -1, 0); // pointing straight down
  tangents.push(1, 0, 0); // push the tangent at that point
  texels.push(0.5, 0.5); // grab the conversion to the texture map
  colors.push(...color); // baseline color

  // ==================================
  //  GENERATE INDICES
  // ==================================

  // Each horizontal ring actually contains (h_steps + 1) vertices due to the <= h_steps loop
  const vertices_per_ring = h_steps + 1; 
  let last_pt_index = (vertices.length / 3) - 1; // the south polar cap index

  // NORTH POLAR CAP INDICES
  // index 0 is the north pole. the first ring starts at index 1.
  for (let h_i = 0; h_i < h_steps; h_i++) {
    const current_ring_pt = 1 + h_i;
    const next_ring_pt = current_ring_pt + 1;
    indices.push(0, current_ring_pt, next_ring_pt);
  } // end loop

  // MIDDLE BANDING INDICES
  // we have (v_steps - 1) rings of vertices in the middle.
  for (let v_i = 0; v_i < v_steps - 2; v_i++) {
    const current_ring_start = 1 + (v_i * vertices_per_ring);
    const next_ring_start = current_ring_start + vertices_per_ring;

    for (let h_i = 0; h_i < h_steps; h_i++) {
      const bottom_left  = current_ring_start + h_i;
      const bottom_right = bottom_left + 1;
      const top_left     = next_ring_start + h_i;
      const top_right    = top_left + 1;

      indices.push(
        bottom_left, top_left, top_right,
        bottom_left, top_right, bottom_right
      );
    } // end loop
  } // end loop

  // SOUTH POLAR CAP INDICES
  // the last ring of vertices before the south pole starts here:
  const last_ring_start = 1 + ((v_steps - 2) * vertices_per_ring);
  for (let h_i = 0; h_i < h_steps; h_i++) {
    const current_ring_pt = last_ring_start + h_i;
    const next_ring_pt = current_ring_pt + 1;
    indices.push(last_pt_index, next_ring_pt, current_ring_pt);
  }

  // return as a js dict
  return {
    "vertices": new Float32Array(vertices), 
    "indices": new Uint16Array(indices),
    "normals": new Float32Array(normals),
    "tangents": new Float32Array(tangents),
    "texels": new Float32Array(texels),
    "colors": new Float32Array(colors)
  };
} // end function


/**
 * cylinder mesh (basic)
 * TODO: would like to center it around origin maybe. we'll see.
 * right now base is at origin.
 */
export function gen_cylinder_mesh(
  r=0.5, // radius of the cylinder
  h_step=0.1, // horizontal step interval (u)
  v_step=0.1, // vertical step interval (v)
  color=[0.5, 0.5, 0.5]
) {

  // how many steps we are taking in that range.
  let h_steps = Math.round((2 * Math.PI) / h_step)
  let v_steps = Math.round(1 / v_step)

  const vertices = [] // simple js array for collection of vertices
  const indices = [] // js array for collecting indices
  const normals = []; // normals for the planes
  const tangents = []; // for texture mapping; tangent to the minisurface
  const texels = []; // texture coordinates for sampling
  const colors = []; // just some basic coloring for the primitive.

  // ==================================
  //  GENERATE CAPS
  // ==================================

  let curr_index = 0; // this will be used for setting up indices as an incrementer
  
  // generate the cap points
  for (let y of [0, 1]) { // grows on the y axis

    // this is the middle point
    vertices.push(0, y, 0) // at the origin
    if (y == 0) {
      normals.push(0, -1, 0); // pointing straight down
    } else {
      normals.push(0, y, 0); // pointing straight up
    } // end if
    tangents.push(1, 0, 0); // pointing to the side
    texels.push(0.5, 0.5); // pick the halfway texel
    colors.push(...color); // basic color

    for (let h_i = 0; h_i < h_steps; h_i++) {
      // get our current h, which is the h in (h, v)
      const h = h_i * h_step
      const cos_h = Math.cos(h) // save for later
      const sin_h = Math.sin(h)

      // gather the points using parametric form
      const x = r * cos_h
      const z = r * sin_h

      vertices.push(x, y, z) // save the points
      if (y == 0) {
        normals.push(0, -1, 0); // pointing straight down
      } else {
        normals.push(0, 1, 0); // pointing straight up
      } // end if
      tangents.push(1, 0, 0); // push the tangent at that point
      // texels.push(0.5 + r * Math.cos(tex_theta), 0.5 + r * Math.sin(tex_theta)); // TODO: grab the conversion to the texture max
      texels.push((cos_h + 1) * 0.5, (sin_h + 1) * 0.5); 
      colors.push(...color); // basic color
    } // end loop
  } // end loop
  
  // generate the caps' indexing
  for (let num_caps = 0; num_caps < 2; num_caps++) {
    const center = curr_index; // this will be the center point
    for (let i = 0; i < h_steps - 1; i++) { // for all but last index connection
      indices.push(center, center + i + 1, center + i + 2); // (0, 1, 2), (0, 2, 3)....
    } // end loop
    indices.push(center, center + 1, center + h_steps) // final special case wrap around: (0, 6, 1)
    curr_index += h_steps + 1; // increment to the next center point
  } // end loop

  // ==================================
  //  GENERATE SIDES
  // ==================================

  // generate the bands of the side of the cylinder.
  for (let v_i = 0; v_i <= v_steps; v_i++) { // for each vertical step
    // get our current v, which is the v in (h, v)
    const v = v_i * v_step

    for (let h_i = 0; h_i < h_steps; h_i++) { // for each horizontal step
      // get our current h, which is the h in (h, v)
      const h = h_i * h_step
      const cos_h = Math.cos(h) // save for later
      const sin_h = Math.sin(h)

      // gather the points using parametric form
      const x = r * cos_h
      const z = r * sin_h
      const y = v

      vertices.push(x, y, z) // save the points
      normals.push(x, 0, z); // pointing straight out to sides of x, z, but no y value
      tangents.push(z, 0, -x); // push the tangent at that point
      texels.push((h_i / h_steps) * Math.PI, y); // grab the conversion to the texture map
      colors.push(...color); // basic color
    } // end loop
  } // end loop

  // put together the index mapping of side vertices
  for (let i = 0; i < v_steps; i++) { // each band

    for (let j = 0; j < h_steps - 1; j++) { // each step along the base band
      const bottom_left = curr_index + j;
      const bottom_right = bottom_left + 1;
      const top_left = bottom_left + h_steps;
      const top_right = top_left + 1;

      indices.push(bottom_left, bottom_right, top_right, bottom_left, top_left, top_right);
    } // end loop

    // special last case to wrap around
    const bottom_left = curr_index + h_steps - 1;
    const bottom_right = curr_index;
    const top_left = bottom_left + h_steps;
    const top_right = bottom_right + h_steps;

    indices.push(bottom_left, bottom_right, top_right, bottom_left, top_left, top_right);
    
    curr_index += h_steps; // move up the cylinder
  } // end loop
  
  // return as a js dict
  return {
    "vertices": new Float32Array(vertices), 
    "indices": new Uint16Array(indices),
    "normals": new Float32Array(normals),
    "tangents": new Float32Array(tangents),
    "texels": new Float32Array(texels),
    "colors": new Float32Array(colors)
  } 
} // end method

/**
 * basic cone mesh using parametrics.
 */
export function gen_cone_mesh(
  r=0.5,       // radius of the base
  h_step=0.1, // horizontal "resolution"
  v_step=0.1, // vertical "resolution"
  color=[0.5, 0.5, 0.5]
) {

  // how many steps we are taking in that range.
  let h_steps = Math.round((2 * Math.PI) / h_step);
  let v_steps = Math.round(1 / v_step);

  // all of our collections
  const vertices = [];
  const indices = [];
  const normals = [];
  const tangents = [];
  const texels = [];
  const colors = [];

  // step sizes after rounding.
  const h_angle = (2 * Math.PI) / h_steps;

  // ==================================
  // VERTICES
  // ==================================

  let curr_index = 0;

  // Base center.
  vertices.push(0, 0, 0);
  normals.push(0, -1, 0);
  tangents.push(1, 0, 0);
  texels.push(0.5, 0.5);
  colors.push(...color);

  // the base circle perimeter
  for (let h_i = 0; h_i < h_steps; h_i++) {

    const h = h_i * h_angle;

    const cos_h = Math.cos(h);
    const sin_h = Math.sin(h);

    const x = r * cos_h;
    const z = r * sin_h;

    vertices.push(x, 0, z);
    normals.push(0, -1, 0);
    tangents.push(1, 0, 0);
    texels.push(0.5 + 0.5 * cos_h, 0.5 + 0.5 * sin_h); // planar texture mapping
    colors.push(...color); // base coloring
  } // end loop

  // now onto the sides

  // Generate vertical rings.
  // The final ring is the apex.
  for (let v_i = 0; v_i <= v_steps; v_i++) {

    const v = v_i / v_steps;

    // radius reduction head v step
    const curr_r = r * (1 - v);

    for (let h_i = 0; h_i <= h_steps; h_i++) {

      const h = h_i * h_angle;

      const cos_h = Math.cos(h);
      const sin_h = Math.sin(h);

      const x = curr_r * cos_h;
      const z = curr_r * sin_h;
      const y = v;

      vertices.push(x, y, z);
      normals.push(x, 0, z); // pointing straight out to sides of x, z, but no y value
      tangents.push(z, 0, -x); // push the tangent at that point
      texels.push(h_i / h_steps, v); // basic selection, choose from segmented u and v as height
      colors.push(...color); 
    } // end loop
  } // end loop

  // ==================================
  // GENERATE INDICES
  // ==================================

  // deal with the base first

  // spokes to select from
  for (let h_i = 0; h_i < h_steps - 1; h_i++) {
    indices.push(curr_index, curr_index + h_i + 2, curr_index + h_i + 1
    );
  } // end loop

  // last step special case wrap around
  indices.push(curr_index, curr_index + 1, curr_index + h_steps
  );

  // now handle the sides.
  curr_index += h_steps + 1;

  const vertices_per_ring = h_steps + 1;

  for (let v_i = 0; v_i < v_steps; v_i++) {

    const current_ring_start = curr_index + v_i * vertices_per_ring;
    const next_ring_start = current_ring_start + vertices_per_ring;

    for (let h_i = 0; h_i < h_steps; h_i++) {

      const bottom_left = current_ring_start + h_i;
      const bottom_right = bottom_left + 1;
      const top_left = next_ring_start + h_i;
      const top_right = top_left + 1;

      // Skip degenerate triangles at the apex.
      if (v_i == v_steps - 1) {
        indices.push(bottom_left, bottom_right, top_left);
      } else {
        // normal sphere index pattern used before
        indices.push(
          bottom_left, bottom_right, top_right,
          bottom_left, top_right, top_left
        );
      } // end if
    } // end loop
  } // end loop

  // ==================================
  // RETURN MESH
  // ==================================

  return {
    "vertices": new Float32Array(vertices),
    "indices": new Uint16Array(indices),
    "normals": new Float32Array(normals),
    "tangents": new Float32Array(tangents),
    "texels": new Float32Array(texels),
    "colors": new Float32Array(colors)
  };

} // end function

/**
 * make a basic cube mesh
 */
export function gen_cube_mesh(color=[0.5, 0.5, 0.5]) {
  const vertices = [
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,   // front
     1, -1, -1,  -1, -1, -1,  -1,  1, -1,   1,  1, -1,   // back
    -1,  1,  1,   1,  1,  1,   1,  1, -1,  -1,  1, -1,   // top
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,   // bottom
     1, -1,  1,   1, -1, -1,   1,  1, -1,   1,  1,  1,   // right
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1    // left
  ];
  const normals = [
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
  ];
  const tangents = [
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1
  ];
  const texels = [
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1
  ];
  const indices = [
     0,  1,  2,   0,  2,  3,   // front
     4,  5,  6,   4,  6,  7,   // back
     8,  9, 10,   8, 10, 11,   // top
    12, 13, 14,  12, 14, 15,   // bottom
    16, 17, 18,  16, 18, 19,   // right
    20, 21, 22,  20, 22, 23    // left
  ];

  const colors = []
  for (let i = 0; i < vertices.length; i += 3) {
    colors.push(...color);
  } // end loop
  
  return {
    "vertices": new Float32Array(vertices),
    "indices": new Uint16Array(indices),
    "normals": new Float32Array(normals),
    "tangents": new Float32Array(tangents),
    "texels": new Float32Array(texels),
    "colors": new Float32Array(colors)
  };
} // end function

/**
 * a basic pyramid.
 */
export function gen_pyramid_mesh(color=[0.5, 0.5, 0.5]) {
  const vertices = [
    -1, 0, -1, -1, 0, 1, 1, 0, 1, 1, 0, -1, // base
    -1, 0, -1, -1, 0, 1, 0, 1, 0, // left face
    -1, 0, 1, 1, 0, 1, 0, 1, 0, // front face
    1, 0, 1, 1, 0, -1, 0, 1, 0, // right face 
    1, 0, -1, -1, 0, -1, 0, 1, 0 // back face
  ]

  const indices = [
    0, 2, 1, 0, 3, 2, // base
    4, 5, 6, // left side
    7, 8, 9, // front side
    10, 11, 12, // right side
    13, 14, 15, // back side
  ]

  const normals = [
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, // all base's facing directly down
    -1, 1, 0, -1, 1, 0, -1, 1, 0, // left face
    0, 1, 1, 0, 1, 1, 0, 1, 1, // front face
    1, 1, 0, 1, 1, 0, 1, 1, 0, // right face
    0, 1, -1, 0, 1, -1, 0, 1, -1 // back face
  ]

  const tangents = [
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, // base
    1, 1, 0, 1, 1, 0, 1, 1, 0, // left face
    0, -1, 1, 0, -1, 1, 0, -1, 1, // front face
    1, -1, 0, 1, -1, 0, 1, -1, 0, // right face
    0, -1, -1, 0, -1, -1, 0, -1, -1 // back face
  ]

  const texels = [
    0, 0, 1, 0, 1, 1, 0, 1, // base
    0, 0, 1, 0, 0.5, 1, // sides, clipped
    0, 0, 1, 0, 0.5, 1,
    0, 0, 1, 0, 0.5, 1,
    0, 0, 1, 0, 0.5, 1,
  ]

  const colors = []
  for (let i = 0; i < vertices.length; i += 3) {
    colors.push(...color);
  } // end loop

  return {
    "vertices": new Float32Array(vertices),
    "indices": new Uint16Array(indices),
    "normals": new Float32Array(normals),
    "tangents": new Float32Array(tangents),
    "texels": new Float32Array(texels),
    "colors": new Float32Array(colors)
  };
} // end function

/**
 * adapted directly from's liz's planet mesh in planet.js.
 * using directly for now in order to adapt.
 */
export function gen_planet_mesh(r, vSteps, uSteps, color=[0.2, 0.4, 0.9], mapping=0, uRepeat=1, vRepeat=1) {
  const positions = [];
  const colors = [];
  const indices = [];
  const normals = [];

    // for texture
  const tangents = [];
  const textureCoors = [];

  /* 
  phi -> 0 - pi
  loop through each step of v 
  v = ratio of place in total v steps by pi
  */
  for (let i = 0; i <= vSteps; i++) {
      const v = i * Math.PI / vSteps;
      const sinV = Math.sin(v);
      const cosV = Math.cos(v);

      /*
      theta -> 0 - 2pi
      */
      for (let j = 0; j <= uSteps; j++) {
          const u = j * 2 * Math.PI / uSteps;
          const sinU = Math.sin(u);
          const cosU = Math.cos(u);

          // convert from spherical to cartesian 
          const x = cosU * sinV;
          const y = cosV;
          const z = sinU * sinV;

          // multiply by the radius, r, and push verticies 
          positions.push(r * x, r * y, r * z);

          // normal vector is just center pointed to x, y, z --> nature of sphere
          normals.push(x, y, z);

          colors.push(color[0], color[1], color[2]);

          // map the texture coordinates 
          textureCoors.push(uRepeat * (1 - j / uSteps), vRepeat * (1 - i / vSteps));
          tangents.push(sinU, 0, -cosU); 
      }

  }
  for (let i = 0; i < vSteps; i++) {
      for (let j = 0; j < uSteps; j++) {
          const k1 = (i * (uSteps + 1)) + j;
          const k2 = k1 + uSteps + 1;
          indices.push(k1, k2, k1 + 1); // upper left triangle
          indices.push(k2, k2 + 1, k1 + 1); // lower right triangle
      }
  }

  return {
      "vertices": new Float32Array(positions),
      "colors": new Float32Array(colors),
      "indices": new Uint16Array(indices),
      "normals": new Float32Array(normals),
      "tangents": new Float32Array(tangents),
      "texels": new Float32Array(textureCoors),
      "mapping": mapping // this is added with liz's shader in mind. better idea than what i did hehe
  };

  
} // end function


// ==================================
// Bumpy Terrain Stuff
// ==================================

/**
 * bumpy sphere for terrain. this is gen_sphere_mesh but...
 *   - each point is pushed out by height_fn(dir) -> the bumps
 *   - normals are recalculated from the triangles (on a bumpy surface the
 *      normal is no longer just the point, so the old normals would be wrong)
 * height_fn(dir) -> how far above the base radius the ground is at direction dir
 * color_fn(dir, h) -> [r, g, b] for that point
 */
export function gen_terrain_sphere_mesh(
  r=1.0, // radius
  h_step=0.1, // horizontal "resolution"
  v_step=0.1, // vertical "resolution"
  height_fn=(dir) => 0, // ground height at a direction
  color_fn=(dir, h) => [0.5, 0.5, 0.5] // color at a direction/height
) {
  // how many steps we are taking in that range.
  let h_steps = Math.round((2 * Math.PI) / h_step)
  let v_steps = Math.round(Math.PI / v_step)

  const vertices = [] // simple js array for collection of vertices
  const indices = [] // js array for collecting indices
  const normals = []; // normals for the planes
  const tangents = []; // for texture mapping; tangent to the minisurface
  const texels = []; // texture coordinates for sampling
  const colors = []; // basic colors of the primitive mesh

  // ==================================
  //  GENERATE POINTS
  // ==================================

  // helper: push one point at direction dir, raised by the terrain height
  function add_point(dir, tangent, texel) {
    const h = height_fn(dir); // how high is the ground here
    const dist = r + h; // distance from the center
    vertices.push(dir[0] * dist, dir[1] * dist, dir[2] * dist);
    normals.push(0, 0, 0); // placeholder, calculated below
    tangents.push(...tangent);
    texels.push(...texel);
    colors.push(...color_fn(dir, h));
  } // end function

  add_point([0, 1, 0], [-1, 0, 0], [0.5, 0.5]); // north polar cap

  // generate the bands of the sphere
  for (let v_i = 1; v_i < v_steps; v_i++) { // for each vertical step
    const v = (v_i / v_steps) * Math.PI;
    const sin_v = Math.sin(v)
    const cos_v = Math.cos(v)

    for (let h_i = 0; h_i <= h_steps; h_i++) { // for each horizontal step
      const h = (h_i / h_steps) * 2 * Math.PI;

      // direction on a radius 1 sphere (same as gen_sphere_mesh with r = 1)
      const x = sin_v * Math.cos(h);
      const z = sin_v * Math.sin(h);
      const y = cos_v;

      add_point([x, y, z], [-z, 0, x], [h_i / h_steps, v_i / v_steps]);
    } // end loop
  } // end loop

  add_point([0, -1, 0], [1, 0, 0], [0.5, 0.5]); // south polar cap

  // ==================================
  //  GENERATE INDICES (same as gen_sphere_mesh)
  // ==================================

  const vertices_per_ring = h_steps + 1;
  let last_pt_index = (vertices.length / 3) - 1; // the south polar cap index

  // NORTH POLAR CAP INDICES
  for (let h_i = 0; h_i < h_steps; h_i++) {
    const current_ring_pt = 1 + h_i;
    const next_ring_pt = current_ring_pt + 1;
    indices.push(0, current_ring_pt, next_ring_pt);
  } // end loop

  // MIDDLE BANDING INDICES
  for (let v_i = 0; v_i < v_steps - 2; v_i++) {
    const current_ring_start = 1 + (v_i * vertices_per_ring);
    const next_ring_start = current_ring_start + vertices_per_ring;

    for (let h_i = 0; h_i < h_steps; h_i++) {
      const bottom_left  = current_ring_start + h_i;
      const bottom_right = bottom_left + 1;
      const top_left     = next_ring_start + h_i;
      const top_right    = top_left + 1;

      indices.push(
        bottom_left, top_left, top_right,
        bottom_left, top_right, bottom_right
      );
    } // end loop
  } // end loop

  // SOUTH POLAR CAP INDICES
  const last_ring_start = 1 + ((v_steps - 2) * vertices_per_ring);
  for (let h_i = 0; h_i < h_steps; h_i++) {
    const current_ring_pt = last_ring_start + h_i;
    const next_ring_pt = current_ring_pt + 1;
    indices.push(last_pt_index, next_ring_pt, current_ring_pt);
  }

  // ==================================
  //  GENERATE NORMALS
  // ==================================

  // each triangle's normal is the cross product of two of its edges.
  // add it to all 3 corners -> each point ends up with the average
  // direction of the triangles around it (smooth shading).
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3, b = indices[i + 1] * 3, c = indices[i + 2] * 3;

    // two edges of the triangle
    const e1 = [vertices[c] - vertices[a], vertices[c + 1] - vertices[a + 1], vertices[c + 2] - vertices[a + 2]];
    const e2 = [vertices[b] - vertices[a], vertices[b + 1] - vertices[a + 1], vertices[b + 2] - vertices[a + 2]];

    // cross product (e1 x e2), ordered so it points outward with these indices
    const n = [
      e1[1] * e2[2] - e1[2] * e2[1],
      e1[2] * e2[0] - e1[0] * e2[2],
      e1[0] * e2[1] - e1[1] * e2[0]
    ];

    for (const k of [a, b, c]) {
      normals[k] += n[0]; normals[k + 1] += n[1]; normals[k + 2] += n[2];
    } // end loop
  } // end loop

  // the first and last point of each ring are the same spot (the <= h_steps loop),
  // but each only got the triangles on its own side. share them so there's no seam line.
  for (let v_i = 0; v_i < v_steps - 1; v_i++) {
    const first = (1 + v_i * vertices_per_ring) * 3;
    const last = first + h_steps * 3;
    for (let d = 0; d < 3; d++) {
      const sum = normals[first + d] + normals[last + d];
      normals[first + d] = sum;
      normals[last + d] = sum;
    } // end loop
  } // end loop

  // make every normal length 1
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
    normals[i] /= len; normals[i + 1] /= len; normals[i + 2] /= len;
  } // end loop

  // return as a js dict
  return {
    "vertices": new Float32Array(vertices), 
    // Uint16 can only count to 65535 points -- terrain has way more
    "indices": vertices.length / 3 > 65535 ? new Uint32Array(indices) : new Uint16Array(indices),
    "normals": new Float32Array(normals),
    "tangents": new Float32Array(tangents),
    "texels": new Float32Array(texels),
    "colors": new Float32Array(colors)
  };
}
