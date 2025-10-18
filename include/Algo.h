#ifndef ALGO_H
#define ALGO_H

#include"Graph.h"
#include<stack>
#include<limits>
#include<functional>

using namespace std;

class Algorithms{
    public:
        //Utility
        static double heuristic(Graph & g , long long node1, long long node2);
        static void printPath(Graph& g,unordered_map<long long, long long> &parent, long long start, long long end);
 
        //Algorithms
        static vector<long long> Dijkstra(Graph & g , long long start, long long end);
        static void Astar(Graph & g , long long start, long long end);

        //Efficiency
        static void efficiency(Graph & g, long long start, long long end);
};


#endif