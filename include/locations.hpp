#pragma once
#include <string>
#include <vector>
using namespace std;

struct Location {
    long long id;
    double lat;
    double lon;
    string name;
};

vector<Location> loadLocations(const string& path);
