attribute vec3 aPosition;
attribute vec2 aTexCoord;

// This varying variable is passed on to the fragment shader if needed
varying vec2 vTexCoord;

void main() {
  // Copy the texcoord attribute
  vTexCoord = aTexCoord;
   
  // Convert the vertex position from [0..1] range to [-1..1]
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;

  // Standard final position
  gl_Position = positionVec4;
}
