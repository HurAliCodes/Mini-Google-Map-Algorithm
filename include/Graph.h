#ifndef GRAPH_H
#define GRAPH_H

#include"Node.h"

using namespace std;

class Graph{
    private:
        unordered_map<long long, Node> nodes;
        unordered_map<long long, vector<pair<long long, double>>> adjList;
    
        double haversine(double lat1, double lat2, double lon1, double lon2);
    public:

        void addNode(long long id, double lat, double lon);
        void adEdge(long long from, long long to, double distance);
        void adEdge(long long from, long long to);

        
        //Getters
        unordered_map<long long, vector<pair<long long, double>>>& get_adjList();
        unordered_map<long long, Node>& get_nodes();
        void printGraph();
    };

#endif