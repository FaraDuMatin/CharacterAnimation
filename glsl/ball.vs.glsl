
out vec3 interpolatedNormal;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    interpolatedNormal = normalMatrix * normal;
}
