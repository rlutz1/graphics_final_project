import { perspective, mat4Identity, ortho, matMul, translate, rotate, scale, mat4FromRows } from './transitions.js';
import { SHADER_MAP } from './shaders.js';

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
  constructor(id=null, shader_id="phong_basic") {
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
   * M_world_child = M_world_parent * M_local_child.
   * if want to change, extend the SceneNode and override, but you MUST
   * set the transformation_matrix, otherwise nothing will happen/
   * incorrect renderiing.
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
 * 
 * feel free to extend/override, but be sure to set
 * up the buffers here! that way this only happens once and
 * can be reused by many nodes if needed.
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
 * kinds. here is where you could extend and add things
 * like light attenuation, etc...
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
 * RENDERING WORKHORSE
 * ==============================================
 */

export class Renderer {
  constructor(gl) {
    this.gl = gl;
    this.clear(); // first thing, clear
    this.init_shader_map(); // initialize our shader map only once.
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
    shader.load(node, camera, lights, this.gl); // load up the buffer locations
    shader.draw(node, this.gl); // draw this node
    if (node.children) {
      node.children.forEach((c) => { // drill down the tree
        this.draw_nodes(c, camera, lights);
      });
    } // end if
    
  } // end function

  /**
   * go through all shader keys in the shader map and
   * initialize the shaders.
   */
  init_shader_map() {
    this.shader_map = {};
    for (const [shader_id, ShaderClass] of Object.entries(SHADER_MAP)) {
      this.shader_map[shader_id] = new ShaderClass(this.gl);
    } // end loop
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

