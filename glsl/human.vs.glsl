attribute vec4 skinIndex;
attribute vec4 skinWeight;

uniform mat4 bones[12];

out vec3 interpolatedNormal;

void main() {
	// 𝑣′ = (∑𝑤𝑗𝑇𝑗) * v
	

	vec4 pos = vec4(position, 1.0);

	vec3 skinned =
		  skinWeight.x * ( (bones[int(skinIndex.x)]) * pos ).xyz
		+ skinWeight.y * ( (bones[int(skinIndex.y)]) * pos ).xyz
		+ skinWeight.z * ( (bones[int(skinIndex.z)]) * pos ).xyz
		+ skinWeight.w * ( (bones[int(skinIndex.w)]) * pos ).xyz;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(skinned, 1.0);

	
	mat3 blended =
		  skinWeight.x * mat3(bones[int(skinIndex.x)])
		+ skinWeight.y * mat3(bones[int(skinIndex.y)])
		+ skinWeight.z * mat3(bones[int(skinIndex.z)])
		+ skinWeight.w * mat3(bones[int(skinIndex.w)]);

	vec3 skinned_normal = normalize(blended * normal);
	interpolatedNormal = skinned_normal;
}

// Inspiré d'un code trouvé sur le site de Carnegie Mellon’s School of Computer Science : https://graphics.cs.cmu.edu/courses/15-466-f17/notes/skinning.html