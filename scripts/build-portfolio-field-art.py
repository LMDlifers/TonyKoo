from pathlib import Path
import struct, zlib
p=Path('images/portfolio-field'); NS='http://www.w3.org/2000/svg'
def rect(x,y,w,h,c): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>'
def svg(w,h,s): return f'<svg xmlns="{NS}" width="{w}" height="{h}" viewBox="0 0 {w} {h}" shape-rendering="crispEdges">'+''.join(s)+'</svg>\n'
for night in (False,True):
 sky,grass,leaf,path,ink,cream,roof = ('#172f38','#36584f','#29473f','#667161','#23343b','#b8bca0','#577e77') if night else ('#e5efdf','#9bb8a0','#5c8b78','#dbcfaa','#334b50','#f2e5c5','#477d77')
 s=[rect(0,0,960,400,sky),rect(0,156,960,244,grass)]
 # Open sky and distant stepped hills leave room for page copy.
 for x,y,w in [(0,140,170),(145,128,160),(320,148,170),(500,132,230),(760,140,200)]: s += [rect(x,y,w,28,leaf)]
 s += [rect(0,300,960,52,path),rect(230,270,430,34,path),rect(510,220,90,80,path)]
 # Workshop: broad eaves, small chimney and warm windows.
 s += [rect(506,151,164,96,cream),rect(492,137,192,18,roof),rect(508,121,160,18,roof),rect(524,107,128,16,roof),rect(630,94,18,28,ink),rect(570,192,34,55,ink),rect(521,171,32,30,ink),rect(525,175,24,22,'#ebc477'),rect(618,171,32,30,ink),rect(622,175,24,22,'#ebc477')]
 # AI station, diagram easel, study bench and tree.
 s += [rect(167,254,104,10,ink),rect(176,264,8,28,ink),rect(252,264,8,28,ink),rect(197,228,40,26,ink),rect(201,232,32,18,'#7db4b2'),rect(207,239,10,3,cream),rect(221,243,9,3,cream),rect(418,219,52,43,ink),rect(422,223,44,33,cream),rect(427,231,12,5,roof),rect(449,240,11,5,roof),rect(441,233,3,17,roof),rect(421,262,6,27,ink),rect(460,262,6,27,ink),rect(735,265,98,10,ink),rect(744,276,8,18,ink),rect(816,276,8,18,ink),rect(778,251,24,14,cream),rect(847,174,15,105,ink)]
 for x,y,w,h in [(802,140,102,35),(818,112,70,35),(790,164,126,35),(814,194,84,22)]: s += [rect(x,y,w,h,leaf)]
 for i in range(68):
  x=(i*137+23)%950; y=181+(i*59)%210
  if 292<y<355 or (490<x<685 and y<252): continue
  s += [rect(x,y,3,7,leaf),rect(x+4,y+3,3,4,leaf)]
 for x,y in [(120,275),(310,360),(706,248),(888,357)]: s += [rect(x,y,6,4,'#c9a874'),rect(x+2,y-3,2,3,cream)]
 if night: s += [rect(91,46,24,24,'#e8dcac'),rect(103,42,16,25,sky)]+[rect(x,y,2,2,'#b8c6bc') for x,y in [(210,42),(397,77),(735,47),(880,88),(650,40)]]
 legacy=p.joinpath('field-night.svg' if night else 'field.svg')
 if not legacy.exists(): legacy.write_text(svg(960,400,s))

# The interactive homepage uses one isometric footprint in four palettes. Keeping
# the geometry identical lets the visitor change seasons without moving a persona.
def polygon(points, color, extra=''):
 return f'<polygon points="{points}" fill="{color}" {extra}/>'
def line(x1,y1,x2,y2,color,width=2,opacity=1):
 return f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{color}" stroke-width="{width}" opacity="{opacity}" fill="none"/>'
for season in ('summer','snow'):
 for night in (False,True):
  winter=season=='snow'
  sky='#101923' if night else '#e9eeed'
  soil='#263942' if night else '#58695e'
  soil_edge='#19282e' if night else '#394c48'
  top=('#768996' if night else '#e7eff1') if winter else ('#3e645d' if night else '#82aa82')
  tile=('#91a4af' if night else '#f4faf8') if winter else ('#547971' if night else '#a3c19a')
  path=('#7b8d96' if night else '#d9e2e1') if winter else ('#718a7b' if night else '#d4c8a2')
  ink='#172a33' if night else '#314b52'
  roof=('#526a76' if night else '#c8d9dc') if winter else ('#345659' if night else '#bf6849')
  wall='#9daeb1' if night else '#f0e7d3'
  leaf=('#c6d4da' if night else '#ffffff') if winter else ('#527a72' if night else '#3e7968')
  accent='#e9b574' if night else '#cb8154'
  s=[rect(0,0,960,520,sky)]
  # Small technical stars/dots keep the scene connected to the rest of the site.
  for i in range(34):
   x=(i*173+41)%960; y=(i*89+31)%480
   s.append(rect(x,y,2,2,'#718993' if night else '#bdcbc7'))
  s += [polygon('480,133 911,300 480,482 49,300','#071219' if night else '#adbbb7','opacity=".28"'),
        polygon('480,103 906,278 480,461 54,278',soil_edge),
        polygon('54,278 480,461 480,486 54,303',soil),
        polygon('480,461 906,278 906,303 480,486',soil_edge),
        polygon('480,103 906,278 480,461 54,278',top)]
  s.append('<clipPath id="island"><polygon points="480,103 906,278 480,461 54,278"/></clipPath>')
  s.append('<g clip-path="url(#island)">')
  for i in range(-8,18):
   x=i*60
   s += [line(x,85,x+900,470,tile,1,.24),line(x,470,x+900,85,tile,1,.24)]
  # Cross-island path and a quiet central plaza, drawn in the same projection.
  s += [polygon('130,278 180,258 480,380 430,401',path,'opacity=".83"'),
        polygon('480,380 787,254 835,273 528,402',path,'opacity=".83"'),
        polygon('480,270 593,316 480,363 367,316',path,'opacity=".88"')]
  s.append('</g>')
  # Left workshop: flat-shaded isometric walls, roof, windows and a tiny laptop.
  s += [polygon('211,174 285,203 285,270 211,240',wall),
        polygon('285,203 365,171 365,239 285,270','#b9b0a1' if not night else '#71838a'),
        polygon('197,171 283,135 378,173 289,211',roof),
        polygon('211,183 279,209 279,215 211,189',ink),
        polygon('313,222 341,210 341,239 313,251',ink),
        polygon('318,224 336,217 336,235 318,242',accent),
        polygon('230,210 250,218 250,232 230,224',ink),
        polygon('234,214 246,219 246,227 234,222','#85b9bb')]
  # Research board, study bench and two stylized pines set the three zones.
  s += [polygon('475,191 544,219 544,266 475,237',ink),
        polygon('481,198 537,221 537,255 481,232','#edf2e9' if not night else '#bac9cd'),
        line(489,213,527,228,'#4d8e91',3),line(495,226,519,236,accent,3),
        line(486,239,473,279,ink,5),line(539,260,554,286,ink,5),
        polygon('681,284 743,259 766,268 704,294',ink),
        polygon('681,279 743,254 766,263 704,289',wall),
        line(700,288,700,311,ink,5),line(750,271,750,293,ink,5)]
  for cx,cy,scale in [(730,180,1),(807,242,.78),(137,266,.7)]:
   w=int(34*scale); h=int(64*scale)
   s += [rect(cx-4,cy+20,8,int(50*scale),soil_edge),
         polygon(f'{cx},{cy-h//2} {cx+w},{cy+23} {cx-w},{cy+23}',leaf),
         polygon(f'{cx},{cy-h//2-13} {cx+w//2},{cy+2} {cx-w//2},{cy+2}',leaf)]
  # Snow and grass details stay sparse so moving personas remain legible.
  for i in range(24):
   x=135+(i*113)%680; y=238+(i*47)%160
   if 365<x<600 and 275<y<365: continue
   s += [rect(x,y,4,2,'#dce7e8' if winter else '#386d60'),
         rect(x+5,y-3,2,3,'#e9f5f6' if winter else accent)]
  if winter:
   for x,y in [(172,146),(424,129),(617,163),(848,174),(90,100),(887,101)]:
    s += [line(x-4,y,x+4,y,'#d3e8ee',2,.6),line(x,y-4,x,y+4,'#d3e8ee',2,.6)]
  if night:
   s += [rect(73,65,26,26,'#e9d7ab'),rect(84,60,20,29,sky)]
  name=f'field-{season}{"-night" if night else ""}.svg'
  p.joinpath(name).write_text(svg(960,520,s))
roles={'ai-engineer':('#304d6b','#7db4b2'),'researcher':('#bd873c','#f1dfae'),'student':('#e8ddbb','#608b68'),'writer':('#694c60','#e0b2a5'),'reader':('#40655e','#e4d4a1')}
def frame(role,state,i):
 coat,accent=roles[role]; bob= -1 if state=='idle' and i in (1,2) else 0
 stride=([0,2,3,0,-2,-3][i] if state=='walk' else 0)
 r=[]
 def R(x,y,w,h,c): r.append((x,y+bob,w,h,c))
 ink='#29383e'; skin='#d7ab87'; hair='#29373b'
 R(20-stride,60,9,10,ink); R(36+stride,60,9,10,ink); R(17-stride,68,13,4,ink); R(36+stride,68,13,4,ink)
 if role=='student': R(13,41,12,23,accent); R(12,46,4,12,ink)
 R(21,39,23,24,coat); R(18,44,6,16,coat); R(42,44,6,16,coat); R(26,38,12,6,skin); R(30,44,4,16,accent)
 R(19,15,28,21,hair); R(17,20,32,13,hair); R(23,25,21,14,skin); R(23,22,8,7,hair); R(30,22,14,4,hair); R(27,30,2,3,ink); R(39,30,2,3,ink); R(32,36,5,1,'#9c7762')
 if role=='ai-engineer':
  R(28,48,24,15,ink); R(31,50,18,10,accent); R(37,54,6,2,'#dfebd4'); R(25,62,29,3,ink); R(22,56,6,5,skin)
 elif role=='researcher':
  R(37,47,15,19,ink); R(39,48,11,16,accent); R(40,52,8,2,'#bd873c'); R(40,57,8,2,'#bd873c'); R(34,56,6,5,skin)
 elif role=='writer':
  R(26,47,25,19,ink); R(29,49,19,15,'#fff7e9'); R(32,53,12,2,accent); R(32,58,10,2,accent)
  R(43,45,2,19,'#ce8f56'); R(42,44,4,3,ink); R(22,55,7,5,skin)
 elif role=='reader':
  R(20,51,30,17,ink); R(23,53,12,12,accent); R(36,53,11,12,'#f6ead0')
  R(35,51,2,16,ink); R(25,56,8,2,'#ba966b'); R(39,56,7,2,'#ba966b'); R(18,56,6,5,skin)
 else:
  R(24,52,24,13,accent); R(27,54,9,8,'#faf0d1'); R(38,54,8,8,'#faf0d1'); R(20,57,6,5,skin)
 return r

def png(path,w,h,frames):
 pixels=bytearray(w*h*4)
 for offset,rs in frames:
  for x,y,rw,rh,c in rs:
   rgb=bytes.fromhex(c[1:])+b'\xff'
   for yy in range(y,y+rh):
    for xx in range(x,x+rw):
     assert 0<=xx<64 and 0<=yy<80
     n=(yy*w+offset+xx)*4; pixels[n:n+4]=rgb
 raw=b''.join(b'\x00'+pixels[y*w*4:(y+1)*w*4] for y in range(h))
 def chunk(k,v):return struct.pack('>I',len(v))+k+v+struct.pack('>I',zlib.crc32(k+v))
 path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))
for role in roles:
 rs=frame(role,'still',0); p.joinpath(role+'.svg').write_text(svg(64,80,[rect(*v) for v in rs]))
 for state,count in [('idle',4),('walk',6),('still',1)]:
  frames=[(i*64,frame(role,state,i)) for i in range(count)]; png(p/f'{role}-{state}.png',count*64,80,frames)
# Renderable contact sheet with an explicit row per state and persona.
s=[]; row=0
for role in roles:
 for state,count in [('idle',4),('walk',6),('still',1)]:
  s.append(rect(0,row*80,384,80,'#cbd4cb' if row%2==0 else '#e9e5d9'))
  for i in range(count): s.append(f'<g transform="translate({i*64},{row*80})">'+''.join(rect(*v) for v in frame(role,state,i))+'</g>')
  row+=1
Path('/tmp/portfolio-contact.svg').write_text(svg(384,720,s))
