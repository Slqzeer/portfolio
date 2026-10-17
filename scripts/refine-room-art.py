"""Create an editable art revision, preserving both original Blender files.

blender --background --factory-startup --python scripts/refine-room-art.py
"""
from pathlib import Path
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/blender/art-v2"
OUT.mkdir(parents=True, exist_ok=True)
COPY = {
    "ContactCard_Name": "Martin Couturier",
    "ContactCard_Role": "Etudiant / Developpeur fullstack",
    "ContactCard_Email_Label": "Echangeons",
    "ContactCard_Email_Value": "LinkedIn / GitHub",
    "ContactCard_GitHub_Value": "github.com/Slqzeer",
    "ContactCard_LinkedIn_Value": "linkedin.com/in/martin-couturier",
    "Diploma_Title": "FORMATION EN COURS",
    "Diploma_Name": "Martin Couturier",
    "Diploma_Promotion": "Cinquieme annee",
    "Diploma_Specialty": "Conception / Developpement / Qualite",
    "Diploma_Detail": "Une formation, des projets et une experience fullstack chez CACIB",
}
CODE = [
    "# ClassPulse / backend quality", "from fastapi import FastAPI", "", "app = FastAPI(title=\"ClassPulse\")", "",
    "# Concevoir. Tester. Verifier.", "# Un accompagnement pour les etudiants.", "", "@app.get(\"/health\")", "def health():", "    return {\"status\": \"ok\"}", "",
    "def test_health(client):", "    response = client.get(\"/health\")", "    assert response.status_code == 200", "    assert response.json() == {\"status\": \"ok\"}", "", "# Martin Couturier", "# Conception et verification du backend", "# Python / FastAPI", "", "# Illustration du travail de verification", "# github.com/Slqzeer",
]

def bsdf(material):
    return next(n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED")

def color(name, value, roughness=None):
    material = bpy.data.materials.get(name)
    if not material:
        return
    node = bsdf(material)
    for link in list(node.inputs["Base Color"].links):
        material.node_tree.links.remove(link)
    node.inputs["Base Color"].default_value = (*value, 1)
    if roughness is not None:
        node.inputs["Roughness"].default_value = roughness

def fabric(name, dark, light, scale):
    material = bpy.data.materials[name]
    tree = material.node_tree
    node = bsdf(material)
    for link in list(node.inputs["Base Color"].links):
        tree.links.remove(link)
    noise = tree.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 2
    ramp = tree.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*dark, 1)
    ramp.color_ramp.elements[1].color = (*light, 1)
    tree.links.new(noise.outputs["Fac"], ramp.inputs[0])
    tree.links.new(ramp.outputs["Color"], node.inputs["Base Color"])
    node.inputs["Roughness"].default_value = .92

def materials():
    color("MAT_Review_Wall_BlueGrey", (.48, .54, .46), .9)
    color("MAT_Review_Wall_Cap", (.35, .40, .34), .8)
    color("MAT_Rack_Metal", (.065, .085, .078), .4)
    color("MAT_Chair_Fabric", (.055, .075, .067), .88)
    color("MAT_Diploma_Print", (.14, .22, .19), .88)
    color("MAT_Diploma_Frame", (.07, .10, .085), .6)
    color("MAT_Lamp_Base", (.22, .14, .065), .35)
    color("MAT_Lamp_Shade", (.72, .64, .47), .85)
    fabric("MAT_Sofa_Fabric", (.055, .14, .12), (.085, .19, .16), 110)
    fabric("MAT_Rug_Wool", (.44, .39, .29), (.54, .49, .39), 150)
    rug = bpy.data.materials["MAT_Rug_Wool"].node_tree
    coordinates = rug.nodes.new("ShaderNodeTexCoord")
    split = rug.nodes.new("ShaderNodeSeparateXYZ")
    rug.links.new(coordinates.outputs["Generated"], split.inputs[0])
    distances = []
    for component in ("X", "Y"):
        opposite = rug.nodes.new("ShaderNodeMath")
        opposite.operation = "SUBTRACT"
        opposite.inputs[0].default_value = 1
        rug.links.new(split.outputs[component], opposite.inputs[1])
        minimum = rug.nodes.new("ShaderNodeMath")
        minimum.operation = "MINIMUM"
        rug.links.new(split.outputs[component], minimum.inputs[0])
        rug.links.new(opposite.outputs[0], minimum.inputs[1])
        distances.append(minimum.outputs[0])
    edge = rug.nodes.new("ShaderNodeMath")
    edge.operation = "MINIMUM"
    for index, distance in enumerate(distances):
        rug.links.new(distance, edge.inputs[index])
    border = rug.nodes.new("ShaderNodeValToRGB")
    border.color_ramp.elements[0].position = .025
    border.color_ramp.elements[0].color = (.12, .21, .17, 1)
    border.color_ramp.elements[1].position = .045
    border.color_ramp.elements[1].color = (.50, .45, .35, 1)
    rug.links.new(edge.outputs[0], border.inputs[0])
    rug.links.new(border.outputs[0], bsdf(bpy.data.materials["MAT_Rug_Wool"]).inputs["Base Color"])
    for name in ("MAT_Lamp_Shade", "MAT_Lamp_Bulb"):
        material = bpy.data.materials[name]
        for node in material.node_tree.nodes:
            socket = node.inputs.get("Emission Color") if node.type == "BSDF_PRINCIPLED" else node.inputs.get("Color") if node.type == "EMISSION" else None
            if socket:
                for link in list(socket.links):
                    material.node_tree.links.remove(link)
                for frame in (1, 23, 24):
                    socket.default_value = (1, .63, .30, 1)
                    socket.keyframe_insert(data_path="default_value", frame=frame)
                strength = node.inputs.get("Emission Strength") or node.inputs.get("Strength")
                if strength:
                    for frame, value in ((1, .025), (23, 1.8), (24, 1.8)):
                        strength.default_value = value
                        strength.keyframe_insert(data_path="default_value", frame=frame)
    lamp = bpy.data.objects["LIGHT_Lamp"]
    for frame in (1, 23, 24):
        lamp.data.color = (1, .67, .38)
        lamp.data.keyframe_insert(data_path="color", frame=frame)
    fill = bpy.data.objects["LIGHT_Fill"]
    fill.location = (-3, -4, 6)
    fill.rotation_euler = (Vector((-1, 1, 2)) - fill.location).to_track_quat('-Z', 'Y').to_euler()
    fill.data.size = 7
    fill.data.color = (.65, .75, .68)
    for frame, energy in ((1, 0), (23, 100), (24, 100)):
        fill.data.energy = energy
        fill.data.keyframe_insert(data_path="energy", frame=frame)

font_records = []
for source, output in (("portfolio-room.blend", "portfolio-room.blend"), ("portfolio-room-optimized.blend", "portfolio-room-optimized.blend")):
    bpy.ops.wm.open_mainfile(filepath=str(ROOT / "assets/blender" / source))
    scene = bpy.context.scene
    scene.frame_set(1)
    materials()
    if not font_records:
        for obj in scene.objects:
            if obj.type != "FONT":
                continue
            if obj.name in COPY:
                obj.data.body = COPY[obj.name]
            if obj.name.startswith("IDLE_Monitor_Code_"):
                obj.data.body = CODE[int(obj.name.rsplit("_", 1)[1])] or " "
            # Longer names and the LinkedIn address must fit the existing frames.
            if obj.name in ("ContactCard_Name", "Diploma_Name"):
                obj.data.size *= .78
            if obj.name == "ContactCard_LinkedIn_Value":
                obj.data.size *= .75
            font_records.append({"name":obj.name, "font":obj.data.font.name, "matrix":[list(row) for row in obj.matrix_world], "body":obj.data.body, "properties":{key:getattr(obj.data,key) for key in ("size","align_x","align_y","space_character","space_word","extrude","bevel_depth")}, "materials":[m.name for m in obj.data.materials]})
    else:
        removable = [o for o in scene.objects if o.name.startswith("IDLE_Monitor_Code_") or o.type == "MESH" and o.name.startswith(("Diploma_Assembly__MAT_Diploma_Ink", "ContactCard_Assembly__MAT_ContactCard_Ink"))]
        # Keep geometry and lightmap UVs of the frames, replace only the printed lettering.
        for obj in removable:
            bpy.data.objects.remove(obj, do_unlink=True)
        for record in font_records:
            old = bpy.data.objects.get(record["name"])
            if old:
                bpy.data.objects.remove(old, do_unlink=True)
            data = bpy.data.curves.new(record["name"], type="FONT")
            data.body = record["body"]
            font = bpy.data.fonts.get(record["font"])
            if font:
                data.font = font
            for key, value in record["properties"].items():
                setattr(data, key, value)
            for name in record["materials"]:
                data.materials.append(bpy.data.materials[name])
            obj = bpy.data.objects.new(record["name"], data)
            scene.collection.objects.link(obj)
            parent_name = "Monitor_Assembly" if record["name"].startswith("IDLE_") else "ContactCard_Assembly" if record["name"].startswith("Contact") else "Diploma_Assembly"
            obj.parent = bpy.data.objects[parent_name]
            obj.matrix_parent_inverse = obj.parent.matrix_world.inverted()
            obj.matrix_world = Matrix(record["matrix"])
    assert all(o.data.body != "Prénom Nom" for o in scene.objects if o.type == "FONT")
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / output))
    print(f"[art] {output}: {len(font_records)} personalized text objects", flush=True)
