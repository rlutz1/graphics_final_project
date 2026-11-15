import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";
import { mat4Identity, matMul, translate, rotate, scale, mat4FromRows, deg_to_rad } from '../util/transitions.js';

export class BumpyLandSceneNode extends SceneBuilder.SceneNode {
  
  constructor(id="bumpyland", shader="bumpyland_basic") {
    super(id, shader);

    this.position = [0, -10, 0]; // want it down a bit so surface is in middle of screen (may need to adjust)
    this.rotation = [0, 0, 0]; // leave as nothing for now
    this.scale = [1, 1, 1];
    this.center = [...this.position, 1]; // leave center as static 
    this.velocity = [0, 0, 0]; 
    this.rotation_speed = 0.0; 
  }

  /**
   * initialize the land mesh, material, textures, anything else
   */
  init(gl) {
    const pointer = new SceneBuilder.SceneNode(this.id, this.shader_id); // pointer with the same shader and id for now
    pointer.position = [0, 10, 0]; // push up from the sphere

    const base_mesh = new SceneBuilder.Mesh(gl, MeshBuilder.gen_sphere_mesh(10, 0.1, 0.1, [0.7, 0.2, 0.2])); // generate a basic base sphere
    const pointer_mesh = new SceneBuilder.Mesh(gl, MeshBuilder.gen_cone_mesh(0.5, 0.1, 0.1, [0.7, 0.7, 0.2]));

    // super basic material for now
    const material = new SceneBuilder.Material({ 
      "ka": [0.7, 0.5, 0.5], 
      "kd": [0.6, 0.5, 0.5],
      "ks": [0.8, 0.8, 0.8], 
      "shininess": 30, 
      "transparency": 1
    });

    this.set_mesh(base_mesh).set_material(material); 
    pointer.set_mesh(pointer_mesh).set_material(material);
    
    this.add_child(pointer);
  } // end function

} // end class