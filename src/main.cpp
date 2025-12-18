#include <bits/stdc++.h>
#include "../include/graph_loader.hpp"
#include "../include/routing.hpp"
#include "../include/kdtree.hpp"
using namespace std;

void displayRoute(const PathResult& result, const unordered_map<long long, Location>& nodes) {
    cout << "Route found!\n";
    cout << "Total distance: " << result.totalDistance / 1000.0 << " km\n";
    cout << "Path nodes: " << result.path.size() << "\n";
    
    // Show first and last few waypoints
    cout << "\nWaypoints:\n";
    size_t showCount = 5;
    for (size_t i = 0; i < showCount && i < result.path.size(); i++) {
        long long nid = result.path[i];
        cout << "  " << nid;
        if (!nodes.at(nid).name.empty()) cout << " - " << nodes.at(nid).name;
        cout << "\n";
    }
    if (result.path.size() > 10) {
        cout << "  ... (" << result.path.size() - 10 << " more nodes) ...\n";
    }
    if (result.path.size() > showCount) {
        size_t startIdx = result.path.size() - showCount;
        if (startIdx < showCount) startIdx = showCount;
        for (size_t i = startIdx; i < result.path.size(); i++) {
            long long nid = result.path[i];
            cout << "  " << nid;
            if (!nodes.at(nid).name.empty()) cout << " - " << nodes.at(nid).name;
            cout << "\n";
        }
    }
}

void exportRoute(const PathResult& result, const unordered_map<long long, Location>& nodes) {
    ofstream pathFile("route_output.csv");
    pathFile << "lat,lon,name\n";
    for (size_t i = 0; i < result.path.size(); i++) {
        long long nid = result.path[i];
        pathFile << fixed << setprecision(6) 
                 << nodes.at(nid).lat << "," 
                 << nodes.at(nid).lon << ","
                 << nodes.at(nid).name << "\n";
    }
    pathFile.close();
    cout << "Path exported to route_output.csv\n";
    cout << "Visualize at: https://www.google.com/maps/dir/";
    cout << nodes.at(result.path[0]).lat << "," << nodes.at(result.path[0]).lon << "/";
    cout << nodes.at(result.path.back()).lat << "," << nodes.at(result.path.back()).lon << "\n";
}

int main() {
    // Load graph data
    GraphData graph = loadGraph("data/nodes.csv", "data/edges.csv");
    
    if (!graph.loaded) {
        cerr << "Failed to load graph data\n";
        return 1;
    }
    
    cout << "=========================================\n";
    
    // Interactive routing loop
    while (true) {
        cout << "\nEnter source coordinates (lat lon) or 'q' to quit: ";
        string input;
        getline(cin, input);
        
        if (input == "q" || input == "Q") break;
        
        double srcLat, srcLon;
        stringstream ss1(input);
        if (!(ss1 >> srcLat >> srcLon)) {
            cout << "Invalid input. Format: lat lon\n";
            continue;
        }
        
        cout << "Enter destination coordinates (lat lon): ";
        getline(cin, input);
        
        double destLat, destLon;
        stringstream ss2(input);
        if (!(ss2 >> destLat >> destLon)) {
            cout << "Invalid input. Format: lat lon\n";
            continue;
        }
        
        // Find nearest nodes using KD-tree
        double srcDist, destDist;
        int srcIdx = findNearest(graph.kdTree, srcLat, srcLon, srcDist);
        int destIdx = findNearest(graph.kdTree, destLat, destLon, destDist);
        
        if (srcIdx < 0 || destIdx < 0) {
            cout << "Could not find nearby nodes\n";
            continue;
        }
        
        long long srcNode = graph.indexToId[srcIdx];
        long long destNode = graph.indexToId[destIdx];
        
        cout << "\nSource node: " << srcNode;
        if (!graph.nodes[srcNode].name.empty()) cout << " (" << graph.nodes[srcNode].name << ")";
        cout << " [" << srcDist << "m away]\n";
        
        cout << "Destination node: " << destNode;
        if (!graph.nodes[destNode].name.empty()) cout << " (" << graph.nodes[destNode].name << ")";
        cout << " [" << destDist << "m away]\n";
        
        // Run A* pathfinding
        cout << "\nFinding route using A*...\n";
        clock_t start = clock();
        PathResult result = astar(graph.adj, graph.coords, srcNode, destNode);
        clock_t end = clock();
        double duration = (double)(end - start) / CLOCKS_PER_SEC * 1000;
        
        if (result.found) {
            displayRoute(result, graph.nodes);
            cout << "Time taken: " << duration << " ms\n";
            
            // Option to export path for visualization
            cout << "\nExport path coordinates? (y/n): ";
            string exportChoice;
            getline(cin, exportChoice);
            if (exportChoice == "y" || exportChoice == "Y") {
                exportRoute(result, graph.nodes);
            }
        } else {
            cout << "No route found!\n";
        }
    }
    
    cout << "Goodbye!\n";
    return 0;
}
