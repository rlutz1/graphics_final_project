/**
 * Purpose of this file is to seed generate noise
 * The noise is utilize to generate terrain.
 * Same seed = same terrain
 */

/**
 * using noise generator with mulberry32, apparently good for game dev 
 * specifically seed generation
 * https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 * https://gamedev.stackexchange.com/questions/178399/same-noise-generator-for-c-and-javascript
 * ^^ links if anyone is interested, mulberry was new to me and seems 
 * pretty cool :) 
 */
export function mulberry32(a) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * Using cylindrical projections to randomly scatter points on the sphere
 * this will stop the points from bunching up and will allow for a more 
 * evenly distributed randomness 
 * https://mathworld.wolfram.com/SpherePointPicking.html
 * rng is the random number generated --> seed 
 * 
 * unit sphere equation --> x^2 + y^2 + z^2 = 1 = r^2
 * we choose y randomly, so treat it as a constant
 * x^2 + y^2 + z^2 = 1
 * x^2 + z^2 = 1 - y^2
 * r is the same for 2D circle, so solve in terms of y
 * x^2 + z^2 = r^2 = 1 - y^2
 * r = sqrt(1 - y^2)
 * 
 */
export function spherePointPicking(rng) {
    const theta = rng() * 2 - 1;
    const phi = rng() * 2 * Math.PI;
    const r = Math.sqrt(1 - y * y);

    return [r * Math.cos(theta), y, r * Math.sin(theta)];
}

/**
 * Using Perlin Noise algorithm
 * This is pretty cool, made especially for this sort of thing
 * It creates as lattice grid to for random gradients. It does 
 * this by ccalculating the dot products between the gradient 
 * vectors of the surrounding cell corners and the vectors pointing from 
 * those corners to the sample point
 * Explination of the algorithm which is very helpful: https://adrianb.io/2014/08/09/perlinnoise.html
 * This is that code...
 * 
 */

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

function lerp(t, a, b) {return a + t * (b - a);}

function grad(hash, x, y, z){ 
    const h = hash & 15; // convert lo 4 bits of hash code
    const u = h < 8 ? x : y; // into 12 gradient directions 
    const v = h < 4 ? y : h == 12 || h == 14 ? x : z;
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}

const p = new Array(512);

const permutation = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
  8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
  35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
  134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
  55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
  18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
  250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
  189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
  172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
  228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
  107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
];

for(let i = 0; i < 256; i++){
    p[256 + i] = p[i] = permutation[i];
}

export function improvedPerlin(x, y, z) {
const X = Math.floor(x) & 255,
      Y = Math.floor(y) & 255,
      Z = Math.floor(z) & 255;

x -= Math.floor(x);
y -= Math.floor(y);
z -= Math.floor(z);

const u = fade(x),
      v = fade(y),
      w = fade(z);

const A = p[X] + Y,     AA = p[A] + Z, AB = p[A + 1] + Z,
      B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;

return lerp(w, lerp(v, lerp(u, grad(p[AA  ], x  , y  , z   ),  
                               grad(p[BA  ], x-1, y  , z   )), 
                       lerp(u, grad(p[AB  ], x  , y-1, z   ),  
                               grad(p[BB  ], x-1, y-1, z   ))),
               lerp(v, lerp(u, grad(p[AA+1], x  , y  , z-1 ),  
                               grad(p[BA+1], x-1, y  , z-1 )), 
                       lerp(u, grad(p[AB+1], x  , y-1, z-1 ),
                               grad(p[BB+1], x-1, y-1, z-1 ))));
}

/**
 * Run the perlin function with a generated seed from mulberry32
 * This allows for a rondomized and repeatable noise 
 */
export function seededPerlin(seed){
    if(seed == 0) {return improvedPerlin;}

    const rng = mulberry32(seed);
    // offset the perlin vzlues by random number generated (rng)
    const xOffset = rng() * 256,
          yOffset = rng() * 256,
          zOffset = rng() * 256;
    
    // return the associated offset perlin coor
    return function noise(x, y, z){
        return improvedPerlin(x + xOffset, y + yOffset, z + zOffset);
    };
}

/**
 * Using Fractial Brownian Motion (FBM) to create more interesting paterns and detailed layers
 * Creating more noiseee to create a more natural terrain
 * p(t+1) = p(t) + white_noise
 * https://www.youtube.com/watch?v=PzuzGea3AAc
 * 
 * octaves = number of layers
 * lacunarity = the amount of scaling between each layer
 * gain = amount of influence each successive layer has on the result
 * preset w/ defaults
 */
export function initFbm(noise, {octaves = 4, lacunarity = 2.0, gain = 0.5} = {}){
    // normalize based on input values --> forces land to not get too big
    // values can be adjusted to change this later if needed 
    let norm = 0;
    for(let o = 0, a = 1; o < octaves; o++, a *= gain) norm += a;

    // standard fbm function
    // in the loop, each step we scale by lacunarity
    // then scale accumulated value by gain
    return function fbm(x, y, z) {
    let sum = 0, 
        amp = 1, 
        freq = 1;

    for (let o = 0; o < octaves; o++) {
      // small per-octave offset so octaves don't line up at the origin
      sum += amp * noise(x * freq + o * 17.13, y * freq + o * 5.71, z * freq + o * 11.37);
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm; // normalize sum
  };
}

/**
 * Performs Hermite interpolation between given edge values 
 * Is a helper in order to smooth values nicer --> will be helpful potentially in the colors
 * https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml
 */
export function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
} 