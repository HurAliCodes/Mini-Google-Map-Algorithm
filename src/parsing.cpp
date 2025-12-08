// // #include "parsing.h"
// // using namespace std;

// // void parseOSM(Graph &graph1, const string &filename)
// // {
// //     pugi::xml_document doc;
// //     pugi::xml_parse_result result = doc.load_file(filename.c_str());
// //     if (!result)
// //     {
// //         cout << "File Not loaded" << endl;
// //         return;
// //     }

// //     pugi::xml_node osm = doc.child("osm");

// //     for (pugi::xml_node node = osm.child("node"); node; node = node.next_sibling("node"))
// //     {
// //         long long id = node.attribute("id").as_llong();
// //         double lat = node.attribute("lat").as_double();
// //         double lon = node.attribute("lon").as_double();

// //         graph1.addNode(id, lat, lon);

// //         //  graph1.addNode(id, lat, lon);
// //     }
// //     cout << "total Nodes added: " << graph1.get_nodes().size() << endl;
// //     for (pugi::xml_node way = osm.child("way"); way; way = way.next_sibling("way"))
// //     {
// //         /* code */
// //         vector<long long> noderefs;
// //         for (pugi::xml_node nd = way.child("nd"); nd; nd = nd.next_sibling("nd"))
// //         {
// //             long long ref = nd.attribute("ref").as_llong();
// //             if (graph1.get_nodes().count(ref))
// //             {
// //                 noderefs.push_back(ref);
// //             }
// //         }
// //         for (size_t i = 0; i + 1 < noderefs.size(); i++)
// //         {
// //             graph1.adEdge(noderefs[i], noderefs[i + 1]);
// //         }
// //     }
// //     // int count = 0;
// //     // for (auto &p : graph1.get_nodes())
// //     // {
// //     //     cout << "Node " << p.first << " → (" << p.second.get_latitude() << ", " << p.second.get_longitude() << ")\n";
// //     //     if (++count >= 10)
// //     //         break;
// //     // }
// //     // for (auto &p : graph1.get_adjList())
// //     // {
// //     //     cout<<"Node: "<<p.first<<endl;
// //     //     for(auto &s: p.second){
// //     //         cout<<s.first<<" "<<s.second<<endl;
// //     //     }
// //     //     if (++count >= 10)
// //     //         break;
// //     // }
// // }


// #include "parsing.h"
// #include <unordered_map>
// #include <unordered_set>
// #include <iostream>
// #include <vector>
// #include <string>
// #include "pugixml.hpp"

// using namespace std;

// void parseOSM(Graph &graph, const string &filename)
// {
//     pugi::xml_document doc;
//     pugi::xml_parse_result result = doc.load_file(filename.c_str());
//     if (!result) {
//         cout << "OSM File not loaded!" << endl;
//         return;
//     }

//     pugi::xml_node osm = doc.child("osm");

//     // Step 1: build a map from node id -> XML node for fast lookup
//     unordered_map<long long, pugi::xml_node> allNodes;
//     for (pugi::xml_node node = osm.child("node"); node; node = node.next_sibling("node")) {
//         long long id = node.attribute("id").as_llong();
//         allNodes[id] = node;
//     }

//     // Step 2: keep track of nodes that belong to roads only
//     unordered_set<long long> roadNodes;

//     // Step 3: process ways
//     for (pugi::xml_node way = osm.child("way"); way; way = way.next_sibling("way")) {

//         bool isRoad = false;

//         // Check if the way is a highway (street)
//         for (pugi::xml_node tag = way.child("tag"); tag; tag = tag.next_sibling("tag")) {
//             string k = tag.attribute("k").as_string();
//             if (k == "highway") {
//                 isRoad = true;
//                 break;
//             }
//         }

//         if (!isRoad) continue; // skip buildings, parks, etc.

//         // Collect all node references in this road
//         vector<long long> noderefs;
//         for (pugi::xml_node nd = way.child("nd"); nd; nd = nd.next_sibling("nd")) {
//             long long ref = nd.attribute("ref").as_llong();

//             // Add node to graph if not already added
//             if (allNodes.count(ref) && !graph.hasNode(ref)) {
//                 pugi::xml_node node = allNodes[ref];
//                 double lat = node.attribute("lat").as_double();
//                 double lon = node.attribute("lon").as_double();
//                 graph.addNode(ref, lat, lon);
//             }

//             // Track as road node
//             if (graph.hasNode(ref)) {
//                 noderefs.push_back(ref);
//                 roadNodes.insert(ref);
//             }
//         }

//         // Add edges between consecutive nodes
//         for (size_t i = 0; i + 1 < noderefs.size(); i++) {
//             graph.adEdge(noderefs[i], noderefs[i + 1]);
//         }
//     }

//     cout << "Total nodes added (streets only): " << roadNodes.size() << endl;
// }


// void exporttotxt(Graph &graph1)
// {
//     ofstream file("nodes.txt");
//     for (auto &p : graph1.get_adjList())
//     {
//         file << "Node: " << p.first << endl;
//         for (auto &s : p.second)
//         {
//             file << s.first << " " << s.second << endl;
//         }
//     }

//     file.close();
// }

// void exporttocsv(Graph &graph1)
// {
//     ofstream file("nodes.csv");
//     file << " id, latitude, longitude\n";
//     for (auto &p : graph1.get_nodes())
//     {
//         file << p.first << "," << p.second.get_latitude() << "," << p.second.get_longitude() << "\n";
//     }

//     file.close();
// }