#include"Graph.h"

//---------------------Haversine------------------------------------
double Graph::haversine(double lat1, double lat2, double lon1, double lon2){
    #ifndef M_PI
    #define M_PI 3.14159265358979323846
    #endif
    const double R = 6371000;

    double dLat = (lat2-lat1) * M_PI / 180.0;
    double dLon = (lon2-lon1) * M_PI / 180.0;
    lat1 *= M_PI / 180.0;
    lat2 *= M_PI / 180.0;

    double a = (sin(dLat/2) * sin(dLat/2)) + (sin(dLon/2) * sin(dLon/2) * cos(lat1) * cos(lat2));
    double c = 2 * atan2(sqrt(a), sqrt(1-a));

    return c * R;
}


void Graph::addNode(long long id, double lat, double lon){
    nodes[id] = {id, lat, lon};
}

void Graph::adEdge(long long from, long long to, double distance){
    adjList[from].push_back({to, distance});
    adjList[to].push_back({from, distance});
}

void Graph::adEdge(long long from, long long to){
    double distance = haversine(nodes[from].get_latitude(), nodes[to].get_latitude(), nodes[from].get_longitude(), nodes[to].get_longitude());

    adjList[from].push_back({to, distance});
    adjList[to].push_back({from, distance});
}

const unordered_map<long long, vector<pair<long long, double>>>& Graph::get_adjList() const{
    return adjList;
}
unordered_map<long long, vector<pair<long long, double>>>& Graph::get_adjList(){
    return adjList;
}
unordered_map<long long, Node>& Graph::get_nodes(){
    return nodes;
}

void Graph::printGraph(){
    for(auto &n : adjList){
        cout<<"Node: "<<n.first<<" -> ";
        for(auto &neighbour : n.second){
            cout<<neighbour.first<<" (distance: "<<neighbour.second<<")";
        }
        cout<<endl;
    }
}

void Graph::buildNodeIndexMapping() {
    idToIndex.clear();
    indexToId.clear();

    int index = 0;
    for (auto &p : adjList) {
        idToIndex[p.first] = index;
        indexToId.push_back(p.first);
        index++;
    }
}
const vector<pair<long long, double>>& Graph::getNeighbors(long long id) const {
    static const vector<pair<long long, double>> empty;
    auto it = adjList.find(id);
    if(it != adjList.end()) return it->second;
    return empty;
}

bool Graph::hasNode(long long id) const {
    return nodes.find(id) != nodes.end();
}

const unordered_map<long long, Node>& Graph::get_nodes() const {
    return nodes;
}

