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
 p.joinpath('field-night.svg' if night else 'field.svg').write_text(svg(960,400,s))
roles={'ai-engineer':('#304d6b','#7db4b2'),'researcher':('#bd873c','#f1dfae'),'student':('#e8ddbb','#608b68')}
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
