#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <climits>
#include <queue>
#include <unordered_set>

using namespace std;

typedef pair<int, int> pii; //{Distance, node}

void Dijkstra(int n, int src, vector<vector<pii>> &adj){

    vector<int> dist(n, 1e9); //Initialize distances to infinity
    dist[src] = 0;

    priority_queue<pii, vector<pii>, greater<pii>> pq;

    pq.push({0, src});

    while(!pq.empty()){
        int d = pq.top().first;
        int u = pq.top().second;

        pq.pop();

        if(d!=dist[u]) continue;//Skip outdated entries

        for(auto &edge : adj[u]){
            int v = edge.first;
            int w = edge.second;

            if(dist[u] + w < dist[v]){
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }

    cout << "Shortest distances from node " << src << ":\n";
    for (int i = 0; i < n; i++)
        cout << "To " << i << " : " << dist[i] << "\n";

}

int main(){

    int n = 3; //Number of nodes -> (0, 1, 2)

    vector<vector<pii>> adj(n);

    adj[0].push_back({1, 2}); //A(0) -> B(1)
    adj[0].push_back({2, 4}); //A(0) -> C(2)
    adj[1].push_back({2, 1}); //B(1) -> C(2)

    Dijkstra(n, 0, adj);

    return 0;
};