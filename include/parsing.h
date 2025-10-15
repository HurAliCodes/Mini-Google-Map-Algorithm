#include"Graph.h"
#include<pugixml.hpp>
#include<iostream>
#include<vector>
#include<fstream>

using namespace std;

void parseOSM(Graph& graph, const string& filename);
void exporttocsv(Graph& graph1);
