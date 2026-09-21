"""G2 authored eastern court. Blender 5.2; deterministic, local, no downloads.
Coordinates below are game x,y,z converted to Blender x,-z,y.
"""
import bpy, math, random
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent.parent
OUT=R/'public/assets/g2'
SRC=R/'assets-source/g2'
OUT.mkdir(exist_ok=True,parents=True); SRC.mkdir(exist_ok=True,parents=True)
random.seed(2026)
bpy.ops.wm.read_factory_settings(use_empty=True)

def rgba(h):
    v=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(x/12.92 if x<.04045 else ((x+.055)/1.055)**2.4 for x in v)+(1,)

def mat(name,h,rough=.85):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=rgba(h);p.inputs['Roughness'].default_value=rough
    return m

def texture(name,kind):
    n=512; im=bpy.data.images.new(name,width=n,height=n); px=[]
    for y in range(n):
        for x in range(n):
            if kind=='stone':
                row=y//64; xx=(x+(32 if row%2 else 0))%128; yy=y%64
                shade=((row*17+(x+(32 if row%2 else 0))//128*31)%9-4)*1.1
                joint=xx<2 or yy<2
                edge=xx<5 or yy<5
                rgb=(116,114,102) if joint else tuple(c+shade-(7 if edge else 0) for c in (188,182,163))
            elif kind=='leaf':
                # Broad clustered highlights with quiet local leaf marks, no alpha overdraw.
                a=math.sin(x*.095+math.sin(y*.047)*2)*math.sin(y*.11)
                b=math.sin(x*.031+y*.041)
                rgb=tuple(c+a*12+b*8 for c in (105,121,67))
            elif kind=='roof':
                seam=x%128<3 or y%128<3
                rgb=(78,82,78) if seam else (110,115,108)
            else:
                band=18*math.exp(-y/65)
                rgb=tuple(c-band for c in (199,191,172))
            noise=random.uniform(-2.5,2.5)
            px.extend([max(0,min(1,(c+noise)/255)) for c in rgb]+[1])
    im.pixels.foreach_set(px);im.filepath_raw=str(SRC/(name+'.png'));im.file_format='PNG';im.save()
    m=mat(name,'ffffff');p=m.node_tree.nodes.get('Principled BSDF')
    t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im
    m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
    return m

stone=texture('limestone','stone');leaf=texture('foliage','leaf');roof=texture('roof-felt','roof');plaster=texture('plaster','plaster')
metal=mat('powder coated graphite','454d49',.65);trim=mat('limestone coping','c3bdab');bark=mat('bark','625c46')
wood=mat('oiled ash','998269');soil=mat('mulch','514f3d');glass=mat('smoked glazing','405657',.38)
reflection=mat('soft reflected sky','728381',.5);red=mat('SRAP enamel','a14c40',.7)
leafmats=[mat('leaf shadow','4c5b36'),mat('leaf mid','687844'),mat('leaf sun','8a9455')]

def point(p):return (p[0],-p[2],p[1])
def box(name,p,s,m,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=point(p));o=bpy.context.object;o.name=name;o.dimensions=(s[0],s[2],s[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('edge highlights','BEVEL');mod.width=bevel;mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    o.data.materials.append(m);return o

def mesh(name,verts,faces,m):
    data=bpy.data.meshes.new(name);data.from_pydata([point(v) for v in verts],[],faces);data.update()
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);data.materials.append(m)
    return o

def uv(o,scale=1):
    layer=o.data.uv_layers.new(name='AuthoredUV')
    for f in o.data.polygons:
        for i in f.loop_indices:
            v=o.data.vertices[o.data.loops[i].vertex_index].co
            layer.data[i].uv=(v.x*scale,v.z*scale if abs(f.normal.z)<.5 else v.y*scale)

def rod(name,a,b,r1,r2,m):
    av,bv=Vector(point(a)),Vector(point(b));d=bv-av
    bpy.ops.mesh.primitive_cone_add(vertices=9,radius1=r1,radius2=r2,depth=d.length,location=(av+bv)/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(m);return o

def crown(name,p,s,seed):
    rng=random.Random(seed)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=point(p));o=bpy.context.object;o.name=name
    for v in o.data.vertices:
        q=v.co; fac=1+rng.uniform(-.17,.17)+.10*math.sin(q.x*11+q.z*7)
        q.x*=s[0]*fac;q.y*=s[2]*fac;q.z*=s[1]*fac
    o.data.materials.append(leaf);uv(o,1.4)
    for f in o.data.polygons:f.use_smooth=True
    # Opaque broad leaf sprays break the spherical silhouette. No alpha stacks,
    # no animation noise; minimum leaf length .24m is deliberate screen-space detail.
    verts=[];faces=[]
    for i in range(65 if 'tree' in name else 18):
        az=rng.random()*math.tau;el=rng.uniform(-.75,1)
        radial=math.sqrt(1-el*el)
        center=Vector((p[0]+math.cos(az)*radial*s[0],p[1]+el*s[1],p[2]+math.sin(az)*radial*s[2]))
        for j in range(3):
            angle=az+j*2.1;length=rng.uniform(.24,.40)
            direction=Vector((math.cos(angle)*length,.07,math.sin(angle)*length))
            width=Vector((-math.sin(angle)*length*.38,.04,math.cos(angle)*length*.38))
            base=len(verts)
            verts.extend([center,center+direction*.45+width,center+direction,center+direction*.45-width,center+direction*.45+Vector((0,.055,0))])
            faces.extend([(base,base+1,base+4),(base+1,base+2,base+4),(base+2,base+3,base+4),(base+3,base,base+4)])
    spray=mesh(name+' leaf sprays',verts,faces,leafmats[0])
    for m in leafmats[1:]:spray.data.materials.append(m)
    for f in spray.data.polygons:f.material_index=(f.index//12+seed)%3
    return o

# Court paving occupies just the east half; 4 x 4 metre texture, 1 x .5m slabs.
o=mesh('fixed:paving',[(-2,.008,-23.5),(34,.008,-23.5),(34,.008,16),(-2,.008,16)],[(3,2,1,0)],stone);uv(o,.25)
# Deliberate perimeter band and large drain covers at the existing south edge.
for z in (-23.4,15.9):box('fixed:edge',(16,.06,z),(36,.12,.22),trim)
for x in (4,28):
    box('fixed:drain',(x,.065,-23.2),(1.1,.035,.35),metal)
    for j in range(6):box('fixed:drain slots',(x-.45+j*.18,.087,-23.2),(.055,.008,.24),soil,0)

# Two planted footprints, matched to authoritative ellipses; irregular crowns remain inside them.
for index,(cx,cz,w,d,h) in enumerate([(14,5,8,5,1.8),(26,6,6,8,2)]):
    for i in range(40):
        a=i*math.tau/40;b=(i+1)*math.tau/40
        o=mesh('fixed:planter coping',[(cx+math.cos(t)*(w/2+off),y,cz+math.sin(t)*(d/2+off)) for y,off in [(h+.03,-.20),(h+.03,0),(h-.15,0)] for t in (a,b)],[(0,1,3,2),(2,3,5,4)],trim)
    for i in range(18):
        a=i*2.399; radius=math.sqrt((i+.5)/18)
        crown('fixed:shrub',(cx+math.cos(a)*radius*(w/2-.7),h+.1,cz+math.sin(a)*radius*(d/2-.7)),(.65,.45,.6),i+index*30)

# One deciduous family, two asymmetric compositions at the existing tree anchors.
for ti,(cx,cz,sc) in enumerate([(13,5,1),(26,6,1.1)]):
    rod('fixed:trunk',(cx,0,cz),(cx+.18,4.4*sc,cz-.12),.22,.10,bark)
    for i in range(7):
        a=i*2.399+ti;length=1.15 if i<5 else .65;y=4.0+(i%3)*.53
        end=(cx+math.cos(a)*length,y*sc,cz+math.sin(a)*length)
        rod('fixed:branch',(cx+.1,2.7,cz),end,.09,.025,bark)
        crown('fixed:tree',end,(1.02*sc,1.0*sc,.96*sc),100+ti*10+i)

# North hedge is the same hiding mass, with an authored broken top edge.
for i in range(24):crown('fixed:hedge',(6.45+i*.82,1.8,14),(.52,.38,.53),230+i)

# Existing benches remain on their solid ledges; no furnishing blocks new routes.
for x,z in [(11,-7),(3,0)]:
    for i in range(4):box('fixed:bench seat',(x,1.69,z-.25+i*.16),(2.6,.09,.125),wood,.02)
    for y in (1.87,2.06):box('fixed:bench back',(x,y,z+.32),(2.6,.14,.09),wood,.02)
    for side in (-1,1):
        box('fixed:bench steel',(x+side*.95,1.76,z),(.065,.58,.56),metal)
        box('fixed:bench arm',(x+side*1.05,1.96,z),(.085,.075,.64),metal)

# SRAP: rhythm, shadow reveals, parapet and material surface. No new wall/opening.
for cx,w,z in [(8.5,17,-11.69),(24.5,7,-11.69),(14,28,-22.31)]:
    box('srap:plaster',(cx,2.9,z),(w,5.5,.055),plaster,.0)
    box('srap:base',(cx,.28,z),(w,.5,.12),metal)
    box('srap:fascia',(cx,4.6,z),(w,.88,.16),red)
    box('srap:coping',(cx,5.9,z),(w,.22,.26),trim)
    facing=1 if z>-20 else -1
    for x in [cx-w/2+1.5+i*2.8 for i in range(int(w/2.8))]:
        box('srap:reveal',(x,2.5,z+facing*.075),(2.52,2.85,.13),metal)
        box('srap:glazing',(x,2.5,z+facing*.155),(2.28,2.60,.025),glass,.0)
        box('srap:reflection',(x-.48,2.75,z+facing*.175),(.52,2.08,.009),reflection,.0)
        for dx in (-1.18,0,1.18):box('srap:mullion',(x+dx,2.5,z+facing*.19),(.055,2.65,.075),trim,.01)
        box('srap:transom',(x,3.17,z+facing*.19),(2.4,.075,.075),trim,.01)
for z in (-22.13,-11.88):box('srap:parapet',(14,6.38,z),(28,.4,.20),trim)
box('srap:parapet',(0,6.38,-17),(.2,.4,10.3),trim)
o=box('srap:roof membrane',(14,6.255,-17),(27.7,.035,9.9),roof,0);uv(o,.25)
for x,z in [(8,-18),(23,-18)]:
    box('srap:plant plinth',(x,6.4,z),(2.3,.28,1.7),metal)
    box('srap:air unit',(x,6.83,z),(1.9,.65,1.3),trim,.08)
    for i in range(6):box('srap:louvre',(x-.72+i*.28,6.89,z-.66),(.10,.4,.035),metal,.0)
# UV plaster in metres, bounded broad grime near base.
for o in list(bpy.data.objects):
    if o.type=='MESH' and o.data.materials[0]==plaster:uv(o,.18)

# Export batches by cutaway ownership + material. No scene lights/cameras.
groups={}
for o in list(bpy.data.objects):
    if o.type=='MESH':groups.setdefault((o.name.split(':')[0],o.data.materials[0].name),[]).append(o)
for (group,m),objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=group+':'+m
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'court.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'court.glb'),export_format='GLB',export_yup=True,export_animations=False)

# Hostile H1: source rig/stride retained, long olive outer torso, knit cap, folded tote.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'assets-source/hero/casual.glb'))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE');rig.animation_data.action=None
for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
keep={'Idle_Neutral':'hostile_idle','Walk':'hostile_walk','Run':'hostile_sprint'}
for action in list(bpy.data.actions):
    key=action.name.split('|')[-1]
    if key not in keep:bpy.data.actions.remove(action)
    else:
        action.name=keep[key];t=rig.animation_data.nla_tracks.new();t.name=action.name;t.strips.new(action.name,0,action);t.mute=True
rig.data.pose_position='REST';bpy.context.view_layer.update()
palette={'LightBrown':'686d48','LightBlue':'383d39','White':'a5a18d','Red_Dark':'43483c','Hair':'3b3930','Eyebrows':'443b31'}
for m in bpy.data.materials:
    if m.use_nodes:
        p=m.node_tree.nodes.get('Principled BSDF')
        if p:
            if m.name in palette:p.inputs['Base Color'].default_value=rgba(palette[m.name])
            p.inputs['Roughness'].default_value=.9;p.inputs['Metallic'].default_value=0
def attach(o,bone):
    world=o.matrix_world.copy();o.parent=rig;o.matrix_world=world
    g=o.vertex_groups.new(name=bone);g.add(list(range(len(o.data.vertices))),1,'REPLACE')
    mod=o.modifiers.new('same proven rig','ARMATURE');mod.object=rig
olive=mat('outer coat','666b48');dark=mat('knit charcoal','353a32');canvas=mat('folded canvas','9b9478')
# Rest coordinates here are in game-equivalent x,height,forward.
o=box('coat hem',(0,.99,0),(.44,.26,.28),olive,.06);attach(o,'Hips')
o=box('folded tote',(.26,1.01,-.025),(.14,.30,.23),canvas,.04);attach(o,'Hips')
o=box('coat opening',(0,1.29,.169),(.045,.42,.018),dark,.005);attach(o,'Chest')
bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=1,location=(0,.008,1.775))
o=bpy.context.object;o.name='knit cap';o.scale=(.133,.124,.105);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(dark);attach(o,'Head')
for o in list(bpy.data.objects):
    if o.name=='Icosphere':bpy.data.objects.remove(o,do_unlink=True)
rig.data.pose_position='POSE'
for t in rig.animation_data.nla_tracks:t.mute=False
bpy.context.scene.render.fps=30
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'watcher.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'watcher.glb'),export_format='GLB',export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_current_frame=False,export_animations=True,export_skins=True,export_yup=True)

