#include"Algo.h"
#include<chrono>
#include<fstream>

//---------------Heuristic [for A Star]--------------------------------------------
double Algorithms::heuristic(Graph & g, long long node1, long long node2){
    auto & nodes = g.get_nodes();
    double lat1 = nodes[node1].get_latitude();
    double lon1 = nodes[node1].get_longitude();
    double lat2 = nodes[node2].get_latitude();
    double lon2 = nodes[node2].get_longitude();

    return g.haversine(lat1, lat2, lon1, lon2);
}

void Algorithms::printPath(Graph& g,unordered_map<long long, long long> &parent, long long start, long long end){
    vector<long long> path;

    for(long long at = end; at != -1; at = parent[at]){
        path.push_back(at);
        if(at == start) break;
    }

    reverse(path.begin(), path.end());
    ofstream ot("practice/path_cordinates.csv");
    ot<< "lat,lon\n";

     for (auto node : path) {
        cout << node << " ";
        auto n = g.get_nodes().at(node);
        ot << n.get_latitude() << "," << n.get_longitude() << "\n";
    }
    cout << endl;

    ot.close();
    cout << "✅ Path coordinates saved to path_coords.csv\n";

    cout<<"Shortest path: ";
    for(auto node : path)
        cout<<node<<" ";
    cout<<endl;
}

//---------------A Star-----------------------------------------------
void Algorithms::Astar(Graph & g , long long start, long long end){

    //Astart Formula : f(n) = g(n) + h(n)
    //Here, f(n) = Final/Total cost
    //      g(n) = actual cost (path cost)
    //      h(n) = heuristic cost

    //Get adjency list
    auto &adj = g.get_adjList();
    //Get nodes
    auto &nodes = g.get_nodes();

    unordered_map<long long, double> gScore, fScore;
    unordered_map<long long, long long> parent;

    //Set all to infinity
    for(auto &p: adj){
        gScore[p.first] = numeric_limits<double>::infinity();
        fScore[p.first] = numeric_limits<double>::infinity();
        parent[p.first] = -1;
    }

    //Set starting node's cost to 0
    gScore[start] = 0;
    fScore[start] = heuristic(g, start, end);

    priority_queue<pair<double, long long>, vector<pair<double, long long>>, greater<pair<double, long long>>> pq;
    pq.push({fScore[start], start});

    auto startTime = chrono::high_resolution_clock::now();
    
    while(!pq.empty()){
        //Return if Dijkstra found the result
        // if(found) return;

        long long node = pq.top().second;
        pq.pop();

        if(node == end){
            // found = true;
            // auto endTime = chrono::high_resolution_clock::now();
            // chrono::duration<double, milli> duration = endTime - startTime;
            // cout << "\n--- A* Search Algorithm ---\n";
            // printPath(g, parent, start, end);
            // cout << "Total Distance: " << gScore[end] << " meters\n";
            // cout << "Execution Time: " << duration.count() << " ms\n";
            break;
        }

        for(auto &neighbour : adj[node]){
            long long next = neighbour.first;
            double weight = neighbour.second;
            
            //Temporary path cost
            double tentative_g = gScore[node] + weight;
            
            if(tentative_g < gScore[next]){
                parent[next] = node;
                gScore[next] = tentative_g;
                fScore[next] = tentative_g + heuristic(g, next, end);
                pq.push({fScore[next], next});
            }
        }
    }

    auto endTime = chrono::high_resolution_clock::now();
    chrono::duration<double, milli> duration = endTime - startTime;

    cout << "\n--- A* Search Algorithm ---\n";
    printPath(g, parent, start, end);
    cout << "Total Distance: " << gScore[end] << " meters\n";
    cout << "Execution Time: " << duration.count() << " ms\n";
}

//---------------Dijkstra---------------------------------------------
vector<long long> Algorithms::Dijkstra(Graph & g, long long start, long long destination){
    auto &adj = g.get_adjList();

    unordered_map<long long, double> dist;
    unordered_map<long long, long long> parent;

    //Setting distances to infinity
    for(auto &p : adj){
        dist[p.first] = numeric_limits<double>::infinity();
        parent[p.first] = -1;
    }

    //Current Node distance to 0
    dist[start] = 0;

    priority_queue<pair<double, long long>, vector<pair<double, long long>>, greater<pair<double, long long>>> pq;
    pq.push({0, start});

    auto startTime = chrono::high_resolution_clock::now();

    while(!pq.empty()){
        //Return - A-Star found the result
        // if(found) return;

        auto [currentDist, node] = pq.top();
        pq.pop();

        if(node == destination){
            // found = true;
            // auto endTime = chrono::high_resolution_clock::now();
            // chrono::duration<double, milli> duration = endTime - startTime;

            // cout << "\n--- Dijkstra Algorithm ---\n";
            // printPath(g,parent, start, destination);
            // cout << "Total Distance: " << dist[destination] << " meters\n";
            // cout << "Execution Time: " << duration.count() << " ms\n";
            break;
        }

        for(auto &neighbour : adj[node]){
            long long next = neighbour.first;
            double weight = neighbour.second;

            if(currentDist + weight < dist[next]){
                dist[next] = currentDist + weight;
                parent[next] = node;
                pq.push({dist[next], next});
            }
        }
    }

    vector<long long> path;
    for (long long at = destination; at != -1; at= parent[at])
    {
        /* code */
        path.push_back(at);
        if(at== start) break;
    }
    
    reverse(path.begin(), path.end());

    auto endTime = chrono::high_resolution_clock::now();
    chrono::duration<double, milli> duration = endTime - startTime;

    cout << "\n--- Dijkstra Algorithm ---\n";
    printPath(g,parent, start, destination);
    cout << "Total Distance: " << dist[destination] << " meters\n";
    cout << "Execution Time: " << duration.count() << " ms\n";

    return path;

}

void Algorithms::efficiency(Graph & g, long long start, long long end){
    // Dijkstra(g, start, end);
    // Astar(g, start, end);
}