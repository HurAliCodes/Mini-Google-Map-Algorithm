#ifndef ALGO_H
#define ALGO_H

#include"Graph.h"
#include<stack>
#include<limits>
#include<functional>

using namespace std;

class Algorithms{
    public:
        static void BFS(Graph &g, long long start);
        static void DFS(Graph &g, long long start);

        static void Dijkstra(Graph & g, long long start, long long destination);
};


#endif