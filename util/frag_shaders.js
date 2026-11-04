/**
 * simple fragment shaders to grab if wanted. can add more/make this more malleable.
 */

/**
 * most basic frag shader to use.
 */
const basic_frag_shader = `#version 300 es
    precision mediump float;
    in vec3 vColor;

    out vec4 fragColor;

    void main() {
      fragColor = vec4(vColor,1.0);
    }
  `;

/**
 * phong but with flat
 * https://stackoverflow.com/questions/27581271/flat-qualifier-in-glsl
 * https://wikis.khronos.org/opengl/Primitive#Provoking_vertex
 * allow opengl to pick the vertex from the provoking vertex of the
 * primitive (our case, 1st vertex of the triangle.)
 */
const flat_frag_shader = `#version 300 es
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

    in vec3 vPosition;
    flat in vec3 vNormal;
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
        float spec = pow(max(dot(V, R), 0.0), uLightParams.alpha); // specular max and power alpha
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
  `;

/**
 * gouraud frag shader.
 * same as basic frag shader, but named
 * for clarity in use.
 */
const gouraud_frag_shader = `#version 300 es
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
    
    in vec3 vColor;

    out vec4 fragColor;

    void main() {
      fragColor = vec4(vColor, uLightParams.transparency);
    }
  `;

/**
 * the basic phong frag shader
 */
export const phong_frag_shader = `#version 300 es
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
        float spec = pow(max(dot(V, R), 0.0), uLightParams.alpha); // specular max and power alpha
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
  `;

/**
 * super basic adapted texture shader with phong lighting.
 */
const texture_frag_shader = `#version 300 es
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

  in vec3 vPosition;
  in vec3 vNormal;
  in vec3 vColor;
  in vec3 vTangent;
  in vec2 vTexCoord;

  uniform vec3 uPointLights[50]; // points light positions in space
  uniform int uNumPointLights; // how many point lights

  uniform sampler2D uTexture; // interface for the texture unit
  uniform int uMapping;  // 0 = bump mapping, 1 = normal mapping

  out vec4 fragColor;

  const float bumpScale = 15.0;

  // convert RGB to luminance (Rec._601 standard, https://en.wikipedia.org/wiki/Rec._601)
  // or you can use a height map texture
  float height(vec2 uv) {
    vec3 c = texture(uTexture, uv).rgb;
    return 1.0 - dot(c, vec3(0.299, 0.587, 0.114));
  }

  void main() {

    vec3 N = normalize(vNormal); // ensure normalized
    vec3 V = normalize(-vPosition); // camera sits at the origin
    vec3 T = normalize(vTangent - dot(vTangent, N) * N);
    vec3 B = cross(N, T);
    mat3 TBN = mat3(T, B, N);

    vec3 baseColor;
    vec3 n;

    vec3 diffuse_acc = vec3(0.0);
    vec3 spec_acc = vec3(0.0);


    if (uMapping == 0) {
      // Bump mapping: tilt the normal against the gradient of the height field
      vec2 du = vec2(1.0 / float(textureSize(uTexture, 0).x), 0.0);
      vec2 dv = vec2(0.0, 1.0 / float(textureSize(uTexture, 0).y));
      float dhdu = (height(vTexCoord + du) - height(vTexCoord - du)) * 0.5;
      float dhdv = (height(vTexCoord + dv) - height(vTexCoord - dv)) * 0.5;
      n = normalize(vec3(-bumpScale * dhdu, -bumpScale * dhdv, 1.0));
      baseColor = texture(uTexture, vTexCoord).rgb;
    } else {
      // Normal mapping: the texture stores the tangent-space normal in [0, 1]
      n = normalize(texture(uTexture, vTexCoord).rgb * 2.0 - 1.0);
      baseColor = vec3(0.85, 0.65, 0.3);
    }

    N = normalize(TBN * n);

    for (int i = 0; i < uNumPointLights; i++) {
      vec3 L = normalize(uPointLights[i] - vPosition); // get l as vector from this point
      vec3 R = reflect(-L, N); // r = 2(dot(n, l) * n - l) 
      float diff = max(dot(N, L), 0.0); // diffuse max
      float spec = pow(max(dot(V, R), 0.0), uLightParams.alpha); // specular max and power alpha
      diffuse_acc += (uLightParams.kd * baseColor) * diff;
      spec_acc += (uLightParams.ks * baseColor) * spec;
    } // end loop 

    fragColor = vec4(
      (uLightParams.ka * baseColor) + 
      diffuse_acc + 
      spec_acc, 
      uLightParams.transparency
      );
  }`;