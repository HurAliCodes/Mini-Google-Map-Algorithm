#include <iostream>
#include <string>
#include <unordered_map>
#include <cmath>
#include <algorithm>
#include <vector>
#include "pugixml.hpp"
using namespace std;

//Graph Class
class Graph{
    private:
        struct Edge{
            int to;
            double weight;
        };

        vector<vector<Edge>> adj;
        unordered_map<long long, int> nodeIdToIndex;
        vector<pair<double, double>> indexToCoord;

        double haversine(double lat1, double lon1, double lat2, double lon2) {
            #ifndef M_PI
            #define M_PI 3.14159265358979323846
            #endif

            const double R = 6371000; 
            double dLat = (lat2 - lat1) * M_PI / 180.0;
            double dLon = (lon2 - lon1) * M_PI / 180.0;
            lat1 *= M_PI / 180.0;
            lat2 *= M_PI / 180.0;
            double a = sin(dLat/2) * sin(dLat/2) +
                    sin(dLon/2) * sin(dLon/2) * cos(lat1) * cos(lat2);
            double c = 2 * atan2(sqrt(a), sqrt(1-a));
            return R * c;
        }

        public:
    bool loadFromOSM(const string& filename) {
        pugi::xml_document doc;
        if (!doc.load_file(filename.c_str())) {
            cerr << "Error loading OSM file!\n";
            return false;
        }

        int index = 0;
        for (auto& node : doc.child("osm").children("node")) {
            long long id = node.attribute("id").as_llong();
            double lat = node.attribute("lat").as_double();
            double lon = node.attribute("lon").as_double();

            nodeIdToIndex[id] = index++;
            indexToCoord.push_back({lat, lon});
            adj.push_back({});
        }

        for (auto& way : doc.child("osm").children("way")) {
            if (!way.find_child_by_attribute("tag", "k", "highway"))
                continue;

            vector<long long> refs;
            for (auto& nd : way.children("nd")) {
                refs.push_back(nd.attribute("ref").as_llong());
            }

            for (size_t i = 1; i < refs.size(); i++) {
                if (nodeIdToIndex.count(refs[i-1]) && nodeIdToIndex.count(refs[i])) {
                    int u = nodeIdToIndex[refs[i-1]];
                    int v = nodeIdToIndex[refs[i]];
                    // auto [lat1, lon1] = indexToCoord[u];
                    // auto [lat2, lon2] = indexToCoord[v];
                    // double dist = haversine(lat1, lon1, lat2, lon2);

                    double lat1 = indexToCoord[u].first;
                    double lon1 = indexToCoord[u].second;
                    double lat2 = indexToCoord[v].first;
                    double lon2 = indexToCoord[v].second;
                    double dist = haversine(lat1, lon1, lat2, lon2);

                    adj[u].push_back({v, dist});
                    adj[v].push_back({u, dist});
                }
            }
        }

        cout << "Graph built with " << indexToCoord.size() 
             << " nodes and adjacency list created.\n";
        return true;
    }

    void printNeighbors(int idx) {
        cout << "Neighbors of node " << idx << " (" 
             << indexToCoord[idx].first << ", " 
             << indexToCoord[idx].second << "):\n";
        for (auto& e : adj[idx]) {
            cout << "  -> " << e.to << " (dist " << e.weight << " m)\n";
        }
    }

    vector<int> dijkstra(int src, int dest) {
        vector<double> dist(adj.size(), 1e18);
        vector<int> parent(adj.size(), -1);
        vector<bool> visited(adj.size(), false);

        dist[src] = 0;
        for (size_t i = 0; i < adj.size(); i++) {
            int u = -1;
            for (size_t j = 0; j < adj.size(); j++) {
                if (!visited[j] && (u == -1 || dist[j] < dist[u]))
                    u = j;
            }
            if (u == -1 || dist[u] == 1e18) break;
            visited[u] = true;

            for (auto& e : adj[u]) {
                if (dist[u] + e.weight < dist[e.to]) {
                    dist[e.to] = dist[u] + e.weight;
                    parent[e.to] = u;
                }
            }
        }

        vector<int> path;
        for (int v = dest; v != -1; v = parent[v])
            path.push_back(v);
        reverse(path.begin(), path.end());
        return path;
    }

    double getLat(int idx) { return indexToCoord[idx].first; }
    double getLon(int idx) { return indexToCoord[idx].second; }
};

int main() {
    // pugi::xml_document doc;
    // if (!doc.load_file("karachi.osm")) {
    //     std::cerr << "Error loading OSM file!\n";
    //     return 1;
    // }

    // // Print a few nodes
    // int count = 0;
    // for (auto& node : doc.child("osm").children("node")) {
    //     long long id = node.attribute("id").as_llong();
    //     double lat = node.attribute("lat").as_double();
    //     double lon = node.attribute("lon").as_double();

    //     cout << "Node " << id 
    //               << " (" << lat << ", " << lon << ")\n";
    //     if (++count >= 10) break; // just first 10
    // }

    Graph g;
    if (!g.loadFromOSM("karachi.osm")) return 1;

    g.printNeighbors(0);  // check neighbors of first node

    // Example: shortest path between two nodes
    int src = 0, dest = 100;  
    vector<int> path = g.dijkstra(src, dest);

    cout << "\nShortest path from " << src << " to " << dest << ":\n";
    for (int idx : path) {
        cout << idx << " (" << g.getLat(idx) << ", " << g.getLon(idx) << ")\n";
    }

    return 0;
}