#include"Algo.h"
#include<chrono>
#include<fstream>

//---------------Heuristic [for A Star]--------------------------------------------
double Algorithms::heuristic(Graph & g, long long node1, long long node2){
    auto & nodes = g.get_nodes();
    double lat1 = nodes[node1].get_latitude();
    double lon1 = nodes[node1].get_longitude();
    double lat2 = nodes[node2].get_latitude();
    double lon2 = nodes[node2].get_longitude();

    return g.haversine(lat1, lat2, lon1, lon2);
}

void Algorithms::printPath(Graph& g,unordered_map<long long, long long> &parent, long long start, long long end){
    vector<long long> path;

    for(long long at = end; at != -1; at = parent[at]){
        path.push_back(at);
        if(at == start) break;
    }

    reverse(path.begin(), path.end());
    ofstream ot("path_cordinates.csv");
    ot<< "lat,lon\n";

     for (auto node : path) {
        cout << node << " ";
        auto n = g.get_nodes().at(node);
        ot << n.get_latitude() << "," << n.get_longitude() << "\n";
    }
    cout << endl;

    ot.close();
    cout << "✅ Path coordinates saved to path_coords.csv\n";

    cout<<"Shortest path: ";
    for(auto node : path)
        cout<<node<<" ";
    cout<<endl;
}

//---------------A Star-----------------------------------------------
void Algorithms::Astar(Graph & g , long long start, long long end){
    
}

//---------------Dijkstra---------------------------------------------
double Algorithms::Dijkstra(Graph &g, long long startId, long long destId) {
    auto &adj = g.get_adjList();
    auto &idToIndex = g.idToIndex;
    auto &indexToId = g.indexToId;

    // Convert raw IDs → compact indices
    int start = idToIndex[startId];
    int dest  = idToIndex[destId];

    int N = indexToId.size();

    // Fixed memory – vectors instead of huge unordered_maps
    vector<double> dist(N, numeric_limits<double>::infinity());
    vector<int> parent(N, -1);

    dist[start] = 0;

    using P = pair<double, int>;
    priority_queue<P, vector<P>, greater<P>> pq;
    pq.push({0.0, start});

    auto startTime = chrono::high_resolution_clock::now();

    while (!pq.empty()) {
        auto [currentDist, u] = pq.top();
        pq.pop();

        if (u == dest)
            break;

        long long uId = indexToId[u];

        // Relax all neighbors
        for (auto &nbr : adj.at(uId)) {
            long long vId = nbr.first;
            double weight = nbr.second;

            int v = idToIndex[vId];

            if (currentDist + weight < dist[v]) {
                dist[v] = currentDist + weight;
                parent[v] = u;
                pq.push({dist[v], v});
            }
        }
    }

    auto endTime = chrono::high_resolution_clock::now();
    chrono::duration<double, milli> duration = endTime - startTime;

    cout << "\n--- Dijkstra Algorithm (Optimized) ---\n";

    // Convert parent[] indices → raw IDs
    unordered_map<long long, long long> rawParent;
    for (int i = 0; i < N; i++) {
        if (parent[i] == -1) rawParent[indexToId[i]] = -1;
        else rawParent[indexToId[i]] = indexToId[parent[i]];
    }

    // Print path using raw IDs
    printPath(g, rawParent, startId, destId);

    cout << "Total Distance: " << dist[dest] << " meters\n";
    cout << "Execution Time: " << duration.count() << " ms\n";

    return dist[dest];
}



void Algorithms::efficiency(Graph & g, long long start, long long end){
    Dijkstra(g, start, end);
    Astar(g, start, end);
}