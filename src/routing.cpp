#include "../include/routing.hpp"
#include "../include/kdtree.hpp"
#include <queue>
#include <unordered_set>
#include <cmath>
#include <limits>
#include <algorithm>

using namespace std;

// A* algorithm implementation with haversine heuristic
PathResult astar(AdjList& adj, NodeCoords& coords, long long source, long long destination) {
    PathResult result;
    result.found = false;
    result.totalDistance = 0.0;
    
    if (adj.find(source) == adj.end() || adj.find(destination) == adj.end()) {
        return result;
    }
    
    // Get destination coordinates for heuristic
    double destLat = coords[destination].first;
    double destLon = coords[destination].second;
    
    // g-score: actual distance from source
    unordered_map<long long, double> gScore;
    
    // Parent map to reconstruct path
    unordered_map<long long, long long> parent;
    
    // Closed set
    unordered_set<long long> closed;
    
    // Priority queue: (f-score, node_id) where f = g + h
    priority_queue<pair<double, long long>,
                   vector<pair<double, long long>>,
                   greater<pair<double, long long>>> pq;
    
    // Initialize
    gScore[source] = 0.0;
    double srcLat = coords[source].first;
    double srcLon = coords[source].second;
    double heuristic = haversine(srcLat, srcLon, destLat, destLon);
    pq.push({heuristic, source});
    
    while (!pq.empty()) {
        double f = pq.top().first;
        long long u = pq.top().second;
        pq.pop();
        
        // Found destination
        if (u == destination) {
            result.found = true;
            result.totalDistance = gScore[u];
            
            // Reconstruct path
            long long current = destination;
            while (current != source) {
                result.path.push_back(current);
                current = parent[current];
            }
            result.path.push_back(source);
            reverse(result.path.begin(), result.path.end());
            return result;
        }
        
        // Skip if already processed
        if (closed.count(u)) {
            continue;
        }
        closed.insert(u);
        
        // Explore neighbors
        for (size_t i = 0; i < adj[u].size(); i++) {
            long long v = adj[u][i].first;
            double weight = adj[u][i].second;
            
            if (closed.count(v)) {
                continue;
            }
            
            double tentativeG = gScore[u] + weight;
            
            if (!gScore.count(v) || tentativeG < gScore[v]) {
                gScore[v] = tentativeG;
                parent[v] = u;
                
                // Calculate heuristic (straight-line distance to destination)
                double vLat = coords[v].first;
                double vLon = coords[v].second;
                double h = haversine(vLat, vLon, destLat, destLon);
                double fScore = tentativeG + h;
                
                pq.push({fScore, v});
            }
        }
    }
    
    return result; // No path found
}
