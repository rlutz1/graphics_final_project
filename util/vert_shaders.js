/**
 * simple vertex shaders to grab if wanted. can add more/make this more malleable.
 */

/**
 * the most basic vertex shader, no lighting is considered.
 */
const basic_vert_shader = `#version 300 es
    in vec3 aPosition;
    in vec3 aColor;

    // uniform float uTime; //time in sec
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    // allow for many matrices in a row
    uniform mat4 uModelTransformationMatrix[50];
    uniform int transforms_up_to; // marker of how many transforms
    
    out vec3 vColor; // color to interpolate

    void main() {
      // uProjectionMatrix * uModelViewMatrix * uModelTransformationMatrix * vec4(aPosition,1.0);
      vec4 pos = vec4(aPosition, 1.0);
      

      for (int i = 0; i < transforms_up_to; i++) {
        pos = uModelTransformationMatrix[i] * pos; // add all transforms
      } // end loop

      gl_Position = uProjectionMatrix * uModelViewMatrix * pos;
      // address some clipping while using an orthographic projection:
      // https://stackoverflow.com/questions/66405678/othographic-projection-causing-geometry-to-get-clipped-by-the-far-plane
      gl_Position.z *= 0.5;
      
      vColor = aColor;
    }
  `;

/**
 * phong but with flat
 * https://stackoverflow.com/questions/27581271/flat-qualifier-in-glsl
 * https://wikis.khronos.org/opengl/Primitive#Provoking_vertex
 * allow opengl to pick the vertex from the provoking vertex of the
 * primitive (our case, 1st vertex of the triangle.)
 */
const flat_vert_shader = `#version 300 es
    precision mediump float;

    // struct to hold light parameters 
    struct LightParams {
      vec3 ka;
      vec3 kd;
      vec3 ks;
      float alpha;
      float transparency;
    };

    uniform LightParams uLightParams;

    in vec3 aPosition;
    in vec3 aNormal;
    in vec3 aColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    // allow for many matrices in a row
    uniform mat4 uModelTransformationMatrix[50];
    uniform int transforms_up_to; // marker of how many transforms

    out vec3 vPosition;
    flat out vec3 vNormal;
    out vec3 vColor;

    void main() {
      // cast for transformations to a 4d homogenous coord
      vec4 pos = vec4(aPosition, 1.0);
      vec3 norm = aNormal;

      for (int i = 0; i < transforms_up_to; i++) {
        pos = uModelTransformationMatrix[i] * pos; // add all transforms
        norm = mat3(uModelTransformationMatrix[i]) * norm; // ensure to also alter the norm
      } // end loop

      // save the position of this vertex prior to projection -- send to frag.
      vec4 p = uModelViewMatrix * pos;
      vPosition = p.xyz;

      // use model view and apply to given normal -- send to frag.
      vNormal = mat3(uModelViewMatrix) * norm;

      // set the actual positioning in the projection
      gl_Position = uProjectionMatrix * p;

      // address some clipping while using an orthographic projection:
      // https://stackoverflow.com/questions/66405678/othographic-projection-causing-geometry-to-get-clipped-by-the-far-plane
      //gl_Position.z *= 0.5;

      vColor = aColor; // send out the vertex color to frag shader
    }
  `;

/**
 * a vertex shader that handles gouraud shading, which
 * conducts the lighting calculations here, letting the
 * colors found per vertex be interpolated instead of normals.
 * should be used with: gouraud_frag_shader (or basic_frag_shader)
 */
const gouraud_vert_shader = `#version 300 es
    precision mediump float;

    // struct to hold light parameters 
    struct LightParams {
      vec3 ka;
      vec3 kd;
      vec3 ks;
      float alpha;
      float transparency;
    };

    uniform LightParams uLightParams;

    in vec3 aPosition;
    in vec3 aNormal;
    in vec3 aColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    // allow for many matrices in a row
    uniform mat4 uModelTransformationMatrix[50];
    uniform int transforms_up_to; // marker of how many transforms

    uniform vec3 uPointLights[50]; // points light positions in space
    uniform int uNumPointLights; // how many point lights

    out vec3 vColor; // only sends out color

    void main() {
      // cast for transformations to a 4d homogenous coord
      vec4 pos = vec4(aPosition, 1.0);
      vec3 norm = aNormal;

      for (int i = 0; i < transforms_up_to; i++) {
        pos = uModelTransformationMatrix[i] * pos; // add all transforms
        norm = mat3(uModelTransformationMatrix[i]) * norm; // ensure to also alter the norm
      } // end loop

      // save the position of this vertex prior to projection
      vec4 p = uModelViewMatrix * pos;
      vec3 vPosition = p.xyz;

      // use model view and apply to given normal 
      vec3 vNormal = mat3(uModelViewMatrix) * norm;

      vec3 N = normalize(vNormal); // ensure normalized
      vec3 V = normalize(-vPosition); // camera sits at the origin

      vec3 diffuse_acc = vec3(0.0);
      vec3 spec_acc = vec3(0.0);

      for (int i = 0; i < uNumPointLights; i++) {
        vec3 L = normalize(uPointLights[i] - vPosition); // get l as vector from this point
        vec3 R = reflect(-L, N); // r = 2(dot(n, l) * n - l) 
        float diff = max(dot(N, L), 0.0); // diffuse max
        float spec = pow(max(dot(V, R), 0.0), uLightParams.alpha); // specular max and power alpha
        diffuse_acc += (uLightParams.kd * aColor) * diff;
        spec_acc += (uLightParams.ks * aColor) * spec;
      } // end loop 

      vColor = vec3(
        (uLightParams.ka * aColor) + 
        diffuse_acc + 
        spec_acc
        );

      // set the actual positioning in the projection
      gl_Position = uProjectionMatrix * p;
    }
  `;

/**
 * a vertex shader that implements the vertex shading of 
 * phong shading. meaning: phong will pass normal to frag shader
 * for normal interpolation and lighting calculated per fragment.
 * should be used with: phong_frag_shader
 */
export const phong_vert_shader = `#version 300 es
    precision mediump float;
    
    in vec3 aPosition;
    in vec3 aNormal;
    in vec3 aColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    // allow for many matrices in a row
    uniform mat4 uModelTransformationMatrix[50];
    uniform int transforms_up_to; // marker of how many transforms

    out vec3 vPosition;
    out vec3 vNormal;
    out vec3 vColor;

    void main() {
      // cast for transformations to a 4d homogenous coord
      vec4 pos = vec4(aPosition, 1.0);
      vec3 norm = aNormal;

      for (int i = 0; i < transforms_up_to; i++) {
        pos = uModelTransformationMatrix[i] * pos; // add all transforms
        norm = mat3(uModelTransformationMatrix[i]) * norm; // ensure to also alter the norm
      } // end loop

      // save the position of this vertex prior to projection -- send to frag.
      vec4 p = uModelViewMatrix * pos;
      vPosition = p.xyz;

      // use model view and apply to given normal -- send to frag.
      vNormal = mat3(uModelViewMatrix) * norm;

      // set the actual positioning in the projection
      gl_Position = uProjectionMatrix * p;

      vColor = aColor; // send out the vertex color to frag shader
    }
  `;

const texture_vertex_shader = `#version 300 es
  in vec3 aPosition;
  in vec3 aNormal;
  in vec3 aColor;
  in vec3 aTangent;
  in vec2 aTexCoord;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  // allow for many matrices in a row
  uniform mat4 uModelTransformationMatrix[50];
  uniform int transforms_up_to; // marker of how many transforms

  out vec3 vPosition;
  out vec3 vNormal;
  out vec3 vColor;
  out vec3 vTangent;
  out vec2 vTexCoord;

  void main() {
    // cast for transformations to a 4d homogenous coord
    vec4 pos = vec4(aPosition, 1.0);
    vec3 norm = aNormal;
    vec3 tangent = aTangent;

    for (int i = 0; i < transforms_up_to; i++) {
      pos = uModelTransformationMatrix[i] * pos; // add all transforms
      //norm = mat3(uModelTransformationMatrix[i]) * norm; // ensure to also alter the norm
      //tangent = mat3(uModelTransformationMatrix[i]) * tangent; // and tangent

      norm = transpose(inverse(mat3(uModelTransformationMatrix[i]))) * norm; // TODO
      tangent = transpose(inverse(mat3(uModelTransformationMatrix[i]))) * tangent;
    } // end loop

    // save the position of this vertex prior to projection -- send to frag.
    vec4 p = uModelViewMatrix * pos;
    vPosition = p.xyz;

    // use model view and apply to given normal -- send to frag.
    //vNormal = mat3(uModelViewMatrix) * norm;
    //vTangent = mat3(uModelViewMatrix) * tangent;
    vNormal = transpose(inverse(mat3(uModelViewMatrix))) * norm; // TODO 
    vTangent = transpose(inverse(mat3(uModelViewMatrix))) * tangent;

    // set the actual positioning in the projection
    gl_Position = uProjectionMatrix * p;

    vColor = aColor; // send out the vertex color to frag shader
    vTexCoord = aTexCoord; // also send on out
  }
`;