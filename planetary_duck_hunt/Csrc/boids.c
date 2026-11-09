#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include "vector.h"
#include "boids.h"


// ONLY INCLUDE THIS HEADER IF COMPILED WITH EMCC
#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

#define NUM_BOIDS 500 // CAN NEVER BE 1!
#define NUM_DIM 3
#define WORLD_MIN -1.0f // thresholds for detecting collision with boundary, based on webgl vals [-1,1]
#define WORLD_MAX 1.0f
#define BOUNDARY_PROXIMITY_THRESHOLD 0.5f
#define BOUNDARY_WEIGHT 2.0f // gently steer us away from boundaries

#define NUMERICAL_TOLERANCE 0.0001f

#define MAX_SPEED 1.5f
#define MAX_ACCELERATION 1.0f

#define TARGET_SPEED 1.0f
#define SPEED_MAINTENANCE_WEIGHT 0.5f

#define COLLISION_RADIUS 0.1f
#define PERCEPTION_RADIUS 0.6f
#define INITIAL_VELOCITY 0.3f // start in a random val on range [-IV, IV]
#define COHESION_WEIGHT 0.3f
#define SEPERATION_WEIGHT 0.15f
#define ALIGNMENT_WEIGHT 0.5f


Boid* themBoids = NULL; // totally safe, production level code. the array of Boid structs
float* boidSharedPositions = NULL; // shared heap memory between WebGl and this program
float* boidSharedVelocities = NULL;

// rand() returns a "random" float from 0 to some big fuckin number. if we want to clamp it between 
// min and max we need to do some arithmetic
float randomInRange(float min, float max) 
{
  float intervalSize = max - min;
  float normalized = (float)rand() / (float)RAND_MAX; // [0.0, 1.0]
  float scaled = normalized * intervalSize; // [0.0, max-min (20)]

  return scaled + min; // shift so that 0.0 -> min (-10)
}

// MALLOCS Boids and their fields as well as shared boidPositions, and assigns initial values. TODO: Check malloc return vals
EMSCRIPTEN_KEEPALIVE
void initializeBoids()
{
  int bI = 0;

  srand((unsigned int)time(NULL)); // seeds rand, have to cast the current time (time(NULL)) to unsigned int
  themBoids = malloc(NUM_BOIDS * sizeof(Boid));
  boidSharedPositions = malloc(NUM_BOIDS * NUM_DIM * sizeof(float));
  boidSharedVelocities = malloc(NUM_BOIDS * NUM_DIM * sizeof(float));
  
  if (themBoids == NULL || boidSharedPositions == NULL) 
  {
    return; // some kind of panic, free what was alloced
  }

  while (bI < NUM_BOIDS)
  {
    themBoids[bI].myIdx = bI;
    themBoids[bI].position = malloc(NUM_DIM * sizeof(float));
    themBoids[bI].velocity = malloc(NUM_DIM * sizeof(float));
    themBoids[bI].acceleration = malloc(NUM_DIM * sizeof(float));

    if (themBoids[bI].position == NULL || themBoids[bI].velocity == NULL || themBoids[bI].acceleration == NULL) 
    {
      return; // again, some kind of panic, free what was alloced
    }
    // for each x,y,z in the case of 3dim boids, set the initial values of position and velocity
    for (int idx = 0; idx < NUM_DIM; idx++)
    {
      themBoids[bI].position[idx] = randomInRange(WORLD_MIN, WORLD_MAX);
      themBoids[bI].velocity[idx] = randomInRange(-INITIAL_VELOCITY, INITIAL_VELOCITY);
      themBoids[bI].acceleration[idx] = 0;
      // for this boid, write its position values to the shared heap memory as they are initialized
      boidSharedPositions[(bI * NUM_DIM) + idx] = themBoids[bI].position[idx];
      boidSharedVelocities[(bI * NUM_DIM) + idx] = themBoids[bI].velocity[idx];
    }

    bI++;
  }
}


// I don't love the side effects here, but seems to be how I write a lot of my C.
// returns the number of birds in our visual radius, also calculates the 
// average position, seperation and velocity of the birds around us and writes to v1,2,3.
int steerBasedOnNeighbors(Boid* me, float* avgPos, float* avgSep, float* avgVel, int flockSize)
{
  float distToOthers[NUM_DIM];
  float distMag = 0.0f;
  int neighborCnt = 0;

  for (int bI = 0; bI < flockSize; bI++) 
  {
    Boid* otherBird = &themBoids[bI];
    
    if (bI != me->myIdx) 
    {
      // check if |(other position - my position)| is in my visual range
      vectorSubtract(distToOthers, otherBird->position, me->position, NUM_DIM);
      distMag = vecMagnitude(distToOthers, NUM_DIM);

      // if they are, add their position to the average position of neighbors, and add their velocity to the average velocity
      if (distMag < PERCEPTION_RADIUS)
      {
        neighborCnt++;  
        vectorAdd(avgPos, avgPos, otherBird->position, NUM_DIM);
        vectorAdd(avgVel, avgVel, otherBird->velocity, NUM_DIM);
      }
      // only steer away from birds we are about to hit
      // that is, set distToOthers = my position - their position = a vector pointing from them to me
      // add this vector to the vector containing the average
      // later we will follow this vector by adding it to our accelaration to steer away from the neighbors
      if (distMag < COLLISION_RADIUS)
      {
        vectorSubtract(distToOthers, me->position, otherBird->position,  NUM_DIM);
        vectorAdd(avgSep, avgSep, distToOthers, NUM_DIM);
      }
    }
  }
  return neighborCnt;
}

// ** flocksize is an arg so that we can skip dead birds when flock shrinks? might not make sense in the end
// Heart of BOIDS simulation. This is where we calculate updates to the simulation
void updateAcceleration(Boid* thisBoid, int flockSize)
{
  float v1[NUM_DIM]; float v2[NUM_DIM]; float v3[NUM_DIM];
  float accelMag;
  int neighborCnt;

  // Set all vectos to 0 initially
  zeroVec(v1, NUM_DIM); // Average position of all other birds
  zeroVec(v2, NUM_DIM); // Average separation vector, steer us away from too close birds
  zeroVec(v3, NUM_DIM); // Average velocity of flock

  // returns the number of birds in our visual radius, also calculates the 
  // average position, seperation and velocity of the birds around us and writes to v1,2,3.
  neighborCnt = steerBasedOnNeighbors(thisBoid, v1, v2, v3, flockSize);

  // now actually update accelaration based on the average position and velocity of the flock
  // after some weighting, and ensuring our final vectors point where we want to go below
  if (neighborCnt > 0)
  {
    vectorScalar(v1, 1.0f / neighborCnt, NUM_DIM); // scale v1 by 1 / # neighbors
    // this converts v1 into a steering direction, v1 = averagePos - myPos 
    // yields a vector pointing from me to the average, we want to follow that
    vectorSubtract(v1, v1, thisBoid->position, NUM_DIM);
    vectorScalar(v1, COHESION_WEIGHT, NUM_DIM); // weight this, how strongly do we want to follow neighbors?

    vectorScalar(v3, 1.0f / neighborCnt, NUM_DIM); // scale velocity of neighbors by 1 / # neighbors
    // this converts average velocity into a steering direction, a vector pointing from me to the average
    vectorSubtract(v3, v3, thisBoid->velocity, NUM_DIM);
    vectorScalar(v3, ALIGNMENT_WEIGHT, NUM_DIM); // weight this, how much do we match neighbors velocity?
  }

  // sum of vectors pointing away from potential collisions, weight is how strongly we avoid crashing
  vectorScalar(v2, SEPERATION_WEIGHT, NUM_DIM); 

  // zero out our acceleration from previous steps as we now have a fresh picture of our neighbors
  zeroVec(thisBoid->acceleration, NUM_DIM);
  // finally our acceleration = avoidCrash + avgPos + avgVel + the average velocity of the flock (we try to match velocities)
  vectorAdd(thisBoid->acceleration, v1, v2, NUM_DIM);
  vectorAdd(thisBoid->acceleration, thisBoid->acceleration, v3, NUM_DIM);

  // if birds are wildin out, clamp their acceleration to max
    
  accelMag = vecMagnitude(thisBoid->acceleration, NUM_DIM);
  if (accelMag > MAX_ACCELERATION)
  {
    vectorScalar(thisBoid->acceleration, MAX_ACCELERATION / accelMag, NUM_DIM);
  }
}


// Updates laggard birds acceleration to match a target
void maintainSpeed(Boid* thisBoid, float velocityMag)
{
  float speedDiff;

  if (velocityMag > NUMERICAL_TOLERANCE && velocityMag < TARGET_SPEED)
  {
    speedDiff = TARGET_SPEED - velocityMag; // I gotta catch up!
    
    // add a portion of the speed difference to the boids acceleration
    // maintain current direction by adding the product of speed diff and the normalized velocity vector
    // this product produces an acceleration vector pointing in the direction we were already headed.
    for (int coordIdx = 0; coordIdx < NUM_DIM; coordIdx++)
    {
      thisBoid->acceleration[coordIdx] += SPEED_MAINTENANCE_WEIGHT * speedDiff * (thisBoid->velocity[coordIdx] / velocityMag);
    }
  }
}

// decrement acceleration in direction of walls if applicable
void avoidBoundaries(Boid* thisBoid)
{
  float distToMax, distToMin;
  for (int coordIdx = 0; coordIdx < NUM_DIM; coordIdx++)
  {
    distToMax = WORLD_MAX - thisBoid->position[coordIdx];
    distToMin = thisBoid->position[coordIdx] - WORLD_MIN;

    // if we are between a wall and the threshold, decrement by a set weight * (distance into the avoidance zone) / threshold
    // dividing by the threshold gives us a value between 0 and 1 which makes adjusting weights nice
    // eg if boundary = 1.0, threshold = 0.5 and our bird is at 0.75. distToMax = 0.25, 0.25/0.5 = 1/4 / 1/2 = 2/8 = 0.25
    if (distToMax < BOUNDARY_PROXIMITY_THRESHOLD)
    {
      thisBoid->acceleration[coordIdx] -= BOUNDARY_WEIGHT * 
      (BOUNDARY_PROXIMITY_THRESHOLD - distToMax) / BOUNDARY_PROXIMITY_THRESHOLD;
    }
    else if (distToMin < BOUNDARY_PROXIMITY_THRESHOLD)
    {
      thisBoid->acceleration[coordIdx] += BOUNDARY_WEIGHT * 
      (BOUNDARY_PROXIMITY_THRESHOLD - distToMin) / BOUNDARY_PROXIMITY_THRESHOLD;
    }
  }
}

void clampAtBoundaries(Boid* thisBoid, int coordIdx)
{
  if (thisBoid->position[coordIdx] > WORLD_MAX)
  {
    thisBoid->position[coordIdx] = WORLD_MAX;

    if (thisBoid->velocity[coordIdx] > 0.0f) thisBoid->velocity[coordIdx] = 0.0f;
  }
  else if (thisBoid->position[coordIdx] < WORLD_MIN)
  {
    thisBoid->position[coordIdx] = WORLD_MIN;

    if (thisBoid->velocity[coordIdx] < 0.0f) thisBoid->velocity[coordIdx] = 0.0f;
  }
}

// What WebGl context calls, updates our simulation internally, then updates shared memory
EMSCRIPTEN_KEEPALIVE
void advanceBoids(float delT)
{
  int birdIdx, coordIdx, sharedPosIdx;
  float velocityMag, accelMag;
  Boid thisBoid;

  // calculate every birds acceleration
  // the O(N**2) bit is this bit
  for (birdIdx = 0; birdIdx < NUM_BOIDS; birdIdx++)
  {
    updateAcceleration(&themBoids[birdIdx], NUM_BOIDS);
  }

  // now update their velocity and position. that is, 
  // velocity += acceleration, position += velocity
  for (birdIdx = 0; birdIdx < NUM_BOIDS; birdIdx++)
  {
    thisBoid = themBoids[birdIdx];

    velocityMag = vecMagnitude(thisBoid.velocity, NUM_DIM);
    maintainSpeed(&thisBoid, velocityMag); // accelerates birds who are lagging

    // check if we are within the threshold of a boundary and update acceleration to steer away
    avoidBoundaries(&thisBoid);

    // after these updates to acceleration, clamp acceleration to max if they are rocketing
    accelMag = vecMagnitude(thisBoid.acceleration, NUM_DIM);
    if (accelMag > MAX_ACCELERATION) 
    {
      vectorScalar(thisBoid.acceleration, MAX_ACCELERATION / accelMag, NUM_DIM);
    }

    // NOW update velocities                                                                Replace this with a call to one of our vector Fs??? true for all little loops?
    // delT is set to 1/60. so every call to advance is like 1/60th a second to create a smooth picture of the simulation.
    // otherwise, each call is like 1 second, or delT = 1, and that'll look like shit partner
    for (coordIdx = 0; coordIdx < NUM_DIM; coordIdx++)
    {
      thisBoid.velocity[coordIdx] += thisBoid.acceleration[coordIdx] * delT;
    }
    
    // check speed after update, set to max speed if too speedy
    velocityMag = vecMagnitude(thisBoid.velocity, NUM_DIM);
    if (velocityMag > MAX_SPEED) vectorScalar(thisBoid.velocity, MAX_SPEED / velocityMag, NUM_DIM);

    // update position and shared positions
    for (coordIdx = 0; coordIdx < NUM_DIM; coordIdx++)
    {
      thisBoid.position[coordIdx] += thisBoid.velocity[coordIdx] * delT;
      clampAtBoundaries(&thisBoid, coordIdx);
      sharedPosIdx = (birdIdx * NUM_DIM) + coordIdx;
      boidSharedPositions[sharedPosIdx] = thisBoid.position[coordIdx];
      boidSharedVelocities[sharedPosIdx] = thisBoid.velocity[coordIdx];
    }
  }
}








/* Functions that will never change that WebGl context needs exposed. */
EMSCRIPTEN_KEEPALIVE
float* getBoidPositions()
{
  return &boidSharedPositions[0];
}

EMSCRIPTEN_KEEPALIVE
float* getBoidVelocities()
{
  return &boidSharedVelocities[0];
}

EMSCRIPTEN_KEEPALIVE
int getNumBoids()
{
  return NUM_BOIDS;
}

EMSCRIPTEN_KEEPALIVE
int getDim()
{
  return NUM_DIM;
}

EMSCRIPTEN_KEEPALIVE
void freeBoids()
{
  int idx = 0;

  while (idx < NUM_BOIDS) // dont free when killed, translate to ground?
  {
    free(themBoids[idx].position);
    free(themBoids[idx].velocity);
    free(themBoids[idx].acceleration);
    idx++;
  }
  
  free(themBoids);
  free(boidSharedPositions);
  free(boidSharedVelocities);
}