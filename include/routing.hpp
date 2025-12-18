#pragma once
#include <vector>
#include <unordered_map>
using namespace std;

struct PathResult {
    vector<long long> path;       
    double totalDistance;        
    bool found;                   
};
typedef unordered_map<long long, vector<pair<long long, double>>> AdjList;

typedef unordered_map<long long, pair<double, double>> NodeCoords;

PathResult astar(AdjList& adj, NodeCoords& coords, long long source, long long destination);
