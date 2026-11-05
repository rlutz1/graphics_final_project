/**
 * separate file for holding the raw string shaders. 
 * 
 * preferred convention: make the shader dict name correspond
 * to the id of the Shader that will process it.
 * 
 * preferred format should be: 
 *  export const my_shader = {
 *    "vertex_shader": "...",
 *    "fragment_shader": "..."
 *  }
 * 
 * the above formats and conventions are not really enforced, since
 * it's up to you how to grab from this file, but it would be 
 * super extra nice to make it the same way ;)
 */

// just a super basic phong shader
export const phong_basic = {
  // vertex shader
  "vertex_shader": `#version 300 es
      precision mediump float;
      
      in vec3 aPosition;
      in vec3 aNormal;
      in vec3 aColor;

      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;

      // allow for many matrices in a row
      uniform mat4 uModelTransformationMatrix;

      out vec3 vPosition;
      out vec3 vNormal;
      out vec3 vColor;

      void main() {
        // cast for transformations to a 4d homogenous coord
        vec4 pos = vec4(aPosition, 1.0);
        vec3 norm = aNormal;

        pos = uModelTransformationMatrix * pos; // add all transforms
        norm = mat3(uModelTransformationMatrix) * norm; // ensure to also alter the norm

        // save the position of this vertex prior to projection -- send to frag.
        vec4 p = uModelViewMatrix * pos;
        vPosition = p.xyz;

        // use model view and apply to given normal -- send to frag.
        vNormal = mat3(uModelViewMatrix) * norm;

        // set the actual positioning in the projection
        gl_Position = uProjectionMatrix * p;

        vColor = aColor; // send out the vertex color to frag shader
      }
    `,
    // fragment shader
    "fragment_shader": `#version 300 es
        precision mediump float;

        // struct to hold light parameters 
        struct LightParams {
          vec3 ka;
          vec3 kd;
          vec3 ks;
          float shininess;
          float transparency;
        };

        uniform LightParams uLightParams;

        in vec3 vPosition;
        in vec3 vNormal;
        in vec3 vColor;

        uniform vec3 uPointLights[50]; // points light positions in space
        uniform int uNumPointLights; // how many point lights

        out vec4 fragColor;

        void main() {
          vec3 N = normalize(vNormal); // ensure normalized
          vec3 V = normalize(-vPosition); // camera sits at the origin

          vec3 diffuse_acc = vec3(0.0);
          vec3 spec_acc = vec3(0.0);

          for (int i = 0; i < uNumPointLights; i++) {
            vec3 L = normalize(uPointLights[i] - vPosition); // get l as vector from this point
            vec3 R = reflect(-L, N); // r = 2(dot(n, l) * n - l) 
            float diff = max(dot(N, L), 0.0); // diffuse max
            float spec = pow(max(dot(V, R), 0.0), uLightParams.shininess); // specular max and power shininess
            diffuse_acc += (uLightParams.kd * vColor) * diff;
            spec_acc += (uLightParams.ks * vColor) * spec;
          } // end loop 

          fragColor = vec4(
            (uLightParams.ka * vColor) + 
            diffuse_acc + 
            spec_acc, 
            uLightParams.transparency
            );
        }
      `
} // end src