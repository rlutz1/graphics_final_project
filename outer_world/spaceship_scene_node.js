import * as SceneBuilder from "../util/scene_graph.js";
import * as MeshBuilder from "../util/mesh_generators.js";
import { mat4Identity, matMul, translate, rotate, scale, mat4FromRows, deg_to_rad } from '../util/transitions.js';

export class SpaceshipSceneNode extends SceneBuilder.SceneNode {
  
  constructor(id="spaceship", shader="spaceship_basic") {
    super(id, shader);

    this.position = [0, 0, -5]; // shove it back a little
    this.rotation = [-deg_to_rad(20), 0, 0]; // rotate to face front
    this.scale = [0.5, 0.5, 0.5];
    this.center = [...this.position, 1]; // this will ALWAYS be static on scene!
    this.velocity = [0.1, 0.1, 0.1]; // velocity in each direction (can tweak of course :) )
    this.rotation_speed = 0.03; // controls the rotation speed left/right 
  }

  /**
   * initialize the spaceship mesh, material, textures, anything else
   * needed at a node level. can change this with better things available :D
   * keeping this init here instead of in the scene because it will likely get more
   * complex and don't want to clutter the scene.
   * 
   * NOTE: please set the id's of any child nodes to this.id for now. it has to do with some 
   * center updates in the update_transformations on the scene end! if you need to 
   * set it to something else, just check in before please :)
   */
  init(gl) {
    const pointer = new SceneBuilder.SceneNode(this.id, this.shader_id); // pointer with the same shader and id for now
    pointer.position = [0, 0.7, 0]; // push up from the sphere. will be a cone, base of cone is at origin

    const base_mesh = new SceneBuilder.Mesh(gl, MeshBuilder.gen_sphere_mesh(1, 0.1, 0.1, [0.7, 0.2, 0.2])); // generate a basic base sphere
    const pointer_mesh = new SceneBuilder.Mesh(gl, MeshBuilder.gen_cone_mesh(0.5, 0.1, 0.1, [0.7, 0.7, 0.2]));

    // super basic material for now
    const material = new SceneBuilder.Material({ 
      "ka": [0.7, 0.5, 0.5], 
      "kd": [0.6, 0.5, 0.5],
      "ks": [0.8, 0.8, 0.8], 
      "shininess": 30, 
      "transparency": 1
    });

    this.bounding_shape = new SceneBuilder.BoundingSphere({
      center_x:  this.center[0],
      center_y:  this.center[1],
      center_z:  this.center[2],
      radius: 0.5 // TODO don't like this, for tesing only
    });

    this.set_mesh(base_mesh).set_material(material); 
    pointer.set_mesh(pointer_mesh).set_material(material);
    
    this.add_child(pointer);
  } // end function

} // end class