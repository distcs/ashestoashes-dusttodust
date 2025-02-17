#ifdef GL_ES
precision highp float;
#endif
#define PI 3.14159265359
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_pixelDensity;
uniform vec2 u_mouse;
varying vec2 vTexCoord;
uniform sampler2D u_prevFrame;
uniform float u_seed;
uniform float u_speed;
uniform float u_noiseScale;
uniform float u_aniScale;
uniform float u_noiseExpo1;
uniform float u_noiseExpo2;
uniform float u_chroAber;
uniform float u_red;
uniform float u_rgbd;
uniform float u_scl;
uniform float u_color;
uniform float u_noiseB;
uniform float u_sortAm;
uniform float u_shake;
uniform float u_add;
uniform float u_kali;
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * u_seed);
}
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
     vec2 u;
    if(u_noiseB == 0.0){
    u = f * f * (3.0 - 2.0 * f);
    }else{
    u = f / f / (3.0 - 2.0 * f);
    }
    return mix (a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float grain(vec2 st) {
    return random(st);
}
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.8;
    vec2 shift = vec2(10.0);
    for (int i = 0; i < 10; i++) {
        value += amplitude * noise(st);
        st = st * 2.0 + shift; 
        amplitude *= 0.6;
    }
    return value;
}
float ridgedFBM(vec2 st) {
    float total = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for(int i=0; i<100; i++){
        float n = 1.0 - abs(noise(st * frequency)*2.0 - 1.0);
        total += n * amplitude;
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return total;
}
void main() {
    vec2 adjustedResolution = u_resolution / u_pixelDensity;
    vec2 st = gl_FragCoord.xy / adjustedResolution;
    st.y = 1.0 - st.y;
vec2 animatedCoords = vec2(
st.x,
(st.y + u_time * (0.15/ u_speed) + u_add)/u_aniScale
);
float yShift = u_add * 0.0001; 
animatedCoords.y += yShift;
float n = noise(animatedCoords * 1.0)
+ cos(ridgedFBM(animatedCoords * 1.0/u_noiseScale) * 10.0 + (animatedCoords.x * 10.0 - (u_time/u_speed)* 0.25)) * u_noiseExpo1
+ tan(ridgedFBM(animatedCoords * 1.0/u_noiseScale) * 10.0 + animatedCoords.y * 1.0 - (u_time/u_speed)* 0.25) * u_noiseExpo2;
vec3 color = vec3(n);
color = clamp(color, 0.0, 1.0);
if(u_red == 1.0){
float redThreshold = 3.1;   
float redSmooth = 1.1;       
float redMask = smoothstep(redThreshold, redThreshold + redSmooth, n);
if(u_color == 0.0){
color = mix(color, vec3(0.6, 0.0, 0.0), redMask);
}else{
color = mix(color, vec3(0.0, 0.0, 0.5), redMask);
}}
vec2 warp = vec2(
(noise(animatedCoords * 200.0 - 1.0) * 0.0001),
(noise(animatedCoords * 2.0 - 1.0) )
);
warp *= 0.5/ u_speed;
float grainAmount = 0.1; 
color += grain(st) * grainAmount;
color -= 0.1;
float line = step(0.999, st.y);
color = mix(color, vec3(0.2), line);
vec4 prevColor = texture2D(u_prevFrame, st + warp * 0.02);
float fadeAlpha = 0.01;
vec3 feedbackColor = mix(prevColor.rgb, color, 0.008);
color = prevColor.rgb * 0.96 + color * 0.04 ;
color = mix(color, feedbackColor, fadeAlpha);
vec2 aberration = vec2(0.002, 0.0); 
float rChannel = texture2D(u_prevFrame, st - aberration).r;
float gChannel = texture2D(u_prevFrame, st).g;
float bChannel = texture2D(u_prevFrame, st + aberration).b;
vec3 chromaColor = vec3(rChannel, gChannel, bChannel);
float aberrationStrength = u_chroAber; 
color = mix(color, chromaColor, aberrationStrength);
vec2 rOffset = (ridgedFBM(st * 10.0 + (u_time/u_speed)) - 0.5) * 0.005 * vec2(1.0, 0.0);
vec2 gOffset = vec2(0.0, 0.0);//(noise(st * 10.0 + 1.0 + u_time) - 0.5) * 0.005 * vec2(0.0, 1.0);
vec2 bOffset = vec2(0.0, 0.0);//(noise(st * 10.0 + 2.0 + u_time) - 0.5) * 0.005 * vec2(1.0, 1.0);
float rSplit = texture2D(u_prevFrame, clamp(st + rOffset, 0.0, 1.0)).r;
float gSplit = texture2D(u_prevFrame, clamp(st + gOffset, 0.0, 1.0)).g;
float bSplit = texture2D(u_prevFrame, clamp(st + bOffset, 0.0, 1.0)).b;
vec3 splitColor = vec3(rSplit, gSplit, bSplit);
color = mix(color, splitColor, u_rgbd);
vec3 baseColor = color;
float N = 12.0;
vec2 center = vec2(0.5, 0.5);
vec2 delta = st - center;
float angle = atan(delta.y, delta.x);
float radius = length(delta);
angle = mod(angle, 2.0 * PI / N);
vec2 uv = center + vec2(cos(angle), sin(angle)) * radius;
vec3 effectColor = texture2D(u_prevFrame, clamp(uv, 0.0, 1.0)).rgb;
float effectStrength = u_kali;
color = mix(baseColor, effectColor, effectStrength);
float shakeAmp = 0.02 * sin(u_time * 50.0);
vec2 uvS = st;
uvS.x += shakeAmp;
vec3 effectColorS = texture2D(u_prevFrame, clamp(uvS, 0.0, 1.0)).rgb;
float effectStrengthS;
if(u_shake == 0.0){
effectStrengthS = 0.0;
}else{
effectStrengthS = 0.5;
}
color = mix(color, effectColorS, effectStrengthS);
gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
