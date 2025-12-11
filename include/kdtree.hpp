#pragma once
#include <vector>
using namespace std;

struct PointLL {
    double lat;
    double lon;
    int index;
};

struct KDNode {
    PointLL pt;
    KDNode* left;
    KDNode* right;
};

double haversine(double lat1, double lon1, double lat2, double lon2);
KDNode* buildKDTree(vector<PointLL>& pts, int l, int r, int depth);
int findNearest(KDNode* root, double lat, double lon, double& bestDistMeters);
