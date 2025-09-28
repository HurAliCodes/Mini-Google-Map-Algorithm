#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <climits>
#include <queue>
#include <unordered_set>

using namespace std;

class Graph{
    private:
        unordered_map<string, vector<string>> adjList;
    public:
        void addEdge(string u, string v, bool bidir=true){
            adjList[u].push_back(v);
            if(bidir) adjList[v].push_back(u);
        }

        void BFS(string start){
            unordered_set<string> visited;
            queue<string> q;

            q.push(start);
            visited.insert(start);

            cout<<"BFS Traversal: ";
            while(!q.empty()){
                string node = q.front();
                q.pop();

                cout<<node<<" ";

                for(auto &neighbour : adjList[node]){
                    if(visited.find(neighbour)==visited.end()){
                        q.push(neighbour);
                        visited.insert(neighbour);
                    }
                }
            }
            cout<<endl;
        }

        void DFSUtil(string node, unordered_set<string> visited){
            visited.insert(node);

            cout<<node<<" ";

            for(auto &neighbour : adjList[node]){
                if(visited.find(neighbour) == visited.end()){
                    DFSUtil(neighbour, visited);
                }
            }
        }

        void DFS(string start){
            unordered_set<string> visited;
            cout<<"DFS Traversal: ";
            DFSUtil(start, visited);
            cout<<endl;
        }

};


int main(){

    Graph g;
    g.addEdge("A", "B");
    g.addEdge("B", "C");
    g.addEdge("A", "D");
    g.addEdge("D", "E");
    g.addEdge("C", "E");

    g.BFS("A");
    g.DFS("A");

    return 0;
};