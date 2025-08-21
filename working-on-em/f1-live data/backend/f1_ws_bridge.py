# f1_ws_bridge.py
import asyncio
import json
import math
import websockets
import fastf1
from fastf1 import plotting
from fastf1.core import Laps

# Ensure fastf1 cache enabled
fastf1.Cache.enable_cache('./cache')

# Simplified track polyline for Monaco (replace with accurate polyline for better positions)
# polyline points are in arbitrary units; we'll normalize by bounding box
TRACK_POINTS = [
    (120,400),(230,220),(420,220),(540,400),(660,580),(900,580),(1020,400),(1140,220),(1360,220),(1480,400)
]

# Helper: compute total polyline length and map distance->(x,y)
def polyline_length(pts):
    total = 0
    segs = []
    for i in range(len(pts)-1):
        x1,y1 = pts[i]; x2,y2 = pts[i+1]
        d = math.hypot(x2-x1, y2-y1)
        segs.append(d); total+=d
    return total,segs

TOTAL_LEN, SEGS = polyline_length(TRACK_POINTS)

def map_distance_to_xy(dist):
    # dist between 0..TOTAL_LEN
    if dist <=0: return TRACK_POINTS[0]
    d = dist % TOTAL_LEN
    acc = 0
    for i in range(len(SEGS)):
        seg_len = SEGS[i]
        if acc + seg_len >= d:
            # within this segment
            t = (d-acc)/seg_len
            x1,y1 = TRACK_POINTS[i]; x2,y2 = TRACK_POINTS[i+1]
            x = x1 + (x2-x1)*t
            y = y1 + (y2-y1)*t
            # normalize to 0..1 based on bounding box
            minx = min(p[0] for p in TRACK_POINTS); maxx = max(p[0] for p in TRACK_POINTS)
            miny = min(p[1] for p in TRACK_POINTS); maxy = max(p[1] for p in TRACK_POINTS)
            nx = (x - minx) / (maxx-minx)
            ny = (y - miny) / (maxy-miny)
            return (nx, ny)
        acc += seg_len
    # fallback
    x,y = TRACK_POINTS[-1]
    minx = min(p[0] for p in TRACK_POINTS); maxx = max(p[0] for p in TRACK_POINTS)
    miny = min(p[1] for p in TRACK_POINTS); maxy = max(p[1] for p in TRACK_POINTS)
    return ((x-minx)/(maxx-minx),(y-miny)/(maxy-miny))

async def producer(websocket, path):
    print('client connected')
    try:
        # For demo, we will stream last race laps positions every 1s
        # In real usage, use FastF1 live session telemetry.
        year = 2025
        # pick a race (last) — this could be dynamic
        last_event = fastf1.get_event_schedule(year).loc[0]
        session = fastf1.get_session(year, last_event['EventName'], 'R')
        session.load()  # may take a while

        # Take driver laps
        laps = session.laps
        # compute each driver's lap distance time series roughly by using lap['LapTime'] and cumulative
        drivers = laps['DriverNumber'].unique()
        # Build a simple loop emitting positions using lap distance interpolation
        while True:
            positions = []
            for drv in laps['DriverNumber'].unique():
                dlaps = laps.pick_driver(drv)
                if len(dlaps)==0: continue
                # use last lap distance (approx): sum sector distances? We'll use index to spread along track
                # For a simple visual, map position in order of classification
                try:
                    lastlap = dlaps.iloc[-1]
                    pos = int(lastlap['Position']) if 'Position' in lastlap else 99
                    # artificial 'distance' using position index to spread them along track
                    dist = pos * (TOTAL_LEN/ (len(laps['DriverNumber'].unique())+1))
                    nx,ny = map_distance_to_xy(dist)
                    positions.append({
                        'id': str(lastlap['Abbreviation'] if 'Abbreviation' in lastlap else lastlap['DriverNumber']),
                        'driver': f"{lastlap['GivenName']} {lastlap['FamilyName']}" if 'GivenName' in lastlap else str(drv),
                        'constructor': lastlap['Team'] if 'Team' in lastlap else '—',
                        'x': nx,
                        'y': ny,
                        'gap': None,
                        'lastLap': str(lastlap.get('LapTime', '—'))
                    })
                except Exception as e:
                    print('drv map error', e)
            await websocket.send(json.dumps({'type':'positions','data':positions}))
            await asyncio.sleep(1)
    except Exception as e:
        print('producer error', e)

async def main():
    async with websockets.serve(producer, '0.0.0.0', 8080):
        print('WS bridge started on ws://0.0.0.0:8080')
        await asyncio.Future()

if __name__ == '__main__':
    asyncio.run(main())