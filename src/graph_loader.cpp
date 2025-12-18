#include "../include/graph_loader.hpp"
#include <fstream>
#include <sstream>
#include <iostream>
using namespace std;

GraphData loadGraph(const string& nodesFile, const string& edgesFile) {
    GraphData data;
    data.loaded = false;
    data.kdTree = nullptr;
    
    // Load nodes
    ifstream fin(nodesFile);
    if (!fin.is_open()) {
        cerr << "Error: " << nodesFile << " not found\n";
        return data;
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
        
        data.nodes[id] = {id, lat, lon, name};
        data.coords[id] = {lat, lon};
    }
    fin.close();
    
    cout << "Loaded " << data.nodes.size() << " nodes\n";
    
    // Load edges and build adjacency list
    ifstream fe(edgesFile);
    if (!fe.is_open()) {
        cerr << "Error: " << edgesFile << " not found\n";
        return data;
    }
    
    getline(fe, line); // Skip header
    
    while (getline(fe, line)) {
        if (line.empty()) continue;
        
        // Parse CSV: id,node_ids,road_name,traffic_multiplier
        int comma1 = line.find(',');
        int comma2 = line.find(',', comma1 + 1);
        int comma3 = line.find(',', comma2 + 1);
        
        string nodes_str = line.substr(comma1 + 1, comma2 - comma1 - 1);
        
        // Parse traffic multiplier (default 1.0 if not present)
        double traffic_multiplier = 1.0;
        if (comma3 != string::npos) {
            string multiplier_str = line.substr(comma3 + 1);
            try {
                traffic_multiplier = stod(multiplier_str);
            } catch (...) {
                traffic_multiplier = 1.0;
            }
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
            
            if (!data.nodes.count(u) || !data.nodes.count(v)) continue;
            
            double dist = haversine(
                data.nodes[u].lat, data.nodes[u].lon,
                data.nodes[v].lat, data.nodes[v].lon
            );
            
            // Apply traffic multiplier to distance
            double weighted_dist = dist * traffic_multiplier;
            
            data.adj[u].push_back(make_pair(v, weighted_dist));
            data.adj[v].push_back(make_pair(u, weighted_dist));
        }
    }
    fe.close();
    
    cout << "Graph built with " << data.adj.size() << " connected nodes\n";
    
    // Build KD-tree ONLY from nodes that are in the road network
    vector<PointLL> points;
    for (AdjList::iterator it = data.adj.begin(); it != data.adj.end(); it++) {
        long long nodeId = it->first;
        if (data.nodes.count(nodeId)) {
            PointLL p;
            p.lat = data.nodes[nodeId].lat;
            p.lon = data.nodes[nodeId].lon;
            p.index = (int)points.size();
            points.push_back(p);
            data.indexToId.push_back(nodeId);
        }
    }
    data.kdTree = buildKDTree(points, 0, (int)points.size() - 1, 0);
    cout << "KD-tree built with " << points.size() << " road network nodes\n";
    
    data.loaded = true;
    return data;
}
