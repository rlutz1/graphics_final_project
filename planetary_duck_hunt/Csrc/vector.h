#ifndef VECTOR_H
#define VECTOR_H

void vectorAdd(float* target, const float* v1, const float* v2, int dim);

void vectorSubtract(float* target, const float* v1, const float* v2, int dim);

void vectorScalar(float* vec, float scalar, int dim);

float vecMagnitude(float* vec, int dim);

void zeroVec(float* vec, int dim);

#endif