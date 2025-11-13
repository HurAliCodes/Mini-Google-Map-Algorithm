#define _USE_MATH_DEFINES
#include <iostream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <cmath>
#include <algorithm>
#include <vector>
#include "pugixml.hpp"
#include "Graph.h"
#include "parsing.h"
#include "Algo.h"
using namespace std;

int main()
{
    Algorithms a;
    Graph g;
    parseOSM(g, "Karachi/Karachi.osm");
    exporttocsv(g);
    exporttotxt(g);

    return 0;
}