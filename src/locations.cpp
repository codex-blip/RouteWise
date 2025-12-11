// location function def

#include "../include/locations.hpp"
#include <fstream>
#include <sstream>
#include <iostream>
using namespace std;

vector<Location> loadLocations(const string& path) {
    vector<Location> locs;
    ifstream file(path);
    if (!file.is_open()) {
        cerr << "Error: could not open file " << path << "\n";
        return locs;
    }
    string line;
    bool first = true;
    while (getline(file, line)) {
        if (line.empty()) continue;
        if (first) {
            first = false;
            continue;
        }
        stringstream ss(line);
        string idStr, latStr, lonStr, nameStr;
        if (!getline(ss, idStr, ',')) continue;
        if (!getline(ss, latStr, ',')) continue;
        if (!getline(ss, lonStr, ',')) continue;
        if (!getline(ss, nameStr)) continue;
        Location loc;
        loc.id = stoll(idStr);
        loc.lat = stod(latStr);
        loc.lon = stod(lonStr);
        loc.name = nameStr;
        locs.push_back(loc);
    }
    return locs;
}
