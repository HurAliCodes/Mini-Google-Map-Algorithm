#include"Algo.h"
#include<chrono>


//---------------Heuristic [for A Star]--------------------------------------------
double Algorithms::heuristic(Graph & g, long long node1, long long node2){
    auto & nodes = g.get_nodes();
    double lat1 = nodes[node1].get_latitude();
    double lon1 = nodes[node1].get_longitude();
    double lat2 = nodes[node2].get_latitude();
    double lon2 = nodes[node2].get_longitude();

    return g.haversine(lat1, lat2, lon1, lon2);
}

void Algorithms::printPath(unordered_map<long long, long long> &parent, long long start, long long end){
    vector<long long> path;

    for(long long at = end; at != -1; at = parent[at]){
        path.push_back(at);
        if(at == start) break;
    }

    reverse(path.begin(), path.end());
    cout<<"Shortest path: ";
    for(auto node : path)
        cout<<node<<" ";
    cout<<endl;
}

//---------------A Star-----------------------------------------------
void Algorithms::Astar(Graph & g , long long start, long long end){
    
}

//---------------Dijkstra---------------------------------------------
void Algorithms::Dijkstra(Graph & g, long long start, long long destination){
    auto &adj = g.get_adjList();

    unordered_map<long long, double> dist;
    unordered_map<long long, long long> parent;

    //Setting distances to infinity
    for(auto &p : adj){
        dist[p.first] = numeric_limits<double>::infinity();
        parent[p.first] = -1;
    }

    //Current Node distance to 0
    dist[start] = 0;

    priority_queue<pair<double, long long>, vector<pair<double, long long>>, greater<pair<double, long long>>> pq;
    pq.push({0, start});

    auto startTime = chrono::high_resolution_clock::now();

    while(!pq.empty()){
        auto [currentDist, node] = pq.top();
        pq.pop();

        if(node == destination) break;

        for(auto &neighbour : adj[node]){
            long long next = neighbour.first;
            double weight = neighbour.second;

            if(currentDist + weight < dist[next]){
                dist[next] = currentDist + weight;
                parent[next] = node;
                pq.push({dist[next], next});
            }
        }
    }

    auto endTime = chrono::high_resolution_clock::now();
    chrono::duration<double, milli> duration = endTime - startTime;

    cout << "\n--- Dijkstra Algorithm ---\n";
    printPath(parent, start, destination);
    cout << "Total Distance: " << dist[destination] << " meters\n";
    cout << "Execution Time: " << duration.count() << " ms\n";
}

void Algorithms::efficiency(Graph & g, long long start, long long end){
    Dijkstra(g, start, end);
    Astar(g, start, end);
}