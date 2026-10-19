import {
  Light,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Color,
  DataTexture,
  ShaderChunk,
  Texture,
} from "three";
import type { Lighting } from "../app/appState";
import type { Locale } from "../content/types";
import { sceneManifest } from "./sceneManifest";
import { clipGardenMaterial } from "./gardenPortal";
export type LightmapKey = `LM_${"props" | "shell"}_${Lighting}`;

type Environments = Record<Lighting, Texture>;
const FLAT_LIGHT = { day: 2, night: 0.1 };
const WHITE = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
WHITE.needsUpdate = true;
const localeFlags: Record<Locale, string> = { fr: "Flag_FR", en: "Flag_EN" };
const interactiveNames = Object.values(sceneManifest).map(
  ({ nodeName }) => nodeName,
);
const anchorNames = [
  "CAM_Overview",
  ...Object.values(sceneManifest).flatMap(({ cameraAnchorName }) =>
    cameraAnchorName ? [cameraAnchorName] : [],
  ),
];
const IBL_DIFFUSE = "iblIrradiance += getIBLIrradiance( geometryNormal );";
const LIGHTS_WITHOUT_IBL_DIFFUSE = ShaderChunk.lights_fragment_maps.replace(
  IBL_DIFFUSE,
  "",
);
const blends = new WeakMap<
  Material,
  { map: { value: Texture }; gain: { value: number } }
>();

// The lightmap already holds all diffuse light; three.js would add the
// environment's diffuse on top and wash the bake out. Keep only its reflections.
function withoutIblDiffuse(material: Material) {
  const blend = { map: { value: WHITE as Texture }, gain: { value: 0 } };
  blends.set(material, blend);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.roomNightMap = blend.map;
    shader.uniforms.roomNightGain = blend.gain;
    shader.fragmentShader =
      "uniform sampler2D roomNightMap;\nuniform float roomNightGain;\n" +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_maps>",
      LIGHTS_WITHOUT_IBL_DIFFUSE.replace(
        "vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;",
        "vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity + texture2D( roomNightMap, vLightMapUv ).rgb * roomNightGain;",
      ),
    );
  };
}

function applyLightmaps(
  materials: Material[],
  textures: Record<LightmapKey, Texture>,
  { dayMap, nightMap }: { dayMap: number; nightMap: number },
  scales: Record<LightmapKey, number>,
  environments?: Environments,
  exposure: Record<Lighting, number> = { day: 1, night: 1 },
) {
  for (const material of materials) {
    const lit = material as MeshStandardMaterial;
    if (!lit.lightMap || (environments && !lit.envMap)) lit.needsUpdate = true;
    if (environments) {
      lit.envMap = environments[dayMap >= nightMap ? "day" : "night"];
      lit.envMapIntensity = exposure.day * dayMap + exposure.night * nightMap;
    }
    if (
      material.userData.lightmapAtlas === "blind" ||
      material.userData.lightmapAtlas === "exterior"
    ) {
      const exterior = material.userData.lightmapAtlas === "exterior";
      // Keep ambient fill, but retain directional diffuse to reveal the slat faces.
      lit.lightMap = WHITE;
      lit.lightMapIntensity =
        (exterior ? 0.15 : 1) * exposure.day * dayMap +
        FLAT_LIGHT.night * exposure.night * nightMap;
      if (environments) lit.envMap = environments.day;
      lit.envMapIntensity =
        (exterior ? 1.6 : 0.6) * exposure.day * dayMap +
        0.1 * exposure.night * nightMap;
      continue;
    }
    if (!blends.has(material)) withoutIblDiffuse(material);
    const blend = blends.get(material)!;
    if (material.userData.lightmapAtlas === "flat") {
      lit.lightMap = WHITE;
      lit.lightMapIntensity = FLAT_LIGHT.day * exposure.day * dayMap;
      blend.map.value = WHITE;
      blend.gain.value = FLAT_LIGHT.night * exposure.night * nightMap;
      continue;
    }
    const dayKey = `LM_${material.userData.lightmapAtlas}_day` as LightmapKey;
    const nightKey =
      `LM_${material.userData.lightmapAtlas}_night` as LightmapKey;
    lit.lightMap = textures[dayKey];
    blend.map.value = textures[nightKey];
    blend.gain.value = scales[nightKey] * exposure.night * nightMap * Math.PI;
    // Blender bakes the light a surface receives (shade = albedo × bake); three.js
    // treats lightMap as irradiance and divides it by π (Lambert).
    lit.lightMapIntensity = scales[dayKey] * exposure.day * dayMap * Math.PI;
  }
}

export function prepareRoomScene(source: Object3D) {
  for (const nodeName of [
    ...Object.values(sceneManifest).map(({ nodeName }) => nodeName),
    ...Object.values(localeFlags),
    ...anchorNames,
  ]) {
    if (!source.getObjectByName(nodeName)) {
      throw new Error(`Missing required room node: ${nodeName}`);
    }
  }

  const scene = source.clone(true);
  // The GLB exports Flag_EN with a stray transform; both canvases share bounds.
  const [fr, en] = Object.values(localeFlags).map((name) =>
    scene.getObjectByName(name)!,
  );
  en.position.copy(fr.position);
  en.quaternion.copy(fr.quaternion);
  en.scale.copy(fr.scale);
  const materials = prepareLighting(scene);
  const baked = materials.filter((material) => material.userData.lightmapAtlas);
  const exterior = materials
    .filter(
      (material) =>
        material instanceof MeshStandardMaterial &&
        material.userData.roomExterior,
    )
    .map((material) => {
      const lit = material as MeshStandardMaterial;
      return {
        material: lit,
        base: lit.emissiveIntensity,
        day: lit.emissive.clone(),
        night: lit.emissive.clone().multiply(new Color("#718bb2")),
      };
    });
  const exposure = {
    day:
      typeof scene.userData.web_exposure_day === "number"
        ? scene.userData.web_exposure_day
        : 1,
    night:
      typeof scene.userData.web_exposure_night === "number"
        ? scene.userData.web_exposure_night
        : 1,
  };
  return {
    scene,
    anchors: Object.fromEntries(
      anchorNames.map((name) => [name, scene.getObjectByName(name)!]),
    ),
    setLocale(locale: Locale) {
      showLocaleFlag(scene, locale);
    },
    setTheme(lighting: Lighting) {
      showDeviceTheme(scene, lighting);
    },
    configureLighting(textures: Texture[], anisotropy: number) {
      for (const texture of [
        ...textures,
        ...baked.flatMap((material) =>
          Object.values(material).filter(
            (value): value is Texture => value instanceof Texture,
          ),
        ),
      ])
        texture.anisotropy = anisotropy;
    },
    applyLighting(
      frame: { dayMap: number; nightMap: number; windowView: number },
      textures: Record<LightmapKey, Texture>,
      scales: Record<LightmapKey, number>,
      environments?: Environments,
    ) {
      applyLightmaps(baked, textures, frame, scales, environments, exposure);
      exterior.forEach(({ material, base, day, night }) => {
        material.emissiveIntensity = base * frame.windowView;
        material.emissive.lerpColors(day, night, frame.nightMap);
      });
    },
    dispose() {
      materials.forEach((material) => material.dispose());
    },
  };
}

function lightmapAtlas(object: Object3D): string | undefined {
  for (let node: Object3D | null = object; node; node = node.parent) {
    const atlas = node.userData.lightmap_atlas;
    if (typeof atlas === "string") return atlas;
  }
}

// Blender's lights stay as hidden anchors for RoomLighting, which recreates
// them; baked meshes get one material clone per lightmap atlas.
function prepareLighting(scene: Object3D) {
  scene.traverse((object) => {
    // glTF puts multi-material mesh extras on the parent of its primitives.
    if (object.parent?.userData.exterior_surface)
      object.userData.exterior_surface = true;
    if (object instanceof Light) object.visible = false;
  });

  const baked = new Map<string, Material>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    // Slats and modeled scenery need normal-dependent shading to retain depth.
    const atlas =
      object.userData.exterior_surface && object.name !== "EMIT_WindowView"
        ? "exterior"
        : object.name.startsWith("Blind_Slat_")
          ? "blind"
          : (object.geometry.attributes.uv1 && lightmapAtlas(object)) || "flat";
    const bake = (material: Material) => {
      // Animated objects need independent materials even when the GLB shares them.
      const interactive = interactiveNames.some((name) => {
        for (let node: Object3D | null = object; node; node = node.parent)
          if (node.name === name) return true;
        return false;
      });
      const key = [
        material.uuid,
        atlas,
        interactive ? object.uuid : "",
        !!object.userData.device_surface,
        !!object.userData.device_hidden_base,
        !!object.userData.exterior_surface,
      ].join(":");
      if (!baked.has(key)) {
        const clone = material.clone();
        // Hide just the old phone display, keeping its notification children visible.
        if (object.userData.device_hidden_base) clone.visible = false;
        if (object.userData.device_surface) {
          // These are emissive displays authored in Blender, with exact site colours.
          clone.toneMapped = false;
        } else {
          clone.userData.lightmapAtlas = atlas;
        }
        // three.js lays sheen over the flat lightmap irradiance as a grey veil,
        // turning the navy sofa and rug slate; the bake already shades them.
        if (clone instanceof MeshPhysicalMaterial) clone.sheen = 0;
        if (
          atlas !== "blind" &&
          atlas !== "exterior" &&
          !object.userData.device_surface
        )
          withoutIblDiffuse(clone);
        if (object.userData.exterior_surface) clipGardenMaterial(clone);
        clone.userData.roomExterior =
          object.name === "EMIT_WindowView" ||
          !!object.userData.exterior_surface;
        baked.set(key, clone);
      }
      return baked.get(key)!;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(bake)
      : bake(object.material);
  });
  return [...baked.values()];
}

function showLocaleFlag(scene: Object3D, locale: Locale) {
  for (const [flagLocale, nodeName] of Object.entries(localeFlags)) {
    scene.getObjectByName(nodeName)!.visible = flagLocale === locale;
  }
}

function showDeviceTheme(scene: Object3D, lighting: Lighting) {
  scene.traverse((object) => {
    if (object.userData.screen_theme) {
      object.visible = object.userData.screen_theme === lighting;
    }
    if (!(object instanceof Mesh)) return;
    for (const material of [object.material].flat()) {
      if (
        !(material instanceof MeshStandardMaterial) ||
        !material.userData.screen_palette
      )
        continue;
      const palette = JSON.parse(material.userData.screen_palette) as Record<
        Lighting,
        [number, number, number]
      >;
      material.emissive.setRGB(...palette[lighting]);
    }
  });
}

export type PreparedRoom = ReturnType<typeof prepareRoomScene>;
