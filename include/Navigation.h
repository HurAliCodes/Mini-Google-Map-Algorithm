#pragma once
#include<vector>
#include<string>
#include<cmath>
#include<sstream>
#include<iomanip>
#include"Graph.h"
using namespace std;


struct Navinstruction{
string text;
double distance_m;
long long node_id;
};

namespace navigation{
    double bearing_deg(double lat1_deg, double lon1_deg, double lat2_deg, double lon2_deg);
    double normalize_angle(double ang);
    vector<Navinstruction> buildinstruction(Graph& g, const vector<long long>& path, double turn_threshold_deg=30.0, double small_angle_deg= 15.0);
    
}