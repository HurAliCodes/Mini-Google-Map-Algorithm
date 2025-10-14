#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <climits>
#include <queue>
#include <unordered_set>

using namespace std;

class Node{
    public:
        double lat, lon;
        long long int id;

        Node(long long int id, double lat, double lon){
            this->id = id;
            this->lat = lat;
            this->lon = lon;
        }
};

class Edge{
    public:
        long long int to;
        double weight;

        Edge(long long int to, double weight){
            this->to = to;
            this->weight = weight;
        }
};

class Graph{
    public:
        vector<Node> nodes;
        vector<Edge> adjList;

        Graph(){}

        
};


int main(){

    

    return 0;
};