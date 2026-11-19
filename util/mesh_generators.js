
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

/**
 * torus mesh generation
 */
export function gen_torus_mesh(
    r1 = 1,          // outer radius (center of tube to center of torus)
    r2 = 0.4,        // inner radius (tube radius)
    innerBands = 32, // resolution around the tube
    outerBands = 32, // resolution around the torus ring
    color = [0.5, 0.5, 0.5]
) {
  const vertices = [], normals = [], tangents = [], indices = [], texels = [], colors = [];

  for (let inner = 0; inner <= innerBands; inner++) {
    const phi = (inner / innerBands) * 2 * Math.PI;
    const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);

    for (let outer = 0; outer <= outerBands; outer++) {
      const theta = (outer / outerBands) * 2 * Math.PI;
      const sinTheta = Math.sin(theta), cosTheta = Math.cos(theta);

      const x = (r1 + r2 * cosPhi) * cosTheta;
      const y = r2 * sinPhi;
      const z = (r1 + r2 * cosPhi) * sinTheta;

      const nx = cosPhi * cosTheta;
      const ny = sinPhi;
      const nz = cosPhi * sinTheta;

      const tx = -sinTheta;
      const ty = 0;
      const tz = cosTheta;

      vertices.push(x, y, z);
      normals.push(nx, ny, nz);
      tangents.push(tx, ty, tz);
      texels.push(theta / (2 * Math.PI), phi / (2 * Math.PI));
      colors.push(...color);
    }
  }

  for (let inner = 0; inner < innerBands; inner++) {
    for (let outer = 0; outer < outerBands; outer++) {
      const a = inner * (outerBands + 1) + outer;
      const b = a + 1;
      const c = a + (outerBands + 1);
      const d = c + 1;
      indices.push(a, c, b,  b, c, d);
    }
  }

  return {
    "vertices": new Float32Array(vertices),
    "indices":  new Uint16Array(indices),
    "normals":  new Float32Array(normals),
    "tangents": new Float32Array(tangents),
    "texels":   new Float32Array(texels),
    "colors":   new Float32Array(colors),
  };
} // end function




/**
 * Spaceship mesh v3 — black caps on fuselage and engine pod backs to eliminate z-fighting.
 * White fuselage, blue wings, black engine backs, orange exhaust, blue cockpit.
 * Ship faces -Z (nose forward, away from camera in third-person view).
 */
export function gen_spaceship_mesh(color = null) {

  const baked_colors = new Float32Array([0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.3, 0.75, 1.0, 0.15, 0.45, 0.9, 0.15, 0.45, 0.9, 0.15, 0.45, 0.9, 0.15, 0.45, 0.9, 0.1, 0.3, 0.65, 0.1, 0.3, 0.65, 0.1, 0.3, 0.65, 0.1, 0.3, 0.65, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.15, 0.45, 0.9, 0.15, 0.45, 0.9, 0.15, 0.45, 0.9, 0.15, 0.45, 0.9, 0.1, 0.3, 0.65, 0.1, 0.3, 0.65, 0.1, 0.3, 0.65, 0.1, 0.3, 0.65, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 0.05, 0.05, 0.08, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05, 1.0, 0.45, 0.05]);
  const vertices = new Float32Array([0.28, 0.0, -1.6, 0.27045923136093913, 0.04658742811845373, -1.6, 0.24248711305964285, 0.08999999999999998, -1.6, 0.19798989873223333, 0.12727922061357855, -1.6, 0.14000000000000004, 0.15588457268119893, -1.6, 0.07246933262870581, 0.17386664873203228, -1.6, 1.7145055188062947e-17, 0.18, -1.6, -0.07246933262870585, 0.17386664873203228, -1.6, -0.13999999999999996, 0.15588457268119896, -1.6, -0.1979898987322333, 0.12727922061357855, -1.6, -0.24248711305964285, 0.08999999999999998, -1.6, -0.27045923136093913, 0.04658742811845378, -1.6, -0.28, 2.2043642384652358e-17, -1.6, -0.2704592313609392, -0.046587428118453664, -1.6, -0.24248711305964282, -0.09000000000000001, -1.6, -0.19798989873223338, -0.12727922061357855, -1.6, -0.14000000000000012, -0.1558845726811989, -1.6, -0.07246933262870578, -0.17386664873203228, -1.6, -5.143516556418884e-17, -0.18, -1.6, 0.0724693326287057, -0.1738666487320323, -1.6, 0.14000000000000004, -0.15588457268119893, -1.6, 0.19798989873223327, -0.12727922061357858, -1.6, 0.24248711305964277, -0.09000000000000008, -1.6, 0.27045923136093913, -0.04658742811845372, -1.6, 0.28, -4.4087284769304716e-17, -1.6, 0.28, 0.0, 0.75, 0.27045923136093913, 0.04658742811845373, 0.75, 0.24248711305964285, 0.08999999999999998, 0.75, 0.19798989873223333, 0.12727922061357855, 0.75, 0.14000000000000004, 0.15588457268119893, 0.75, 0.07246933262870581, 0.17386664873203228, 0.75, 1.7145055188062947e-17, 0.18, 0.75, -0.07246933262870585, 0.17386664873203228, 0.75, -0.13999999999999996, 0.15588457268119896, 0.75, -0.1979898987322333, 0.12727922061357855, 0.75, -0.24248711305964285, 0.08999999999999998, 0.75, -0.27045923136093913, 0.04658742811845378, 0.75, -0.28, 2.2043642384652358e-17, 0.75, -0.2704592313609392, -0.046587428118453664, 0.75, -0.24248711305964282, -0.09000000000000001, 0.75, -0.19798989873223338, -0.12727922061357855, 0.75, -0.14000000000000012, -0.1558845726811989, 0.75, -0.07246933262870578, -0.17386664873203228, 0.75, -5.143516556418884e-17, -0.18, 0.75, 0.0724693326287057, -0.1738666487320323, 0.75, 0.14000000000000004, -0.15588457268119893, 0.75, 0.19798989873223327, -0.12727922061357858, 0.75, 0.24248711305964277, -0.09000000000000008, 0.75, 0.27045923136093913, -0.04658742811845372, 0.75, 0.28, -4.4087284769304716e-17, 0.75, 0, 0, 0.75, 0.28, 0.0, 0.75, 0.27045923136093913, 0.04658742811845373, 0.75, 0.24248711305964285, 0.08999999999999998, 0.75, 0.19798989873223333, 0.12727922061357855, 0.75, 0.14000000000000004, 0.15588457268119893, 0.75, 0.07246933262870581, 0.17386664873203228, 0.75, 1.7145055188062947e-17, 0.18, 0.75, -0.07246933262870585, 0.17386664873203228, 0.75, -0.13999999999999996, 0.15588457268119896, 0.75, -0.1979898987322333, 0.12727922061357855, 0.75, -0.24248711305964285, 0.08999999999999998, 0.75, -0.27045923136093913, 0.04658742811845378, 0.75, -0.28, 2.2043642384652358e-17, 0.75, -0.2704592313609392, -0.046587428118453664, 0.75, -0.24248711305964282, -0.09000000000000001, 0.75, -0.19798989873223338, -0.12727922061357855, 0.75, -0.14000000000000012, -0.1558845726811989, 0.75, -0.07246933262870578, -0.17386664873203228, 0.75, -5.143516556418884e-17, -0.18, 0.75, 0.0724693326287057, -0.1738666487320323, 0.75, 0.14000000000000004, -0.15588457268119893, 0.75, 0.19798989873223327, -0.12727922061357858, 0.75, 0.24248711305964277, -0.09000000000000008, 0.75, 0.27045923136093913, -0.04658742811845372, 0.75, 0.28, 0.0, -1.6, 0.27045923136093913, 0.04658742811845373, -1.6, 0.24248711305964285, 0.08999999999999998, -1.6, 0.19798989873223333, 0.12727922061357855, -1.6, 0.14000000000000004, 0.15588457268119893, -1.6, 0.07246933262870581, 0.17386664873203228, -1.6, 1.7145055188062947e-17, 0.18, -1.6, -0.07246933262870585, 0.17386664873203228, -1.6, -0.13999999999999996, 0.15588457268119896, -1.6, -0.1979898987322333, 0.12727922061357855, -1.6, -0.24248711305964285, 0.08999999999999998, -1.6, -0.27045923136093913, 0.04658742811845378, -1.6, -0.28, 2.2043642384652358e-17, -1.6, -0.2704592313609392, -0.046587428118453664, -1.6, -0.24248711305964282, -0.09000000000000001, -1.6, -0.19798989873223338, -0.12727922061357855, -1.6, -0.14000000000000012, -0.1558845726811989, -1.6, -0.07246933262870578, -0.17386664873203228, -1.6, -5.143516556418884e-17, -0.18, -1.6, 0.0724693326287057, -0.1738666487320323, -1.6, 0.14000000000000004, -0.15588457268119893, -1.6, 0.19798989873223327, -0.12727922061357858, -1.6, 0.24248711305964277, -0.09000000000000008, -1.6, 0.27045923136093913, -0.04658742811845372, -1.6, 0.28, -4.4087284769304716e-17, -1.6, 0, 0, -2.2, 0.28, 0.0, 0.75, 0.27045923136093913, 0.04658742811845373, 0.75, 0.24248711305964285, 0.08999999999999998, 0.75, 0.19798989873223333, 0.12727922061357855, 0.75, 0.14000000000000004, 0.15588457268119893, 0.75, 0.07246933262870581, 0.17386664873203228, 0.75, 1.7145055188062947e-17, 0.18, 0.75, -0.07246933262870585, 0.17386664873203228, 0.75, -0.13999999999999996, 0.15588457268119896, 0.75, -0.1979898987322333, 0.12727922061357855, 0.75, -0.24248711305964285, 0.08999999999999998, 0.75, -0.27045923136093913, 0.04658742811845378, 0.75, -0.28, 2.2043642384652358e-17, 0.75, -0.2704592313609392, -0.046587428118453664, 0.75, -0.24248711305964282, -0.09000000000000001, 0.75, -0.19798989873223338, -0.12727922061357855, 0.75, -0.14000000000000012, -0.1558845726811989, 0.75, -0.07246933262870578, -0.17386664873203228, 0.75, -5.143516556418884e-17, -0.18, 0.75, 0.0724693326287057, -0.1738666487320323, 0.75, 0.14000000000000004, -0.15588457268119893, 0.75, 0.19798989873223327, -0.12727922061357858, 0.75, 0.24248711305964277, -0.09000000000000008, 0.75, 0.27045923136093913, -0.04658742811845372, 0.75, 0.28, -4.4087284769304716e-17, 0.75, 0.28, 0.0, 0.95, 0.27045923136093913, 0.04658742811845373, 0.95, 0.24248711305964285, 0.08999999999999998, 0.95, 0.19798989873223333, 0.12727922061357855, 0.95, 0.14000000000000004, 0.15588457268119893, 0.95, 0.07246933262870581, 0.17386664873203228, 0.95, 1.7145055188062947e-17, 0.18, 0.95, -0.07246933262870585, 0.17386664873203228, 0.95, -0.13999999999999996, 0.15588457268119896, 0.95, -0.1979898987322333, 0.12727922061357855, 0.95, -0.24248711305964285, 0.08999999999999998, 0.95, -0.27045923136093913, 0.04658742811845378, 0.95, -0.28, 2.2043642384652358e-17, 0.95, -0.2704592313609392, -0.046587428118453664, 0.95, -0.24248711305964282, -0.09000000000000001, 0.95, -0.19798989873223338, -0.12727922061357855, 0.95, -0.14000000000000012, -0.1558845726811989, 0.95, -0.07246933262870578, -0.17386664873203228, 0.95, -5.143516556418884e-17, -0.18, 0.95, 0.0724693326287057, -0.1738666487320323, 0.95, 0.14000000000000004, -0.15588457268119893, 0.95, 0.19798989873223327, -0.12727922061357858, 0.95, 0.24248711305964277, -0.09000000000000008, 0.95, 0.27045923136093913, -0.04658742811845372, 0.95, 0.28, -4.4087284769304716e-17, 0.95, 0.28, 0.0, 0.75, 0.27045923136093913, 0.04658742811845373, 0.75, 0.24248711305964285, 0.08999999999999998, 0.75, 0.19798989873223333, 0.12727922061357855, 0.75, 0.14000000000000004, 0.15588457268119893, 0.75, 0.07246933262870581, 0.17386664873203228, 0.75, 1.7145055188062947e-17, 0.18, 0.75, -0.07246933262870585, 0.17386664873203228, 0.75, -0.13999999999999996, 0.15588457268119896, 0.75, -0.1979898987322333, 0.12727922061357855, 0.75, -0.24248711305964285, 0.08999999999999998, 0.75, -0.27045923136093913, 0.04658742811845378, 0.75, -0.28, 2.2043642384652358e-17, 0.75, -0.2704592313609392, -0.046587428118453664, 0.75, -0.24248711305964282, -0.09000000000000001, 0.75, -0.19798989873223338, -0.12727922061357855, 0.75, -0.14000000000000012, -0.1558845726811989, 0.75, -0.07246933262870578, -0.17386664873203228, 0.75, -5.143516556418884e-17, -0.18, 0.75, 0.0724693326287057, -0.1738666487320323, 0.75, 0.14000000000000004, -0.15588457268119893, 0.75, 0.19798989873223327, -0.12727922061357858, 0.75, 0.24248711305964277, -0.09000000000000008, 0.75, 0.27045923136093913, -0.04658742811845372, 0.75, 0.28, -4.4087284769304716e-17, 0.75, 0, 0, 0.95, 0.13, 0.18, -1.1, 0.12010433922646728, 0.18, -1.0751255768962693, 0.09192388155425119, 0.18, -1.0540380592228744, 0.04974884620746168, 0.18, -1.0399478303867664, 7.960204194457797e-18, 0.18, -1.0350000000000001, -0.049748846207461665, 0.18, -1.0399478303867664, -0.09192388155425117, 0.18, -1.0540380592228744, -0.12010433922646728, 0.18, -1.0751255768962693, -0.13, 0.18, -1.1, -0.1201043392264673, 0.18, -1.1248744231037309, -0.0919238815542512, 0.18, -1.1459619407771258, -0.04974884620746175, 0.18, -1.1600521696132338, -2.3880612583373387e-17, 0.18, -1.165, 0.0497488462074617, 0.18, -1.1600521696132338, 0.09192388155425116, 0.18, -1.1459619407771258, 0.12010433922646725, 0.18, -1.1248744231037309, 0.13, 0.18, -1.1, 0.12750208645241995, 0.1995090322016128, -1.1, 0.1177965680258754, 0.1995090322016128, -1.0756035319613388, 0.09015758994593959, 0.1995090322016128, -1.0549212050270302, 0.048792936077322484, 0.1995090322016128, -1.0411017159870624, 7.80725110292826e-18, 0.1995090322016128, -1.03624895677379, -0.04879293607732247, 0.1995090322016128, -1.0411017159870624, -0.09015758994593957, 0.1995090322016128, -1.0549212050270302, -0.1177965680258754, 0.1995090322016128, -1.0756035319613388, -0.12750208645241995, 0.1995090322016128, -1.1, -0.11779656802587542, 0.1995090322016128, -1.1243964680386613, -0.0901575899459396, 0.1995090322016128, -1.14507879497297, -0.04879293607732255, 0.1995090322016128, -1.1588982840129378, -2.342175330878478e-17, 0.1995090322016128, -1.1637510432262101, 0.04879293607732251, 0.1995090322016128, -1.1588982840129378, 0.09015758994593956, 0.1995090322016128, -1.14507879497297, 0.11779656802587538, 0.1995090322016128, -1.1243964680386613, 0.12750208645241995, 0.1995090322016128, -1.1, 0.12010433922646728, 0.21826834323650898, -1.1, 0.1109619407771256, 0.21826834323650898, -1.0770190296114373, 0.08492659271696448, 0.21826834323650898, -1.0575367036415178, 0.0459619407771256, 0.21826834323650898, -1.0445190296114373, 7.354269729870052e-18, 0.21826834323650898, -1.0399478303867664, -0.045961940777125586, 0.21826834323650898, -1.0445190296114373, -0.08492659271696447, 0.21826834323650898, -1.0575367036415178, -0.1109619407771256, 0.21826834323650898, -1.0770190296114373, -0.12010433922646728, 0.21826834323650898, -1.1, -0.1109619407771256, 0.21826834323650898, -1.122980970388563, -0.0849265927169645, 0.21826834323650898, -1.1424632963584824, -0.045961940777125655, 0.21826834323650898, -1.155480970388563, -2.2062809189610157e-17, 0.21826834323650898, -1.1600521696132338, 0.04596194077712562, 0.21826834323650898, -1.155480970388563, 0.08492659271696446, 0.21826834323650898, -1.1424632963584824, 0.11096194077712557, 0.21826834323650898, -1.122980970388563, 0.12010433922646728, 0.21826834323650898, -1.1, 0.10809104959933089, 0.2355570233019602, -1.1, 0.09986310837248412, 0.2355570233019602, -1.0793176730656915, 0.07643191415725832, 0.2355570233019602, -1.061784042921371, 0.04136465386861711, 0.2355570233019602, -1.0500684458137581, 6.6186678954149184e-18, 0.2355570233019602, -1.0459544752003347, -0.0413646538686171, 0.2355570233019602, -1.0500684458137581, -0.07643191415725831, 0.2355570233019602, -1.061784042921371, -0.09986310837248412, 0.2355570233019602, -1.0793176730656915, -0.10809104959933089, 0.2355570233019602, -1.1, -0.09986310837248413, 0.2355570233019602, -1.1206823269343087, -0.07643191415725833, 0.2355570233019602, -1.1382159570786292, -0.041364653868617166, 0.2355570233019602, -1.149931554186242, -1.9856003686244754e-17, 0.2355570233019602, -1.1540455247996655, 0.04136465386861713, 0.2355570233019602, -1.149931554186242, 0.07643191415725831, 0.2355570233019602, -1.1382159570786292, 0.0998631083724841, 0.2355570233019602, -1.1206823269343087, 0.10809104959933089, 0.2355570233019602, -1.1, 0.09192388155425119, 0.2507106781186548, -1.1, 0.08492659271696448, 0.2507106781186548, -1.0824111267452488, 0.06500000000000002, 0.2507106781186548, -1.0675000000000001, 0.03517774650950281, 0.2507106781186548, -1.0575367036415178, 5.628714365530707e-18, 0.2507106781186548, -1.0540380592228744, -0.035177746509502804, 0.2507106781186548, -1.0575367036415178, -0.065, 0.2507106781186548, -1.0675000000000001, -0.08492659271696448, 0.2507106781186548, -1.0824111267452488, -0.09192388155425119, 0.2507106781186548, -1.1, -0.08492659271696448, 0.2507106781186548, -1.1175888732547514, -0.06500000000000002, 0.2507106781186548, -1.1325, -0.03517774650950286, 0.2507106781186548, -1.1424632963584824, -1.688614309659212e-17, 0.2507106781186548, -1.1459619407771258, 0.03517774650950283, 0.2507106781186548, -1.1424632963584824, 0.06499999999999999, 0.2507106781186548, -1.1325, 0.08492659271696446, 0.2507106781186548, -1.1175888732547514, 0.09192388155425119, 0.2507106781186548, -1.1, 0.0722241302925483, 0.2631469612302545, -1.1, 0.06672639573071379, 0.2631469612302545, -1.0861805109600322, 0.051070172295161656, 0.2631469612302545, -1.0744649138524192, 0.027638978079935844, 0.2631469612302545, -1.0666368021346433, 4.422452499198534e-18, 0.2631469612302545, -1.063887934853726, -0.027638978079935837, 0.2631469612302545, -1.0666368021346433, -0.05107017229516165, 0.2631469612302545, -1.0744649138524192, -0.06672639573071379, 0.2631469612302545, -1.0861805109600322, -0.0722241302925483, 0.2631469612302545, -1.1, -0.0667263957307138, 0.2631469612302545, -1.113819489039968, -0.05107017229516166, 0.2631469612302545, -1.125535086147581, -0.02763897807993588, 0.2631469612302545, -1.1333631978653569, -1.3267357497595599e-17, 0.2631469612302545, -1.1361120651462742, 0.027638978079935858, 0.2631469612302545, -1.1333631978653569, 0.051070172295161635, 0.2631469612302545, -1.125535086147581, 0.06672639573071378, 0.2631469612302545, -1.113819489039968, 0.0722241302925483, 0.2631469612302545, -1.1, 0.04974884620746168, 0.2723879532511287, -1.1, 0.0459619407771256, 0.2723879532511287, -1.090480970388563, 0.03517774650950281, 0.2723879532511287, -1.0824111267452488, 0.019038059222874416, 0.2723879532511287, -1.0770190296114373, 3.0462382634620945e-18, 0.2723879532511287, -1.0751255768962693, -0.019038059222874413, 0.2723879532511287, -1.0770190296114373, -0.035177746509502804, 0.2723879532511287, -1.0824111267452488, -0.0459619407771256, 0.2723879532511287, -1.090480970388563, -0.04974884620746168, 0.2723879532511287, -1.1, -0.0459619407771256, 0.2723879532511287, -1.1095190296114372, -0.03517774650950282, 0.2723879532511287, -1.1175888732547514, -0.019038059222874444, 0.2723879532511287, -1.122980970388563, -9.138714790386283e-18, 0.2723879532511287, -1.1248744231037309, 0.019038059222874427, 0.2723879532511287, -1.122980970388563, 0.035177746509502804, 0.2723879532511287, -1.1175888732547514, 0.045961940777125586, 0.2723879532511287, -1.1095190296114372, 0.04974884620746168, 0.2723879532511287, -1.1, 0.025361741862096682, 0.27807852804032307, -1.1, 0.023431194215225815, 0.27807852804032307, -1.0951472407867278, 0.0179334596533913, 0.27807852804032307, -1.0910332701733045, 0.009705518426544543, 0.27807852804032307, -1.0882844028923873, 1.5529587996109067e-18, 0.27807852804032307, -1.0873191290689517, -0.00970551842654454, 0.27807852804032307, -1.0882844028923873, -0.017933459653391298, 0.27807852804032307, -1.0910332701733045, -0.023431194215225815, 0.27807852804032307, -1.0951472407867278, -0.025361741862096682, 0.27807852804032307, -1.1, -0.023431194215225815, 0.27807852804032307, -1.1048527592132724, -0.017933459653391305, 0.27807852804032307, -1.1089667298266956, -0.009705518426544556, 0.27807852804032307, -1.111715597107613, -4.65887639883272e-18, 0.27807852804032307, -1.1126808709310485, 0.009705518426544548, 0.27807852804032307, -1.111715597107613, 0.017933459653391298, 0.27807852804032307, -1.1089667298266956, 0.02343119421522581, 0.27807852804032307, -1.1048527592132724, 0.025361741862096682, 0.27807852804032307, -1.1, 7.960204194457797e-18, 0.28, -1.1, 7.354269729870052e-18, 0.28, -1.1, 5.6287143655307075e-18, 0.28, -1.1, 3.0462382634620945e-18, 0.28, -1.1, 4.874219293651038e-34, 0.28, -1.1, -3.0462382634620938e-18, 0.28, -1.1, -5.628714365530707e-18, 0.28, -1.1, -7.354269729870052e-18, 0.28, -1.1, -7.960204194457797e-18, 0.28, -1.1, -7.354269729870054e-18, 0.28, -1.1, -5.628714365530708e-18, 0.28, -1.1, -3.0462382634620988e-18, 0.28, -1.1, -1.4622657880953112e-33, 0.28, -1.1, 3.046238263462096e-18, 0.28, -1.1, 5.628714365530706e-18, 0.28, -1.1, 7.35426972987005e-18, 0.28, -1.1, 7.960204194457797e-18, 0.28, -1.1, -0.28, 0.02, -0.8, -0.9, -0.01, -0.5, -1.35, -0.04, 0.6, -0.28, 0.02, 0.65, -0.28, 0.02, 0.65, -1.35, -0.04, 0.6, -0.9, -0.01, -0.5, -0.28, 0.02, -0.8, -0.28, 0.02, 0.65, -1.35, -0.04, 0.6, -1.35, -0.07, 0.6, -0.28, -0.009999999999999998, 0.65, 0.28, 0.02, -0.8, 0.9, -0.01, -0.5, 1.35, -0.04, 0.6, 0.28, 0.02, 0.65, 0.28, 0.02, 0.65, 1.35, -0.04, 0.6, 0.9, -0.01, -0.5, 0.28, 0.02, -0.8, 0.28, 0.02, 0.65, 1.35, -0.04, 0.6, 1.35, -0.07, 0.6, 0.28, -0.009999999999999998, 0.65, -0.5900000000000001, -0.12, -0.55, -0.5968508420739842, -0.09321215973444372, -0.55, -0.6163603896932108, -0.07050252531694168, -0.55, -0.6455584910871419, -0.05532843272420991, -0.55, -0.68, -0.04999999999999999, -0.55, -0.7144415089128582, -0.05532843272420991, -0.55, -0.7436396103067893, -0.07050252531694166, -0.55, -0.7631491579260159, -0.0932121597344437, -0.55, -0.77, -0.11999999999999998, -0.55, -0.7631491579260159, -0.14678784026555627, -0.55, -0.7436396103067894, -0.1694974746830583, -0.55, -0.7144415089128582, -0.18467156727579004, -0.55, -0.68, -0.19, -0.55, -0.6455584910871419, -0.18467156727579007, -0.55, -0.6163603896932108, -0.16949747468305834, -0.55, -0.5968508420739843, -0.14678784026555633, -0.55, -0.5900000000000001, -0.12000000000000001, -0.55, -0.5900000000000001, -0.12, 0.78, -0.5968508420739842, -0.09321215973444372, 0.78, -0.6163603896932108, -0.07050252531694168, 0.78, -0.6455584910871419, -0.05532843272420991, 0.78, -0.68, -0.04999999999999999, 0.78, -0.7144415089128582, -0.05532843272420991, 0.78, -0.7436396103067893, -0.07050252531694166, 0.78, -0.7631491579260159, -0.0932121597344437, 0.78, -0.77, -0.11999999999999998, 0.78, -0.7631491579260159, -0.14678784026555627, 0.78, -0.7436396103067894, -0.1694974746830583, 0.78, -0.7144415089128582, -0.18467156727579004, 0.78, -0.68, -0.19, 0.78, -0.6455584910871419, -0.18467156727579007, 0.78, -0.6163603896932108, -0.16949747468305834, 0.78, -0.5968508420739843, -0.14678784026555633, 0.78, -0.5900000000000001, -0.12000000000000001, 0.78, -0.5900000000000001, -0.12, -0.55, -0.5968508420739842, -0.09321215973444372, -0.55, -0.6163603896932108, -0.07050252531694168, -0.55, -0.6455584910871419, -0.05532843272420991, -0.55, -0.68, -0.04999999999999999, -0.55, -0.7144415089128582, -0.05532843272420991, -0.55, -0.7436396103067893, -0.07050252531694166, -0.55, -0.7631491579260159, -0.0932121597344437, -0.55, -0.77, -0.11999999999999998, -0.55, -0.7631491579260159, -0.14678784026555627, -0.55, -0.7436396103067894, -0.1694974746830583, -0.55, -0.7144415089128582, -0.18467156727579004, -0.55, -0.68, -0.19, -0.55, -0.6455584910871419, -0.18467156727579007, -0.55, -0.6163603896932108, -0.16949747468305834, -0.55, -0.5968508420739843, -0.14678784026555633, -0.55, -0.5900000000000001, -0.12000000000000001, -0.55, -0.68, -0.12, -0.75, -0.68, -0.12, 0.78, -0.5900000000000001, -0.12, 0.78, -0.5968508420739842, -0.09321215973444372, 0.78, -0.6163603896932108, -0.07050252531694168, 0.78, -0.6455584910871419, -0.05532843272420991, 0.78, -0.68, -0.04999999999999999, 0.78, -0.7144415089128582, -0.05532843272420991, 0.78, -0.7436396103067893, -0.07050252531694166, 0.78, -0.7631491579260159, -0.0932121597344437, 0.78, -0.77, -0.11999999999999998, 0.78, -0.7631491579260159, -0.14678784026555627, 0.78, -0.7436396103067894, -0.1694974746830583, 0.78, -0.7144415089128582, -0.18467156727579004, 0.78, -0.68, -0.19, 0.78, -0.6455584910871419, -0.18467156727579007, 0.78, -0.6163603896932108, -0.16949747468305834, 0.78, -0.5968508420739843, -0.14678784026555633, 0.78, 0.77, -0.12, -0.55, 0.7631491579260159, -0.09321215973444372, -0.55, 0.7436396103067893, -0.07050252531694168, -0.55, 0.7144415089128582, -0.05532843272420991, -0.55, 0.68, -0.04999999999999999, -0.55, 0.6455584910871419, -0.05532843272420991, -0.55, 0.6163603896932108, -0.07050252531694166, -0.55, 0.5968508420739842, -0.0932121597344437, -0.55, 0.5900000000000001, -0.11999999999999998, -0.55, 0.5968508420739842, -0.14678784026555627, -0.55, 0.6163603896932107, -0.1694974746830583, -0.55, 0.6455584910871419, -0.18467156727579004, -0.55, 0.68, -0.19, -0.55, 0.7144415089128582, -0.18467156727579007, -0.55, 0.7436396103067893, -0.16949747468305834, -0.55, 0.7631491579260158, -0.14678784026555633, -0.55, 0.77, -0.12000000000000001, -0.55, 0.77, -0.12, 0.78, 0.7631491579260159, -0.09321215973444372, 0.78, 0.7436396103067893, -0.07050252531694168, 0.78, 0.7144415089128582, -0.05532843272420991, 0.78, 0.68, -0.04999999999999999, 0.78, 0.6455584910871419, -0.05532843272420991, 0.78, 0.6163603896932108, -0.07050252531694166, 0.78, 0.5968508420739842, -0.0932121597344437, 0.78, 0.5900000000000001, -0.11999999999999998, 0.78, 0.5968508420739842, -0.14678784026555627, 0.78, 0.6163603896932107, -0.1694974746830583, 0.78, 0.6455584910871419, -0.18467156727579004, 0.78, 0.68, -0.19, 0.78, 0.7144415089128582, -0.18467156727579007, 0.78, 0.7436396103067893, -0.16949747468305834, 0.78, 0.7631491579260158, -0.14678784026555633, 0.78, 0.77, -0.12000000000000001, 0.78, 0.77, -0.12, -0.55, 0.7631491579260159, -0.09321215973444372, -0.55, 0.7436396103067893, -0.07050252531694168, -0.55, 0.7144415089128582, -0.05532843272420991, -0.55, 0.68, -0.04999999999999999, -0.55, 0.6455584910871419, -0.05532843272420991, -0.55, 0.6163603896932108, -0.07050252531694166, -0.55, 0.5968508420739842, -0.0932121597344437, -0.55, 0.5900000000000001, -0.11999999999999998, -0.55, 0.5968508420739842, -0.14678784026555627, -0.55, 0.6163603896932107, -0.1694974746830583, -0.55, 0.6455584910871419, -0.18467156727579004, -0.55, 0.68, -0.19, -0.55, 0.7144415089128582, -0.18467156727579007, -0.55, 0.7436396103067893, -0.16949747468305834, -0.55, 0.7631491579260158, -0.14678784026555633, -0.55, 0.77, -0.12000000000000001, -0.55, 0.68, -0.12, -0.75, 0.68, -0.12, 0.78, 0.77, -0.12, 0.78, 0.7631491579260159, -0.09321215973444372, 0.78, 0.7436396103067893, -0.07050252531694168, 0.78, 0.7144415089128582, -0.05532843272420991, 0.78, 0.68, -0.04999999999999999, 0.78, 0.6455584910871419, -0.05532843272420991, 0.78, 0.6163603896932108, -0.07050252531694166, 0.78, 0.5968508420739842, -0.0932121597344437, 0.78, 0.5900000000000001, -0.11999999999999998, 0.78, 0.5968508420739842, -0.14678784026555627, 0.78, 0.6163603896932107, -0.1694974746830583, 0.78, 0.6455584910871419, -0.18467156727579004, 0.78, 0.68, -0.19, 0.78, 0.7144415089128582, -0.18467156727579007, 0.78, 0.7436396103067893, -0.16949747468305834, 0.78, 0.7631491579260158, -0.14678784026555633, 0.78, -0.7380000000000001, -0.147, 0.78, -0.7020000000000001, -0.147, 0.78, -0.735, -0.21, 1.08, -0.753, -0.21, 1.08, -0.753, -0.21, 1.08, -0.735, -0.21, 1.08, -0.7020000000000001, -0.147, 0.78, -0.7380000000000001, -0.147, 0.78, -0.6980000000000001, -0.153, 0.78, -0.662, -0.153, 0.78, -0.671, -0.22999999999999998, 1.08, -0.6890000000000001, -0.22999999999999998, 1.08, -0.6890000000000001, -0.22999999999999998, 1.08, -0.671, -0.22999999999999998, 1.08, -0.662, -0.153, 0.78, -0.6980000000000001, -0.153, 0.78, -0.658, -0.147, 0.78, -0.622, -0.147, 0.78, -0.6070000000000001, -0.21, 1.08, -0.6250000000000001, -0.21, 1.08, -0.6250000000000001, -0.21, 1.08, -0.6070000000000001, -0.21, 1.08, -0.622, -0.147, 0.78, -0.658, -0.147, 0.78, 0.622, -0.147, 0.78, 0.658, -0.147, 0.78, 0.6250000000000001, -0.21, 1.08, 0.6070000000000001, -0.21, 1.08, 0.6070000000000001, -0.21, 1.08, 0.6250000000000001, -0.21, 1.08, 0.658, -0.147, 0.78, 0.622, -0.147, 0.78, 0.662, -0.153, 0.78, 0.6980000000000001, -0.153, 0.78, 0.6890000000000001, -0.22999999999999998, 1.08, 0.671, -0.22999999999999998, 1.08, 0.671, -0.22999999999999998, 1.08, 0.6890000000000001, -0.22999999999999998, 1.08, 0.6980000000000001, -0.153, 0.78, 0.662, -0.153, 0.78, 0.7020000000000001, -0.147, 0.78, 0.7380000000000001, -0.147, 0.78, 0.753, -0.21, 1.08, 0.735, -0.21, 1.08, 0.735, -0.21, 1.08, 0.753, -0.21, 1.08, 0.7380000000000001, -0.147, 0.78, 0.7020000000000001, -0.147, 0.78]);
  const normals  = new Float32Array([1.0, 0.0, 0.0, 0.9230299930023462, 0.38472799744506325, 0.0, 0.7439964729139703, 0.6681835438646868, 0.0, 0.5407575913134987, 0.8411784753765535, 0.0, 0.34796010286217666, 0.9375093422553951, 0.0, 0.16975307948004276, 0.9854866270056851, 0.0, 3.936364711545064e-17, 1.0, 0.0, -0.16975307948004284, 0.9854866270056851, 0.0, -0.3479601028621764, 0.9375093422553953, 0.0, -0.5407575913134985, 0.8411784753765535, 0.0, -0.7439964729139703, 0.6681835438646868, 0.0, -0.9230299930023461, 0.38472799744506364, 0.0, -1.0, 1.9050061320069942e-16, 0.0, -0.9230299930023466, -0.38472799744506275, 0.0, -0.7439964729139703, -0.6681835438646869, 0.0, -0.5407575913134988, -0.8411784753765535, 0.0, -0.34796010286217693, -0.9375093422553951, 0.0, -0.16975307948004267, -0.9854866270056851, 0.0, -1.180909413463519e-16, -1.0, 0.0, 0.16975307948004245, -0.9854866270056851, 0.0, 0.34796010286217666, -0.9375093422553951, 0.0, 0.5407575913134984, -0.8411784753765537, 0.0, 0.74399647291397, -0.6681835438646873, 0.0, 0.9230299930023462, -0.3847279974450632, 0.0, 1.0, -3.8100122640139883e-16, 0.0, 1.0, 0.0, 0.0, 0.9230299930023462, 0.38472799744506325, 0.0, 0.7439964729139703, 0.6681835438646868, 0.0, 0.5407575913134987, 0.8411784753765535, 0.0, 0.34796010286217666, 0.9375093422553951, 0.0, 0.16975307948004276, 0.9854866270056851, 0.0, 3.936364711545064e-17, 1.0, 0.0, -0.16975307948004284, 0.9854866270056851, 0.0, -0.3479601028621764, 0.9375093422553953, 0.0, -0.5407575913134985, 0.8411784753765535, 0.0, -0.7439964729139703, 0.6681835438646868, 0.0, -0.9230299930023461, 0.38472799744506364, 0.0, -1.0, 1.9050061320069942e-16, 0.0, -0.9230299930023466, -0.38472799744506275, 0.0, -0.7439964729139703, -0.6681835438646869, 0.0, -0.5407575913134988, -0.8411784753765535, 0.0, -0.34796010286217693, -0.9375093422553951, 0.0, -0.16975307948004267, -0.9854866270056851, 0.0, -1.180909413463519e-16, -1.0, 0.0, 0.16975307948004245, -0.9854866270056851, 0.0, 0.34796010286217666, -0.9375093422553951, 0.0, 0.5407575913134984, -0.8411784753765537, 0.0, 0.74399647291397, -0.6681835438646873, 0.0, 0.9230299930023462, -0.3847279974450632, 0.0, 1.0, -3.8100122640139883e-16, 0.0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0.9629640197141817, 0.0, 0.2696299255199709, 0.8916639893186148, 0.3716543380010783, 0.2584731769398779, 0.7233629871533543, 0.6496526016630237, 0.23387493659868855, 0.5287710408793103, 0.8225327302567047, 0.20938264967246448, 0.34153652317936, 0.9202022834465641, 0.19126045298044156, 0.16696100034042827, 0.9692774562380048, 0.18062457527730294, 3.874104506181177e-17, 0.9841833239736952, 0.17715299831526515, -0.16696100034042835, 0.9692774562380048, 0.18062457527730294, -0.34153652317935973, 0.9202022834465643, 0.19126045298044156, -0.52877104087931, 0.8225327302567048, 0.20938264967246442, -0.7233629871533543, 0.6496526016630237, 0.23387493659868855, -0.8916639893186147, 0.37165433800107867, 0.2584731769398779, -0.9629640197141817, 1.8344523624576202e-16, 0.2696299255199709, -0.891663989318615, -0.3716543380010778, 0.258473176939878, -0.7233629871533542, -0.649652601663024, 0.23387493659868855, -0.5287710408793102, -0.8225327302567046, 0.20938264967246442, -0.3415365231793603, -0.9202022834465641, 0.1912604529804416, -0.16696100034042818, -0.9692774562380048, 0.18062457527730294, -1.1622313518543529e-16, -0.9841833239736952, 0.17715299831526515, 0.166961000340428, -0.969277456238005, 0.18062457527730294, 0.34153652317936, -0.9202022834465641, 0.19126045298044156, 0.5287710408793099, -0.8225327302567049, 0.20938264967246442, 0.723362987153354, -0.6496526016630242, 0.2338749365986885, 0.8916639893186148, -0.3716543380010782, 0.2584731769398779, 0.9629640197141817, -3.6689047249152403e-16, 0.2696299255199709, 0, 0, 1, 1.0, 0.0, 0.0, 0.9230299930023462, 0.38472799744506325, 0.0, 0.7439964729139703, 0.6681835438646868, 0.0, 0.5407575913134987, 0.8411784753765535, 0.0, 0.34796010286217666, 0.9375093422553951, 0.0, 0.16975307948004276, 0.9854866270056851, 0.0, 3.936364711545064e-17, 1.0, 0.0, -0.16975307948004284, 0.9854866270056851, 0.0, -0.3479601028621764, 0.9375093422553953, 0.0, -0.5407575913134985, 0.8411784753765535, 0.0, -0.7439964729139703, 0.6681835438646868, 0.0, -0.9230299930023461, 0.38472799744506364, 0.0, -1.0, 1.9050061320069942e-16, 0.0, -0.9230299930023466, -0.38472799744506275, 0.0, -0.7439964729139703, -0.6681835438646869, 0.0, -0.5407575913134988, -0.8411784753765535, 0.0, -0.34796010286217693, -0.9375093422553951, 0.0, -0.16975307948004267, -0.9854866270056851, 0.0, -1.180909413463519e-16, -1.0, 0.0, 0.16975307948004245, -0.9854866270056851, 0.0, 0.34796010286217666, -0.9375093422553951, 0.0, 0.5407575913134984, -0.8411784753765537, 0.0, 0.74399647291397, -0.6681835438646873, 0.0, 0.9230299930023462, -0.3847279974450632, 0.0, 1.0, -3.8100122640139883e-16, 0.0, 1.0, 0.0, 0.0, 0.9230299930023462, 0.38472799744506325, 0.0, 0.7439964729139703, 0.6681835438646868, 0.0, 0.5407575913134987, 0.8411784753765535, 0.0, 0.34796010286217666, 0.9375093422553951, 0.0, 0.16975307948004276, 0.9854866270056851, 0.0, 3.936364711545064e-17, 1.0, 0.0, -0.16975307948004284, 0.9854866270056851, 0.0, -0.3479601028621764, 0.9375093422553953, 0.0, -0.5407575913134985, 0.8411784753765535, 0.0, -0.7439964729139703, 0.6681835438646868, 0.0, -0.9230299930023461, 0.38472799744506364, 0.0, -1.0, 1.9050061320069942e-16, 0.0, -0.9230299930023466, -0.38472799744506275, 0.0, -0.7439964729139703, -0.6681835438646869, 0.0, -0.5407575913134988, -0.8411784753765535, 0.0, -0.34796010286217693, -0.9375093422553951, 0.0, -0.16975307948004267, -0.9854866270056851, 0.0, -1.180909413463519e-16, -1.0, 0.0, 0.16975307948004245, -0.9854866270056851, 0.0, 0.34796010286217666, -0.9375093422553951, 0.0, 0.5407575913134984, -0.8411784753765537, 0.0, 0.74399647291397, -0.6681835438646873, 0.0, 0.9230299930023462, -0.3847279974450632, 0.0, 1.0, -3.8100122640139883e-16, 0.0, 0.9629640197141817, 0.0, 0.2696299255199709, 0.8916639893186148, 0.3716543380010783, 0.2584731769398779, 0.7233629871533543, 0.6496526016630237, 0.23387493659868855, 0.5287710408793103, 0.8225327302567047, 0.20938264967246448, 0.34153652317936, 0.9202022834465641, 0.19126045298044156, 0.16696100034042827, 0.9692774562380048, 0.18062457527730294, 3.874104506181177e-17, 0.9841833239736952, 0.17715299831526515, -0.16696100034042835, 0.9692774562380048, 0.18062457527730294, -0.34153652317935973, 0.9202022834465643, 0.19126045298044156, -0.52877104087931, 0.8225327302567048, 0.20938264967246442, -0.7233629871533543, 0.6496526016630237, 0.23387493659868855, -0.8916639893186147, 0.37165433800107867, 0.2584731769398779, -0.9629640197141817, 1.8344523624576202e-16, 0.2696299255199709, -0.891663989318615, -0.3716543380010778, 0.258473176939878, -0.7233629871533542, -0.649652601663024, 0.23387493659868855, -0.5287710408793102, -0.8225327302567046, 0.20938264967246442, -0.3415365231793603, -0.9202022834465641, 0.1912604529804416, -0.16696100034042818, -0.9692774562380048, 0.18062457527730294, -1.1622313518543529e-16, -0.9841833239736952, 0.17715299831526515, 0.166961000340428, -0.969277456238005, 0.18062457527730294, 0.34153652317936, -0.9202022834465641, 0.19126045298044156, 0.5287710408793099, -0.8225327302567049, 0.20938264967246442, 0.723362987153354, -0.6496526016630242, 0.2338749365986885, 0.8916639893186148, -0.3716543380010782, 0.2584731769398779, 0.9629640197141817, -3.6689047249152403e-16, 0.2696299255199709, 0, 0, 1, 1.0, 0.0, 0.0, 0.9238795325112867, 0.0, 0.3826834323650898, 0.7071067811865476, 0.0, 0.7071067811865475, 0.38268343236508984, 0.0, 0.9238795325112867, 6.123233995736766e-17, 0.0, 1.0, -0.3826834323650897, 0.0, 0.9238795325112867, -0.7071067811865475, 0.0, 0.7071067811865476, -0.9238795325112867, 0.0, 0.3826834323650899, -1.0, 0.0, 1.2246467991473532e-16, -0.9238795325112868, 0.0, -0.38268343236508967, -0.7071067811865477, 0.0, -0.7071067811865475, -0.38268343236509034, 0.0, -0.9238795325112865, -1.8369701987210297e-16, 0.0, -1.0, 0.38268343236509006, 0.0, -0.9238795325112867, 0.7071067811865474, 0.0, -0.7071067811865477, 0.9238795325112865, 0.0, -0.3826834323650904, 1.0, 0.0, -2.4492935982947064e-16, 0.9807852804032304, 0.19509032201612825, 0.0, 0.9061274463528878, 0.19509032201612825, 0.37533027751786524, 0.6935199226610738, 0.19509032201612825, 0.6935199226610737, 0.3753302775178653, 0.19509032201612825, 0.9061274463528878, 6.005577771483278e-17, 0.19509032201612825, 0.9807852804032304, -0.37533027751786524, 0.19509032201612828, 0.9061274463528879, -0.6935199226610738, 0.19509032201612828, 0.6935199226610739, -0.9061274463528878, 0.19509032201612825, 0.37533027751786535, -0.9807852804032304, 0.19509032201612825, 1.2011155542966555e-16, -0.9061274463528879, 0.19509032201612825, -0.37533027751786513, -0.6935199226610739, 0.19509032201612825, -0.6935199226610737, -0.37533027751786585, 0.19509032201612828, -0.9061274463528877, -1.8016733314449831e-16, 0.19509032201612825, -0.9807852804032304, 0.3753302775178655, 0.19509032201612828, -0.9061274463528878, 0.6935199226610735, 0.19509032201612825, -0.6935199226610739, 0.9061274463528876, 0.19509032201612825, -0.37533027751786585, 0.9807852804032304, 0.19509032201612825, -2.402231108593311e-16, 0.9238795325112867, 0.3826834323650898, 0.0, 0.8535533905932737, 0.3826834323650898, 0.3535533905932738, 0.6532814824381884, 0.38268343236508984, 0.6532814824381883, 0.35355339059327384, 0.3826834323650898, 0.8535533905932737, 5.657130561438501e-17, 0.3826834323650898, 0.9238795325112867, -0.35355339059327373, 0.3826834323650898, 0.8535533905932737, -0.6532814824381882, 0.3826834323650898, 0.6532814824381883, -0.8535533905932737, 0.3826834323650898, 0.35355339059327384, -0.9238795325112867, 0.3826834323650898, 1.1314261122877003e-16, -0.8535533905932738, 0.3826834323650898, -0.3535533905932737, -0.6532814824381884, 0.3826834323650898, -0.6532814824381882, -0.35355339059327434, 0.38268343236508984, -0.8535533905932736, -1.6971391684315505e-16, 0.3826834323650898, -0.9238795325112867, 0.353553390593274, 0.38268343236508984, -0.8535533905932737, 0.6532814824381881, 0.3826834323650898, -0.6532814824381884, 0.8535533905932735, 0.3826834323650898, -0.35355339059327434, 0.9238795325112867, 0.3826834323650898, -2.2628522245754005e-16, 0.8314696123025452, 0.5555702330196022, 0.0, 0.7681777567114163, 0.5555702330196022, 0.31818964514320847, 0.5879378012096794, 0.5555702330196022, 0.5879378012096793, 0.3181896451432085, 0.5555702330196022, 0.7681777567114163, 5.091282996473014e-17, 0.5555702330196022, 0.8314696123025452, -0.31818964514320847, 0.5555702330196022, 0.7681777567114163, -0.5879378012096793, 0.5555702330196022, 0.5879378012096794, -0.7681777567114163, 0.5555702330196022, 0.3181896451432086, -0.8314696123025452, 0.5555702330196022, 1.0182565992946028e-16, -0.7681777567114164, 0.5555702330196022, -0.3181896451432084, -0.5879378012096795, 0.5555702330196022, -0.5879378012096793, -0.31818964514320897, 0.5555702330196022, -0.7681777567114161, -1.527384898941904e-16, 0.5555702330196022, -0.8314696123025452, 0.31818964514320874, 0.5555702330196023, -0.7681777567114163, 0.5879378012096792, 0.5555702330196022, -0.5879378012096795, 0.7681777567114161, 0.5555702330196022, -0.318189645143209, 0.8314696123025452, 0.5555702330196022, -2.0365131985892056e-16, 0.7071067811865476, 0.7071067811865475, 0.0, 0.6532814824381884, 0.7071067811865476, 0.27059805007309856, 0.5000000000000001, 0.7071067811865475, 0.5, 0.27059805007309856, 0.7071067811865475, 0.6532814824381883, 4.329780281177467e-17, 0.7071067811865475, 0.7071067811865476, -0.2705980500730985, 0.7071067811865475, 0.6532814824381883, -0.5, 0.7071067811865475, 0.5000000000000001, -0.6532814824381883, 0.7071067811865475, 0.2705980500730986, -0.7071067811865476, 0.7071067811865475, 8.659560562354934e-17, -0.6532814824381884, 0.7071067811865475, -0.27059805007309845, -0.5000000000000001, 0.7071067811865475, -0.5, -0.2705980500730989, 0.7071067811865475, -0.6532814824381882, -1.29893408435324e-16, 0.7071067811865475, -0.7071067811865476, 0.27059805007309873, 0.7071067811865476, -0.6532814824381883, 0.49999999999999994, 0.7071067811865476, -0.5000000000000002, 0.6532814824381882, 0.7071067811865475, -0.27059805007309895, 0.7071067811865476, 0.7071067811865475, -1.7319121124709868e-16, 0.5555702330196023, 0.8314696123025452, 0.0, 0.5132799671593368, 0.8314696123025452, 0.21260752369181415, 0.3928474791935512, 0.8314696123025452, 0.3928474791935511, 0.21260752369181418, 0.8314696123025452, 0.5132799671593368, 3.4018865378450254e-17, 0.8314696123025452, 0.5555702330196023, -0.2126075236918141, 0.8314696123025452, 0.5132799671593368, -0.3928474791935511, 0.8314696123025452, 0.3928474791935512, -0.5132799671593368, 0.8314696123025452, 0.2126075236918142, -0.5555702330196023, 0.8314696123025452, 6.803773075690051e-17, -0.5132799671593369, 0.8314696123025452, -0.21260752369181407, -0.39284747919355123, 0.8314696123025452, -0.3928474791935511, -0.21260752369181446, 0.8314696123025452, -0.5132799671593367, -1.0205659613535076e-16, 0.8314696123025452, -0.5555702330196023, 0.21260752369181427, 0.8314696123025452, -0.5132799671593368, 0.39284747919355106, 0.8314696123025452, -0.39284747919355123, 0.5132799671593367, 0.8314696123025452, -0.2126075236918145, 0.5555702330196023, 0.8314696123025452, -1.3607546151380102e-16, 0.38268343236508984, 0.9238795325112867, 0.0, 0.35355339059327384, 0.9238795325112867, 0.14644660940672627, 0.27059805007309856, 0.9238795325112867, 0.2705980500730985, 0.1464466094067263, 0.9238795325112867, 0.35355339059327384, 2.3432602026631496e-17, 0.9238795325112867, 0.38268343236508984, -0.14644660940672624, 0.9238795325112867, 0.35355339059327384, -0.2705980500730985, 0.9238795325112867, 0.27059805007309856, -0.35355339059327384, 0.9238795325112867, 0.1464466094067263, -0.38268343236508984, 0.9238795325112867, 4.686520405326299e-17, -0.35355339059327384, 0.9238795325112867, -0.1464466094067262, -0.2705980500730986, 0.9238795325112867, -0.2705980500730985, -0.1464466094067265, 0.9238795325112867, -0.35355339059327373, -7.029780607989448e-17, 0.9238795325112867, -0.38268343236508984, 0.14644660940672635, 0.9238795325112867, -0.3535533905932738, 0.27059805007309845, 0.9238795325112867, -0.2705980500730986, 0.35355339059327373, 0.9238795325112867, -0.1464466094067265, 0.38268343236508984, 0.9238795325112867, -9.373040810652598e-17, 0.19509032201612833, 0.9807852804032304, 0.0, 0.18023995550173702, 0.9807852804032304, 0.07465783405034264, 0.13794968964147156, 0.9807852804032304, 0.13794968964147153, 0.07465783405034264, 0.9807852804032304, 0.18023995550173702, 1.1945836920083898e-17, 0.9807852804032304, 0.19509032201612833, -0.07465783405034263, 0.9807852804032304, 0.18023995550173702, -0.13794968964147153, 0.9807852804032304, 0.13794968964147156, -0.18023995550173702, 0.9807852804032304, 0.07465783405034265, -0.19509032201612833, 0.9807852804032304, 2.3891673840167796e-17, -0.18023995550173705, 0.9807852804032304, -0.07465783405034261, -0.13794968964147158, 0.9807852804032304, -0.13794968964147153, -0.07465783405034274, 0.9807852804032304, -0.180239955501737, -3.583751076025169e-17, 0.9807852804032304, -0.19509032201612833, 0.07465783405034268, 0.9807852804032304, -0.18023995550173702, 0.13794968964147153, 0.9807852804032304, -0.13794968964147158, 0.180239955501737, 0.9807852804032304, -0.07465783405034275, 0.19509032201612833, 0.9807852804032304, -4.778334768033559e-17, 6.123233995736766e-17, 1.0, 0.0, 5.657130561438501e-17, 1.0, 2.3432602026631493e-17, 4.329780281177467e-17, 1.0, 4.329780281177466e-17, 2.3432602026631496e-17, 1.0, 5.657130561438501e-17, 3.749399456654644e-33, 1.0, 6.123233995736766e-17, -2.3432602026631487e-17, 1.0, 5.657130561438501e-17, -4.329780281177466e-17, 1.0, 4.329780281177467e-17, -5.657130561438501e-17, 1.0, 2.34326020266315e-17, -6.123233995736766e-17, 1.0, 7.498798913309288e-33, -5.657130561438503e-17, 1.0, -2.3432602026631484e-17, -4.3297802811774677e-17, 1.0, -4.329780281177466e-17, -2.3432602026631527e-17, 1.0, -5.6571305614385e-17, -1.1248198369963932e-32, 1.0, -6.123233995736766e-17, 2.3432602026631505e-17, 1.0, -5.657130561438501e-17, 4.329780281177465e-17, 1.0, -4.3297802811774677e-17, 5.6571305614385e-17, 1.0, -2.343260202663153e-17, 6.123233995736766e-17, 1.0, -1.4997597826618576e-32, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1.0, 0.0, 0.0, 0.882636094209965, 0.47005693825086553, 0.0, 0.6139406135149206, 0.7893522173763262, 0.0, 0.3066453766941747, 0.9518238350409637, 0.0, 4.7625153300174854e-17, 1.0, 0.0, -0.3066453766941746, 0.9518238350409637, 0.0, -0.6139406135149205, 0.7893522173763263, 0.0, -0.8826360942099649, 0.47005693825086564, 0.0, -1.0, 1.5745458846180255e-16, 0.0, -0.882636094209965, -0.4700569382508653, 0.0, -0.6139406135149207, -0.7893522173763262, 0.0, -0.3066453766941752, -0.9518238350409637, 0.0, -1.4287545990052454e-16, -1.0, 0.0, 0.30664537669417485, -0.9518238350409637, 0.0, 0.6139406135149204, -0.7893522173763263, 0.0, 0.8826360942099646, -0.47005693825086614, 0.0, 1.0, -3.149091769236051e-16, 0.0, 1.0, 0.0, 0.0, 0.882636094209965, 0.47005693825086553, 0.0, 0.6139406135149206, 0.7893522173763262, 0.0, 0.3066453766941747, 0.9518238350409637, 0.0, 4.7625153300174854e-17, 1.0, 0.0, -0.3066453766941746, 0.9518238350409637, 0.0, -0.6139406135149205, 0.7893522173763263, 0.0, -0.8826360942099649, 0.47005693825086564, 0.0, -1.0, 1.5745458846180255e-16, 0.0, -0.882636094209965, -0.4700569382508653, 0.0, -0.6139406135149207, -0.7893522173763262, 0.0, -0.3066453766941752, -0.9518238350409637, 0.0, -1.4287545990052454e-16, -1.0, 0.0, 0.30664537669417485, -0.9518238350409637, 0.0, 0.6139406135149204, -0.7893522173763263, 0.0, 0.8826360942099646, -0.47005693825086614, 0.0, 1.0, -3.149091769236051e-16, 0.0, 0.9959744388432288, 0.0, 0.0896376994958906, 0.8793914321908055, 0.46832896009045494, 0.0856661784486557, 0.6120747462154063, 0.7869532451340935, 0.07790439665555078, 0.30585105769823756, 0.9493582777215954, 0.07193045965622127, 4.7508898736084064e-17, 0.9975589671416267, 0.06982912769991388, -0.3058510576982375, 0.9493582777215955, 0.07193045965622129, -0.6120747462154061, 0.7869532451340936, 0.07790439665555078, -0.8793914321908055, 0.46832896009045505, 0.0856661784486557, -0.9959744388432288, 1.568207453865353e-16, 0.0896376994958906, -0.8793914321908057, -0.46832896009045477, 0.0856661784486557, -0.6120747462154064, -0.7869532451340935, 0.07790439665555078, -0.305851057698238, -0.9493582777215954, 0.07193045965622129, -1.4252669620825217e-16, -0.9975589671416267, 0.06982912769991388, 0.3058510576982378, -0.9493582777215955, 0.07193045965622129, 0.612074746215406, -0.7869532451340937, 0.07790439665555078, 0.8793914321908052, -0.46832896009045555, 0.08566617844865568, 0.9959744388432288, -3.136414907730706e-16, 0.0896376994958906, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1.0, 0.0, 0.0, 0.882636094209965, 0.47005693825086553, 0.0, 0.6139406135149206, 0.7893522173763262, 0.0, 0.3066453766941747, 0.9518238350409637, 0.0, 4.7625153300174854e-17, 1.0, 0.0, -0.3066453766941746, 0.9518238350409637, 0.0, -0.6139406135149205, 0.7893522173763263, 0.0, -0.8826360942099649, 0.47005693825086564, 0.0, -1.0, 1.5745458846180255e-16, 0.0, -0.882636094209965, -0.4700569382508653, 0.0, -0.6139406135149207, -0.7893522173763262, 0.0, -0.3066453766941752, -0.9518238350409637, 0.0, -1.4287545990052454e-16, -1.0, 0.0, 0.30664537669417485, -0.9518238350409637, 0.0, 0.6139406135149204, -0.7893522173763263, 0.0, 0.8826360942099646, -0.47005693825086614, 0.0, 1.0, -3.149091769236051e-16, 0.0, 1.0, 0.0, 0.0, 0.882636094209965, 0.47005693825086553, 0.0, 0.6139406135149206, 0.7893522173763262, 0.0, 0.3066453766941747, 0.9518238350409637, 0.0, 4.7625153300174854e-17, 1.0, 0.0, -0.3066453766941746, 0.9518238350409637, 0.0, -0.6139406135149205, 0.7893522173763263, 0.0, -0.8826360942099649, 0.47005693825086564, 0.0, -1.0, 1.5745458846180255e-16, 0.0, -0.882636094209965, -0.4700569382508653, 0.0, -0.6139406135149207, -0.7893522173763262, 0.0, -0.3066453766941752, -0.9518238350409637, 0.0, -1.4287545990052454e-16, -1.0, 0.0, 0.30664537669417485, -0.9518238350409637, 0.0, 0.6139406135149204, -0.7893522173763263, 0.0, 0.8826360942099646, -0.47005693825086614, 0.0, 1.0, -3.149091769236051e-16, 0.0, 0.9959744388432288, 0.0, 0.0896376994958906, 0.8793914321908055, 0.46832896009045494, 0.0856661784486557, 0.6120747462154063, 0.7869532451340935, 0.07790439665555078, 0.30585105769823756, 0.9493582777215954, 0.07193045965622127, 4.7508898736084064e-17, 0.9975589671416267, 0.06982912769991388, -0.3058510576982375, 0.9493582777215955, 0.07193045965622129, -0.6120747462154061, 0.7869532451340936, 0.07790439665555078, -0.8793914321908055, 0.46832896009045505, 0.0856661784486557, -0.9959744388432288, 1.568207453865353e-16, 0.0896376994958906, -0.8793914321908057, -0.46832896009045477, 0.0856661784486557, -0.6120747462154064, -0.7869532451340935, 0.07790439665555078, -0.305851057698238, -0.9493582777215954, 0.07193045965622129, -1.4252669620825217e-16, -0.9975589671416267, 0.06982912769991388, 0.3058510576982378, -0.9493582777215955, 0.07193045965622129, 0.612074746215406, -0.7869532451340937, 0.07790439665555078, 0.8793914321908052, -0.46832896009045555, 0.08566617844865568, 0.9959744388432288, -3.136414907730706e-16, 0.0896376994958906, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1]);
  const tangents = new Float32Array([-0.0, 1.0, 0.0, -0.25881904510252074, 0.9659258262890683, 0.0, -0.49999999999999994, 0.8660254037844387, 0.0, -0.7071067811865475, 0.7071067811865476, 0.0, -0.8660254037844386, 0.5000000000000001, 0.0, -0.9659258262890683, 0.25881904510252074, 0.0, -1.0, 6.123233995736766e-17, 0.0, -0.9659258262890683, -0.25881904510252085, 0.0, -0.8660254037844387, -0.4999999999999998, 0.0, -0.7071067811865476, -0.7071067811865475, 0.0, -0.49999999999999994, -0.8660254037844387, 0.0, -0.258819045102521, -0.9659258262890682, 0.0, -1.2246467991473532e-16, -1.0, 0.0, 0.25881904510252035, -0.9659258262890684, 0.0, 0.5000000000000001, -0.8660254037844386, 0.0, 0.7071067811865475, -0.7071067811865477, 0.0, 0.8660254037844384, -0.5000000000000004, 0.0, 0.9659258262890683, -0.25881904510252063, 0.0, 1.0, -1.8369701987210297e-16, 0.0, 0.9659258262890684, 0.2588190451025203, 0.0, 0.8660254037844386, 0.5000000000000001, 0.0, 0.7071067811865477, 0.7071067811865474, 0.0, 0.5000000000000004, 0.8660254037844384, 0.0, 0.2588190451025207, 0.9659258262890683, 0.0, 2.4492935982947064e-16, 1.0, 0.0, -0.0, 1.0, 0.0, -0.25881904510252074, 0.9659258262890683, 0.0, -0.49999999999999994, 0.8660254037844387, 0.0, -0.7071067811865475, 0.7071067811865476, 0.0, -0.8660254037844386, 0.5000000000000001, 0.0, -0.9659258262890683, 0.25881904510252074, 0.0, -1.0, 6.123233995736766e-17, 0.0, -0.9659258262890683, -0.25881904510252085, 0.0, -0.8660254037844387, -0.4999999999999998, 0.0, -0.7071067811865476, -0.7071067811865475, 0.0, -0.49999999999999994, -0.8660254037844387, 0.0, -0.258819045102521, -0.9659258262890682, 0.0, -1.2246467991473532e-16, -1.0, 0.0, 0.25881904510252035, -0.9659258262890684, 0.0, 0.5000000000000001, -0.8660254037844386, 0.0, 0.7071067811865475, -0.7071067811865477, 0.0, 0.8660254037844384, -0.5000000000000004, 0.0, 0.9659258262890683, -0.25881904510252063, 0.0, 1.0, -1.8369701987210297e-16, 0.0, 0.9659258262890684, 0.2588190451025203, 0.0, 0.8660254037844386, 0.5000000000000001, 0.0, 0.7071067811865477, 0.7071067811865474, 0.0, 0.5000000000000004, 0.8660254037844384, 0.0, 0.2588190451025207, 0.9659258262890683, 0.0, 2.4492935982947064e-16, 1.0, 0.0, 1, 0, 0, -0.0, 1.0, 0, -0.25881904510252074, 0.9659258262890683, 0, -0.49999999999999994, 0.8660254037844387, 0, -0.7071067811865475, 0.7071067811865476, 0, -0.8660254037844386, 0.5000000000000001, 0, -0.9659258262890683, 0.25881904510252074, 0, -1.0, 6.123233995736766e-17, 0, -0.9659258262890683, -0.25881904510252085, 0, -0.8660254037844387, -0.4999999999999998, 0, -0.7071067811865476, -0.7071067811865475, 0, -0.49999999999999994, -0.8660254037844387, 0, -0.258819045102521, -0.9659258262890682, 0, -1.2246467991473532e-16, -1.0, 0, 0.25881904510252035, -0.9659258262890684, 0, 0.5000000000000001, -0.8660254037844386, 0, 0.7071067811865475, -0.7071067811865477, 0, 0.8660254037844384, -0.5000000000000004, 0, 0.9659258262890683, -0.25881904510252063, 0, 1.0, -1.8369701987210297e-16, 0, 0.9659258262890684, 0.2588190451025203, 0, 0.8660254037844386, 0.5000000000000001, 0, 0.7071067811865477, 0.7071067811865474, 0, 0.5000000000000004, 0.8660254037844384, 0, 0.2588190451025207, 0.9659258262890683, 0, -0.0, 1.0, 0, -0.25881904510252074, 0.9659258262890683, 0, -0.49999999999999994, 0.8660254037844387, 0, -0.7071067811865475, 0.7071067811865476, 0, -0.8660254037844386, 0.5000000000000001, 0, -0.9659258262890683, 0.25881904510252074, 0, -1.0, 6.123233995736766e-17, 0, -0.9659258262890683, -0.25881904510252085, 0, -0.8660254037844387, -0.4999999999999998, 0, -0.7071067811865476, -0.7071067811865475, 0, -0.49999999999999994, -0.8660254037844387, 0, -0.258819045102521, -0.9659258262890682, 0, -1.2246467991473532e-16, -1.0, 0, 0.25881904510252035, -0.9659258262890684, 0, 0.5000000000000001, -0.8660254037844386, 0, 0.7071067811865475, -0.7071067811865477, 0, 0.8660254037844384, -0.5000000000000004, 0, 0.9659258262890683, -0.25881904510252063, 0, 1.0, -1.8369701987210297e-16, 0, 0.9659258262890684, 0.2588190451025203, 0, 0.8660254037844386, 0.5000000000000001, 0, 0.7071067811865477, 0.7071067811865474, 0, 0.5000000000000004, 0.8660254037844384, 0, 0.2588190451025207, 0.9659258262890683, 0, 2.4492935982947064e-16, 1.0, 0, 1, 0, 0, -0.0, 1.0, 0.0, -0.25881904510252074, 0.9659258262890683, 0.0, -0.49999999999999994, 0.8660254037844387, 0.0, -0.7071067811865475, 0.7071067811865476, 0.0, -0.8660254037844386, 0.5000000000000001, 0.0, -0.9659258262890683, 0.25881904510252074, 0.0, -1.0, 6.123233995736766e-17, 0.0, -0.9659258262890683, -0.25881904510252085, 0.0, -0.8660254037844387, -0.4999999999999998, 0.0, -0.7071067811865476, -0.7071067811865475, 0.0, -0.49999999999999994, -0.8660254037844387, 0.0, -0.258819045102521, -0.9659258262890682, 0.0, -1.2246467991473532e-16, -1.0, 0.0, 0.25881904510252035, -0.9659258262890684, 0.0, 0.5000000000000001, -0.8660254037844386, 0.0, 0.7071067811865475, -0.7071067811865477, 0.0, 0.8660254037844384, -0.5000000000000004, 0.0, 0.9659258262890683, -0.25881904510252063, 0.0, 1.0, -1.8369701987210297e-16, 0.0, 0.9659258262890684, 0.2588190451025203, 0.0, 0.8660254037844386, 0.5000000000000001, 0.0, 0.7071067811865477, 0.7071067811865474, 0.0, 0.5000000000000004, 0.8660254037844384, 0.0, 0.2588190451025207, 0.9659258262890683, 0.0, 2.4492935982947064e-16, 1.0, 0.0, -0.0, 1.0, 0.0, -0.25881904510252074, 0.9659258262890683, 0.0, -0.49999999999999994, 0.8660254037844387, 0.0, -0.7071067811865475, 0.7071067811865476, 0.0, -0.8660254037844386, 0.5000000000000001, 0.0, -0.9659258262890683, 0.25881904510252074, 0.0, -1.0, 6.123233995736766e-17, 0.0, -0.9659258262890683, -0.25881904510252085, 0.0, -0.8660254037844387, -0.4999999999999998, 0.0, -0.7071067811865476, -0.7071067811865475, 0.0, -0.49999999999999994, -0.8660254037844387, 0.0, -0.258819045102521, -0.9659258262890682, 0.0, -1.2246467991473532e-16, -1.0, 0.0, 0.25881904510252035, -0.9659258262890684, 0.0, 0.5000000000000001, -0.8660254037844386, 0.0, 0.7071067811865475, -0.7071067811865477, 0.0, 0.8660254037844384, -0.5000000000000004, 0.0, 0.9659258262890683, -0.25881904510252063, 0.0, 1.0, -1.8369701987210297e-16, 0.0, 0.9659258262890684, 0.2588190451025203, 0.0, 0.8660254037844386, 0.5000000000000001, 0.0, 0.7071067811865477, 0.7071067811865474, 0.0, 0.5000000000000004, 0.8660254037844384, 0.0, 0.2588190451025207, 0.9659258262890683, 0.0, 2.4492935982947064e-16, 1.0, 0.0, -0.0, 1.0, 0, -0.25881904510252074, 0.9659258262890683, 0, -0.49999999999999994, 0.8660254037844387, 0, -0.7071067811865475, 0.7071067811865476, 0, -0.8660254037844386, 0.5000000000000001, 0, -0.9659258262890683, 0.25881904510252074, 0, -1.0, 6.123233995736766e-17, 0, -0.9659258262890683, -0.25881904510252085, 0, -0.8660254037844387, -0.4999999999999998, 0, -0.7071067811865476, -0.7071067811865475, 0, -0.49999999999999994, -0.8660254037844387, 0, -0.258819045102521, -0.9659258262890682, 0, -1.2246467991473532e-16, -1.0, 0, 0.25881904510252035, -0.9659258262890684, 0, 0.5000000000000001, -0.8660254037844386, 0, 0.7071067811865475, -0.7071067811865477, 0, 0.8660254037844384, -0.5000000000000004, 0, 0.9659258262890683, -0.25881904510252063, 0, 1.0, -1.8369701987210297e-16, 0, 0.9659258262890684, 0.2588190451025203, 0, 0.8660254037844386, 0.5000000000000001, 0, 0.7071067811865477, 0.7071067811865474, 0, 0.5000000000000004, 0.8660254037844384, 0, 0.2588190451025207, 0.9659258262890683, 0, 2.4492935982947064e-16, 1.0, 0, 1, 0, 0, -0.0, 0, 1.0, -0.3826834323650898, 0, 0.9238795325112867, -0.7071067811865475, 0, 0.7071067811865476, -0.9238795325112867, 0, 0.38268343236508984, -1.0, 0, 6.123233995736766e-17, -0.9238795325112867, 0, -0.3826834323650897, -0.7071067811865476, 0, -0.7071067811865475, -0.3826834323650899, 0, -0.9238795325112867, -1.2246467991473532e-16, 0, -1.0, 0.38268343236508967, 0, -0.9238795325112868, 0.7071067811865475, 0, -0.7071067811865477, 0.9238795325112865, 0, -0.38268343236509034, 1.0, 0, -1.8369701987210297e-16, 0.9238795325112866, 0, 0.38268343236509, 0.7071067811865477, 0, 0.7071067811865474, 0.3826834323650904, 0, 0.9238795325112865, 2.4492935982947064e-16, 0, 1.0, -0.0, 0, 1.0, -0.3826834323650898, 0, 0.9238795325112867, -0.7071067811865475, 0, 0.7071067811865476, -0.9238795325112867, 0, 0.38268343236508984, -1.0, 0, 6.123233995736766e-17, -0.9238795325112867, 0, -0.3826834323650897, -0.7071067811865476, 0, -0.7071067811865475, -0.3826834323650899, 0, -0.9238795325112867, -1.2246467991473532e-16, 0, -1.0, 0.38268343236508967, 0, -0.9238795325112868, 0.7071067811865475, 0, -0.7071067811865477, 0.9238795325112865, 0, -0.38268343236509034, 1.0, 0, -1.8369701987210297e-16, 0.9238795325112866, 0, 0.38268343236509, 0.7071067811865477, 0, 0.7071067811865474, 0.3826834323650904, 0, 0.9238795325112865, 2.4492935982947064e-16, 0, 1.0, -0.0, 0, 1.0, -0.3826834323650898, 0, 0.9238795325112867, -0.7071067811865475, 0, 0.7071067811865476, -0.9238795325112867, 0, 0.38268343236508984, -1.0, 0, 6.123233995736766e-17, -0.9238795325112867, 0, -0.3826834323650897, -0.7071067811865476, 0, -0.7071067811865475, -0.3826834323650899, 0, -0.9238795325112867, -1.2246467991473532e-16, 0, -1.0, 0.38268343236508967, 0, -0.9238795325112868, 0.7071067811865475, 0, -0.7071067811865477, 0.9238795325112865, 0, -0.38268343236509034, 1.0, 0, -1.8369701987210297e-16, 0.9238795325112866, 0, 0.38268343236509, 0.7071067811865477, 0, 0.7071067811865474, 0.3826834323650904, 0, 0.9238795325112865, 2.4492935982947064e-16, 0, 1.0, -0.0, 0, 1.0, -0.3826834323650898, 0, 0.9238795325112867, -0.7071067811865475, 0, 0.7071067811865476, -0.9238795325112867, 0, 0.38268343236508984, -1.0, 0, 6.123233995736766e-17, -0.9238795325112867, 0, -0.3826834323650897, -0.7071067811865476, 0, -0.7071067811865475, -0.3826834323650899, 0, -0.9238795325112867, -1.2246467991473532e-16, 0, -1.0, 0.38268343236508967, 0, -0.9238795325112868, 0.7071067811865475, 0, -0.7071067811865477, 0.9238795325112865, 0, -0.38268343236509034, 1.0, 0, -1.8369701987210297e-16, 0.9238795325112866, 0, 0.38268343236509, 0.7071067811865477, 0, 0.7071067811865474, 0.3826834323650904, 0, 0.9238795325112865, 2.4492935982947064e-16, 0, 1.0, -0.0, 0, 1.0, -0.3826834323650898, 0, 0.9238795325112867, -0.7071067811865475, 0, 0.7071067811865476, -0.9238795325112867, 0, 0.38268343236508984, -1.0, 0, 6.123233995736766e-17, -0.9238795325112867, 0, -0.3826834323650897, -0.7071067811865476, 0, -0.7071067811865475, -0.3826834323650899, 0, -0.9238795325112867, -1.2246467991473532e-16, 0, -1.0, 0.38268343236508967, 0, -0.9238795325112868, 0.7071067811865475, 0, -0.7071067811865477, 0.9238795325112865, 0, -0.38268343236509034, 1.0, 0, -1.8369701987210297e-16, 0.9238795325112866, 0, 0.38268343236509, 0.7071067811865477, 0, 0.7071067811865474, 0.3826834323650904, 0, 0.9238795325112865, 2.4492935982947064e-16, 0, 1.0, -0.0, 0, 1.0, -0.3826834323650898, 0, 0.9238795325112867, -0.7071067811865475, 0, 0.7071067811865476, -0.9238795325112867, 0, 0.38268343236508984, -1.0, 0, 6.123233995736766e-17, -0.9238795325112867, 0, -0.3826834323650897, -0.7071067811865476, 0, -0.7071067811865475, -0.3826834323650899, 0, -0.9238795325112867, -1.2246467991473532e-16, 0, -1.0, 0.38268343236508967, 0, -0.9238795325112868, 0.7071067811865475, 0, -0.7071067811865477, 0.9238795325112865, 0, -0.38268343236509034, 1.0, 0, -1.8369701987210297e-16, 0.9238795325112866, 0, 0.38268343236509, 0.7071067811865477, 0, 0.7071067811865474, 0.3826834323650904, 0, 0.9238795325112865, 2.4492935982947064e-16, 0, 1.0, -0.0, 0, 1.0, -0.3826834323650898, 0, 0.9238795325112867, -0.7071067811865475, 0, 0.7071067811865476, -0.9238795325112867, 0, 0.38268343236508984, -1.0, 0, 6.123233995736766e-17, -0.9238795325112867, 0, -0.3826834323650897, -0.7071067811865476, 0, -0.7071067811865475, -0.3826834323650899, 0, -0.9238795325112867, -1.2246467991473532e-16, 0, -1.0, 0.38268343236508967, 0, -0.9238795325112868, 0.7071067811865475, 0, -0.7071067811865477, 0.9238795325112865, 0, -0.38268343236509034, 1.0, 0, -1.8369701987210297e-16, 0.9238795325112866, 0, 0.38268343236509, 0.7071067811865477, 0, 0.7071067811865474, 0.3826834323650904, 0, 0.9238795325112865, 2.4492935982947064e-16, 0, 1.0, -0.0, 0, 1.0, -0.3826834323650898, 0, 0.9238795325112867, -0.7071067811865475, 0, 0.7071067811865476, -0.9238795325112867, 0, 0.38268343236508984, -1.0, 0, 6.123233995736766e-17, -0.9238795325112867, 0, -0.3826834323650897, -0.7071067811865476, 0, -0.7071067811865475, -0.3826834323650899, 0, -0.9238795325112867, -1.2246467991473532e-16, 0, -1.0, 0.38268343236508967, 0, -0.9238795325112868, 0.7071067811865475, 0, -0.7071067811865477, 0.9238795325112865, 0, -0.38268343236509034, 1.0, 0, -1.8369701987210297e-16, 0.9238795325112866, 0, 0.38268343236509, 0.7071067811865477, 0, 0.7071067811865474, 0.3826834323650904, 0, 0.9238795325112865, 2.4492935982947064e-16, 0, 1.0, -0.0, 0, 1.0, -0.3826834323650898, 0, 0.9238795325112867, -0.7071067811865475, 0, 0.7071067811865476, -0.9238795325112867, 0, 0.38268343236508984, -1.0, 0, 6.123233995736766e-17, -0.9238795325112867, 0, -0.3826834323650897, -0.7071067811865476, 0, -0.7071067811865475, -0.3826834323650899, 0, -0.9238795325112867, -1.2246467991473532e-16, 0, -1.0, 0.38268343236508967, 0, -0.9238795325112868, 0.7071067811865475, 0, -0.7071067811865477, 0.9238795325112865, 0, -0.38268343236509034, 1.0, 0, -1.8369701987210297e-16, 0.9238795325112866, 0, 0.38268343236509, 0.7071067811865477, 0, 0.7071067811865474, 0.3826834323650904, 0, 0.9238795325112865, 2.4492935982947064e-16, 0, 1.0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -0.0, 1.0, 0.0, -0.3826834323650898, 0.9238795325112867, 0.0, -0.7071067811865475, 0.7071067811865476, 0.0, -0.9238795325112867, 0.38268343236508984, 0.0, -1.0, 6.123233995736766e-17, 0.0, -0.9238795325112867, -0.3826834323650897, 0.0, -0.7071067811865476, -0.7071067811865475, 0.0, -0.3826834323650899, -0.9238795325112867, 0.0, -1.2246467991473532e-16, -1.0, 0.0, 0.38268343236508967, -0.9238795325112868, 0.0, 0.7071067811865475, -0.7071067811865477, 0.0, 0.9238795325112865, -0.38268343236509034, 0.0, 1.0, -1.8369701987210297e-16, 0.0, 0.9238795325112866, 0.38268343236509, 0.0, 0.7071067811865477, 0.7071067811865474, 0.0, 0.3826834323650904, 0.9238795325112865, 0.0, 2.4492935982947064e-16, 1.0, 0.0, -0.0, 1.0, 0.0, -0.3826834323650898, 0.9238795325112867, 0.0, -0.7071067811865475, 0.7071067811865476, 0.0, -0.9238795325112867, 0.38268343236508984, 0.0, -1.0, 6.123233995736766e-17, 0.0, -0.9238795325112867, -0.3826834323650897, 0.0, -0.7071067811865476, -0.7071067811865475, 0.0, -0.3826834323650899, -0.9238795325112867, 0.0, -1.2246467991473532e-16, -1.0, 0.0, 0.38268343236508967, -0.9238795325112868, 0.0, 0.7071067811865475, -0.7071067811865477, 0.0, 0.9238795325112865, -0.38268343236509034, 0.0, 1.0, -1.8369701987210297e-16, 0.0, 0.9238795325112866, 0.38268343236509, 0.0, 0.7071067811865477, 0.7071067811865474, 0.0, 0.3826834323650904, 0.9238795325112865, 0.0, 2.4492935982947064e-16, 1.0, 0.0, -0.0, 1.0, 0, -0.3826834323650898, 0.9238795325112867, 0, -0.7071067811865475, 0.7071067811865476, 0, -0.9238795325112867, 0.38268343236508984, 0, -1.0, 6.123233995736766e-17, 0, -0.9238795325112867, -0.3826834323650897, 0, -0.7071067811865476, -0.7071067811865475, 0, -0.3826834323650899, -0.9238795325112867, 0, -1.2246467991473532e-16, -1.0, 0, 0.38268343236508967, -0.9238795325112868, 0, 0.7071067811865475, -0.7071067811865477, 0, 0.9238795325112865, -0.38268343236509034, 0, 1.0, -1.8369701987210297e-16, 0, 0.9238795325112866, 0.38268343236509, 0, 0.7071067811865477, 0.7071067811865474, 0, 0.3826834323650904, 0.9238795325112865, 0, 2.4492935982947064e-16, 1.0, 0, 1, 0, 0, 1, 0, 0, -0.0, 1.0, 0, -0.3826834323650898, 0.9238795325112867, 0, -0.7071067811865475, 0.7071067811865476, 0, -0.9238795325112867, 0.38268343236508984, 0, -1.0, 6.123233995736766e-17, 0, -0.9238795325112867, -0.3826834323650897, 0, -0.7071067811865476, -0.7071067811865475, 0, -0.3826834323650899, -0.9238795325112867, 0, -1.2246467991473532e-16, -1.0, 0, 0.38268343236508967, -0.9238795325112868, 0, 0.7071067811865475, -0.7071067811865477, 0, 0.9238795325112865, -0.38268343236509034, 0, 1.0, -1.8369701987210297e-16, 0, 0.9238795325112866, 0.38268343236509, 0, 0.7071067811865477, 0.7071067811865474, 0, 0.3826834323650904, 0.9238795325112865, 0, -0.0, 1.0, 0.0, -0.3826834323650898, 0.9238795325112867, 0.0, -0.7071067811865475, 0.7071067811865476, 0.0, -0.9238795325112867, 0.38268343236508984, 0.0, -1.0, 6.123233995736766e-17, 0.0, -0.9238795325112867, -0.3826834323650897, 0.0, -0.7071067811865476, -0.7071067811865475, 0.0, -0.3826834323650899, -0.9238795325112867, 0.0, -1.2246467991473532e-16, -1.0, 0.0, 0.38268343236508967, -0.9238795325112868, 0.0, 0.7071067811865475, -0.7071067811865477, 0.0, 0.9238795325112865, -0.38268343236509034, 0.0, 1.0, -1.8369701987210297e-16, 0.0, 0.9238795325112866, 0.38268343236509, 0.0, 0.7071067811865477, 0.7071067811865474, 0.0, 0.3826834323650904, 0.9238795325112865, 0.0, 2.4492935982947064e-16, 1.0, 0.0, -0.0, 1.0, 0.0, -0.3826834323650898, 0.9238795325112867, 0.0, -0.7071067811865475, 0.7071067811865476, 0.0, -0.9238795325112867, 0.38268343236508984, 0.0, -1.0, 6.123233995736766e-17, 0.0, -0.9238795325112867, -0.3826834323650897, 0.0, -0.7071067811865476, -0.7071067811865475, 0.0, -0.3826834323650899, -0.9238795325112867, 0.0, -1.2246467991473532e-16, -1.0, 0.0, 0.38268343236508967, -0.9238795325112868, 0.0, 0.7071067811865475, -0.7071067811865477, 0.0, 0.9238795325112865, -0.38268343236509034, 0.0, 1.0, -1.8369701987210297e-16, 0.0, 0.9238795325112866, 0.38268343236509, 0.0, 0.7071067811865477, 0.7071067811865474, 0.0, 0.3826834323650904, 0.9238795325112865, 0.0, 2.4492935982947064e-16, 1.0, 0.0, -0.0, 1.0, 0, -0.3826834323650898, 0.9238795325112867, 0, -0.7071067811865475, 0.7071067811865476, 0, -0.9238795325112867, 0.38268343236508984, 0, -1.0, 6.123233995736766e-17, 0, -0.9238795325112867, -0.3826834323650897, 0, -0.7071067811865476, -0.7071067811865475, 0, -0.3826834323650899, -0.9238795325112867, 0, -1.2246467991473532e-16, -1.0, 0, 0.38268343236508967, -0.9238795325112868, 0, 0.7071067811865475, -0.7071067811865477, 0, 0.9238795325112865, -0.38268343236509034, 0, 1.0, -1.8369701987210297e-16, 0, 0.9238795325112866, 0.38268343236509, 0, 0.7071067811865477, 0.7071067811865474, 0, 0.3826834323650904, 0.9238795325112865, 0, 2.4492935982947064e-16, 1.0, 0, 1, 0, 0, 1, 0, 0, -0.0, 1.0, 0, -0.3826834323650898, 0.9238795325112867, 0, -0.7071067811865475, 0.7071067811865476, 0, -0.9238795325112867, 0.38268343236508984, 0, -1.0, 6.123233995736766e-17, 0, -0.9238795325112867, -0.3826834323650897, 0, -0.7071067811865476, -0.7071067811865475, 0, -0.3826834323650899, -0.9238795325112867, 0, -1.2246467991473532e-16, -1.0, 0, 0.38268343236508967, -0.9238795325112868, 0, 0.7071067811865475, -0.7071067811865477, 0, 0.9238795325112865, -0.38268343236509034, 0, 1.0, -1.8369701987210297e-16, 0, 0.9238795325112866, 0.38268343236509, 0, 0.7071067811865477, 0.7071067811865474, 0, 0.3826834323650904, 0.9238795325112865, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]);
  const texels   = new Float32Array([0.0, 0, 0.041666666666666664, 0, 0.08333333333333333, 0, 0.125, 0, 0.16666666666666666, 0, 0.20833333333333334, 0, 0.25, 0, 0.2916666666666667, 0, 0.3333333333333333, 0, 0.375, 0, 0.4166666666666667, 0, 0.4583333333333333, 0, 0.5, 0, 0.5416666666666666, 0, 0.5833333333333334, 0, 0.625, 0, 0.6666666666666666, 0, 0.7083333333333334, 0, 0.75, 0, 0.7916666666666666, 0, 0.8333333333333334, 0, 0.875, 0, 0.9166666666666666, 0, 0.9583333333333334, 0, 1.0, 0, 0.0, 1, 0.041666666666666664, 1, 0.08333333333333333, 1, 0.125, 1, 0.16666666666666666, 1, 0.20833333333333334, 1, 0.25, 1, 0.2916666666666667, 1, 0.3333333333333333, 1, 0.375, 1, 0.4166666666666667, 1, 0.4583333333333333, 1, 0.5, 1, 0.5416666666666666, 1, 0.5833333333333334, 1, 0.625, 1, 0.6666666666666666, 1, 0.7083333333333334, 1, 0.75, 1, 0.7916666666666666, 1, 0.8333333333333334, 1, 0.875, 1, 0.9166666666666666, 1, 0.9583333333333334, 1, 1.0, 1, 0.5, 0.5, 1.0, 0.5, 0.9829629131445341, 0.6294095225512604, 0.9330127018922194, 0.75, 0.8535533905932737, 0.8535533905932737, 0.75, 0.9330127018922193, 0.6294095225512604, 0.9829629131445341, 0.5, 1.0, 0.3705904774487396, 0.9829629131445341, 0.2500000000000001, 0.9330127018922194, 0.14644660940672627, 0.8535533905932737, 0.06698729810778065, 0.75, 0.0170370868554659, 0.6294095225512605, 0.0, 0.5000000000000001, 0.01703708685546579, 0.37059047744873985, 0.0669872981077807, 0.24999999999999994, 0.14644660940672616, 0.14644660940672627, 0.24999999999999978, 0.06698729810778081, 0.3705904774487397, 0.017037086855465844, 0.4999999999999999, 0.0, 0.6294095225512601, 0.01703708685546579, 0.75, 0.0669872981077807, 0.8535533905932737, 0.14644660940672616, 0.9330127018922192, 0.24999999999999978, 0.9829629131445341, 0.37059047744873963, 0.0, 0, 0.041666666666666664, 0, 0.08333333333333333, 0, 0.125, 0, 0.16666666666666666, 0, 0.20833333333333334, 0, 0.25, 0, 0.2916666666666667, 0, 0.3333333333333333, 0, 0.375, 0, 0.4166666666666667, 0, 0.4583333333333333, 0, 0.5, 0, 0.5416666666666666, 0, 0.5833333333333334, 0, 0.625, 0, 0.6666666666666666, 0, 0.7083333333333334, 0, 0.75, 0, 0.7916666666666666, 0, 0.8333333333333334, 0, 0.875, 0, 0.9166666666666666, 0, 0.9583333333333334, 0, 1.0, 0, 0.5, 1, 0.0, 0, 0.041666666666666664, 0, 0.08333333333333333, 0, 0.125, 0, 0.16666666666666666, 0, 0.20833333333333334, 0, 0.25, 0, 0.2916666666666667, 0, 0.3333333333333333, 0, 0.375, 0, 0.4166666666666667, 0, 0.4583333333333333, 0, 0.5, 0, 0.5416666666666666, 0, 0.5833333333333334, 0, 0.625, 0, 0.6666666666666666, 0, 0.7083333333333334, 0, 0.75, 0, 0.7916666666666666, 0, 0.8333333333333334, 0, 0.875, 0, 0.9166666666666666, 0, 0.9583333333333334, 0, 1.0, 0, 0.0, 1, 0.041666666666666664, 1, 0.08333333333333333, 1, 0.125, 1, 0.16666666666666666, 1, 0.20833333333333334, 1, 0.25, 1, 0.2916666666666667, 1, 0.3333333333333333, 1, 0.375, 1, 0.4166666666666667, 1, 0.4583333333333333, 1, 0.5, 1, 0.5416666666666666, 1, 0.5833333333333334, 1, 0.625, 1, 0.6666666666666666, 1, 0.7083333333333334, 1, 0.75, 1, 0.7916666666666666, 1, 0.8333333333333334, 1, 0.875, 1, 0.9166666666666666, 1, 0.9583333333333334, 1, 1.0, 1, 0.0, 0, 0.041666666666666664, 0, 0.08333333333333333, 0, 0.125, 0, 0.16666666666666666, 0, 0.20833333333333334, 0, 0.25, 0, 0.2916666666666667, 0, 0.3333333333333333, 0, 0.375, 0, 0.4166666666666667, 0, 0.4583333333333333, 0, 0.5, 0, 0.5416666666666666, 0, 0.5833333333333334, 0, 0.625, 0, 0.6666666666666666, 0, 0.7083333333333334, 0, 0.75, 0, 0.7916666666666666, 0, 0.8333333333333334, 0, 0.875, 0, 0.9166666666666666, 0, 0.9583333333333334, 0, 1.0, 0, 0.5, 1, 0.0, 0.0, 0.0625, 0.0, 0.125, 0.0, 0.1875, 0.0, 0.25, 0.0, 0.3125, 0.0, 0.375, 0.0, 0.4375, 0.0, 0.5, 0.0, 0.5625, 0.0, 0.625, 0.0, 0.6875, 0.0, 0.75, 0.0, 0.8125, 0.0, 0.875, 0.0, 0.9375, 0.0, 1.0, 0.0, 0.0, 0.125, 0.0625, 0.125, 0.125, 0.125, 0.1875, 0.125, 0.25, 0.125, 0.3125, 0.125, 0.375, 0.125, 0.4375, 0.125, 0.5, 0.125, 0.5625, 0.125, 0.625, 0.125, 0.6875, 0.125, 0.75, 0.125, 0.8125, 0.125, 0.875, 0.125, 0.9375, 0.125, 1.0, 0.125, 0.0, 0.25, 0.0625, 0.25, 0.125, 0.25, 0.1875, 0.25, 0.25, 0.25, 0.3125, 0.25, 0.375, 0.25, 0.4375, 0.25, 0.5, 0.25, 0.5625, 0.25, 0.625, 0.25, 0.6875, 0.25, 0.75, 0.25, 0.8125, 0.25, 0.875, 0.25, 0.9375, 0.25, 1.0, 0.25, 0.0, 0.375, 0.0625, 0.375, 0.125, 0.375, 0.1875, 0.375, 0.25, 0.375, 0.3125, 0.375, 0.375, 0.375, 0.4375, 0.375, 0.5, 0.375, 0.5625, 0.375, 0.625, 0.375, 0.6875, 0.375, 0.75, 0.375, 0.8125, 0.375, 0.875, 0.375, 0.9375, 0.375, 1.0, 0.375, 0.0, 0.5, 0.0625, 0.5, 0.125, 0.5, 0.1875, 0.5, 0.25, 0.5, 0.3125, 0.5, 0.375, 0.5, 0.4375, 0.5, 0.5, 0.5, 0.5625, 0.5, 0.625, 0.5, 0.6875, 0.5, 0.75, 0.5, 0.8125, 0.5, 0.875, 0.5, 0.9375, 0.5, 1.0, 0.5, 0.0, 0.625, 0.0625, 0.625, 0.125, 0.625, 0.1875, 0.625, 0.25, 0.625, 0.3125, 0.625, 0.375, 0.625, 0.4375, 0.625, 0.5, 0.625, 0.5625, 0.625, 0.625, 0.625, 0.6875, 0.625, 0.75, 0.625, 0.8125, 0.625, 0.875, 0.625, 0.9375, 0.625, 1.0, 0.625, 0.0, 0.75, 0.0625, 0.75, 0.125, 0.75, 0.1875, 0.75, 0.25, 0.75, 0.3125, 0.75, 0.375, 0.75, 0.4375, 0.75, 0.5, 0.75, 0.5625, 0.75, 0.625, 0.75, 0.6875, 0.75, 0.75, 0.75, 0.8125, 0.75, 0.875, 0.75, 0.9375, 0.75, 1.0, 0.75, 0.0, 0.875, 0.0625, 0.875, 0.125, 0.875, 0.1875, 0.875, 0.25, 0.875, 0.3125, 0.875, 0.375, 0.875, 0.4375, 0.875, 0.5, 0.875, 0.5625, 0.875, 0.625, 0.875, 0.6875, 0.875, 0.75, 0.875, 0.8125, 0.875, 0.875, 0.875, 0.9375, 0.875, 1.0, 0.875, 0.0, 1.0, 0.0625, 1.0, 0.125, 1.0, 0.1875, 1.0, 0.25, 1.0, 0.3125, 1.0, 0.375, 1.0, 0.4375, 1.0, 0.5, 1.0, 0.5625, 1.0, 0.625, 1.0, 0.6875, 1.0, 0.75, 1.0, 0.8125, 1.0, 0.875, 1.0, 0.9375, 1.0, 1.0, 1.0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0.0, 0, 0.0625, 0, 0.125, 0, 0.1875, 0, 0.25, 0, 0.3125, 0, 0.375, 0, 0.4375, 0, 0.5, 0, 0.5625, 0, 0.625, 0, 0.6875, 0, 0.75, 0, 0.8125, 0, 0.875, 0, 0.9375, 0, 1.0, 0, 0.0, 1, 0.0625, 1, 0.125, 1, 0.1875, 1, 0.25, 1, 0.3125, 1, 0.375, 1, 0.4375, 1, 0.5, 1, 0.5625, 1, 0.625, 1, 0.6875, 1, 0.75, 1, 0.8125, 1, 0.875, 1, 0.9375, 1, 1.0, 1, 0.0, 0, 0.0625, 0, 0.125, 0, 0.1875, 0, 0.25, 0, 0.3125, 0, 0.375, 0, 0.4375, 0, 0.5, 0, 0.5625, 0, 0.625, 0, 0.6875, 0, 0.75, 0, 0.8125, 0, 0.875, 0, 0.9375, 0, 1.0, 0, 0.5, 1, 0.5, 0.5, 1.0, 0.5, 0.9619397662556434, 0.6913417161825449, 0.8535533905932737, 0.8535533905932737, 0.6913417161825449, 0.9619397662556434, 0.5, 1.0, 0.30865828381745514, 0.9619397662556434, 0.14644660940672627, 0.8535533905932737, 0.03806023374435663, 0.6913417161825449, 0.0, 0.5000000000000001, 0.038060233744356575, 0.3086582838174552, 0.14644660940672616, 0.14644660940672627, 0.30865828381745486, 0.03806023374435674, 0.4999999999999999, 0.0, 0.691341716182545, 0.038060233744356686, 0.8535533905932737, 0.14644660940672616, 0.9619397662556433, 0.3086582838174548, 0.0, 0, 0.0625, 0, 0.125, 0, 0.1875, 0, 0.25, 0, 0.3125, 0, 0.375, 0, 0.4375, 0, 0.5, 0, 0.5625, 0, 0.625, 0, 0.6875, 0, 0.75, 0, 0.8125, 0, 0.875, 0, 0.9375, 0, 1.0, 0, 0.0, 1, 0.0625, 1, 0.125, 1, 0.1875, 1, 0.25, 1, 0.3125, 1, 0.375, 1, 0.4375, 1, 0.5, 1, 0.5625, 1, 0.625, 1, 0.6875, 1, 0.75, 1, 0.8125, 1, 0.875, 1, 0.9375, 1, 1.0, 1, 0.0, 0, 0.0625, 0, 0.125, 0, 0.1875, 0, 0.25, 0, 0.3125, 0, 0.375, 0, 0.4375, 0, 0.5, 0, 0.5625, 0, 0.625, 0, 0.6875, 0, 0.75, 0, 0.8125, 0, 0.875, 0, 0.9375, 0, 1.0, 0, 0.5, 1, 0.5, 0.5, 1.0, 0.5, 0.9619397662556434, 0.6913417161825449, 0.8535533905932737, 0.8535533905932737, 0.6913417161825449, 0.9619397662556434, 0.5, 1.0, 0.30865828381745514, 0.9619397662556434, 0.14644660940672627, 0.8535533905932737, 0.03806023374435663, 0.6913417161825449, 0.0, 0.5000000000000001, 0.038060233744356575, 0.3086582838174552, 0.14644660940672616, 0.14644660940672627, 0.30865828381745486, 0.03806023374435674, 0.4999999999999999, 0.0, 0.691341716182545, 0.038060233744356686, 0.8535533905932737, 0.14644660940672616, 0.9619397662556433, 0.3086582838174548, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1]);
  const indices  = new Uint16Array([0, 1, 26, 0, 26, 25, 1, 2, 27, 1, 27, 26, 2, 3, 28, 2, 28, 27, 3, 4, 29, 3, 29, 28, 4, 5, 30, 4, 30, 29, 5, 6, 31, 5, 31, 30, 6, 7, 32, 6, 32, 31, 7, 8, 33, 7, 33, 32, 8, 9, 34, 8, 34, 33, 9, 10, 35, 9, 35, 34, 10, 11, 36, 10, 36, 35, 11, 12, 37, 11, 37, 36, 12, 13, 38, 12, 38, 37, 13, 14, 39, 13, 39, 38, 14, 15, 40, 14, 40, 39, 15, 16, 41, 15, 41, 40, 16, 17, 42, 16, 42, 41, 17, 18, 43, 17, 43, 42, 18, 19, 44, 18, 44, 43, 19, 20, 45, 19, 45, 44, 20, 21, 46, 20, 46, 45, 21, 22, 47, 21, 47, 46, 22, 23, 48, 22, 48, 47, 23, 24, 49, 23, 49, 48, 50, 51, 52, 50, 52, 53, 50, 53, 54, 50, 54, 55, 50, 55, 56, 50, 56, 57, 50, 57, 58, 50, 58, 59, 50, 59, 60, 50, 60, 61, 50, 61, 62, 50, 62, 63, 50, 63, 64, 50, 64, 65, 50, 65, 66, 50, 66, 67, 50, 67, 68, 50, 68, 69, 50, 69, 70, 50, 70, 71, 50, 71, 72, 50, 72, 73, 50, 73, 74, 50, 74, 51, 75, 76, 100, 76, 77, 100, 77, 78, 100, 78, 79, 100, 79, 80, 100, 80, 81, 100, 81, 82, 100, 82, 83, 100, 83, 84, 100, 84, 85, 100, 85, 86, 100, 86, 87, 100, 87, 88, 100, 88, 89, 100, 89, 90, 100, 90, 91, 100, 91, 92, 100, 92, 93, 100, 93, 94, 100, 94, 95, 100, 95, 96, 100, 96, 97, 100, 97, 98, 100, 98, 99, 100, 101, 102, 127, 101, 127, 126, 102, 103, 128, 102, 128, 127, 103, 104, 129, 103, 129, 128, 104, 105, 130, 104, 130, 129, 105, 106, 131, 105, 131, 130, 106, 107, 132, 106, 132, 131, 107, 108, 133, 107, 133, 132, 108, 109, 134, 108, 134, 133, 109, 110, 135, 109, 135, 134, 110, 111, 136, 110, 136, 135, 111, 112, 137, 111, 137, 136, 112, 113, 138, 112, 138, 137, 113, 114, 139, 113, 139, 138, 114, 115, 140, 114, 140, 139, 115, 116, 141, 115, 141, 140, 116, 117, 142, 116, 142, 141, 117, 118, 143, 117, 143, 142, 118, 119, 144, 118, 144, 143, 119, 120, 145, 119, 145, 144, 120, 121, 146, 120, 146, 145, 121, 122, 147, 121, 147, 146, 122, 123, 148, 122, 148, 147, 123, 124, 149, 123, 149, 148, 124, 125, 150, 124, 150, 149, 151, 152, 176, 152, 153, 176, 153, 154, 176, 154, 155, 176, 155, 156, 176, 156, 157, 176, 157, 158, 176, 158, 159, 176, 159, 160, 176, 160, 161, 176, 161, 162, 176, 162, 163, 176, 163, 164, 176, 164, 165, 176, 165, 166, 176, 166, 167, 176, 167, 168, 176, 168, 169, 176, 169, 170, 176, 170, 171, 176, 171, 172, 176, 172, 173, 176, 173, 174, 176, 174, 175, 176, 177, 178, 195, 177, 195, 194, 178, 179, 196, 178, 196, 195, 179, 180, 197, 179, 197, 196, 180, 181, 198, 180, 198, 197, 181, 182, 199, 181, 199, 198, 182, 183, 200, 182, 200, 199, 183, 184, 201, 183, 201, 200, 184, 185, 202, 184, 202, 201, 185, 186, 203, 185, 203, 202, 186, 187, 204, 186, 204, 203, 187, 188, 205, 187, 205, 204, 188, 189, 206, 188, 206, 205, 189, 190, 207, 189, 207, 206, 190, 191, 208, 190, 208, 207, 191, 192, 209, 191, 209, 208, 192, 193, 210, 192, 210, 209, 194, 195, 212, 194, 212, 211, 195, 196, 213, 195, 213, 212, 196, 197, 214, 196, 214, 213, 197, 198, 215, 197, 215, 214, 198, 199, 216, 198, 216, 215, 199, 200, 217, 199, 217, 216, 200, 201, 218, 200, 218, 217, 201, 202, 219, 201, 219, 218, 202, 203, 220, 202, 220, 219, 203, 204, 221, 203, 221, 220, 204, 205, 222, 204, 222, 221, 205, 206, 223, 205, 223, 222, 206, 207, 224, 206, 224, 223, 207, 208, 225, 207, 225, 224, 208, 209, 226, 208, 226, 225, 209, 210, 227, 209, 227, 226, 211, 212, 229, 211, 229, 228, 212, 213, 230, 212, 230, 229, 213, 214, 231, 213, 231, 230, 214, 215, 232, 214, 232, 231, 215, 216, 233, 215, 233, 232, 216, 217, 234, 216, 234, 233, 217, 218, 235, 217, 235, 234, 218, 219, 236, 218, 236, 235, 219, 220, 237, 219, 237, 236, 220, 221, 238, 220, 238, 237, 221, 222, 239, 221, 239, 238, 222, 223, 240, 222, 240, 239, 223, 224, 241, 223, 241, 240, 224, 225, 242, 224, 242, 241, 225, 226, 243, 225, 243, 242, 226, 227, 244, 226, 244, 243, 228, 229, 246, 228, 246, 245, 229, 230, 247, 229, 247, 246, 230, 231, 248, 230, 248, 247, 231, 232, 249, 231, 249, 248, 232, 233, 250, 232, 250, 249, 233, 234, 251, 233, 251, 250, 234, 235, 252, 234, 252, 251, 235, 236, 253, 235, 253, 252, 236, 237, 254, 236, 254, 253, 237, 238, 255, 237, 255, 254, 238, 239, 256, 238, 256, 255, 239, 240, 257, 239, 257, 256, 240, 241, 258, 240, 258, 257, 241, 242, 259, 241, 259, 258, 242, 243, 260, 242, 260, 259, 243, 244, 261, 243, 261, 260, 245, 246, 263, 245, 263, 262, 246, 247, 264, 246, 264, 263, 247, 248, 265, 247, 265, 264, 248, 249, 266, 248, 266, 265, 249, 250, 267, 249, 267, 266, 250, 251, 268, 250, 268, 267, 251, 252, 269, 251, 269, 268, 252, 253, 270, 252, 270, 269, 253, 254, 271, 253, 271, 270, 254, 255, 272, 254, 272, 271, 255, 256, 273, 255, 273, 272, 256, 257, 274, 256, 274, 273, 257, 258, 275, 257, 275, 274, 258, 259, 276, 258, 276, 275, 259, 260, 277, 259, 277, 276, 260, 261, 278, 260, 278, 277, 262, 263, 280, 262, 280, 279, 263, 264, 281, 263, 281, 280, 264, 265, 282, 264, 282, 281, 265, 266, 283, 265, 283, 282, 266, 267, 284, 266, 284, 283, 267, 268, 285, 267, 285, 284, 268, 269, 286, 268, 286, 285, 269, 270, 287, 269, 287, 286, 270, 271, 288, 270, 288, 287, 271, 272, 289, 271, 289, 288, 272, 273, 290, 272, 290, 289, 273, 274, 291, 273, 291, 290, 274, 275, 292, 274, 292, 291, 275, 276, 293, 275, 293, 292, 276, 277, 294, 276, 294, 293, 277, 278, 295, 277, 295, 294, 279, 280, 297, 279, 297, 296, 280, 281, 298, 280, 298, 297, 281, 282, 299, 281, 299, 298, 282, 283, 300, 282, 300, 299, 283, 284, 301, 283, 301, 300, 284, 285, 302, 284, 302, 301, 285, 286, 303, 285, 303, 302, 286, 287, 304, 286, 304, 303, 287, 288, 305, 287, 305, 304, 288, 289, 306, 288, 306, 305, 289, 290, 307, 289, 307, 306, 290, 291, 308, 290, 308, 307, 291, 292, 309, 291, 309, 308, 292, 293, 310, 292, 310, 309, 293, 294, 311, 293, 311, 310, 294, 295, 312, 294, 312, 311, 296, 297, 314, 296, 314, 313, 297, 298, 315, 297, 315, 314, 298, 299, 316, 298, 316, 315, 299, 300, 317, 299, 317, 316, 300, 301, 318, 300, 318, 317, 301, 302, 319, 301, 319, 318, 302, 303, 320, 302, 320, 319, 303, 304, 321, 303, 321, 320, 304, 305, 322, 304, 322, 321, 305, 306, 323, 305, 323, 322, 306, 307, 324, 306, 324, 323, 307, 308, 325, 307, 325, 324, 308, 309, 326, 308, 326, 325, 309, 310, 327, 309, 327, 326, 310, 311, 328, 310, 328, 327, 311, 312, 329, 311, 329, 328, 330, 331, 332, 330, 332, 333, 334, 335, 336, 334, 336, 337, 338, 339, 340, 338, 340, 341, 342, 343, 344, 342, 344, 345, 346, 347, 348, 346, 348, 349, 350, 351, 352, 350, 352, 353, 354, 355, 372, 354, 372, 371, 355, 356, 373, 355, 373, 372, 356, 357, 374, 356, 374, 373, 357, 358, 375, 357, 375, 374, 358, 359, 376, 358, 376, 375, 359, 360, 377, 359, 377, 376, 360, 361, 378, 360, 378, 377, 361, 362, 379, 361, 379, 378, 362, 363, 380, 362, 380, 379, 363, 364, 381, 363, 381, 380, 364, 365, 382, 364, 382, 381, 365, 366, 383, 365, 383, 382, 366, 367, 384, 366, 384, 383, 367, 368, 385, 367, 385, 384, 368, 369, 386, 368, 386, 385, 369, 370, 387, 369, 387, 386, 388, 389, 405, 389, 390, 405, 390, 391, 405, 391, 392, 405, 392, 393, 405, 393, 394, 405, 394, 395, 405, 395, 396, 405, 396, 397, 405, 397, 398, 405, 398, 399, 405, 399, 400, 405, 400, 401, 405, 401, 402, 405, 402, 403, 405, 403, 404, 405, 406, 407, 408, 406, 408, 409, 406, 409, 410, 406, 410, 411, 406, 411, 412, 406, 412, 413, 406, 413, 414, 406, 414, 415, 406, 415, 416, 406, 416, 417, 406, 417, 418, 406, 418, 419, 406, 419, 420, 406, 420, 421, 406, 421, 422, 406, 422, 407, 423, 424, 441, 423, 441, 440, 424, 425, 442, 424, 442, 441, 425, 426, 443, 425, 443, 442, 426, 427, 444, 426, 444, 443, 427, 428, 445, 427, 445, 444, 428, 429, 446, 428, 446, 445, 429, 430, 447, 429, 447, 446, 430, 431, 448, 430, 448, 447, 431, 432, 449, 431, 449, 448, 432, 433, 450, 432, 450, 449, 433, 434, 451, 433, 451, 450, 434, 435, 452, 434, 452, 451, 435, 436, 453, 435, 453, 452, 436, 437, 454, 436, 454, 453, 437, 438, 455, 437, 455, 454, 438, 439, 456, 438, 456, 455, 457, 458, 474, 458, 459, 474, 459, 460, 474, 460, 461, 474, 461, 462, 474, 462, 463, 474, 463, 464, 474, 464, 465, 474, 465, 466, 474, 466, 467, 474, 467, 468, 474, 468, 469, 474, 469, 470, 474, 470, 471, 474, 471, 472, 474, 472, 473, 474, 475, 476, 477, 475, 477, 478, 475, 478, 479, 475, 479, 480, 475, 480, 481, 475, 481, 482, 475, 482, 483, 475, 483, 484, 475, 484, 485, 475, 485, 486, 475, 486, 487, 475, 487, 488, 475, 488, 489, 475, 489, 490, 475, 490, 491, 475, 491, 476, 492, 493, 494, 492, 494, 495, 496, 497, 498, 496, 498, 499, 500, 501, 502, 500, 502, 503, 504, 505, 506, 504, 506, 507, 508, 509, 510, 508, 510, 511, 512, 513, 514, 512, 514, 515, 516, 517, 518, 516, 518, 519, 520, 521, 522, 520, 522, 523, 524, 525, 526, 524, 526, 527, 528, 529, 530, 528, 530, 531, 532, 533, 534, 532, 534, 535, 536, 537, 538, 536, 538, 539]);

  const colors = color
      ? new Float32Array(vertices.length).map((_, i) => color[i % 3])
      : baked_colors;

  return { vertices, indices, normals, tangents, texels, colors };
} // end function