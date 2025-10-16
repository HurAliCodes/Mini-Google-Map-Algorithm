#include "parsing.h"
using namespace std;

double minlat = 24.89, maxlat = 24.95;
double minlon = 67.05, maxlon = 67.12;

void parseOSM(Graph &graph1, const string &filename)
{
    pugi::xml_document doc;
    pugi::xml_parse_result result = doc.load_file(filename.c_str());
    if (!result)
    {
        cout << "File Not loaded" << endl;
        return;
    }

    pugi::xml_node osm = doc.child("osm");

    for (pugi::xml_node node = osm.child("node"); node; node = node.next_sibling("node"))
    {
        long long id = node.attribute("id").as_llong();
        double lat = node.attribute("lat").as_double();
        double lon = node.attribute("lon").as_double();
        if (lat >= minlat && lat <= maxlat && lon >= minlon && lon <= maxlon)
        {
            graph1.addNode(id, lat, lon);
        }
        //  graph1.addNode(id, lat, lon);
    }
    cout << "total Nodes added: " << graph1.get_nodes().size() << endl;
    for (pugi::xml_node way = osm.child("way"); way; way = way.next_sibling("way"))
    {
        /* code */
        vector<long long> noderefs;
        for (pugi::xml_node nd = way.child("nd"); nd; nd = nd.next_sibling("nd"))
        {
            long long ref = nd.attribute("ref").as_llong();
            if (graph1.get_nodes().count(ref))
            {
                noderefs.push_back(ref);
            }
        }
        for (size_t i = 0; i + 1 < noderefs.size(); i++)
        {
            graph1.adEdge(noderefs[i], noderefs[i + 1]);
        }
    }
    // int count = 0;
    // for (auto &p : graph1.get_nodes())
    // {
    //     cout << "Node " << p.first << " → (" << p.second.get_latitude() << ", " << p.second.get_longitude() << ")\n";
    //     if (++count >= 10)
    //         break;
    // }
    // for (auto &p : graph1.get_adjList())
    // {
    //     cout<<"Node: "<<p.first<<endl;
    //     for(auto &s: p.second){
    //         cout<<s.first<<" "<<s.second<<endl;
    //     }
    //     if (++count >= 10)
    //         break;
    // }
    

}

void exporttocsv(Graph &graph1){
 ofstream file("nodes.txt");
//  file<< " id, latitude, longitude\n";
//  for(auto &p : graph1.get_nodes()){
//     file<<p.first<< ","<< p.second.get_latitude()<< ","<<p.second.get_longitude()<<"\n";
//  }
 for (auto &p : graph1.get_adjList())
    {
        file<<"Node: "<<p.first<<endl;
        for(auto &s: p.second){
            file<<s.first<<" "<<s.second<<endl;
        }
    }

 file.close();


}