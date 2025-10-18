#define _USE_MATH_DEFINES
#include "Navigation.h"
#include<cmath>
#include<iostream>
#include<fstream>

using namespace std;

double navigation::bearing_deg(double lat1_deg, double lon1_deg, double lat2_deg, double lon2_deg){
    const double torad= M_PI/180.0;
    double phi1= lat1_deg* torad;
    double phi2= lat2_deg* torad;
    double lam1= lon1_deg* torad;
    double lam2= lon2_deg* torad;

    double y = sin(lam2- lam1) * cos(phi2);
    double x= cos(phi1) * sin(phi2) - sin(phi1) * cos(phi2) * cos(lam2-lam1);
    double br= atan2(y,x) * 180.0 / M_PI;
    if (br<0) br+=360.0;
    return br;
}

double navigation:: normalize_angle(double angle){
    while(angle<= -180.0) angle+= 360.0;
    while(angle>180.0) angle-=360.0;
    return angle;
}

vector<Navinstruction> navigation::buildinstruction(Graph& g, const vector<long long> &path, double turn_threshold_deg, double small_angle_deg){
    vector<Navinstruction> instruction;
    if(path.size()<2) return instruction;
    auto &nodes= g.get_nodes();
    vector<double> bearings;
    bearings.reserve(max((size_t)0, path.size()-1));
    for (size_t i = 0; i+1 < path.size(); ++i)
    {
        /* code */
        long long a= path[i], b= path[i+1];
        double lat1= nodes.at(a).get_latitude();
        double lon1= nodes.at(a).get_longitude();
        double lat2= nodes.at(b).get_latitude();
        double lon2= nodes.at(b).get_longitude();
        bearings.push_back(bearing_deg(lat1,lon1,lat2,lon2));
    }
    double accumDist = 0.0;
    size_t edgeindex= 0;
    {
        Navinstruction startins;
        ostringstream ss;
        ss<< "Start and head towards node "<<path.front();
        startins.text= ss.str();
        startins.distance_m = 0.0;
        startins.node_id= path.front();
        instruction.push_back(startins); 
    }
    for (size_t  i = 0; i+1 < path.size(); ++i)
    {
        /* code */
        long long from = path[i];
        long long to = path[i+1];
        double latf= nodes.at(from).get_latitude();
        double lonf= nodes.at(from).get_longitude();
        double latt= nodes.at(to).get_latitude();
        double lont= nodes.at(to).get_longitude();
        double edgdist= g.haversine(latf,latt,lonf,lont);
        accumDist+=edgdist;
        if (i+1< bearings.size())
        {
            /* code */
            double br1= bearings[i];
            double br2= bearings[i+1];
            double diff= normalize_angle(br2-br1);
            if (fabs(diff)>= turn_threshold_deg)
            {
                /* code */
                string turntype;
                if(diff>0 && fabs(diff) >= turn_threshold_deg) turntype = "Turn Right";
                else if(diff < 0 && fabs(diff)>= turn_threshold_deg) turntype= "Turn Left";
                else turntype = "continue";

                if(fabs(diff)<= small_angle_deg) turntype = "Continue Straight";

                Navinstruction ins;
                ostringstream ss;
                ss<<fixed<<setprecision(0);
                ss<<"In "<< accumDist << " m, "<<turntype<< "at node "<< to;
                ins.text= ss.str();
                ins.distance_m= accumDist;
                ins.node_id= to;
                instruction.push_back(ins);
                accumDist = 0.0;
                
            }
            
        }else{
            Navinstruction ins;
            ostringstream ss;
            ss<<fixed<<setprecision(0);
            ss<<"In "<<accumDist<< " m, you have arrived at destination (node: "<<to << ")";
            ins.text= ss.str();
            ins.distance_m= accumDist;
            ins.node_id= to;
            instruction.push_back(ins);
            accumDist= 0.0;
        }
        
    }
    ofstream file("practice/instruction.txt");
    for(auto& ins: instruction)
        file<< ins.text<< "\n";

    file.close();

     return instruction;
    
}