#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include "locations.hpp"
#include "routing.hpp"
#include "kdtree.hpp"
using namespace std;

struct GraphData {
    unordered_map<long long, Location> nodes;
    AdjList adj;
    NodeCoords coords;
    KDNode* kdTree;
    vector<long long> indexToId;
    bool loaded;
};

GraphData loadGraph(const string& nodesFile, const string& edgesFile);
