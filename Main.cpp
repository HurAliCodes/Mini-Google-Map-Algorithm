#define _USE_MATH_DEFINES
#include <iostream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <cmath>
#include <algorithm>
#include <vector>
#include<atomic>
#include<thread>
#include"pugixml.hpp"
#include"Graph.h"
#include"parsing.h"
#include"Algo.h"
#include"Navigation.h"
using namespace std;


int main() {
    Algorithms a;
    Graph g;
    parseOSM(g, "Karachi OSM/Karachi.osm");

    // atomic<bool> found(false);

    // thread t1([&](){
    //     a.Dijkstra(g,732019159, 2297529385, found);
    // });
    // thread t2([&](){
        //     a.Astar(g,732019159, 2297529385, found);
        // });
        
    a.Astar(g,732019159, 2297529385);
    a.Dijkstra(g,732019159, 2297529385);

    // exporttocsv(g);
// <<<<<<< HEAD
    // a.Dijkstra(g,13167991882, 13167991885);
    // a.Astar(g, 13167991882, 13167991885);

    // t1.join();
    // t2.join();

    // if(found){
    //     cout<<"\nOne Algorithm reached the destination first"<<endl;
    // }
    // else{
    //     cout<<"\nNo path found by either algorithm"<<endl;
    // }

// =======
//     vector<long long> path= a.Dijkstra(g,2297533049, 1869080608);
    
//     auto instructions=navigation::buildinstruction(g,path);
//     for (auto &ins: instructions)
//     {
//         /* code */
//         cout<< ins.text<<endl;
//     }
    
// >>>>>>> 8b17178c8ac36fb02c96566d96e7d5736fa9fb69
    return 0;
}