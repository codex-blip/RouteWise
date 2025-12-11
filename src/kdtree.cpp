// kdtree function def

#include "../include/kdtree.hpp"
#include <algorithm>
#include <cmath>
#include <limits>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

using namespace std;

static double deg2rad(double deg) {
    return deg * M_PI / 180.0;
}

double haversine(double lat1, double lon1, double lat2, double lon2) {
    const double R = 6371000.0;
    double phi1 = deg2rad(lat1);
    double phi2 = deg2rad(lat2);
    double dphi = deg2rad(lat2 - lat1);
    double dlmb = deg2rad(lon2 - lon1);
    double a = sin(dphi/2)*sin(dphi/2) + cos(phi1)*cos(phi2)*sin(dlmb/2)*sin(dlmb/2);
    double c = 2 * atan2(sqrt(a), sqrt(1-a));
    return R * c;
}

KDNode* buildKDTree(vector<PointLL>& pts, int l, int r, int depth) {
    if (l > r) return nullptr;
    int mid = (l + r) / 2;
    int axis = depth % 2;
    nth_element(pts.begin() + l, pts.begin() + mid, pts.begin() + r + 1,
        [axis](const PointLL& a, const PointLL& b) {
            return (axis == 0) ? (a.lat < b.lat) : (a.lon < b.lon);
        });
    KDNode* node = new KDNode();
    node->pt = pts[mid];
    node->left = buildKDTree(pts, l, mid - 1, depth + 1);
    node->right = buildKDTree(pts, mid + 1, r, depth + 1);
    return node;
}

static void nearestRec(KDNode* node, double lat, double lon, int depth, int& bestIndex, double& bestDistMeters) {
    if (!node) return;
    double d = haversine(lat, lon, node->pt.lat, node->pt.lon);
    if (d < bestDistMeters) {
        bestDistMeters = d;
        bestIndex = node->pt.index;
    }
    int axis = depth % 2;
    double diff = (axis == 0) ? (lat - node->pt.lat) : (lon - node->pt.lon);
    KDNode* first = (diff < 0) ? node->left : node->right;
    KDNode* second = (diff < 0) ? node->right : node->left;
    nearestRec(first, lat, lon, depth + 1, bestIndex, bestDistMeters);
    double diffMeters = abs(diff) * 111000.0;
    if (diffMeters < bestDistMeters) {
        nearestRec(second, lat, lon, depth + 1, bestIndex, bestDistMeters);
    }
}

int findNearest(KDNode* root, double lat, double lon, double& bestDistMeters) {
    bestDistMeters = numeric_limits<double>::infinity();
    int bestIndex = -1;
    nearestRec(root, lat, lon, 0, bestIndex, bestDistMeters);
    return bestIndex;
}
