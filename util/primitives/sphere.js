import { SceneObject } from '../scene_graph.js';
import { phong_frag_shader } from '../frag_shaders.js';
import { phong_vert_shader } from '../vert_shaders.js';


export let testing = new SceneObject("test", phong_vert_shader, phong_frag_shader);