"""Rebuild the G1 hero from the retained CC0 source using Blender 5.2.
Run: blender --background --factory-startup --python scripts/author-hero.py
"""
import bpy, math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets-source/hero/casual.glb'))
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
rig.animation_data.action = None
for track in list(rig.animation_data.nla_tracks):
    rig.animation_data.nla_tracks.remove(track)
keep = {'Idle_Neutral': 'hero_idle', 'Walk': 'hero_walk', 'Run': 'hero_sprint'}
for action in list(bpy.data.actions):
    key = action.name.split('|')[-1]
    if key not in keep:
        bpy.data.actions.remove(action)
    else:
        action.name = keep[key]
        track = rig.animation_data.nla_tracks.new()
        track.name = action.name
        strip = track.strips.new(action.name, 0, action)
        track.mute = True
rig.data.pose_position = 'REST'
bpy.context.view_layer.update()

def color(hex):
    rgb = [int(hex[i:i+2], 16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c < .04045 else ((c+.055)/1.055)**2.4 for c in rgb)+(1,)

palette = {'LightBrown':'3c7774', 'LightBlue':'353d40', 'White':'c8c2b4',
           'Red_Dark':'555957', 'Hair':'443c36', 'Eyebrows':'403830'}
for mat in bpy.data.materials:
    bsdf = mat.node_tree.nodes.get('Principled BSDF') if mat.use_nodes else None
    if bsdf:
        if mat.name in palette: bsdf.inputs['Base Color'].default_value = color(palette[mat.name])
        bsdf.inputs['Metallic'].default_value = 0
        bsdf.inputs['Roughness'].default_value = .88

def material(name, hex):
    mat = bpy.data.materials.new(name)
    mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=color(hex)
    bsdf.inputs['Roughness'].default_value=.9
    return mat

canvas=material('Canvas','aa9673')
strap=material('Canvas seams','73644f')
hair=bpy.data.materials['Hair']

def attach(obj, bone):
    # Rigid weights in the same rest coordinates as the source; no simulation.
    world=obj.matrix_world.copy()
    obj.parent=rig
    obj.matrix_world=world
    group=obj.vertex_groups.new(name=bone)
    group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    mod=obj.modifiers.new('Hero rig','ARMATURE'); mod.object=rig

def box(name, center, size, mat, bone, bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj=bpy.context.object; obj.name=name; obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=obj.modifiers.new('Sewn corners','BEVEL'); mod.width=bevel; mod.segments=2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat); attach(obj,bone)
    return obj

# Blender is Z-up, character faces -Y. Compact soft daypack, above hips.
box('recycling daypack',(0,.135,1.245),(.285,.145,.37),canvas,'Chest',.045)
box('daypack pocket',(0,.22,1.205),(.21,.025,.17),strap,'Chest',.015)
for side in (-1,1):
    box('shoulder strap',(side*.115,-.153,1.345),(.035,.018,.28),strap,'Chest',.009)
    box('strap shoulder',(side*.115,-.035,1.49),(.035,.235,.022),strap,'Chest',.009)
# A broad, tapered moustache silhouette with a subtle centre notch.
verts=[(-.055,-.165,1.653),(-.028,-.179,1.664),(0,-.178,1.66),
       (.028,-.179,1.664),(.055,-.165,1.653),(.049,-.17,1.642),
       (.013,-.178,1.648),(0,-.18,1.646),(-.013,-.178,1.648),(-.049,-.17,1.642)]
mesh=bpy.data.meshes.new('moustache'); mesh.from_pydata(verts,[],[list(range(10))]);mesh.update()
obj=bpy.data.objects.new('hero moustache',mesh);bpy.context.collection.objects.link(obj)
obj.data.materials.append(hair)
solid=obj.modifiers.new('Hair thickness','SOLIDIFY');solid.thickness=.004
bpy.context.view_layer.objects.active=obj
bpy.ops.object.modifier_apply(modifier=solid.name)
attach(obj,'Head')
# Shorter back hair and greying temples give a restrained middle-age direction.
head=bpy.data.objects['Casual2_Head']
inv=head.matrix_world.inverted()
hairids={v for p in head.data.polygons if head.data.materials[p.material_index].name=='Hair' for v in p.vertices}
grey=material('Grey temples','827b70');head.data.materials.append(grey)
for v in head.data.vertices:
    if v.index in hairids:
        p=head.matrix_world@v.co
        if p.y>.06: p.y=.06+(p.y-.06)*.3
        v.co=inv@p
for poly in head.data.polygons:
    p=head.matrix_world@poly.center
    if head.data.materials[poly.material_index].name=='Hair' and abs(p.x)>.075 and p.z<1.74:
        poly.material_index=len(head.data.materials)-1

# Remove importer's bone-display helper, never export scene fixtures.
for obj in list(bpy.data.objects):
    if obj.name=='Icosphere': bpy.data.objects.remove(obj,do_unlink=True)
rig.data.pose_position='POSE'
for track in rig.animation_data.nla_tracks: track.mute=False
bpy.context.scene.render.fps=30
out=ROOT/'public/assets/hero';out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets-source/hero/hero.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'hero.glb'),export_format='GLB',
    export_animation_mode='NLA_TRACKS',export_force_sampling=True,
    export_current_frame=False,export_animations=True,export_skins=True,
    export_yup=True,export_extras=False)
