#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <climits>
using namespace std;

class Graph{
    private:
        unordered_map<string, vector<string>> adjList;
    
    public:
        void addEdge(string u, string v, bool bidir = true){
            adjList[u].push_back(v);
            if(bidir){
                adjList[v].push_back(u);
            }
        }

        void printGraph(){
            for(auto &node : adjList){
                cout<<node.first<<" -> ";
                for(auto &neighbour : node.second){
                    cout<<neighbour<<" ";
                }
                cout<<endl;
            }
        }
};

int main(){

    Graph g;
    g.addEdge("A", "B");
    g.addEdge("B", "C");
    g.addEdge("A", "D");
    g.addEdge("C", "D");

    g.printGraph();

    return 0;
};