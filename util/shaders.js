import * as SourceDicts from './shader_sources.js';

/**
 * this file is to contain a mapping of id -> shader (BOTTOM OF FILE). 
 *  + note: has to be at the bottom to accomplish dynamic class
 *    creation, otherwise JS throws a fit :)
 * as long as the mesh of a node contains all the necessary information
 * for this shader to function (all in's, uniforms, vertices, etc),
 * any node should be able to use it by specififying node.shader_id = "this_shader".
 * 
 * all implemented child shaders should have the constructor signature:
 * constructor(gl)
 * (if for some reason you need something else, there could likely be a special
 * case created in the Renderer.init_shader_map(), but try to avoid this for simplicity.)
 * 
 * process: 
 * + have a vertex_shader and fragment_shader string defined in shader_sources.js
 * + implement an extending shader.
 * + add shader class name to the shader map at the bottom
 * + if want to use in node: node.shader_id = the id in shader map.
 */

/**
 * ==============================================
 * SHADER SKELETON
 * ==============================================
 */

/**
 * shader is here to (1) hold the compiled shader program.
 * and (2) bind and load up the buffers that it is aware of.
 * this is intended highly customizable to whatever shader you want to build.
 * just implement a new shader with load() and draw() and set the id in the node.
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
   * to be implemented by child shader.
   * load should specify how to load all buffers and uniforms
   * with data in the shader. buffers are kept in the node mesh 
   * (node.mesh).
   */
  load(node, camera, lights, gl) {
    throw new Error("Load function not implemented in inheriting shader!");
  } // end function

  /**
   * define how to draw with this shader.
   * this is just to provide flexibility on the gl.draw call
   * in case you want to do something more specific and weird there.
   */
  draw(node, gl) {
    throw new Error("Draw function not implemented in inheriting shader!");
  } // end function

  /**
   * function to generate a shader for this object.
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

  /**
   * utility function to flatten a 2d array
   * to a 1d. if this is helpful outside of this,
   * we can move this to a more util exported function.
   * important for webgl to flatten.
   */
  flatten(to_flatten) {
    const flat = [];
    to_flatten.forEach((i) => {
      flat.push(...i);
    });
    return new Float32Array(flat);
  } // end function

  /**
   * right now, just a simple light position extraction.
   * not beautiful, but it works.
   */
  flatten_lights(lights) {
    const lights_flat = [];
    lights.forEach((l) => {
      lights_flat.push(...l.position);
    });
    return new Float32Array(lights_flat);
  } // end function
  
} // end class

/**
 * ==============================================
 * SHADERS
 * ==============================================
 */

/**
 * just call with a basic phong shader.
 * an example of how to implement a custom shader.
 */
export class PhongShader extends Shader {
  constructor(gl) {
    super(SourceDicts.phong_basic.vertex_shader, SourceDicts.phong_basic.fragment_shader, gl);
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
    gl.uniform3fv(this.lights_loc, this.flatten_lights(lights)); 
    gl.uniform1i(this.num_lights_loc, lights.length);

    // set this nodes transformation matrix
    gl.uniformMatrix4fv(this.node_transforms_loc, false, node.transformation_matrix);

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

} // end class

// ==============================================
// SHADER MAP
//
// the Renderer looks to this to pluck out a shader
// for a node on render.
// if want to add a custom Shader, simply specify
// an id->Shader mapping and it should *just work*.
// please choose a unique id.
// ==============================================

export const SHADER_MAP = {
  "phong_basic": PhongShader
} // end shader map