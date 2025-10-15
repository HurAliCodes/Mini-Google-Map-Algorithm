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
using namespace std;


int main() {
    Graph g;
    parseOSM(g, "Karachi/Karachi.osm");
    exporttocsv(g);
    return 0;
}