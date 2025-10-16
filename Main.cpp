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
using namespace std;


int main() {
    Algorithms a;
    Graph g;
    parseOSM(g, "Karachi/Karachi.osm");
    // exporttocsv(g);
    a.Dijkstra(g,13167991882, 13167991885);
    return 0;
}