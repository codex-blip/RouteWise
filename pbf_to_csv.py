import osmium
import csv

class Handler(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.nodes = []
        self.ways = []

    def node(self, n):
        self.nodes.append([n.id, n.location.lat, n.location.lon])

    def way(self, w):
        node_ids = [nd.ref for nd in w.nodes]
        self.ways.append([w.id, node_ids])

handler = Handler()
handler.apply_file("delhi.pbf")

# Write nodes
with open("nodes.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["id", "lat", "lon"])
    writer.writerows(handler.nodes)

# Write ways
with open("edges.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["id", "node_ids"])
    for w in handler.ways:
        writer.writerow([w[0], " ".join(map(str, w[1]))])
