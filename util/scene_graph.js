import { perspective, mat4Identity, ortho, matMul, translate, rotate, scale, mat4FromRows } from './transitions.js';
import { phong_frag_shader } from './frag_shaders.js';
import { phong_vert_shader } from './vert_shaders.js';

/**
 * ==============================================
 * SCENE SETUP
 * ==============================================
 */

/**
 * complete rework of api given the additions of 
 * materials, lighting, etc. 
 */

export class Scene {

  /**
   * --------------------------------------
   * constructor
   * --------------------------------------
   */
  constructor() {
    this.roots = []; // root objects in the scene.
    this.lights = []; // generally: lights in the scene. can be any kind of light.
    this.camera = null; // camera, meaning more specifically the perspective used.
  }

  /**
   * --------------------------------------
   * functions
   * --------------------------------------
   */

  /**
   * add an object to the scene.
   */
  add_node(node) {
    if (!node) return;

    node.parent = null; // ensure a null parent

    this.roots.push(node); // poosh to the roots
    return node; // return ref if needed.
  } // end function

  /**
   * remove an object from the scene.
   */
  remove_node(node) {
    this.roots = this.roots.filter(n => n !== node);
  } // end function

  /**
   * add a light to the scene that will 
   * affect all objects in the scene.
   */
  add_light(light) {
    this.lights.push(light);
    return light;
  } // end function

  /**
   * remove the light from the scene.
   */
  remove_light(light) {
    this.lights = this.lights.filter(l => l !== light);
  } // end function

  /**
   * set a specific camera to the scene.
   * this is meaning PERSPECTIVE.
   */
  set_camera(camera) {
    this.camera = camera;
  } // end function

} // end class

/**
 * a node on the scene. this 
 */
export class SceneNode {

  /**
   * --------------------------------------
   * constructor
   * --------------------------------------
   */
  constructor(id=null, shader_id="phong_V1") {
    this.id = id; // specifying id

    this.parent = null; // parent of this node, null to start
    this.children = []; // all children of this node

    this.mesh = null; // mesh of the node, encompassing vertices, index mapping, norms, etc...
    this.material = null; // material of this node (ka, kd, ...)

    this.shader_id = shader_id; // id corresponding to the shader i want to use for this node.

    // pretty much everything can be described as a translation (position)
    // rotation, and scale. may include reflect/skew later. (TODO)
    this.position = [0, 0, 0];
    this.rotation = [0, 0, 0];
    this.scale = [1, 1, 1];
    // the final transformation matrix (single matrix) to return.
    // it's more calculation on the cpu, but easier to manage.
    // @Theo may be a place for C if things are chuggy.
    this.transformation_matrix = mat4Identity();

  } // end constructor

  /**
   * --------------------------------------
   * functions
   * --------------------------------------
   */

  /**
   * update my transformation dumbly, simply calculate:
   * M_world_child = M_world_parent * M_local_child
   */
  update_transformation_matrix(M_parent) {
    // TODO: NEEDS TESTING!! there could be problems with column vects.
    const translation = translate(this.position);
    const rotation = rotate(this.rotation);
    const scale_mtx = scale(this.scale);

    // my local transformations
    const M_local = matMul(translation, rotation, scale_mtx);

    // add my transformations to the world's
    this.transformation_matrix = matMul(M_parent, M_local);
  } // end function

  /**
   * add a child to this node, creating a hierarchical relationship
   */
  add_child(child) {
    if (!child || child === this) {
      throw new Error("Invalid child node");
    } // end if

    child.parent = this; // set this node to the child's parent
    this.children.push(child); // track this child

    return child;
  } // end function

  /**
   * remove a specific child as a part of this hierarchy
   */
  remove_child(child) {
    this.children = this.children.filter(c => c !== child); // remove from my list

    if (child.parent === this) {
      child.parent = null; // null out the parent
    } // end if
  } // end function

  /**
   * set the mesh of this node
   */
  set_mesh(mesh) {
    this.mesh = mesh;
    return this;
  } // end function

  /**
   * set the mesh of this node
   */
  set_material(material) {
    this.material = material;
    return this;
  } // end function

} // end class

/**
 * ==============================================
 * MESH
 * 
 * how to draw the object
 * ==============================================
 */

/**
 * build a basic mesh, wrapping the bad dict roxanne
 * used before.
 */
export class Mesh {
  constructor(gl, {
    vertices,
    indices,
    colors=null,
    normals=null,
    tangents=null,
    texels=null,
  }) {
    this.vertices = vertices;
    this.indices = indices;
    this.colors = colors;
    this.normals = normals;
    this.tangents = tangents;
    this.texels = texels;

    // initialize whatever we have into a grabable buffer
    if (vertices) this.vert_buff = this.init_buffer(vertices, gl);
    if (indices) this.ind_buff = this.init_buffer(indices, gl, gl.ELEMENT_ARRAY_BUFFER);
    if (normals) this.norm_buff = this.init_buffer(normals, gl);
    if (colors) this.color_buff = this.init_buffer(colors, gl);
    if (tangents) this.tangent_buff = this.init_buffer(tangents, gl);
    if (texels) this.tex_buff = this.init_buffer(texels, gl);
  }

  /**
   * wrapper around the creation and binding of a buffer so no steps missed!
   */
  init_buffer(data, gl, type=gl.ARRAY_BUFFER, gl_hint=gl.STATIC_DRAW) {
      const buff = gl.createBuffer();
      gl.bindBuffer(type, buff);
      gl.bufferData(type, data, gl_hint);
      return buff
  } // end function

} // end class

/**
 * ==============================================
 * MATERIAL
 * 
 * what material a node should look like.
 * ==============================================
 */

/**
 * wrap up a specific material in the most
 * general way possible.
 */
export class Material {
  constructor({
    color=[1, 1, 1],
    ka=[0.2, 0.2, 0.2],
    kd=[0.8, 0.8, 0.8],
    ks=[0.5, 0.5, 0.5],
    shininess=32,
    transparency=1
  }={}) {
    this.color = new Float32Array(color);
    this.ka = new Float32Array(ka);
    this.kd = new Float32Array(kd);
    this.ks = new Float32Array(ks);
    this.shininess = shininess;
    this.transparency = transparency;
  } 
} // end class

/**
 * ==============================================
 * LIGHT
 * ==============================================
 */

/**
 * a general light that can be extended out to other 
 * kinds.
 */
export class Light {
  constructor ({
    position=[3, 4, 5],
    color=[1, 1, 1]
  }={}) {
    this.position = position;
    this.color = color;
  }
} // end class

/**
 * a point light
 * TODO: anything to add beyond parent class above?
 */
export class PointLight extends Light { }


/**
 * ==============================================
 * CAMERA
 * ==============================================
 */

export class Camera {
  constructor({
    fov=Math.PI / 4,
    near=0.1,
    far=100,
    aspect=1,
    ortho_size=2.5
  } = {}) {
    this.fov = fov;
    this.near = near;
    this.far = far;
    this.aspect = aspect;
    this.ortho_size = ortho_size
  }

  /**
   * TODO: placeholder!
   */
  get_view_matrix() {
    return mat4Identity();
  }
} // end class

/**
 * split up the cameras this way. perspective camera.
 */
export class PerspectiveCamera extends Camera {
  get_projection_matrix() {
      return perspective(
        this.fov,
        this.aspect,
        this.near,
        this.far
      );
  }
} // end class


/**
 * split up the cameras this way. perspective camera.
 */
export class OrthographicCamera extends Camera {
  get_projection_matrix() {
    return ortho(this.ortho_size, this.aspect, this.near, this.far);
  }
} // end class


/**
 * ==============================================
 * SHADERS
 * ==============================================
 */

/**
 * generally, take two shaders and turn into a program.
 */
export class Shader {
  constructor(vert_shader, frag_shader, gl) {
    // create the shaders
    this.vert_shader = this.create_shader(gl.VERTEX_SHADER, vert_shader, gl);
    this.frag_shader = this.create_shader(gl.FRAGMENT_SHADER, frag_shader, gl);
    // create the program for this object and children
    this.program = gl.createProgram();
    // attach shaders
    gl.attachShader(this.program, this.vert_shader);
    gl.attachShader(this.program, this.frag_shader);
    // link the program
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this.program));
    } // end if
  }

  /**
   * function to generate a shader for this object and its (optional) children.
   */
  create_shader(type, source, gl) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    } // end if
    return shader;
  } // end function
  
} // end class

/**
 * just call with a basic phong shader
 */
export class PhongShader extends Shader {
  constructor(gl) {
    super(phong_vert_shader, phong_frag_shader, gl);
    // camera and light items (may be able to pull out into the renderer if consistent.)
    this.model_view_loc = gl.getUniformLocation(this.program, "uModelViewMatrix"); 
    this.projection_loc = gl.getUniformLocation(this.program, "uProjectionMatrix"); 
    this.lights_loc = gl.getUniformLocation(this.program, "uPointLights");
    this.num_lights_loc =  gl.getUniformLocation(this.program, "uNumPointLights"); 

    // some lighting specific locations
    this.material_params_loc = {};
    this.material_params_loc["ka"] = gl.getUniformLocation(this.program, 'uLightParams.ka');
    this.material_params_loc["kd"] = gl.getUniformLocation(this.program, 'uLightParams.kd');
    this.material_params_loc["ks"] = gl.getUniformLocation(this.program, 'uLightParams.ks');
    this.material_params_loc["shininess"] = gl.getUniformLocation(this.program, 'uLightParams.shininess');
    this.material_params_loc["transparency"] = gl.getUniformLocation(this.program, 'uLightParams.transparency');

    // more meshy information here.
    this.pos_loc = gl.getAttribLocation(this.program, "aPosition");
    this.norm_loc = gl.getAttribLocation(this.program, "aNormal");
    this.color_loc = gl.getAttribLocation(this.program, "aColor");
    this.node_transforms_loc = gl.getUniformLocation(this.program, "uModelTransformationMatrix"); 
  }

  /**
   * shader is here to (1) hold the compiled shader program.
   * and (2) bind and load up the buffers that it is aware of.
   * this is intended highly customizable to whatever shader you want to build.
   * just implement a new shader with load() and draw() and set the id in the node.
   */
  load(node, camera, lights, gl) {
    // from object
    gl.useProgram(this.program);

    // TODO: pull this out if its general enough to the renderer so don't have to keep setting on load
    // set gl attributes for the camera_matrices
    gl.uniformMatrix4fv(this.projection_loc, false, camera.get_projection_matrix());
    gl.uniformMatrix4fv(this.model_view_loc, false, camera.get_view_matrix());
    // set gl for the global lights of the scene
    gl.uniform3fv(this.lights_loc, this.process_lights(lights)); // TODO
    gl.uniform1i(this.num_lights_loc, lights.length);

    // set this nodes transformation matrix
    gl.uniformMatrix4fv(this.node_transforms_loc, false, node.transformation_matrix); // TODO

    // set up material information for the phong shader
    gl.uniform3fv(this.material_params_loc["ka"], node.material.ka);
    gl.uniform3fv(this.material_params_loc["kd"], node.material.kd);
    gl.uniform3fv(this.material_params_loc["ks"], node.material.ks);
    gl.uniform1f(this.material_params_loc["shininess"], node.material.shininess);
    gl.uniform1f(this.material_params_loc["transparency"], node.material.transparency);

    // vertex/positions buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, node.mesh.vert_buff);
    gl.enableVertexAttribArray(this.pos_loc);
    gl.vertexAttribPointer(this.pos_loc, 3, gl.FLOAT, false, 0, 0);

    // norm buffer setup
    gl.bindBuffer(gl.ARRAY_BUFFER, node.mesh.norm_buff);
    gl.enableVertexAttribArray(this.norm_loc);
    gl.vertexAttribPointer(this.norm_loc, 3, gl.FLOAT, false, 0, 0);

    // color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, node.mesh.color_buff);
    gl.enableVertexAttribArray(this.color_loc);
    gl.vertexAttribPointer(this.color_loc, 3, gl.FLOAT, false, 0, 0);

    // index buffer for drawing as triangles
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, node.mesh.ind_buff);
    
  } // end function

  /**
   * define how to draw with this shader.
   */
  draw(node, gl) {
    // draw the node.
    gl.drawElements(gl.TRIANGLES, node.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
  } // end function

  /**
   * not sure this will stay this way, but for now, 
   * process the light objects -> a flat float32array
   */
  process_lights(lights) {
    const all_positions = [];
    lights.forEach((l) => {
      all_positions.push(...l.position);
    });
    console.log(all_positions.length)
    return new Float32Array(all_positions);
  } // end function

} // end class

/**
 * ==============================================
 * RENDERING WORKHORSE
 * ==============================================
 */

export class Renderer {
  constructor(gl) {
    this.gl = gl;
    this.clear(); // first thing, clear

    // want to cache all possible shaders for use 
    // potential optimaization: group draw calls by shader so
    // switching betweeen programs is not so whiplashy.
    // TODO: this could come from a file that's easy to edit for all without
    // destroying everything hehe
    this.shader_map = {
      "phong_V1": new PhongShader(gl) // right now just one to test with 
    }
  }

  /**
   * main draw function
   */
  draw(scene) {
    this.clear(); // clear out (?)

    scene.roots.forEach((r) => {
      // setup any new transformation matrices first in the hierarchy
      // TODO: dirty bit optimization to avoid needless calculation (thanks for that idea gemini)
      this.update_transformations(r, mat4Identity());

      // for each node in hierarchy tree (maybe combine with prior step to 
      // optimize this a bit, but for clarity, this is two separate steps)
      // grab their shader, load the shader, and draw with shader.
      this.draw_nodes(r, scene.camera, scene.lights);
    });

  } // end function

  /**
   * update all transformations in the tree, working your way down.
   */
  update_transformations(parent, M_parent) {
    parent.update_transformation_matrix(M_parent);

    if (parent.children) {
      parent.children.forEach((c) => { // drill down the tree
        this.update_transformations(c, parent.transformation_matrix);
      });
    } // end if
  } // end function

  /**
   * traverse all nodes a tree and draw them with their shader
   */
  draw_nodes(node, camera, lights) {
    const shader = this.shader_map[node.shader_id]; // grab this nodes shader
    console.log(shader); // testing
    shader.load(node, camera, lights, this.gl); // load up the buffer locations
    shader.draw(node, this.gl); // draw this node
    if (node.children) {
      node.children.forEach((c) => { // drill down the tree
        this.draw_nodes(c, camera);
      });
    } // end if
    
  } // end function

  /**
   * clear out gl, should be used on every render call.
   */
  clear() {
    // clear things.
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clearColor(0.5, 0.5, 0.5, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  } // end function

} // end class

