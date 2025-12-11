#include <bits/stdc++.h>
#include "../include/locations.hpp"
#include "../include/kdtree.hpp"
using namespace std;

int main() {
    // Load nodes
    unordered_map<long long, Location> nodes;
    ifstream fin("nodes.csv");
    
    if (!fin.is_open()) {
        cerr << "Error: nodes.csv not found\n";
        return 1;
    }
    
    string line;
    getline(fin, line); // Skip header
    
    while (getline(fin, line)) {
        if (line.empty()) continue;
        
        int loc = line.find(',');
        long long id = stoll(line.substr(0, loc));
        
        line = line.substr(loc + 1);
        loc = line.find(',');
        double lat = stod(line.substr(0, loc));
        
        line = line.substr(loc + 1);
        loc = line.find(',');
        double lon = stod(line.substr(0, loc));
        
        string name = (loc != string::npos) ? line.substr(loc + 1) : "";
        
        nodes[id] = {id, lat, lon, name};
    }
    fin.close();
    
    cout << "Loaded " << nodes.size() << " nodes\n";
    
    // Build adjacency list
    unordered_map<long long, vector<pair<long long, double>>> adj;
    
    ifstream fe("edges.csv");
    if (!fe.is_open()) {
        cerr << "Error: edges.csv not found\n";
        return 1;
    }
    
    getline(fe, line); // Skip header
    
    while (getline(fe, line)) {
        if (line.empty()) continue;
        
        int comma_pos = line.find(',');
        int second_comma = line.find(',', comma_pos + 1);
        
        string nodes_str;
        if (second_comma != string::npos) {
            nodes_str = line.substr(comma_pos + 1, second_comma - comma_pos - 1);
        } else {
            nodes_str = line.substr(comma_pos + 1);
        }
        
        // Parse space-separated nodes
        vector<long long> node_list;
        stringstream ss(nodes_str);
        long long node_id;
        while (ss >> node_id) {
            node_list.push_back(node_id);
        }
        
        // Connect consecutive nodes
        for (size_t i = 0; i + 1 < node_list.size(); i++) {
            long long u = node_list[i];
            long long v = node_list[i + 1];
            
            if (!nodes.count(u) || !nodes.count(v)) continue;
            
            double dist = haversine(
                nodes[u].lat, nodes[u].lon,
                nodes[v].lat, nodes[v].lon
            );
            
            adj[u].push_back({v, dist});
            adj[v].push_back({u, dist});
        }
    }
    fe.close();
    
    cout << "Adjacency list created\n";
    cout << "Nodes: " << nodes.size() << ", Graph nodes: " << adj.size() << "\n";
    
    return 0;
}
