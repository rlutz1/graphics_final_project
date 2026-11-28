/**
 * This will set all the parameters for each planets terrain
 * Each planet will have the following defined...
 * - name
 * - sky color https://www.worldatlas.com/space/what-color-is-the-sky-on-each-planet.html 
 * - terrain stuff
 *          - seed
 *          - number of bumbs & bumb details (radius & height)
 *          - pateau cut off range
 *          - dip fractvion
 *          - mountain fraction & details (radius & height)
 *          - roll amp & wavelength
 *          - fbm function parameters (octave & gain)
 *          - color palette 
 *          - high & peak bands for color fading 
 */

/**
 * Colors to then go and call for each planet 
 * use this link --> https://rgbcolorpicker.com/0-1 
 * It will make life sm easier if you want to change any colros 
 */
export const COLORS = {
  // Mercury
  MERCURY_SKY: [0, 0.0, 0.0],  
  MERCURY_BASE: [0.45, 0.43, 0.41],
  MERCURY_PATCH: [0.55, 0.52, 0.49],
  MERCURY_LOW: [0.28, 0.27, 0.26],
  MERCURY_HIGH: [0.62, 0.60, 0.57],
  MERCURY_PEAK: [0.70, 0.68, 0.65],

  // Venus
  VENUS_SKY: [0.86, 0.68, 0.38],  
  VENUS_BASE: [0.62, 0.44, 0.22],
  VENUS_PATCH: [0.75, 0.56, 0.30],
  VENUS_LOW: [0.40, 0.26, 0.14],
  VENUS_HIGH: [0.35, 0.22, 0.15],
  VENUS_PEAK: [0.85, 0.35, 0.12],  

  // Earth
  EARTH_SKY: [0.5, 0.7, 0.92],
  EARTH_BASE: [0.30, 0.50, 0.22],
  EARTH_PATCH: [0.74, 0.64, 0.42],
  EARTH_LOW: [0.40, 0.31, 0.20],
  EARTH_HIGH: [0.52, 0.50, 0.46],
  EARTH_PEAK: [0.92, 0.93, 0.95],

  // Mars
  MARS_SKY: [0.85, 0.62, 0.46],  
  MARS_BASE: [0.66, 0.32, 0.18],
  MARS_PATCH: [0.78, 0.45, 0.26],
  MARS_LOW: [0.45, 0.20, 0.12],
  MARS_HIGH: [0.55, 0.28, 0.18],
  MARS_PEAK: [0.85, 0.80, 0.78], 

  // Jupiter
  JUPITER_SKY: [0.80, 0.68, 0.52],
  JUPITER_BASE: [0.82, 0.70, 0.52],
  JUPITER_PATCH: [0.72, 0.42, 0.25],  
  JUPITER_LOW: [0.55, 0.38, 0.28],
  JUPITER_HIGH: [0.92, 0.86, 0.74],
  JUPITER_PEAK: [0.95, 0.92, 0.85],

  // Saturn
  SATURN_SKY: [0.88, 0.80, 0.58],
  SATURN_BASE: [0.86, 0.77, 0.55],
  SATURN_PATCH: [0.78, 0.66, 0.42],
  SATURN_LOW: [0.64, 0.55, 0.38],
  SATURN_HIGH: [0.93, 0.88, 0.72],
  SATURN_PEAK: [0.97, 0.94, 0.85],

  // Uranus
  URANUS_SKY: [0.62, 0.85, 0.90],
  URANUS_BASE: [0.55, 0.80, 0.84],
  URANUS_PATCH: [0.68, 0.88, 0.90],
  URANUS_LOW: [0.38, 0.62, 0.70],
  URANUS_HIGH: [0.80, 0.94, 0.96],
  URANUS_PEAK: [0.95, 0.98, 1.00],

  // Neptune
  NEPTUNE_SKY: [0.22, 0.36, 0.78],
  NEPTUNE_BASE: [0.18, 0.30, 0.68],
  NEPTUNE_PATCH: [0.28, 0.42, 0.82],
  NEPTUNE_LOW: [0.10, 0.16, 0.45],
  NEPTUNE_HIGH: [0.55, 0.68, 0.92],
  NEPTUNE_PEAK: [0.92, 0.95, 1.00],

  // Sun
  SUN_SKY: [1.00, 0.62, 0.22],
  SUN_BASE: [0.95, 0.55, 0.10],
  SUN_PATCH: [1.00, 0.75, 0.20],
  SUN_LOW: [0.70, 0.20, 0.05],
  SUN_HIGH: [1.00, 0.85, 0.40],
  SUN_PEAK: [1.00, 0.97, 0.80],
};

export const PLANET_TERRAIN_CONFIG = {

    // make each planent 
    // references for terrain : 
    // https://www.universetoday.com/articles/surface-of-the-planets

    // mercury
    // make red, black sky, flatish w/ craters 
    mercury : {
        name : "Mercury",
        sky_color : MERCURY_SKY,
        terrain : {
            seed: 50,
            num_bumps : 100,
            bump_radius: [3, 10],
            bump_height: [0.5, 5],
            plateau: [0.5, 1],   
            dip: 0.75,               
            mountain: 0.02,
            mountain_height: [3, 5],
            roll_amplitude: .5,
            // roll_wavelength: , will keep the same as default
            palette: {
                base: MERCURY_BASE,
                patch: MERCURY_PATCH,
                low: MERCURY_LOW,
                high: MERCURY_HIGH,
                peak: MERCURY_PEAK,
            },
        },
    },

    // venius
    // yellow/orange sky 
    venius : {
        name : "Venius",
        sky_color : VENUS_SKY,
        terrain : {
            seed: 150,
            num_bumps : 200,
            bump_radius: [10, 24],
            bump_height: [0.5, 2],
            plateau: [0.6, 0.9],   
            dip: 0.1,               
            mountain: 0.1,
            mountain_height: [5,8],
            roll_amplitude: 1,
            roll_wavelength: 50,
            palette: {
                base: VENUS_BASE,
                patch: VENUS_PATCH,
                low: VENUS_LOW,
                high: VENUS_HIGH,
                peak: VENUS_PEAK,
            },
        },
    },

    // earth 
    earth : {
        name : "Earth",
        sky_color : EARTH_SKY,
        terrain : {
            seed: 200,
            // all of these will be determined as terrain defaults
            //num_bumps : ,
            //bump_radius: ,
            //bump_height: ,
            //plateau: ,   
            //dip: ,               
            //mountain: ,
            //mountain_height: ,
            //roll_amplitude: ,
            //roll_wavelength: ,
            palette: {
                base: EARTH_BASE,
                patch: EARTH_PATCH,
                low: EARTH_LOW,
                high: EARTH_HIGH,
                peak: EARTH_PEAK,
            },
        },
    },

    // mars 
    mars : {
        name : "Mars",
        sky_color : MARS_SKY,
        terrain : {
            seed:250,
            // mars has some crazy terrain,, allegedly. so keep as default

            //num_bumps : ,
            //bump_radius: ,
            //bump_height: ,
            //plateau: ,   
            //dip: ,               
            //mountain: ,
            //mountain_height: ,
            //roll_amplitude: ,
            //roll_wavelength: ,
            palette: {
                base: MARS_BASE,
                patch: MARS_PATCH,
                low: MARS_LOW,
                high: MARS_HIGH,
                peak: MARS_PEAK,
            },
        },
    },

    // jupiter 
    jupiter : {
        name : "Jupiter",
        sky_color : JUPITER_SKY,
        terrain : {
            seed: 300,
            num_bumps : 50,
            bump_radius: [50, 30],
            bump_height: [0.5, 1.5],
            plateau: [0.2, 0.5],   
            dip: 0.3,               
            mountain: 0,
            //mountain_height: ,
            roll_amplitude: 3,
            roll_wavelength: 70,
            fbm: { octaves: 3, gain: 0.4 },
            palette: {
                base: JUPITER_BASE,
                patch: JUPITER_PATCH,
                low: JUPITER_LOW,
                high: JUPITER_HIGH,
                peak: JUPITER_PEAK,
            },
        },
    },

    // satern
    saturn : {
        name : "Saturn",
        sky_color : SATURN_SKY,
        terrain : {
            seed: 350,
            num_bumps : 50,
            bump_radius: [50, 30],
            bump_height: [0.5, 1.5],
            plateau: [0.2, 0.5],   
            dip: 0.3,               
            mountain: 0,
            //mountain_height: ,
            roll_amplitude: 3,
            roll_wavelength: 70,
            fbm: { octaves: 3, gain: 0.4 },
            palette: {
                base: SATURN_BASE,
                patch: SATURN_PATCH,
                low: SATURN_LOW,
                high: SATURN_HIGH,
                peak: SATURN_PEAK,
            },
        },
    },

    // uranus 
    uranus : {
        name : "Uranus",
        sky_color : URANUS_SKY,
        terrain : {
            seed:400,
            num_bumps : 50,
            bump_radius: [50, 30],
            bump_height: [0.5, 1.5],
            plateau: [0.2, 0.5],   
            dip: 0.3,               
            mountain: 0,
            //mountain_height: ,
            roll_amplitude: 3,
            roll_wavelength: 70,
            fbm: { octaves: 3, gain: 0.4 },
            palette: {
                base: URANUS_BASE,
                patch: URANUS_PATCH,
                low: URANUS_LOW,
                high: URANUS_HIGH,
                peak: URANUS_PEAK,
            },
        },
    },

    // neptune 
    neptune : {
        name : "Neptune",
        sky_color : NEPTUNE_SKY,
        terrain : {
            seed: 450,
            num_bumps : 50,
            bump_radius: [50, 30],
            bump_height: [0.5, 1.5],
            plateau: [0.2, 0.5],   
            dip: 0.3,               
            mountain: 0,
            //mountain_height: ,
            roll_amplitude: 3,
            roll_wavelength: 70,
            fbm: { octaves: 3, gain: 0.4 },
            palette: {
                base: NEPTUNE_BASE,
                patch: NEPTUNE_PATCH,
                low: NEPTUNE_LOW,
                high: NEPTUNE_HIGH,
                peak: NEPTUNE_PEAK,
            },
        },
    },

    // la sun
    sun : {
        name : "Sun",
        sky_color : SUN_SKY,
        terrain : {
            // going to attempt to make flares?? tones of mountains basically
            seed: 500,
            num_bumps : 450,
            bump_radius: [3, 10],
            bump_height: [0.5, 2.0],
            plateau: [0.1, 0.3],   
            dip: 0.1,               
            mountain: .8,
            mountain_height: [8, 18],
            //roll_amplitude: ,
            //roll_wavelength: ,
            fbm: { octaves: 5, gain: 0.6 },
            palette: {
                base: SUN_BASE,
                patch: SUN_PATCH,
                low: SUN_LOW,
                high: SUN_HIGH,
                peak: SUN_PEAK,
            },
        },
    },
};