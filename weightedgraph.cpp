#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <climits>
using namespace std;

class Graph{
    private:
        unordered_map<string, vector<pair<string, int>>> adjList;
    
    public:
        void addEdge(string u, string v, int w, bool bidir=true){
            adjList[u].push_back({v, w});
            if(bidir){
                adjList[v].push_back({u, w});
            }
        }

        void printGraph(){
            for(auto &node : adjList){
                cout<<node.first<<" -> ";
                for(auto &neighbour : node.second){
                    cout<<"("<<neighbour.first<<", "<<neighbour.second<<")";
                }
                cout<<endl;
            }
        }
};

int main(){

    Graph g;

    g.addEdge("A", "B", 5);
    g.addEdge("B", "C", 3);
    g.addEdge("A", "D", 7);
    g.addEdge("C", "D", 2);

    g.printGraph();

    return 0;
};