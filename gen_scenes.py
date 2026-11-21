#!/usr/bin/env python3
"""Deterministic, original travel-poster artwork for a spot-the-difference game.

All art is authored in scene pixels, nested inside a 2048 x 1280 SVG viewBox.
Cairo renders at twice the final size; Pillow downsamples with LANCZOS.
The same fixed grain and vignette are applied to both members of every pair.
Run: python3 gen_scenes.py  (requires cairosvg and Pillow; no network access).
"""
from pathlib import Path
import io
import json
import math
import random
import cairosvg
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'scenes'
W, H = 1280, 800


def path(d, fill, stroke=None, sw=2, extra=''):
    return f'<path d="{d}" fill="{fill}"' + (f' stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"' if stroke else '') + f' {extra}/>'


def rect(x,y,w,h,c,rx=0,extra=''):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{c}" {extra}/>'


def ellipse(x,y,rx,ry,c,extra=''):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" {extra}/>'


def line(x,y,a,b,c,sw=2,extra=''):
    return path(f'M{x} {y}L{a} {b}','none',c,sw,extra)


def group(s,x=0,y=0,scale=1,extra=''):
    return f'<g transform="translate({x} {y}) scale({scale})" {extra}>{s}</g>'


def star(x,y,r=3,c='#f9dfaa'):
    return path(f'M{x-r} {y}Q{x} {y} {x} {y-r*1.6}Q{x} {y} {x+r} {y}Q{x} {y} {x} {y+r*1.6}Q{x} {y} {x-r} {y}',c)


def bird(x,y,scale=1,c='#303b48',flip=False):
    return group(path('M-13 2Q-6 -8 0 1Q6 -8 13 2','none',c,2.6),x,y,-scale if flip else scale)


def glow(x,y,r,c='#ffc876'):
    return ellipse(x,y,r,r,'url(#glow)',f'opacity="0.8"')


def window(x,y,w=16,h=28,c='#f4c46a',arched=False):
    s=rect(x-3,y-3,w+6,h+6,'#182b3c',3)+rect(x,y,w,h,c,w/2 if arched else 1)
    return s+line(x+w/2,y+1,x+w/2,y+h,'#735b46',2)+line(x,y+h*.55,x+w,y+h*.55,'#735b46',2)


def pot(x,y,scale=1,c='#b96a51',leaves=True):
    s=ellipse(0,14,23,6,'#122c35','opacity=".22"')
    if leaves:
        for a,b in [(-18,-30),(17,-42),(-5,-56),(26,-20),(-27,-13)]:
            s+=path(f'M0 0Q{a} {b+12} {a} {b}','none','#234f48',3)
            s+=ellipse(a,b,7,16,'#3e7864',f'transform="rotate({a} {a} {b})"')
        s+=ellipse(-2,-39,5,15,'#709476')
    return group(s+path('M-19 -2L-14 24Q0 30 14 24L19 -2Z',c)+rect(-21,-5,42,7,'#db9c70',2)+line(-10,3,-7,20,'#e6b184',2),x,y,scale)


def cat(x,y,c='#172e38',sleep=False,flip=False):
    s=ellipse(0,0,20,10,c)+path('M-13 -5L-12 -24L-4 -18L4 -23L8 -6Z',c)+path('M15 1Q39 -1 29 -18','none',c,6)
    if sleep: s+=path('M-10 -12l4 1m4 -1l4 1','none','#d6b382',1)
    else: s+=ellipse(-8,-13,1.6,1.6,'#e7cb7c')+ellipse(0,-13,1.6,1.6,'#e7cb7c')
    return group(s,x,y,-1 if flip else 1)


def pine(x,y,h,c):
    return path(f'M{x} {y-h}l{-h*.32} {h*.65}h{h*.15}l{-h*.25} {h*.28}h{h*.37}v{h*.12}h{h*.1}v{-h*.12}h{h*.37}l{-h*.25} {-h*.28}h{h*.15}Z',c)


def lantern(x,y,c='#f4c46a',size=1):
    return group(glow(0,10,43)+line(0,-23,0,-9,'#1b303e',2)+rect(-9,-9,18,5,'#24343b',2)+path('M-10 -4L-7 22H7L10 -4Z',c)+rect(-9,22,18,4,'#24343b',2)+line(0,-3,0,21,'#9c7044',2),x,y,size)


def defs(sky):
    return f'''<defs>
    <linearGradient id="sky" x2="0" y2="1"><stop stop-color="{sky[0]}"/><stop offset=".6" stop-color="{sky[1]}"/><stop offset="1" stop-color="{sky[2]}"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="#ffe9a9" stop-opacity=".45"/><stop offset=".4" stop-color="#ffd18c" stop-opacity=".14"/><stop offset="1" stop-color="#ffd18c" stop-opacity="0"/></radialGradient>
    <linearGradient id="water" x2="0.3" y2="1"><stop stop-color="#426c73"/><stop offset="1" stop-color="#162f48"/></linearGradient>
    <linearGradient id="sand" x2=".3" y2="1"><stop stop-color="#e8c88f"/><stop offset="1" stop-color="#ac604f"/></linearGradient>
    <linearGradient id="snow" x2="0" y2="1"><stop stop-color="#e5e6d8"/><stop offset="1" stop-color="#91b5c4"/></linearGradient>
    <linearGradient id="aurora" x2="0" y2="1"><stop stop-color="#3fae8c" stop-opacity="0"/><stop offset=".48" stop-color="#72d6ac" stop-opacity=".5"/><stop offset="1" stop-color="#3fae8c" stop-opacity="0"/></linearGradient>
    <linearGradient id="stone" x2="1" y2="1"><stop stop-color="#a9b5b0"/><stop offset="1" stop-color="#526a77"/></linearGradient>
    </defs>'''


def stars(count=65):
    # Arithmetic placement, fixed forever, avoiding any dependence on render order.
    return ''.join(ellipse(35+(i*173)%1200,35+(i*i*47)%320, .8+(i%3)*.45,.8+(i%3)*.45,'#e5dbc4',f'opacity="{.3+(i%5)*.13}"') for i in range(count))


def footer(title,subtitle,c):
    return rect(34,725,1212,1,c,extra='opacity=".45"')+f'<text x="640" y="762" text-anchor="middle" fill="{c}" font-family="DejaVu Sans" font-size="24" letter-spacing="8">{title.upper()}</text><text x="640" y="784" text-anchor="middle" fill="{c}" font-family="DejaVu Sans" font-size="9" letter-spacing="4">{subtitle.upper()}</text>'


def diff(x,y,r,kind,note):
    return dict(x=x,y=y,r=r,type=kind,note=note)


SCENES=[
 dict(id=1,name='Moonlit Canal',palette=['#1a1f3d','#356c73','#f4c46a','#ece4bc'],sky=['#11182e','#333a60','#b08574'],diffs=[
 diff(1010,123,35,'moved','The little cloud beside the moon drifts right.'),diff(173,325,28,'moved','A hanging lantern sits lower on its cord.'),diff(448,278,25,'removed','One attic window loses its light.'),diff(1008,499,31,'removed','The cat on the canal wall disappears.'),diff(744,220,22,'added','A tiny star appears above the bridge.'),diff(1090,599,29,'added','A terracotta planter appears on the quay.'),diff(292,381,27,'recolored','One pair of shutters changes from teal to rust.'),diff(889,413,25,'recolored','A bridge lantern changes from amber to rose.'),diff(650,593,36,'resized','The gondola cushion becomes wider.'),diff(387,650,28,'detail','The floating leaf points the other way.')]),
 dict(id=2,name='Rooftop Garden',palette=['#f2a65e','#c87568','#376b5b','#f1dfb5'],sky=['#dc806b','#f2b777','#f5d9a0'],diffs=[
 diff(218,167,29,'moved','A swallow moves a little to the right.'),diff(1012,519,31,'moved','The watering can slides along the terrace.'),diff(417,424,28,'removed','One cream towel vanishes from the laundry line.'),diff(1123,619,28,'removed','A small flowerpot disappears.'),diff(746,151,23,'added','A second distant swallow appears.'),diff(312,634,28,'added','A fallen orange appears on the paving.'),diff(866,415,27,'recolored','A cushion changes from coral to golden ochre.'),diff(128,526,29,'recolored','A planter changes from terracotta to blue-green.'),diff(609,546,34,'resized','The sleeping cat grows a little plumper.'),diff(1077,326,29,'detail','One skyline window has its shutter opened.')]),
 dict(id=3,name='Desert Caravan',palette=['#d97b4a','#923e45','#e8c88f','#382c46'],sky=['#61334d','#d97b4a','#edb477'],diffs=[
 diff(1060,156,30,'moved','A bright evening star shifts to the right.'),diff(283,639,31,'moved','A water jar moves across the sand.'),diff(181,473,28,'removed','One oasis fruit cluster disappears.'),diff(1158,627,27,'removed','A little desert rock disappears.'),diff(445,201,23,'added','A new star appears over the dunes.'),diff(532,637,29,'added','A small striped travel bundle appears.'),diff(850,507,27,'recolored','A tent medallion changes from cream to teal.'),diff(619,435,25,'recolored','A caravan saddle blanket changes color.'),diff(1015,649,33,'resized','The campfire becomes slightly taller.'),diff(751,650,27,'detail','A sand scorpion turns to face the opposite way.')]),
 dict(id=4,name='The Observatory',palette=['#101c33','#3fae8c','#b7c9cc','#f4c46a'],sky=['#0b172b','#17374a','#68898b'],diffs=[
 diff(1065,139,28,'moved','One constellation star shifts to the right.'),diff(276,640,31,'moved','A small snow-covered stone moves right.'),diff(159,356,27,'removed','A distant shooting star disappears.'),diff(1102,539,27,'removed','A cabin window loses its warm light.'),diff(422,171,22,'added','A new bright star appears beside the aurora.'),diff(914,638,30,'added','A small trail marker appears in the snow.'),diff(649,501,28,'recolored','The observatory door changes from teal to rust.'),diff(1155,398,25,'recolored','A ridge beacon changes from amber to red.'),diff(721,346,32,'resized','The telescope eyepiece becomes longer.'),diff(382,536,28,'detail','A little weather vane points west instead of east.')]),
 dict(id=5,name='Winter Market',palette=['#26324f','#ac3e4a','#eac478','#e7e9df'],sky=['#202b48','#52637e','#b69b9b'],diffs=[
 diff(229,164,28,'moved','A bright star moves a little to the right.'),diff(1072,646,33,'moved','The little sled slides across the snow.'),diff(449,367,25,'removed','One glowing string bulb disappears.'),diff(150,601,27,'removed','A wrapped parcel disappears.'),diff(786,185,22,'added','A new evening star appears.'),diff(608,650,30,'added','A little snow-covered fir pot appears.'),diff(306,488,28,'recolored','A wreath ribbon changes from red to gold.'),diff(919,477,27,'recolored','A market jar changes from amber to teal.'),diff(1149,295,32,'resized','The chimney smoke curl becomes larger.'),diff(727,573,29,'detail','The bakery sign changes its crescent detail.')])]


def canal(b):
    s=stars()+glow(881,128,170)+ellipse(881,128,61,61,'#eee4bb')+ellipse(862,110,16,12,'#d4cda9','opacity=".45"')+ellipse(900,145,10,14,'#d4cda9','opacity=".35"')
    s+=group(path('M-30 8Q-32 -5 -13 -3Q-6 -20 10 -8Q32 -11 34 8Z','#8c90a0',extra='opacity=".45"'),1010+(12 if b else 0),123)
    s+=path('M0 360V279l60 -22 57 20 44 -51 64 46 50 -22 79 45 67 -39 61 44 74 -14 42 50 50 -31 62 37 80 -55 55 31 55 -12 86 38 75 -33 84 43 40 -28 40 19V480H0Z','#41475f')
    s+=rect(0,420,1280,310,'url(#water)')
    # Far-bank palazzi: narrow facades, rooflines, cornices and warmly lit openings.
    buildings=[(0,268,127,263,'#5e6470'),(118,230,112,306,'#7e7477'),(224,294,120,229,'#566b72'),(339,250,140,269,'#9d827b'),(474,304,99,204,'#526772'),(1016,279,112,248,'#8b7776'),(1122,240,158,302,'#5e6371')]
    for x,y,w,h,c in buildings:
        s+=rect(x,y,w,h,c)+path(f'M{x-7} {y}l{w/2+7} -23 {w/2+7} 23Z','#303b52')+rect(x-3,y+8,w+6,7,'#c1a493')
        s+=rect(x+w-13,y+17,13,h-17,'#263d51',extra='opacity=".28"')
        for row in range(3):
            for col in range(2):
                wx=x+22+col*(w-47); wy=y+43+row*63
                s+=window(wx,wy,15,28,'#e6b976' if (row+col)%3 else '#455366',True)
        s+=line(x+4,y+h-12,x+w-4,y+h-12,'#b29986',4)
    # Designed attic and shutters remain local and independent of facade repetition.
    s+=window(439,262,18,32,'#41475a' if b else '#f4c46a',True)
    for dx in [-20,20]: s+=rect(292+dx-7,365,14,33,'#b66c58' if b else '#2e6568',2)+line(292+dx-4,373,292+dx+4,373,'#c5b098',1)
    s+=path('M560 464Q755 266 973 460L973 502Q767 351 560 507Z','#c3b19a')
    s+=path('M586 461Q761 307 947 461','none','#e3ccb0',8)+path('M588 488Q759 345 946 484','none','#6d7473',5)
    for i in range(13):
        x=580+i*30; yy=391+((x-765)/190)**2*69
        s+=line(x,yy,x+9,yy+28,'#9b9284',2)
    s+=path('M548 458Q755 250 985 454','none','#2b3946',6)
    for i in range(15):
        x=554+i*30; yy=352+((x-760)/210)**2*105
        s+=line(x,yy,x,yy+26,'#2b3946',3)
    s+=lantern(889,413,'#e7a0a1' if b else '#f4c46a',.82)
    # Broken water shimmer deliberately follows architecture instead of a regular grid.
    for i in range(85):
        x=80+(i*139)%1120; y=507+(i*37)%190
        s+=rect(x,y,8+(i*17)%49,1.2+(i%3)*.5,['#8a9990','#d3af79','#567f85','#476b7a'][i%4],1,extra=f'opacity="{.17+(i%4)*.06}"')
    # A soft, broken moon path gives the water a designed focal rhythm.
    for i in range(18):
        x=817+(i*23)%128; y=517+i*8+(i%3)*3
        s+=rect(x,y,11+(i%4)*7,2,'#d9c48f',1,extra=f'opacity="{.18+(i%3)*.08}"')
    s+=path('M0 567L260 535 376 715H0Z','#414d58')+path('M1280 508L1021 506 951 715H1280Z','#53646a')
    s+=path('M0 563L257 530 267 543 0 581Z','#b2a38e')+path('M1031 496L1280 498V514H1024Z','#c1b297')
    for i in range(8): s+=line(0,594+i*17,280+i*11,565+i*20,'#6b7274',1)
    s+=ellipse(646,627,151,14,'#102b40','opacity=".6"')+path('M489 591Q640 634 807 570Q772 636 555 624Q510 615 489 591Z','#102532')+path('M500 594Q656 620 797 576','none','#b28d66',3)
    s+=path('M524 598Q543 558 574 577L591 608Z','#344a56')+ellipse(650,593,28 if b else 19,9,'#b86e60')+line(745,588,830,674,'#b19a75',5)
    s+=line(782,585,1015,530,'#c6b393',2)+rect(1011,517,8,27,'#273e49',2)
    s+=path('M80 255Q180 291 310 257','none','#243141',3)+lantern(173,325+(10 if b else 0))
    if not b:s+=cat(1008,499)
    if b:s+=star(744,220,6)+pot(1090,590,.85)
    s+=group(path('M-17 0Q0 -13 17 0Q0 12 -17 0Z','#c69f68')+line(-12,0,14,0,'#6b6558',1),387,650,-1 if b else 1)
    s+=pot(75,655,1.5)+pot(1200,664,1.2)
    return s


def garden(b):
    # Scene-local paint and helpers keep the other four posters byte-identical.
    s='''<defs>
    <linearGradient id="garden-sky" x2="0" y2="1"><stop stop-color="#d98576"/><stop offset=".53" stop-color="#f0b17c"/><stop offset="1" stop-color="#f5d9a0"/></linearGradient>
    <linearGradient id="garden-floor" x2=".7" y2="1"><stop stop-color="#d9b18a"/><stop offset="1" stop-color="#bf9177"/></linearGradient>
    <pattern id="garden-tiles" width="57" height="28" patternUnits="userSpaceOnUse" patternTransform="skewX(-24)"><path d="M0 0H57V28H0ZM28 0V28" fill="none" stroke="#9f7968" stroke-width=".7" opacity=".2"/><path d="M3 3H25M31 25H54" stroke="#f3d3a5" stroke-width=".8" opacity=".27"/></pattern>
    </defs>'''
    s+=rect(0,0,1280,716,'url(#garden-sky)')+glow(974,205,310)+glow(974,205,175)+ellipse(974,205,62,62,'#f8d99b','opacity=".8"')
    for x,y,k in [(128,107,1),(482,197,.75),(1134,118,.8)]:
        s+=group(path('M-62 3Q-43 -8 -23 -4Q-6 -21 18 -8Q40 -12 68 3Z','#f8d8b2',extra='opacity=".22"'),x,y,k)

    # Three distinct depths: hazy towers, articulated rooflines, then warm facades.
    for j,(base,c,step) in enumerate([(367,'#c8998e',59),(412,'#ad8581',76),(459,'#867677',103)]):
        for i in range(24 if j==0 else 18 if j==1 else 13):
            x=i*step-24+j*11; w=step-5-(i*7)%16
            ht=48+(i*47+j*31)%117; top=base-ht
            s+=rect(x,top,w,ht,c)+rect(x-2,top-4,w+4,5,c)
            s+=rect(x+w-9,top+4,9,ht-4,'#665d68',extra=f'opacity="{.07+j*.05}"')
            if i%4==0:
                s+=rect(x+w*.3,top-13,w*.4,10,c)+line(x+w*.5,top-13,x+w*.5,top-43,c,2)
                s+=line(x+w*.5-12,top-31,x+w*.5+12,top-31,c,1.5)
            elif i%5==2:
                s+=path(f'M{x+12} {top}l4 -22h24l5 22M{x+16} {top-5}l23 -17M{x+16} {top-22}l23 17','none',c,2)
                s+=rect(x+12,top-43,25,22,c,2)+ellipse(x+24.5,top-43,12.5,4,c)
                s+=path(f'M{x+10} {top-46}l14 -9 15 9Z',c)
            elif i%3==1:
                s+=rect(x+9,top-17,12,17,c)+rect(x+7,top-19,16,4,c)
            if j:
                for row in range(3 if j==1 else 4):
                    for col in range(2 if j==1 else 3):
                        wx=x+12+col*(w-22)/(1 if j==1 else 2); wy=top+18+row*29
                        if wy+11<base-4:
                            s+=rect(wx,wy,5 if j==1 else 8,11 if j==1 else 15,'#eed0a1' if (i+row+col)%4==0 else '#6e6870',1,extra='opacity=".5"')
                s+=line(x+2,top+8,x+w-2,top+8,'#d2a68b',2,extra='opacity=".65"')
                if j==2:
                    for by in range(top+30,base-5,22):
                        s+=line(x+3,by,x+14,by,'#bc9582',1,extra='opacity=".5"')
                        s+=line(x+w-23,by+7,x+w-9,by+7,'#665e67',1,extra='opacity=".28"')
    # The registered shutter stays visible on a matching nearby building.
    s+=rect(1035,296,76,144,'#a68c80')+rect(1031,291,84,8,'#d0ad8d')
    s+=rect(1098,299,13,141,'#8b7774')+line(1040,353,1095,353,'#bb9b84',2)
    for x in [1044,1079]:s+=rect(x,378,12,22,'#766f70',1)
    s+=bird(218+(12 if b else 0),167,1.3)
    if b:s+=bird(746,151,.9)

    s+=rect(0,464,1280,252,'#b98872')+path('M0 480L1280 480 1280 715H0Z','url(#garden-floor)')
    s+=rect(0,481,1280,235,'url(#garden-tiles)')
    for y in [528,589,662]:s+=line(0,y,1280,y,'#b58c74',2)
    for i in range(9):s+=line(640+(i-4)*90,480,640+(i-4)*240,716,'#b58c74',2)
    # Slanted late-afternoon shadows ground the planting and furniture.
    for x,y,w in [(62,491,111),(260,497,79),(354,594,67),(626,517,96),(1180,524,83)]:
        s+=path(f'M{x} {y}l-91 71h{w+17}l{74-w} -71Z','#776f61',extra='opacity=".15"')
    s+=rect(0,440,1280,28,'#e5c49a')+rect(0,468,1280,13,'#9d7e70')
    for x in range(0,1280,86):
        s+=line(x,442,x,466,'#b29279',1)+line(x+3,445,x+79,445,'#f5d9ad',1)
    s+=rect(0,479,1280,3,'#876d60',extra='opacity=".35"')

    def planting(x,y,w=76,kind='flowers',color='#b9775d',k=1):
        t=ellipse(0,19,w*.66,7,'#675e4e','opacity=".2"')
        for i in range(7):
            xx=-w*.43+i*w*.14; tip=-25-(i*17)%37
            t+=path(f'M{xx} 0Q{xx-9} {tip*.5} {xx+3} {tip}','none','#3a6550',2)
            for yy,dx in [(tip+11,-7),(tip+20,8)]:
                t+=ellipse(xx+dx,yy,9,4,['#476f53','#6c8c60','#8b9c69'][i%3],f'transform="rotate({-28 if dx<0 else 28} {xx+dx} {yy})"')
            if kind=='flowers':
                fc=['#dfad76','#cc7c70','#edc991'][i%3]
                for dx,dy in [(-4,0),(4,0),(0,-4),(0,4)]:t+=ellipse(xx+3+dx,tip+dy,3,3,fc)
                t+=ellipse(xx+3,tip,2,2,'#916c4c')
            elif kind=='herbs':
                for dy in [0,6,12]:t+=ellipse(xx+3,tip+dy,3,5,'#a0a579' if i%2 else '#6f8b65')
            else:
                t+=ellipse(xx+3,tip+3,9,16,'#4a7759',f'transform="rotate({i*19-47} {xx+3} {tip+3})"')
        t+=path(f'M{-w/2} -2h{w}l-6 27h{-w+12}Z',color)+rect(-w/2-3,-6,w+6,8,'#d7aa7e',2)
        for xx in range(int(-w/2+9),int(w/2),16):t+=line(xx,3,xx+2,19,'#e1b387',1,extra='opacity=".45"')
        return group(t,x,y,k)

    # A compact lattice and climbing sweet peas fill the left middle ground.
    s+=rect(39,311,7,166,'#917157')+rect(179,311,7,166,'#917157')
    s+=rect(36,310,153,7,'#b28c65')+rect(40,422,145,5,'#a17c5b')
    lattice=''
    for xx in range(-110,220,26):
        lattice+=line(xx,320,xx+105,425,'#ac8a66',2)+line(xx,425,xx+105,320,'#ac8a66',2)
    s+='<svg x="46" y="318" width="133" height="107" viewBox="0 318 133 107">'+lattice+'</svg>'
    for xx in [53,104,170]:
        s+=path(f'M{xx} 452q-22 -32 3 -64t-2 -65','none','#416b51',3)
        for i in range(9):
            yy=332+i*13; dx=(-9 if i%2 else 9)
            s+=ellipse(xx+dx,yy,11,5,'#5b805c',f'transform="rotate({-32 if i%2 else 32} {xx+dx} {yy})"')
            if i%3==0:s+=ellipse(xx+dx+3,yy-3,4,5,'#cb8d82')
    s+=planting(111,468,130,'herbs')
    s+=planting(298,472,77,'flowers')+planting(491,478,82,'herbs','#8a9479')
    s+=planting(679,461,73,'leaves','#b78060')
    # Larger, softly folded laundry preserves the towel's registered location.
    s+=rect(107,340,5,147,'#846b55')+rect(648,362,5,129,'#846b55')
    s+=path('M110 350Q381 385 650 379','none','#5d6656',2)
    for x,y,c in [(245,363,'#e9ce9f'),(417,372,'#f2dfb5'),(531,378,'#6e9280')]:
        if x==417 and b:continue
        s+=path(f'M{x-24} {y}q22 4 48 1l-1 69q-25 6 -47 -1Z',c)
        for dx in [-15,5,17]:s+=path(f'M{x+dx} {y+9}q-4 30 0 51','none','#9c8d73',1,extra='opacity=".28"')
        s+=line(x-19,y,x-19,y+9,'#866c55',3)+line(x+18,y+1,x+18,y+10,'#866c55',3)
        s+=path(f'M{x-19} {y+61}q17 4 37 0','none','#b69778',2)

    # Pergola, diagonal cast shadows and a creeping vine canopy.
    for x in [766,1165]:
        s+=path(f'M{x} 484l180 208h30L{x+15} 480Z','#7d8270',extra='opacity=".21"')+rect(x,260,16,320,'#876a55')+rect(x,260,5,320,'#b99771')
    for i in range(6):
        x=787+i*61
        s+=path(f'M{x} 483l-107 126h10L{x+9} 483Z','#776a58',extra='opacity=".1"')
    s+=path('M720 273L1195 273 1237 303H759Z','#6d5b4c')
    for i in range(8):s+=path(f'M{725+i*67} 250l70 51h17l-68 -51Z','#a78560')
    s+=path('M723 270Q840 238 906 282T1206 278','none','#3d6250',6)
    for i in range(44):
        x=727+i*11; y=267+math.sin(i*.7)*16
        s+=ellipse(x,y,13,6,['#365c4d','#56795a','#76906a'][i%3],f'transform="rotate({i*31%100-50} {x} {y})"')
        if i%7==0:s+=ellipse(x+2,y-4,3,4,'#d4b97e')
    for i in range(6):
        x=810+i*65
        s+=path(f'M{x} 280q-22 45 0 77','none','#456b52',3)+ellipse(x-6,312,11,5,'#4b795b')+ellipse(x+3,333,11,5,'#5d8661')
    # Small paper lanterns hang above the seating, clear of the shutter clue.
    s+=path('M744 307Q960 380 1190 315','none','#615f4e',1.6)
    for x,y,c in [(789,321,'#e9ba7c'),(862,338,'#cc8b76'),(939,343,'#ead3a0'),(1012,339,'#cda06f'),(1134,329,'#dfb587')]:
        s+=line(x,y,x,y+9,'#615f4e',1)+ellipse(x,y+20,10,13,c)
        s+=path(f'M{x} {y+8}q-8 12 0 25q8 -13 0 -25','none','#a27b5c',.8,extra='opacity=".55"')
        s+=rect(x-4,y+6,8,3,'#806b51',1)+rect(x-4,y+32,8,3,'#806b51',1)
    s+=rect(793,424,258,22,'#805f52',5)+rect(800,447,245,55,'#a97c64',5)+rect(804,500,14,46,'#6c584a')+rect(1020,500,14,46,'#6c584a')
    for yy in [461,477,492]:s+=line(807,yy,1038,yy,'#8c6756',1.3)
    s+=rect(917,404,67,27,'#8f9b7b',6)+line(926,412,974,423,'#d9c59a',1)
    s+=rect(843,402,46,29,'#dca650' if b else '#c67569',7)+line(850,410,881,424,'#efd6a2',2)
    s+=planting(1230,521,68,'flowers')+planting(1089,471,52,'herbs','#81917a')
    # Oval tea table, woven mat, porcelain pot, cups, and a sprig in a vase.
    s+=ellipse(679,507,67,15,'#ab866d','opacity=".38"')
    s+=line(647,486,639,528,'#765d4c',6)+line(708,486,718,528,'#765d4c',6)+line(648,514,711,514,'#9b7659',3)
    s+=ellipse(678,478,64,17,'#795e4c')+ellipse(678,474,64,17,'#d2ac7c')+ellipse(678,474,46,12,'#e3c494')
    for yy in [470,474,478]:s+=line(646,yy,707,yy,'#b69570',.7,extra='opacity=".5"')
    s+=ellipse(677,468,11,9,'#f0d9b0')+ellipse(677,460,8,2.5,'#f7e4c0')+ellipse(677,457,2,2,'#a77a56')
    s+=path('M685 464q14 -12 12 -1q-3 8 -13 8M667 466l-8 -6 1 8 8 4','none','#eed4a7',3)
    for xx,yy in [(653,478),(703,478)]:
        s+=ellipse(xx,yy+1,10,3,'#f3dfb9')+path(f'M{xx-6} {yy-7}q0 13 12 0Z','#efe0bb')+ellipse(xx,yy-7,5,1.6,'#96674e')
    s+=path('M721 462l-3 -14h7l-1 14Z','#6d8c7a')+line(721,449,725,432,'#557854',1.5)+ellipse(725,435,5,3,'#73936a')

    for x,y,k in [(128,526,1.3),(231,518,1),(375,563,1.5),(1151,487,1.4),(110,649,1.3),(965,669,1.2)]:s+=pot(x,y,k,'#4a7d79' if b and x==128 else '#bd785d')
    s+=planting(221,622,83,'flowers')+planting(61,574,54,'herbs','#80907a')
    s+=planting(1220,645,84,'leaves')+planting(812,648,70,'flowers','#87957d')
    # A separate playful cat and trailing yarn leave the sleeping-cat clue intact.
    s+=ellipse(497,658,46,8,'#8a7761','opacity=".22"')
    s+=path('M471 648q-35 5 -28 -21','none','#4c5145',6)+ellipse(487,644,23,12,'#5e6250')
    s+=path('M496 643l2 -22 9 6 9 -5 1 20Z','#5e6250')+ellipse(503,633,1.5,1.5,'#e5c68c')+ellipse(512,633,1.5,1.5,'#e5c68c')
    s+=path('M498 650q13 8 25 -1','none','#5e6250',6)+path('M476 640q8 -4 11 0m-17 -2q8 -4 11 0','none','#424f43',2)
    s+=path('M521 652q12 4 18 -5t16 0q7 11 15 4','none','#b46e61',1.5)
    s+=ellipse(577,650,12,11,'#bd8073')
    for dx in [-5,0,5]:s+=path(f'M{574+dx} 641q-6 10 6 17','none','#e1ac91',1)
    # Landing sparrows add life without introducing variant-dependent details.
    for x,y,k in [(578,437,.85),(1214,437,1)]:
        sparrow=ellipse(0,0,9,5,'#766553')+ellipse(6,-5,4,4,'#766553')+path('M-6 0l-12 -6 4 10Z','#766553')
        sparrow+=path('M1 -1q-11 -17 -16 -12q2 10 11 13Z','#a58d69')+path('M9 -6l6 2 -5 1Z','#d5b27b')+ellipse(7,-6,1,1,'#394d43')
        sparrow+=line(0,4,-2,9,'#766553',1)+line(4,4,3,9,'#766553',1)
        s+=group(sparrow,x,y,k)
    s+=ellipse(611,556,52,10,'#8f7762','opacity=".3"')+group(cat(0,0,'#d6b88e',True),609,546,1.25 if b else 1)
    # Watering can with an unmistakable handle and angled spout.
    can=ellipse(0,15,29,6,'#7a7960','opacity=".3"')+path('M-20 -13Q-44 -29 -38 3Q-36 13 -18 7','none','#486d66',5)+rect(-21,-18,37,35,'#5a8475',5)+ellipse(-2,-18,18,5,'#82a088')+path('M13 -5L40 -28 46 -23 18 12Z','#5a8475')+line(37,-30,48,-21,'#aac0a0',4)
    s+=group(can,1012+(12 if b else 0),519)
    if not b:s+=pot(1123,610,.7,leaves=False)
    if b:s+=ellipse(312,634,11,10,'#dd8e43')+ellipse(309,630,3,2,'#f8cb74')+path('M312 624q10 -9 14 -3q-5 7 -14 3','#42694e')
    s+=rect(1060,307,35,37,'#887d78')+window(1067,312,20,27,'#e0bd8d')
    s+=path('M1063 310h9v29h-9Z','#476d65') if not b else path('M1062 310l-13 -4v29l13 4Z','#476d65')
    return s


def palm(x,y,h):
    s=path(f'M{x-6} {y}Q{x+12} {y-h*.5} {x} {y-h}','none','#473e43',12)
    for dx,dy in [(-67,10),(-58,-22),(-30,-38),(29,-40),(63,-20),(75,13)]:
        s+=path(f'M{x} {y-h}Q{x+dx*.6} {y-h+dy-21} {x+dx} {y-h+dy+23}Q{x+dx*.5} {y-h+dy} {x} {y-h}', '#354c43')
    return s


def camel(x,y,k=1,blanket='#a65d50'):
    s=ellipse(0,0,32,14,'#463346')+path('M-27 -3Q-20 -29 -10 -15Q2 -31 13 -10L28 -10Q32 -43 43 -44L52 -39 43 -31 41 -1 29 9Z','#463346')
    s+=path('M-24 7l-7 42h6l14 -38M17 8l10 38h6l-3 -42','none','#463346',4)+path('M-29 -2q-18 1 -16 14','none','#463346',3)
    s+=path('M-12 -11l25 2 -3 22 -24 -4Z',blanket)+line(-7,-7,-8,6,'#e8c88f',2)+ellipse(0,-38,6,7,'#463346')+path('M-4 -32L-9 -10H7L5 -31Z','#463346')+path('M-2 -39l-7 0 2 -6 9 -2 6 6Z','#d6b58a')
    return group(s,x,y,k)


def desert(b):
    s=stars(28)+ellipse(1127,99,26,26,'#f3d7a0')+ellipse(1137,91,25,25,'#74404f')
    s+=star(1060+(12 if b else 0),156,5)
    if b:s+=star(445,201,5)
    s+=path('M0 383Q160 219 353 344T726 326Q957 218 1280 345V720H0Z','#ad635b')
    s+=path('M0 453Q215 301 446 400T833 402Q1079 281 1280 378V718H0Z','#d08b68')
    s+=path('M0 505Q264 353 560 438T1008 445Q1149 408 1280 473V720H0Z','url(#sand)')
    s+=path('M0 508Q272 397 555 463Q241 447 0 591Z','#f0d29a')
    s+=path('M0 667Q334 531 644 602T1280 548V720H0Z','#b77961')+path('M0 669Q343 548 655 617Q337 584 0 711Z','#dca67b')
    # Fine wind-carved contour lines give the dune bands a printed-poster finish.
    for i in range(16):
        x=35+i*79; y=568+(i*31)%118
        s+=path(f'M{x} {y}q31 -14 67 -5','none','#f0c68c',1,extra='opacity=".22"')
    s+=ellipse(168,536,123,15,'#687f6a')+ellipse(161,536,82,5,'#b3b99a')
    s+=palm(155,534,188)+palm(223,534,137)+palm(97,537,126)
    if not b:
        for dx,dy in [(0,0),(7,6),(-4,9)]:s+=ellipse(181+dx,467+dy,4,6,'#b17c4e')
    # Caravan follows the actual crest, connected by slack lead ropes.
    for i,(x,y,k) in enumerate([(412,425,.61),(505,432,.71),(619,435,.83),(746,453,.94)]):
        s+=camel(x,y,k,'#4b7871' if b and x==619 else '#a65d50')
        if i<3:s+=path(f'M{x+30*k} {y+1}q28 23 57 9','none','#69504e',1)
    s+=path('M727 576L849 411 1001 576Z','#5b3446')+path('M727 576L849 411 865 578Z','#a74c4b')+path('M849 411L1001 576 865 578Z','#76394a')
    s+=path('M830 576L850 463 884 576Z','#2f2b3d')+line(849,405,849,389,'#3e2f40',4)
    for j in range(3):
        yy=488+j*29
        s+=line(780-j*20,yy,828,yy,'#dfb784',2)+line(878,yy,917+j*23,yy,'#b87861',2)
    s+=path('M850 491l10 16 -10 16 -10 -16Z','#52877b' if b else '#e8c88f')
    s+=line(731,566,695,601,'#4b3644',2)+line(995,567,1032,603,'#4b3644',2)
    for x in [695,1032]:s+=line(x,596,x,608,'#4b3644',3)
    jar=ellipse(0,16,23,5,'#6d4b4b','opacity=".4"')+path('M-8 -20H8L7 -10Q27 11 12 21H-12Q-27 11 -7 -10Z','#8c5551')+ellipse(0,-20,9,3,'#d19b70')+line(-15,5,15,5,'#ddb37b',3)
    s+=group(jar,283+(13 if b else 0),639)
    if b:s+=rect(511,624,41,26,'#b0715a',7)+line(522,625,522,649,'#eccb92',4)+line(538,625,538,649,'#eccb92',4)
    if not b:s+=path('M1137 635l9 -23 22 6 7 18Z','#79514d')+path('M1146 612l-2 18 24 -12Z','#b07a61')
    s+=glow(1015,643,103)+ellipse(1015,672,52,11,'#75484b')
    fire=path('M-18 10Q-28 -9 -8 -24Q-12 -5 1 -40Q23 -10 18 8Q8 23 -18 10Z','#e79754')+path('M-9 11Q-13 -1 0 -20Q1 -6 10 4L5 14Z','#f8d68a')
    s+=group(fire,1015,649,1.25 if b else 1)+line(990,670,1039,661,'#49313d',6)+line(996,660,1034,675,'#49313d',5)
    # Irregular broken amber marks echo firelight on the nearby sand.
    for i in range(13):
        x=942+(i*29)%146; y=684+(i*13)%24
        s+=rect(x,y,8+(i%4)*7,2,'#f1ba72',1,extra=f'opacity="{.14+(i%3)*.06}"')
    scorp=ellipse(0,0,8,4,'#4b3644')+path('M6 0q20 -18 6 -23q-9 0 -5 8M-7 0l-9 -9 -6 3m6 3 -8 9M-1 1l-7 8m10 -6 5 8','none','#4b3644',2)
    s+=group(scorp,751,650,-1 if b else 1)
    for i in range(14):
        x=70+i*83;y=678+(i*17)%29
        s+=path(f'M{x} {y}q9 -6 22 -1','none','#966654',1)
    return s


def observatory(b):
    s=stars(105)
    # Semi-transparent curtains overlap to give the aurora luminous vertical depth.
    for i in range(14):
        x=220+i*53
        sway=18*math.sin(i*.9)
        s+=path(f'M{x} -50Q{x-75+sway} 140 {x+30} 225T{x+23-sway*.4} 381L{x+69-sway*.4} 393Q{x+127-sway} 282 {x+75} 190T{x+68} -50Z','url(#aurora)',extra=f'opacity="{.3+(i%4)*.12}"')
    s+=path('M0 439L114 343 198 408 343 263 482 422 580 344 704 428 833 311 958 404 1091 282 1280 427V715H0Z','#354f64')
    s+=path('M243 369l100 -106 102 117 -95 -58 -24 41 -20 -12Z','#8babad')+path('M999 374l92 -92 95 93 -84 -45 -22 25 -22 -5Z','#90afb0')
    s+=path('M0 493L140 426 249 481 410 393 595 496 758 420 936 497 1110 414 1280 483V720H0Z','#254657')
    s+=path('M0 603Q247 470 501 558T923 545Q1134 504 1280 574V720H0Z','url(#snow)')
    s+=path('M0 655Q264 529 522 600Q286 568 0 704Z','#6e98aa')+path('M690 717Q827 601 1014 589Q892 633 849 717Z','#b6cbd0')
    # Constellation lines stay fixed except the deliberately moved endpoint star.
    coords=[(965,80),(1012,111),(1065+(12 if b else 0),139),(1114,103),(1156,174)]
    for a,c in zip(coords,coords[1:]):s+=line(*a,*c,'#9dbdc2',1,extra='opacity=".45"')
    for x,y in coords:s+=star(x,y,4,'#dce6d9')
    if not b:s+=path('M139 367l40 -24','none','#cee1d4',1.5)+star(179,343,3)
    if b:s+=star(422,171,5,'#dce9d8')
    # Cylindrical masonry drum, ribbed dome, and a real open slit.
    s+=ellipse(645,562,160,25,'#38586a','opacity=".4"')+rect(508,379,275,174,'url(#stone)')+ellipse(645,550,138,20,'#657d85')
    for yy in [412,446,481,519]:
        s+=line(509,yy,782,yy,'#576f7a',1)
        for xx in range(520+(16 if yy%2 else 0),780,43):s+=line(xx,yy,xx,yy+29,'#637d85',1)
    s+=path('M499 383A146 146 0 0 1 791 383Z','url(#stone)')+path('M644 238Q559 282 543 382M644 238Q735 284 753 382','none','#c0cac2',2)
    s+=path('M639 238Q677 281 680 383H713Q707 286 663 240Z','#112b40')+path('M663 240Q704 285 713 383','none','#c5cec5',4)
    # Telescope emerges diagonally from the dark slit.
    s+=group(rect(-36,-13,75,26,'#b5c4bd',3)+rect(28,-18,13,36,'#d9dac7',2)+ellipse(42,0,5,17,'#1b394a')+rect(-56 if b else -46,-8,22 if b else 12,16,'#6d8f96',2),696,357,1,extra='') if False else ''
    s+=f'<g transform="translate(696 359) rotate(-29)">{rect(-36,-12,66,24,"#a3bcb8",3)}{rect(27,-17,12,34,"#dbe0cd",2)}{ellipse(39,0,4,15,"#254254")}{rect(-55 if b else -43,-7,23 if b else 11,14,"#698e96",2)}</g>'
    s+=rect(496,380,299,13,'#d1d1bd',3)+rect(632,478,34,74,'#9d6356' if b else '#315762',17)+ellipse(657,515,2,2,'#dbbd7f')+window(546,438,24,36,'#b3cbc2',True)+window(721,438,24,36,'#a7c2bc',True)
    # Weather instrument on a separate small pedestal.
    s+=rect(372,554,19,20,'#7895a0')+line(382,555,382,516,'#294657',3)+line(364,536,400,536,'#294657',2)
    s+=path('M367 536l13 -7v14Z' if b else 'M397 536l-13 -7v14Z','#294657')
    for x,y,h in [(75,590,160),(137,568,125),(1198,585,189),(1235,617,141),(870,527,95),(949,544,114),(52,669,196)]:s+=pine(x,y,h,'#193e4b')
    s+=rect(1015,507,136,78,'#605653')+path('M996 511L1081 453 1168 511Z','#263d4b')+path('M995 510L1081 451 1170 510 1152 511 1081 470 1014 516Z','#c6d7d2')+rect(1033,533,25,52,'#34434a')
    s+=glow(1102,539,55)+window(1091,527,23,27,'#344957' if b else '#f4c46a')
    s+=line(1155,411,1155,387,'#233f50',3)+ellipse(1155,395,5,5,'#d5746a' if b else '#e6bd77')
    s+=group(path('M-24 10l8 -23 29 2 15 20Z','#6c8e9e')+path('M-16 -13l29 2 4 8 -35 2Z','#e0e4d8'),276+(13 if b else 0),640)
    if b:s+=rect(911,617,6,41,'#6d655c')+path('M895 615h35l9 9 -9 8h-35Z','#a2735b')+ellipse(907,622,2,2,'#dfc28c')
    for i in range(8):s+=ellipse(793-i*7,664+i*6,3,1.6,'#7395a3')
    return s


def market(b):
    s=stars(38)+star(229+(12 if b else 0),164,4)
    if b:s+=star(786,185,5)
    # Cathedral silhouette: nave, spire, rose window and buttresses.
    s+=path('M384 431V290h44v-91l18 -24 18 24v91h38v-55l31 -24 31 24v55h43v-92l18 -30 18 30v92h43v141Z','#3b4964')
    s+=path('M442 192l4 -80 5 80M621 186l4 -109 5 109','#3b4964')+ellipse(533,280,18,18,'#7e8190')+ellipse(533,280,12,12,'#4c5b75')
    for a in range(0,360,45):
        s+=line(533,280,533+16*math.cos(math.radians(a)),280+16*math.sin(math.radians(a)),'#aaa29e',1)
    for x in [402,477,591,656]:s+=rect(x,340,7,91,'#313f59')
    for i in range(10):
        x=i*146-42; y=390+(i*31)%68
        s+=rect(x,y,126,151,'#535d71')+path(f'M{x-9} {y}l74 -48 73 48Z','#424e66')
        for j in range(3):s+=window(x+18+j*33,y+23,12,21,'#af9e89')
    s+=path('M0 575Q312 521 625 558T1280 541V720H0Z','url(#snow)')
    s+=path('M0 693Q510 563 1280 671V719H0Z','#b5c8cc')
    # Stalls use true sloped awnings, alternating cloth panels, scallops and trim.
    def stall(x,y,w,main):
        t=rect(x+12,y+41,w-24,145,'#715953')+rect(x+20,y+112,w-40,60,'#a77b64')+rect(x+8,y+107,w-16,12,'#d5af80')
        for px in [x+8,x+w-16]:t+=rect(px,y+7,8,186,'#4a4750')
        for i in range(8):
            x1=x+i*w/8;x2=x+(i+1)*w/8
            t+=path(f'M{x1+17} {y}H{x2+13}L{x2} {y+61}H{x1}Z',main if i%2==0 else '#e9cfaa')+path(f'M{x1} {y+60}h{w/8}v9q{-w/16} 14 {-w/8} 0Z',main if i%2==0 else '#e9cfaa')
        for x in range(x+24,x+w-28,38):
            t+=ellipse(x,y+145,9,5,'#4c373f')+ellipse(x-2,y+143,3,2,'#f2d397')
        t+=line(x+17,y,x+w+13,y,'#f0ded0',5)+rect(x+2,y+177,w-4,10,'#dfded2',4)
        return t
    s+=stall(161,400,304,'#ac3e4a')+stall(799,389,302,'#a9464c')
    # Goods, bread, ceramic jars, candles and stacked little crates.
    for i in range(7):
        x=186+i*35
        s+=ellipse(x,505,15,7,'#e4b46e')+path(f'M{x-5} 500l4 7m3 -9 4 7','none','#a7784c',1.5)
    for i in range(5):
        x=834+i*48
        s+=path(f'M{x-9} 497q-7 -20 1 -28v-7h16v7q9 11 1 28Z','#447c77' if b and i==2 else '#c39662')+rect(x-10,459,20,6,'#e6c99a',2)
    for x,y in [(191,552),(220,552),(963,544),(997,544)]:s+=rect(x,y,22,21,'#b18c68')+line(x+2,y+6,x+19,y+6,'#776652',2)
    # A side kiosk and chimney anchor the upper-right smoke difference.
    s+=rect(1120,362,160,204,'#766664')+path('M1108 365l88 -56 101 56Z','#394a60')+path('M1109 363l86 -55 103 55 -14 4 -89 -40 -72 43Z','#dce0d7')+rect(1140,311,20,36,'#4b4f60')
    smoke=path('M0 12Q-19 -1 -1 -12T-2 -37Q20 -30 11 -13T6 12Z','#d8c9c1',extra='opacity=".5"')
    s+=group(smoke,1149,295,1.3 if b else 1)
    s+=window(1170,409,36,46,'#e8bd7c',True)+glow(1188,432,74)
    # Catenary light strings, each bulb glows against the dusk.
    for x1,y1,x2,y2,sag in [(30,291,670,320,55),(652,320,1253,246,52)]:
        s+=path(f'M{x1} {y1}Q{(x1+x2)/2} {max(y1,y2)+sag*2} {x2} {y2}','none','#303d50',3)
        for i in range(11):
            t=i/10;x=x1+(x2-x1)*t;y=(1-t)**2*y1+2*(1-t)*t*(max(y1,y2)+sag*2)+t*t*y2
            # Explicit missing-bulb difference is authored separately below.
            if 424<x<474:continue
            s+=line(x,y,x,y+9,'#303d50',2)+glow(x,y+13,24)+ellipse(x,y+13,4,6,'#f7d791')
    if not b:s+=line(449,355,449,364,'#303d50',2)+glow(449,367,25)+ellipse(449,367,4,6,'#f7d791')
    # Wreath, ribbon and a hanging bakery sign.
    s+=ellipse(306,476,23,25,'#284f49')+ellipse(306,476,13,15,'#705950')
    for i in range(9):s+=ellipse(306+20*math.cos(i*.7),476+22*math.sin(i*.7),4,3,'#66846a')
    s+=path('M306 484l-15 -7v14l15 -4 14 5v-14Z','#dfb364' if b else '#bd4f53')+path('M302 488l-6 18 9 -5 5 5 2 -18Z','#dfb364' if b else '#bd4f53')
    s+=line(704,523,704,551,'#394550',3)+line(749,523,749,551,'#394550',3)+rect(695,548,64,49,'#d9b77d',5)+rect(700,553,54,39,'#8c5c50',3)
    s+=ellipse(727,573,13,12,'#e9c789')+ellipse(732 if b else 722,569,11,10,'#8c5c50')
    if not b:s+=rect(132,584,35,32,'#b65c59',3)+rect(146,584,5,32,'#e5c890')+rect(132,594,35,5,'#e5c890')
    sled=path('M-37 11q-3 18 20 18h47q19 0 23 -17','none','#67534f',5)+line(-20,9,-14,25,'#67534f',4)+line(24,9,29,25,'#67534f',4)+rect(-34,-1,74,11,'#aa6357',3)+line(-29,3,35,3,'#dab58a',2)+path('M40 1q30 -55 51 -15','none','#766653',2)
    s+=group(sled,1072+(13 if b else 0),646)
    if b:s+=pot(608,651,.8,leaves=False)+pine(608,647,41,'#3f6a5b')+path('M600 621l8 -15 9 16Z','#e4e7dd')
    for x,y,r in [(70,675,77),(467,598,41),(1200,675,102)]:s+=ellipse(x,y,r,16,'#e0e5dd')
    s+=pine(63,591,145,'#30535a')+pine(1222,647,154,'#34585e')
    return s


DRAW=[canal,garden,desert,observatory,market]


def texture():
    rng=random.Random(731902)
    grain=Image.frombytes('L',(640,400),rng.randbytes(640*400)).resize((W,H),Image.Resampling.BILINEAR).convert('RGB')
    # Multiplicative edge falloff avoids adding a muddy grey veil over the artwork.
    vignette=Image.new('L',(W,H))
    vignette.putdata([round(255*(1-.15*min(1,((x-640)/790)**2+((y-380)/560)**2))) for y in range(H) for x in range(W)])
    return grain,vignette.convert('RGB')


def validate_metadata():
    for scene in SCENES:
        ds=scene['diffs'];assert len(ds)==10
        for i,d in enumerate(ds):
            x,y,r=d['x'],d['y'],d['r']
            assert r+12<x<W-r-12 and r+12<y<H-r-12,(scene['name'],d)
            for e in ds[:i]:assert math.hypot(x-e['x'],y-e['y'])>r+e['r'],(scene['name'],d,e)


def main():
    validate_metadata();OUT.mkdir(exist_ok=True)
    grain,vignette=texture()
    total=0
    previews=[]
    for scene,draw in zip(SCENES,DRAW):
        for variant in [False,True]:
            art=defs(scene['sky'])+rect(0,0,W,H,'url(#sky)')+draw(variant)
            art+=footer(scene['name'],['Notturno · waterside walks','Above the city · evening retreat','Across the dunes · the evening route','High altitude · celestial station','Old town · the season of light'][scene['id']-1],scene['palette'][-1])
            art+=rect(17,17,1246,766,'none',extra=f'stroke="{scene["palette"][-1]}" stroke-width="1" opacity=".35"')
            svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1280" viewBox="0 0 2048 1280"><g transform="scale(1.6)">{art}</g></svg>'
            raw=cairosvg.svg2png(bytestring=svg.encode(),output_width=W*2,output_height=H*2)
            image=Image.open(io.BytesIO(raw)).convert('RGB').resize((W,H),Image.Resampling.LANCZOS)
            image=Image.blend(image,grain,.022)
            image=ImageChops.multiply(image,vignette)
            dest=OUT/f'scene{scene["id"]}{"b" if variant else "a"}.png'
            image.save(dest,optimize=True)
            assert dest.stat().st_size<=1_500_000,(dest,dest.stat().st_size)
            total+=dest.stat().st_size
            if not variant:previews.append(image.copy())
        print(f'Scene {scene["id"]}: A/B rendered, {len(scene["diffs"])} differences listed')
    public=[{k:s[k] for k in ['id','name','palette']}|dict(imgA=f'scenes/scene{s["id"]}a.png',imgB=f'scenes/scene{s["id"]}b.png',diffs=s['diffs']) for s in SCENES]
    (ROOT/'differences.js').write_text('// Original poster scenes. Difference circles use final 1280 × 800 image pixels.\n// Notes describe the change from image A to image B; circles never overlap.\nexport const SCENES = '+json.dumps(public,ensure_ascii=False,indent=2)+';\n')
    # Contact sheet is a development aid, not a game asset.
    sheet=Image.new('RGB',(1280,1200),'#182332')
    for i,img in enumerate(previews):sheet.paste(img.resize((640,400),Image.Resampling.LANCZOS),((i%2)*640,(i//2)*400))
    sheet.save(OUT/'contact-sheet.jpg',quality=92)
    print(f'Total PNG bytes: {total:,}')
    print('\nScene                       | Diffs | A dimensions | B dimensions')
    print('----------------------------|-------|--------------|-------------')
    for scene in SCENES:
        for suffix in 'ab':
            dest=OUT/f'scene{scene["id"]}{suffix}.png'
            with Image.open(dest) as img:assert img.size==(W,H) and img.format=='PNG'
        print(f'{scene["name"]:27} |  10   | 1280 x 800   | 1280 x 800')
    print('Verified: 10 PNGs, all dimensions correct; 50 non-overlapping difference circles.')


if __name__=='__main__':main()
