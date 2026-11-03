/**
 * this file holds the definition of the scene graph components.
 * this is organized in such a way to enable batching by programs
 * and hierarchical modelling.
 * 
 * TODO: this is going to be reworked to be more usable considering 
 * use in final project, but here as reference.
 */

/**
 * ============================================================
 * SCENE GRAPH
 * 
 * this is the root of the scene show in any canvas. 
 * it is really an encapsulation on a list of root objects in the scene
 * and holds some global values to be passed on render
 * to enable automation of a scene build.
 * ============================================================
 */

export class SceneGraph {

  objects = []; // these are root objects of the scene. can be a single node.
  point_lights_global = []; // these are point lights that should default be used on all objects
  transform_dict = {}; // this holds mappings of object/node id -> transformations.
                       // this should be dynamically generated from front depending on desired effects.
  canvas = null; // a ref to the associated canvas. likely mostly for debugging as needed.

  // (camera setup)
  projection = null; // projection transform matrix 
  model_view = null; // model_view transform matrix

  /**
   * ----------------------------------
   * constructor and inits
   * ----------------------------------
   */
  constructor(canvas) {
    if (canvas == null) { // CANNOT be null because need gl from it.
      throw new Error("ERROR: canvas passed to SceneGraph cannot be null!");
    } // end if

    // this.transform_dict = transform_dict;
    this.canvas = canvas;
    this.gl = this.canvas.getContext("webgl2");

    // init the graph.
    this.init();
  } // end constructor

  /**
   * initialize the projection and model view of this scene.
   */
  init() {
    // clear out gl 
    this.clear()

    // projection setup
    const fov = Math.PI / 4;
    const aspect = this.canvas.width / this.canvas.height
    const zNear = 0.1; 
    const zFar = 100;
    const orthoSize = 2.5;

    // perspective and orthographic projection
    const projPerspective = perspective(fov, aspect, zNear, zFar);

    const projOrtho = matMul(
      box2Cube(-orthoSize * aspect, orthoSize * aspect, -orthoSize, orthoSize, zNear, zFar),
      flipZ()
    );
    const projection = projPerspective;

    // init model-view matrix as identity matrix
    const model_view = mat4Identity();
    
    // the general projection/model_view matrices for the scene.
    this.projection = projection;
    this.model_view = model_view;
    } // end init

  /**
   * ----------------------------------
   * render
   * ----------------------------------
   */
  render(node_transforms) {
    // let's do some scene clearing work.
    this.clear();

    // simply: for each main object child, call their render function.
    this.objects.forEach((o) => {
      // console.log(`Rendering ${o.id} object...`);
      // TODO: can i just put camera views on the stack?
      if (o.id in node_transforms) {
        o.render(this.projection, this.model_view, node_transforms[o.id], []);
      }
      
    });
  } // end render

  /**
   * ----------------------------------
   * functions
   * ----------------------------------
   */

  /**
   * clear out gl, should be used on every render call.
   */
  clear() {
    // clear things.
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clearColor(0.2, 0.2, 0.2, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  } // end function

  /**
   * top level graph function to add a point light to the scene.
   * ensure all child objects are handed this point light.
   */
  add_point_light_global(position) {
    this.point_lights_global.push(position); // add to my list
    this.objects.forEach((o) => {
      o.add_point_light(position);
    });
  } // end function

  /**
   * remove a point light from this scene
   */
  remove_point_light_global(position) {
    let pos;
    for (let i = 0; i < this.point_lights_global.length; i++) {
      pos = this.point_lights_global[i];

      if (
        position[0] === pos[0] && 
        position[1] === pos[1] && 
        position[2] === pos[2] 
      ) {
        this.point_lights_global.splice(i, 1); // remove that guy in place
        break; // dont go any further
      } // end if
    } // end loop

    // remove for the objects
     this.objects.forEach((o) => {
        o.remove_point_light(position);
    });
    
  } // end function

  /**
   * method to update the lighting parameters of an object.
   */
  update_material_global(id, material_lighting) {
    this.objects.forEach((o) => {
      if (o.id == id) {
        o.update_material(material_lighting);
      } // end if
    });
  } // end function

  /**
   * add a top level object to the scene graph
   * TODO: add lights in scene automatically here?
   */
  add_object(object) {
    // TODO: assert same gl for both (same canvas!)
    if (object != null) {
      this.objects.push(object);
    } // end if

    // ensure that by default this object is aware of global lighting. 
    this.point_lights_global.forEach((pos) => {
      object.add_point_light(pos);
    })
  } // end function

  /**
   * remove a specific object from the scene.
   */
  remove_object(object) {
    if (object != null) {
      this.objects = this.objects.filter(o => o != object);
      console.log(`Removed ${object.id} from ${this.objects}.`);
    } // end if
  } // end function

  /**
   * remove all objects from the scene graph.
   */
  remove_all_objects() {
    console.log("Removing all scene objects from graph!");
    this.objects = []
  } // end function

  /**
   * return if an object is within the scene graph.
   */
  has_object(object) {
    return this.objects.includes(object);
  } // end function

} // end class


/**
 * ============================================================
 * SCENE OBJECT
 * 
 * essentially: a grouping of nodes, hierarchically pieced together.
 * all of these should have the same shaders/program.
 * ============================================================
 */
export class SceneObject {

  id = null; // object human-readable id; ie: "arm"

  roots = []; // list of root SceneObjectNodes that are structured as hierarchy.
              // these are the base nodes of a given hierarchy object.

  gl = null; // ref to this gl from the scene graph
  vert_shader_raw = null; // the raw json vert_shader
  vert_shader = null; // the vert shader as a dictionary used for this object program.
  frag_shader_raw = null; // the raw json frag_shader
  frag_shader = null; // the frag shader as a dictionary used for this object program.
  program = null; // the program to use for this object (and all nodes within).
  
  // (camera setup)
  model_view_loc = null; // location in vert shader for model_view transform
  projection_loc = null; // location in vert shader for projection transform
  // (light setup)
  point_lights = []; // point lights the object should be responding to.
  point_lights_loc = null;
  num_point_lights_loc = null;
  // (light param setup)
  material_params = null;
  material_params_loc = {};

  /**
   * ----------------------------------
   * constructor and inits
   * TODO: give option of adding shaders here.
   * ----------------------------------
   */
  constructor(id, gl, vert_shader=null, frag_shader=null) {
    this.id = id;
    this.gl = gl; 

    if (vert_shader == null) {
      console.warn("SceneObject created with null vert shader, be sure to init(...) later.");
    } // end if

    if (frag_shader == null) {
      console.warn("SceneObject created with null frag shader, be sure to init(...) later.");
    } // end if

    this.vert_shader_raw = vert_shader;
    this.frag_shader_raw = frag_shader;
    if (vert_shader != null && frag_shader != null) {
        this.init_shader_program(); // assume to init.
    } // end if
  } // end constructor

  /**
   * function to take in shaders and ready a program
   * that is used for all nodes within this SceneObject.
   */
  init(vert_shader, frag_shader) {
    if (vert_shader == null || frag_shader == null) {
      console.error("Cannot init(...) SceneObject with null shaders!");
    } // end if
    this.vert_shader_raw = vert_shader;
    this.frag_shader_raw = frag_shader;
    this.init_shader_program(); // go on with init, let crash
  } // end function

  /**
   * top level call function to (1) create the program 
   * and (2) switch over to using this program to render
   * this object tree.
   */
  init_shader_program() {
    try {
      // create the program for this object and children
      this.create_program();

      // grab these locations
      this.model_view_loc = this.gl.getUniformLocation(this.program, "uModelViewMatrix"); 
      this.projection_loc = this.gl.getUniformLocation(this.program, "uProjectionMatrix"); 
      this.point_lights_loc = this.gl.getUniformLocation(this.program, "uPointLights");
      this.num_point_lights_loc =  this.gl.getUniformLocation(this.program, "uNumPointLights"); 
      this.material_params_loc["ka"] = this.gl.getUniformLocation(this.program, 'uLightParams.ka');
      this.material_params_loc["kd"] = this.gl.getUniformLocation(this.program, 'uLightParams.kd');
      this.material_params_loc["ks"] = this.gl.getUniformLocation(this.program, 'uLightParams.ks');
      this.material_params_loc["alpha"] = this.gl.getUniformLocation(this.program, 'uLightParams.alpha');
      this.material_params_loc["transparency"] = this.gl.getUniformLocation(this.program, 'uLightParams.transparency');
    } catch (e) { 
      console.error(e); 
    } // end try catch
  } // end function

  /**
   * create a gl program with attached shaders.
   */
  create_program() {
    // create the shaders
    this.vert_shader = this.create_shader(this.gl.VERTEX_SHADER, this.vert_shader_raw);
    this.frag_shader = this.create_shader(this.gl.FRAGMENT_SHADER, this.frag_shader_raw);
    // create the program for this object and children
    this.program = this.gl.createProgram();
    // attach shaders
    this.gl.attachShader(this.program, this.vert_shader);
    this.gl.attachShader(this.program, this.frag_shader);
    // link the program
    this.gl.linkProgram(this.program);
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this.program));
    }
  } // end function

  /**
   * function to generate a shader for this object and its (optional) children.
   */
  create_shader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(this.gl.getShaderInfoLog(shader));
    } // end if
    return shader;
  } // end function

  /**
   * ----------------------------------
   * render
   * ----------------------------------
   */
  render(projection, model_view, node_transforms, stack) {
    // use this program
    this.gl.useProgram(this.program);

    // set gl attributes for the camera_matrices
    this.gl.uniformMatrix4fv(this.projection_loc, false, projection);
    this.gl.uniformMatrix4fv(this.model_view_loc, false, model_view);
    // TODO: not new on every render call.
    this.gl.uniform3fv(this.point_lights_loc, new Float32Array(this.point_lights));
    this.gl.uniform1i(this.num_point_lights_loc, this.point_lights.length / 3);
    this.gl.uniform3fv(this.material_params_loc["ka"], new Float32Array(this.material_params["ka"]));
    this.gl.uniform3fv(this.material_params_loc["kd"], new Float32Array(this.material_params["kd"]));
    this.gl.uniform3fv(this.material_params_loc["ks"], new Float32Array(this.material_params["ks"]));
    this.gl.uniform1f(this.material_params_loc["alpha"], this.material_params["alpha"]);
    this.gl.uniform1f(this.material_params_loc["transparency"], this.material_params["transparency"]);

    this.roots.forEach((r) => {
      // console.log(`Rendering ${r.id} root node...`);
      // TODO: can i just put camera views on the stack?
      // stack is empty for now here.
      r.render(node_transforms[r.id], stack);
    });
  } // end render

  /**
   * ----------------------------------
   * functions
   * ----------------------------------
   */

  /**
   * add this point light to my list.
   */
  add_point_light(position) {
    this.point_lights.push(...position);
  } // end function

  /**
   * remove a point light from this scene
   */
  remove_point_light(position) {
    let pos_x, pos_y, pos_z;
    for (let i = 0; i < this.point_lights.length; i += 3) {
      pos_x = this.point_lights[i];
      pos_y = this.point_lights[i + 1];
      pos_z = this.point_lights[i + 2];
      if (
        position[0] === pos_x && 
        position[1] === pos_y && 
        position[2] === pos_z 
      ) {
        this.point_lights.splice(i, 3); // remove that guy in place
        break; // dont go any further
      } // end if
    } // end loop
  } // end func

  /**
   * need to update the lighting constants for my shader.
   */
  update_material(material_lighting) {
    this.material_params = material_lighting;
  } // end function

  /**
   * add a root node to the object
   */
  add_root(node) {
    this.roots.push(node); // push as a root node
  } // end function

} // end class


/**
 * ============================================================
 * SCENE NODE
 * 
 * generalized: a node to wrap in a scene object.
 * this could be an shape (cube, sphere, etc...) 
 * but is the ultimate node of the object tree. 
 * the object level is where you set the vertex/frag shaders and prog.
 * this is simply for holding points, colors, etc, and 
 * setting the final transformation in the vert shader for the
 * hierarchy.
 * ============================================================
 */
export class SceneObjectNode {

  gl = null; // ref to gl for buffer generation
  program = null; // program in use for this node (set by the above Object)
  
  children = []; // children nodes of this node to prop transforms to.
  
  vertices = null; // actual raw vertices of the node
  indices = null; // the indices of the above vertices to join up the triangles 
  norms = null;
  colors = null; // the colors for each vertex
  static_transforms = null; // the PART transforms of this object -- static positioning
                            // relative to the parent.
  // general buffers for gl for this node.
  pos_buff = null;
  norm_buff = null;
  indices_buff = null;
  color_buff = null;

  // these need to be set from getLocation in gl and at minimum should be in shader.
  pos_loc = null; // gl location for placing vertex
  norm_loc = null; // gl location for placing norms
  color_loc = null; // gl location for placing color
  node_transforms_loc = null; // gl location for the transformation matrix
  num_my_transforms_loc = null; // gl location to specify how many transforms i have.

  /**
   * ----------------------------------
   * constructor and inits
   * ----------------------------------
   */
  constructor(id, verts_and_indices, colors, static_transforms, gl, program) {
    this.id = id;
    this.vertices = verts_and_indices.vertices;
    this.indices = verts_and_indices.indices;
    this.norms = verts_and_indices.norms;
    this.colors = colors;
    this.static_transforms = static_transforms;
    this.gl = gl; 
    this.program = program;

    // grab these here for now.
    this.pos_loc = this.gl.getAttribLocation(this.program, "aPosition");
    this.norm_loc = this.gl.getAttribLocation(this.program, "aNormal");
    this.color_loc = this.gl.getAttribLocation(this.program, "aColor");
    this.node_transforms_loc = this.gl.getUniformLocation(this.program, "uModelTransformationMatrix"); 
    this.num_my_transforms_loc = this.gl.getUniformLocation(this.program, "transforms_up_to");

    // initialize the buffers from the given params.
    this.init_buffers();
  } // end constructor

  /**
   * initialize the buffers for 
   * 1. positions/vertices
   * 2. indices
   * 3. colors
   * used for drawing this node.
   */
  init_buffers() {
      this.pos_buff = this.init_buffer(this.vertices);
      this.norm_buff = this.init_buffer(this.norms);
      this.indices_buff = this.init_buffer(this.indices, this.gl.ELEMENT_ARRAY_BUFFER);
      this.color_buff = this.init_buffer(this.colors)
  } // end function

  /**
   * wrapper around the creation and binding of a buffer so no steps missed!
   */
  init_buffer(data, type=this.gl.ARRAY_BUFFER, gl_hint=this.gl.STATIC_DRAW) {
      const buff = this.gl.createBuffer();
      this.gl.bindBuffer(type, buff);
      this.gl.bufferData(type, data, gl_hint);
      return buff
  } // end function

  /**
   * ----------------------------------
   * render
   * ----------------------------------
   */
  render(node_transforms, stack) {
    // vertex/positions buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pos_buff);
    this.gl.enableVertexAttribArray(this.pos_loc);
    this.gl.vertexAttribPointer(this.pos_loc, 3, this.gl.FLOAT, false, 0, 0);

    // norm buffer setup
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.norm_buff);
    this.gl.enableVertexAttribArray(this.norm_loc);
    this.gl.vertexAttribPointer(this.norm_loc, 3, this.gl.FLOAT, false, 0, 0);

    // index buffer for drawing as triangles
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indices_buff);

    // color buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.color_buff);
    this.gl.enableVertexAttribArray(this.color_loc);
    this.gl.vertexAttribPointer(this.color_loc, 3, this.gl.FLOAT, false, 0, 0);

    // flatten the dynamic transforms.
    const dynamic_flattened = this.flatten_matrices(node_transforms.dynamic_transforms);
    // also flatten the static transformations.
    const static_flattened = this.flatten_matrices(this.static_transforms);

    // we are going to add the transforms to the stack. 
    // BUT, we need to remember that they are carried out from FRONT -> BACK
    // we then need to add to the stack in the CORRECT ORDER!
    stack = [...static_flattened, ...stack]; // add static so these are done second
    stack = [...dynamic_flattened, ...stack]; // add dynamic so these are done FIRST.

    // stack for this node is given with its unique "joint" transforms, but they are not
    // saved to the stack passed forward (in effect: popped off).
    // the joint transforms are for moving the object to a specific point
    // in order to affect its dynamic origin. this isn't perfect, but a start to the idea.
    // TODO: potentially a "reverse" transform to undo this joint_transform after the dynamic is complete.
    //       ie: joint_transform -> rotate -> undo_joint_transform -> carry on with hierarchy.
    //       but for now: just be aware of this in the static transforms set past this.
    const stack_float32 = new Float32Array([...this.flatten_matrices(node_transforms.joint_transforms), ...stack]);

    // debugging
    // console.log(
    //     `HOW MANY TRANSFORMS on ${this.id}:`,
    //     stack_float32.length / 16, // 4x4 matrices
    //     "matrices,",
    //     stack_float32.length, // how many vals
    //     "floats"
    // );

    // set this nodes transformation matrix
    this.gl.uniformMatrix4fv(this.node_transforms_loc, false, stack_float32);
    // set how many matrices
    this.gl.uniform1i(this.num_my_transforms_loc, stack_float32.length / 16);
    // draw the node.
    this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);

    // move on to next children
    this.children.forEach((c) => {
        // console.log(`Rendering ${c.id} node...`);
        c.render(
            node_transforms[c.id],
            stack
        );
    });
  } // end render

  /**
   * ----------------------------------
   * functions
   * ----------------------------------
   */

  /**
   * add a child of this node to flesh out the hierarchy tree.
   */
  add_child(node) {
    if (node != null) {
      this.children.push(node);
    } // end if
  } // end function

  /**
   * utility function to flatten out a set of 
   * matrices given into a single array.
   * this must be done before handing off to gl shader!
   */
  flatten_matrices(matrices) {
    let result = []

    matrices.forEach((matrix, i) => {
        result = [...matrix, ...result]
    });

    return result;
  } // end function

} // end class