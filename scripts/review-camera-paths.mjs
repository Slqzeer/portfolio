import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cameraPath,
  cameraTravel,
  HOME_CAMERA,
} from "../src/room/cameraPaths.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, "assets/reviews");
const snapshot = JSON.parse(
  fs.readFileSync(path.join(directory, "camera-scene-snapshot.json"), "utf8"),
);
const anchors = new Map(snapshot.anchors.map((a) => [a.name, a]));
const radius = 0.12;

// Exact segment/slab test against conservative expanded world-space bounds.
function intersects(start, end, box) {
  let near = 0,
    far = 1;
  for (let axis = 0; axis < 3; axis++) {
    const delta = end[axis] - start[axis];
    const min = box.min[axis] - radius,
      max = box.max[axis] + radius;
    if (Math.abs(delta) < 1e-9) {
      if (start[axis] < min || start[axis] > max) return false;
    } else {
      let a = (min - start[axis]) / delta,
        b = (max - start[axis]) / delta;
      if (a > b) [a, b] = [b, a];
      near = Math.max(near, a);
      far = Math.min(far, b);
      if (near > far) return false;
    }
  }
  return true;
}

assert(
  intersects([-2, 0, 0], [2, 0, 0], { min: [-1, -1, -1], max: [1, 1, 1] }),
);
assert(
  !intersects([-2, 2, 0], [2, 2, 0], { min: [-1, -1, -1], max: [1, 1, 1] }),
);
assert(intersects([0, 0, 0], [0, 0, 0], { min: [-1, -1, -1], max: [1, 1, 1] }));

const routes = snapshot.anchors
  .filter((a) => a.name !== HOME_CAMERA)
  .map((target) => {
    const names = cameraPath(target.name);
    const segments = names.slice(1).map((name, i) => {
      const from = anchors.get(names[i]),
        to = anchors.get(name);
      assert(from && to, `Missing route anchor: ${name}`);
      return {
        from: from.name,
        to: to.name,
        intersections: snapshot.mesh_bounds
          .filter((box) => intersects(from.position, to.position, box))
          .map((box) => box.name),
      };
    });
    return { target: target.name, anchors: names, segments };
  });
const directPhone = snapshot.mesh_bounds
  .filter((box) =>
    intersects(
      anchors.get(HOME_CAMERA).position,
      anchors.get("CAM_Anchor_Smartphone").position,
      box,
    ),
  )
  .map((box) => box.name);
const report = {
  travel: cameraTravel,
  source: snapshot.source,
  method:
    "Segment versus world AABB expanded by 0.12 scene units; camera centre only, no frustum/occlusion guarantee",
  rejectedDirectPhonePath: directPhone,
  routes,
};
fs.writeFileSync(
  path.join(directory, "camera-path-review.json"),
  JSON.stringify(report, null, 2) + "\n",
);

const escape = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
const x = (v) => 90 + (v + 7) * 68;
const y = (v) => 120 + (6 - v) * 68;
const parts = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1000" viewBox="0 0 1100 1000"><rect width="1100" height="1000" fill="#f6f0e6"/><style>text{font-family:Arial,sans-serif;fill:#243039}.label{font-size:13px}.title{font-size:27px;font-weight:bold}</style><text x="35" y="42" class="title">Chambre — passages caméra et zones d’interaction</text><text x="35" y="70" font-size="14">Vue de dessus · coordonnées Blender · les traits ne représentent pas la hauteur</text>`,
];
const zones = ["Desk", "Chair", "Sofa", "Bookshelf", "Rack", "CoffeeTable"];
for (const zone of zones) {
  const boxes = snapshot.mesh_bounds.filter((b) => b.name.includes(zone));
  if (!boxes.length) continue;
  const min = [0, 1].map((i) => Math.min(...boxes.map((b) => b.min[i]))),
    max = [0, 1].map((i) => Math.max(...boxes.map((b) => b.max[i])));
  parts.push(
    `<rect x="${x(min[0])}" y="${y(max[1])}" width="${(max[0] - min[0]) * 68}" height="${(max[1] - min[1]) * 68}" rx="7" fill="#d6dce0" stroke="#8799a4"/><text class="label" x="${x(min[0]) + 6}" y="${y(max[1]) + 18}">${zone}</text>`,
  );
}
const desk = anchors.get("CAM_Anchor_Desk"),
  monitor = anchors.get("CAM_Anchor_Monitor"),
  phone = anchors.get("CAM_Anchor_Smartphone");
const entry = { position: [-6.8, -4.8, 7.8] };
const drawLine = (a, b, color, dash = "") =>
  parts.push(
    `<line x1="${x(a.position[0])}" y1="${y(a.position[1])}" x2="${x(b.position[0])}" y2="${y(b.position[1])}" stroke="${color}" stroke-width="3" stroke-dasharray="${dash}"/>`,
  );
drawLine(entry, phone, "#c86c68", "8 6");
drawLine(entry, desk, "#167d72");
drawLine(desk, monitor, "#167d72");
drawLine(desk, phone, "#167d72");
for (const a of snapshot.anchors.filter((a) => a.name !== HOME_CAMERA)) {
  const short = a.name.replace("CAM_Anchor_", "");
  parts.push(
    `<circle cx="${x(a.position[0])}" cy="${y(a.position[1])}" r="6" fill="#167d72"/><text class="label" x="${x(a.position[0]) + 10}" y="${y(a.position[1]) - 8}">${escape(short)} · z=${a.position[2].toFixed(2)}</text>`,
  );
}
parts.push(
  `<text x="35" y="920" font-size="16">Vert : approche bureau puis écran ou téléphone. Rouge : approche téléphone directe rejetée.</text><text x="35" y="946" font-size="14">CAM_Overview hors champ (−18,94 ; −20,00 ; 16,11) : entrée schématisée en bord de plan.</text><text x="35" y="972" font-size="14">Contrôle conservateur du centre de caméra ; cadrage et occultations à vérifier dans le navigateur.</text></svg>`,
);
fs.writeFileSync(
  path.join(directory, "camera-navigation-plan.svg"),
  parts.join("\n"),
);
const failures = routes.flatMap((r) =>
  r.segments.filter((s) => s.intersections.length),
);
assert.equal(failures.length, 0, JSON.stringify(failures));
console.log(
  `Reviewed ${routes.length} routes with ${radius} clearance; all configured segments clear. Direct phone route rejected: ${directPhone.join(", ")}.`,
);
