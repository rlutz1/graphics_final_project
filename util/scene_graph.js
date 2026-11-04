import { perspective, mat4Identity, ortho } from './transitions.js';
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
  constructor(id = null) {
    this.id = id; // specifying id

    this.parent = null; // parent of this node, null to start
    this.children = []; // all children of this node

    this.mesh = null; // mesh of the node, encompassing vertices, index mapping, norms, etc...
    this.material = null; // material of this node (ka, kd, ...)
  } // end constructor

  /**
   * --------------------------------------
   * functions
   * --------------------------------------
   */

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
  constructor({
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
  }
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
    this.position = new Float32Array(position);
    this.color = new Float32Array(color);
  }
} // end class

/**
 * a point light
 * TODO: anything to add beyond parent class above?
 */
export class PointLight { }


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
    this.vert_shader = this.create_shader(gl.VERTEX_SHADER, gl.createShader(vert_shader));
    this.frag_shader = this.create_shader(gl.FRAGMENT_SHADER, gl.createShader(frag_shader));
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
  create_shader(type, shader) {
    this.gl.shaderSource(type, shader);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(this.gl.getShaderInfoLog(shader));
    } // end if
    return shader;
  } // end function

} // end class

/**
 * just call with a basic phong shader
 */
export class PhongShader {
  constructor() {
    super(phong_vert_shader, phong_frag_shader);
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

    // (1) at the top scene level, these are the uniform fields in all general shaders.
    //      + projection and model view matrices
    //      + lights (positions and light-specific metadata)
    model_view_loc = null; // location in vert shader for model_view transform
    projection_loc = null; // location in vert shader for projection transform
    lights_loc = null; // location for the lights to render on scene
    num_lights_loc = null; // location for the number of lights on scene

    // (2) at the node(s) level, these are the more specific material and mesh information
    // this needs to be somewhat tailored per node render, but can be optimized here.
  }

  /**
   * main draw function
   */
  draw(scene) {
    this.clear(); // clear out (?)

    const basic_shader = new PhongShader();

    // gather a bunch of locations
    this.model_view_loc = this.gl.getUniformLocation(basic_shader.program, "uModelViewMatrix"); 
    this.projection_loc = this.gl.getUniformLocation(basic_shader.program, "uProjectionMatrix"); 
    this.lights_loc = this.gl.getUniformLocation(basic_shader.program, "uPointLights");
    this.num_lights_loc =  this.gl.getUniformLocation(basic_shader.program, "uNumPointLights"); 

    // set gl attributes for the camera_matrices
    this.gl.uniformMatrix4fv(this.projection_loc, false, scene.camera.get_projection_matrix());
    this.gl.uniformMatrix4fv(this.model_view_loc, false, scene.camera.get_view_matrix());
    // set gl for the global lights of the scene
    this.gl.uniform3fv(this.point_lights_loc, scene.get_lights());
    this.gl.uniform1i(this.lights_loc, this.point_lights.length / 3);


    this.material_params_loc["ka"] = this.gl.getUniformLocation(basic_shader.program, 'uLightParams.ka');
    this.material_params_loc["kd"] = this.gl.getUniformLocation(basic_shader.program, 'uLightParams.kd');
    this.material_params_loc["ks"] = this.gl.getUniformLocation(basic_shader.program, 'uLightParams.ks');
    this.material_params_loc["alpha"] = this.gl.getUniformLocation(basic_shader.program, 'uLightParams.alpha');
    this.material_params_loc["transparency"] = this.gl.getUniformLocation(basic_shader.program, 'uLightParams.transparency');

    // FOR TESTING

    scene.roots.forEach((r) => {
      // from object
      this.gl.useProgram(basic_shader.program);

      
      this.gl.uniform3fv(this.material_params_loc["ka"], new Float32Array(this.material_params["ka"]));
      this.gl.uniform3fv(this.material_params_loc["kd"], new Float32Array(this.material_params["kd"]));
      this.gl.uniform3fv(this.material_params_loc["ks"], new Float32Array(this.material_params["ks"]));
      this.gl.uniform1f(this.material_params_loc["alpha"], this.material_params["alpha"]);
      this.gl.uniform1f(this.material_params_loc["transparency"], this.material_params["transparency"]);


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


      // from node
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

    });

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

