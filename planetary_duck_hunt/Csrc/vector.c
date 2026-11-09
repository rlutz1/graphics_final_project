#include <math.h>

// TODO make these safe or use someones library
// NOT SAFE, up to the caller.
// Writes result of addition to target. dim must be dim of target, and for addition to 
// be defined, dimension of v1, v2 as well.
void vectorAdd(float* target, const float* v1, const float* v2, int dim) 
{
  for (int i = 0; i < dim; i++) target[i] = v1[i] + v2[i];
}

void vectorSubtract(float* target, const float* v1, const float* v2, int dim)
{
  for (int i = 0; i < dim; i++) target[i] = v1[i] - v2[i];
}

void vectorScalar(float* vec, float scalar, int dim)
{
  for (int i = 0; i < dim; i++) vec[i] *= scalar;
}

float vecMagnitude(float* vec, int dim)
{
  float res = 0.0;
  for (int i = 0; i < dim; i++) res += vec[i] * vec[i];
  return sqrtf(res);
}
void zeroVec(float* vec, int dim) 
{
  for (int i = 0; i < dim; i++) vec[i] = 0.0;
}