#include<bits/stdc++.h>
using namespace std;
#define int long long
using ld =long double;


struct Node{
    ld latitude,longitude;

};
unordered_map< int , Node> nodes;





// Function to convert degrees to radians
ld toRadians(ld degree) {
    return degree * M_PI / 180.0;
}

// Function to calculate distance using Haversine formula
ld haversineDistance(ld lat1, ld lon1, ld lat2, ld lon2) {
    // Earth's radius in kilometers
    const ld R = 6371.008771; 

    // Convert latitudes and longitudes from degrees to radians
    lat1 = toRadians(lat1);
    lon1 = toRadians(lon1);
    lat2 = toRadians(lat2);
    lon2 = toRadians(lon2);

    // Calculate the difference in latitudes and longitudes
    ld dlat = lat2 - lat1;
    ld dlon = lon2 - lon1;

    // Apply Haversine formula
    ld a = sin(dlat / 2) * sin(dlat / 2) +
               cos(lat1) * cos(lat2) *
               sin(dlon / 2) * sin(dlon / 2);
    ld c = 2 * atan2(sqrt(a), sqrt(1 - a));

    // Calculate the distance
    ld distance = R * c;

    return distance; // Distance in kilometers
}






int32_t main(){

    ifstream fin("nodes.csv");
    
if (!fin.is_open()) {
    cout << "Error: nodes.csv not found\n";
    return 0;   // or exit(1);
}

string line;

getline(fin, line); // getting the top line( node  , latitude ,  longitude)


while(getline(fin, line)){

   stringstream ss(line);

        long long id;
        ld lat, lon;
        int loc=line.find(',');
        id=stoll(line.substr(0,loc));

line  =line.substr(loc+1,line.size());

loc=line.find(',');
lat=stold( line.substr(0,loc));
lon=stold(line.substr(loc+1));


        nodes[id] = {lat, lon};

}
fin.close();

  cout << "Loaded " << nodes.size() << " nodes\n";



  //now we go for putting edges 
    unordered_map<int, vector<pair<int, ld>>> adj;

ifstream fe("edges.csv"); 
if (!fe.is_open()) {
    cout << "Error: edges.csv not found\n";
    return 0;
}

getline(fe, line);
while (getline(fe, line)) {
    if (line.size() == 0) continue;
    
    // Find first comma to skip edge ID
    int comma_pos = line.find(',');
    
    // Get the string after comma (space-separated node IDs)
    string nodes_str = line.substr(comma_pos + 1);
    
    // Parse space-separated nodes
    vector<long long> node_list;
    int start = 0;
    
    while (start < nodes_str.size()) {
        // Skip spaces
        while (start < nodes_str.size() && nodes_str[start] == ' ') {
            start++;
        }
        
        if (start >= nodes_str.size()) break;
        
        // Find next space
        int end = start;
        while (end < nodes_str.size() && nodes_str[end] != ' ') {
            end++;
        }
        
        // Extract node ID
        string node_str = nodes_str.substr(start, end - start);
        node_list.push_back(stoll(node_str));
        
        start = end + 1;
    }
    
    // Connect consecutive nodes
    for (int i = 0; i + 1 < node_list.size(); i++) {
        long long u = node_list[i];
        long long v = node_list[i + 1];
        
        if (!nodes.count(u) || !nodes.count(v)) {
            cout<<u<<" "<<v<<'\n';
            continue;
        }
        
        ld dist = haversineDistance(
            nodes[u].latitude, nodes[u].longitude,
            nodes[v].latitude, nodes[v].longitude
        );
        
        adj[u].push_back({v, dist});
        adj[v].push_back({u, dist});
    }
}


cout<<"adjacancy list made "<<endl;

cout<<nodes.size()<<" "<<adj.size()<<endl;



}