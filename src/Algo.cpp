#include"Algo.h"


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

}

void Algorithms::efficiency(Graph & g, long long start, long long end){
    Dijkstra(g, start, end);
    Astar(g, start, end);
}