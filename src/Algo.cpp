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
double Algorithms::Astar(Graph & g , long long startID, long long destID) {

    auto &adj = g.get_adjList();
    auto &idToIndex = g.idToIndex;
    auto &indexToId = g.indexToId;
    auto &nodes = g.get_nodes();

    if (idToIndex.find(startID) == idToIndex.end() ||
        idToIndex.find(destID) == idToIndex.end()) 
    {
        return std::numeric_limits<double>::infinity();
    }

    int start = idToIndex[startID];
    int dest = idToIndex[destID];
    int N = indexToId.size();

    vector<double> gCost(N, numeric_limits<double>::infinity());
    vector<double> fCost(N, numeric_limits<double>::infinity());
    vector<int> parent(N, -1);

    gCost[start] = 0;

    using P = pair<double, int>;
    priority_queue<P, vector<P>, greater<P>> pq;

    fCost[start] = heuristic(g, startID, destID);
    pq.push({fCost[start], start});

    auto startTime = chrono::high_resolution_clock::now();

    while (!pq.empty()) {
        auto [f, u] = pq.top();
        pq.pop();

        if (u == dest)
            break;

        long long uID = indexToId[u];

        for (auto &nbr : adj.at(uID)) {
            long long vID = nbr.first;
            double weight = nbr.second;

            int v = idToIndex[vID];
            double tentative_g = gCost[u] + weight;

            if (tentative_g < gCost[v]) {
                gCost[v] = tentative_g;
                fCost[v] = tentative_g + heuristic(g, vID, destID);
                parent[v] = u;

                pq.push({fCost[v], v});
            }
        }
    }

    auto endTime = chrono::high_resolution_clock::now();
    chrono::duration<double, milli> duration = endTime - startTime;

    cout << "\n--- A* Algorithm (Optimized) ---\n";

    if (gCost[dest] == numeric_limits<double>::infinity()) {
        cout << "❌ No path found\n";
        return numeric_limits<double>::infinity();   // ✔ FIX
    }

    // Convert parent[] indices → raw IDs
    unordered_map<long long, long long> rawParent;
    for (int i = 0; i < N; i++) {
        if (parent[i] == -1) rawParent[indexToId[i]] = -1;
        else rawParent[indexToId[i]] = indexToId[parent[i]];
    }

    printPath(g, rawParent, startID, destID);

    cout << "Total Distance: " << gCost[dest] << " meters\n";
    cout << "Execution Time: " << duration.count() << " ms\n";

    return gCost[dest];   // ✔ REQUIRED
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