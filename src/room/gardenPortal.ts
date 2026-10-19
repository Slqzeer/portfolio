import { Material } from "three";

export const gardenSunlight = { value: 1.5 };

// Match Blender's holdout aperture so a full-depth garden stays behind the window.
export function clipGardenMaterial(material: Material) {
  const compile = material.onBeforeCompile.bind(material);
  const cacheKey = material.customProgramCacheKey();
  material.customProgramCacheKey = () => `${cacheKey}:garden-aperture`;
  material.onBeforeCompile = (shader, renderer) => {
    compile(shader, renderer);
    shader.uniforms.gardenSunlight = gardenSunlight;
    shader.vertexShader = `varying vec3 gardenWorldPosition;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      "#include <project_vertex>\ngardenWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
    );
    shader.fragmentShader = `varying vec3 gardenWorldPosition;\nuniform float gardenSunlight;\n${shader.fragmentShader}`;
    // Blender LIGHT_Daylight direction, converted from Z-up to the web's Y-up.
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_end>",
      `#include <lights_fragment_end>
      vec3 gardenNormal = transformDirectionByInverseViewMatrix(normal, viewMatrix);
      reflectedLight.directDiffuse += diffuseColor.rgb * gardenSunlight *
        max(dot(gardenNormal, normalize(vec3(-0.2507, 0.7420, -0.6217))), 0.0);`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <clipping_planes_fragment>",
      `#include <clipping_planes_fragment>
      vec3 gardenRayDirection = isOrthographic
        ? -vec3(viewMatrix[0].z, viewMatrix[1].z, viewMatrix[2].z)
        : normalize(gardenWorldPosition - cameraPosition);
      if (cameraPosition.z <= -5.14 || gardenRayDirection.z >= -0.0001) discard;
      float gardenRayT = (-5.14 - gardenWorldPosition.z) / gardenRayDirection.z;
      vec3 gardenAperture = gardenWorldPosition + gardenRayDirection * gardenRayT;
      if (gardenRayT > 0.0 || gardenAperture.x < -4.48 || gardenAperture.x > -0.32 ||
          gardenAperture.y < 1.9 || gardenAperture.y > 4.73) discard;`,
    );
  };
}
