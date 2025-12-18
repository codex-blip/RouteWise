import osmium
import csv
from collections import defaultdict

class Handler(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.all_nodes = {}  # id -> (lat, lon, name)
        self.ways = []
        self.way_names = {}  # way_id -> road name
        self.node_degree = defaultdict(int)
        self.poi_nodes = set()  # nodes that are important POIs
        
        # Filter for major roads only
        self.major_road_types = {
            'motorway', 'trunk', 'primary', 'secondary', 'tertiary',
            'motorway_link', 'trunk_link', 'primary_link', 'secondary_link'
        }
        
        # POI types to extract as named locations
        self.poi_tags = {
            'amenity', 'shop', 'tourism', 'leisure', 'office', 
            'public_transport', 'railway', 'aeroway', 'historic'
        }

    def node(self, n):
        name = n.tags.get('name', '')
        self.all_nodes[n.id] = [n.location.lat, n.location.lon, name]
        
        # Mark as POI if it has any important tag with a name
        if name:
            for tag in self.poi_tags:
                if tag in n.tags:
                    self.poi_nodes.add(n.id)
                    break

    def way(self, w):
        # Only process major roads
        highway_type = w.tags.get('highway', '')
        if highway_type not in self.major_road_types:
            return
        
        node_ids = [nd.ref for nd in w.nodes]
        if len(node_ids) < 2:
            return
        
        way_name = w.tags.get('name', '')
        way_id = len(self.ways)
        self.ways.append((node_ids, way_name))
        
        # Count node degrees (endpoints count once, middle nodes count for each connection)
        for i, node_id in enumerate(node_ids):
            if i == 0 or i == len(node_ids) - 1:
                self.node_degree[node_id] += 1  # endpoint
            else:
                self.node_degree[node_id] += 2  # passes through (in + out)

handler = Handler()
handler.apply_file("delhi.pbf")

print(f"Original ways: {len(handler.ways)}")
print(f"Total nodes before filtering: {len(handler.node_degree)}")
print(f"POI nodes found: {len(handler.poi_nodes)}")

# Identify important nodes: intersections (degree != 2), endpoints, named nodes, or POIs
important_nodes = set()
for node_id, degree in handler.node_degree.items():
    # Keep if: intersection (degree != 2), has a name, or is a POI
    if degree != 2 or node_id in handler.poi_nodes or (node_id in handler.all_nodes and handler.all_nodes[node_id][2]):
        important_nodes.add(node_id)

# Also add all POI nodes even if not on major roads (for pickup/dropoff points)
important_nodes.update(handler.poi_nodes)

print(f"Important nodes (intersections/endpoints/named/POIs): {len(important_nodes)}")

# Simplify ways: merge segments between important nodes
simplified_edges = []
edge_id = 1

for way_nodes, way_name in handler.ways:
    if len(way_nodes) < 2:
        continue
    
    # Build segments between important nodes
    segment = [way_nodes[0]]
    
    for i in range(1, len(way_nodes)):
        segment.append(way_nodes[i])
        
        # If we hit an important node (or last node), create an edge
        if way_nodes[i] in important_nodes or i == len(way_nodes) - 1:
            if len(segment) >= 2:
                simplified_edges.append([edge_id, segment, way_name])
                edge_id += 1
            # Start new segment from this important node
            segment = [way_nodes[i]]

print(f"Simplified edges: {len(simplified_edges)}")

# Collect all nodes that are actually used in simplified edges
used_nodes = set()
for edge_id, segment, way_name in simplified_edges:
    used_nodes.update(segment)

# Add POI nodes that might not be on road network
for poi_id in handler.poi_nodes:
    if poi_id in handler.all_nodes:
        used_nodes.add(poi_id)

print(f"Nodes in simplified graph: {len(used_nodes)}")

# Write nodes (only those in simplified edges or are POIs)
with open("nodes.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["id", "lat", "lon", "name"])
    for node_id in sorted(used_nodes):
        if node_id in handler.all_nodes:
            lat, lon, name = handler.all_nodes[node_id]
            writer.writerow([node_id, lat, lon, name])

# Write edges with road names and traffic multiplier
with open("edges.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["id", "node_ids", "road_name", "traffic_multiplier"])
    for edge_id, segment, way_name in simplified_edges:
        writer.writerow([edge_id, " ".join(map(str, segment)), way_name, 1.0])

print("Done! Files created successfully.")
print(f"Nodes: {len(used_nodes)}, Edges: {len(simplified_edges)}")

# Count named nodes
named_count = sum(1 for nid in used_nodes if nid in handler.all_nodes and handler.all_nodes[nid][2])
print(f"Named nodes: {named_count} ({named_count/len(used_nodes)*100:.1f}%)")
