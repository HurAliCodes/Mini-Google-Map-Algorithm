#define _USE_MATH_DEFINES
#include <iostream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <cmath>
#include <algorithm>
#include <vector>
#include"pugixml.hpp"
#include"Graph.h"
#include"parsing.h"
#include"Algo.h"
#include"Navigation.h"
using namespace std;


int main() {
    Algorithms a;
    Graph g;
    parseOSM(g, "Karachi/Karachi.osm");
    // exporttocsv(g);
    vector<long long> path= a.Dijkstra(g,2297533049, 1869080608);
    
    auto instructions=navigation::buildinstruction(g,path);
    for (auto &ins: instructions)
    {
        /* code */
        cout<< ins.text<<endl;
    }
    
    return 0;
}