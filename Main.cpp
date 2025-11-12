#include "crow.h"
#include "Graph.h"
#include "Algo.h"
#include <fstream>
#include <sstream>
#include <iostream>
#include <unordered_map>
#include <limits>
#include <cmath>

struct CORS {
    struct context {};

    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        res.add_header("Access-Control-Allow-Origin", "*");
        res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization");

        if (req.method == "OPTIONS"_method) {
            res.code = 200;
            res.end();
        }
    }

    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        if (!res.headers.count("Access-Control-Allow-Origin")) {
            res.add_header("Access-Control-Allow-Origin", "*");
            res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
            res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        }
    }
};

//---------------------- Load Graph from nodes.txt ----------------------
// Graph loadGraph(const std::string& filename) {
//     Graph g;
//     std::ifstream in(filename);
//     if (!in.is_open()) {
//         std::cerr << "❌ Failed to open " << filename << std::endl;
//         return g;
//     }

//     std::string line;
//     long long currentNode = -1;
//     double lat, lon;

//     while (std::getline(in, line)) {
//         if (line.empty()) continue;
//         std::stringstream ss(line);
//         std::string token;
//         ss >> token;

//         if (token == "Node:") {
//             ss >> currentNode >> lat >> lon;
//             g.addNode(currentNode, lat, lon);  // ✅ add with real coordinates
//         } else {
//             long long neighbor = std::stoll(token);
//             double weight;
//             ss >> weight;

//             // ✅ Only add edge if neighbor already exists
//             if (g.get_nodes().find(currentNode) != g.get_nodes().end() &&
//                 g.get_nodes().find(neighbor) != g.get_nodes().end()) {
//                 g.adEdge(currentNode, neighbor, weight);
//             } else {
//                 // Optionally store temporarily if you prefer to link later
//                 g.adEdge(currentNode, neighbor, weight);
//             }
//         }
//     }

//     std::cout << "✅ Graph loaded from " << filename << std::endl;
//     return g;
// }

Graph loadGraph(const std::string& nodesCSV, const std::string& edgesTXT) {
    Graph g;

    // ---------------- Load all nodes from nodes.csv ----------------
    std::ifstream csv(nodesCSV);
    if (!csv.is_open()) {
        std::cerr << "❌ Failed to open " << nodesCSV << std::endl;
        return g;
    }

    std::string line;
    std::getline(csv, line); // skip header

    while (std::getline(csv, line)) {
        if (line.empty()) continue;

        std::stringstream ss(line);
        std::string idStr, latStr, lonStr;

        std::getline(ss, idStr, ',');
        std::getline(ss, latStr, ',');
        std::getline(ss, lonStr, ',');

        if (idStr.empty() || latStr.empty() || lonStr.empty()) continue;

        long long id = std::stoll(idStr);
        double lat = std::stod(latStr);
        double lon = std::stod(lonStr);

        g.addNode(id, lat, lon);
    }
    csv.close();
    std::cout << "✅ Loaded " << g.get_nodes().size() << " nodes from " << nodesCSV << std::endl;


    // ---------------- Load edges from nodes.txt ----------------
    std::ifstream txt(edgesTXT);
    if (!txt.is_open()) {
        std::cerr << "⚠️  Warning: Failed to open " << edgesTXT << " (no edges loaded)\n";
        return g;
    }

    long long currentNode = -1;
    int edgeCount = 0;

    while (std::getline(txt, line)) {
        if (line.empty()) continue;
        std::stringstream ss(line);
        std::string token;
        ss >> token;

        if (token == "Node:") {
            ss >> currentNode;
        } else {
            long long neighbor = std::stoll(token);
            double weight;
            ss >> weight;

            // ✅ Add edge only if both nodes exist
            if (g.get_nodes().find(currentNode) != g.get_nodes().end() &&
                g.get_nodes().find(neighbor) != g.get_nodes().end()) {
                g.adEdge(currentNode, neighbor, weight);
                edgeCount++;
            } else {
                std::cerr << "⚠️  Skipped edge (" << currentNode << " → " << neighbor 
                          << ") because one of the nodes was missing.\n";
            }
        }
    }

    txt.close();
    std::cout << "✅ Loaded " << edgeCount << " edges from " << edgesTXT << std::endl;

    return g;
}


//---------------------- Find nearest node by lat/lng ----------------------
long long findNearestNode(Graph& g, double lat, double lng) {
    double minDist = std::numeric_limits<double>::infinity();
    long long nearest = -1;
    for (auto& [id, node] : g.get_nodes()) {
        double d = g.haversine(lat, node.get_latitude(), lng, node.get_longitude());
        if (d < minDist) {
            minDist = d;
            nearest = id;
        }
    }
    return nearest;
}

int main() {
    crow::App<CORS> app;

    // Graph g = loadGraph("nodes.txt");
    Graph g = loadGraph("nodes.csv", "nodes.txt");

    Algorithms algo;

    // Health check
    CROW_ROUTE(app, "/")([]() {
        return "✅ Server is running!";
    });

    // Shortest path route
    CROW_ROUTE(app, "/shortest-path").methods("POST"_method)
    ([&](const crow::request& req){
        try {
            auto body = crow::json::load(req.body);
            if (!body || !body.has("start") || !body.has("end") ||
                !body["start"].has("lat") || !body["start"].has("lng") ||
                !body["end"].has("lat") || !body["end"].has("lng")) {
                return crow::response(400, "Invalid JSON or missing start/end lat/lng");
            }

            double startLat = body["start"]["lat"].d();
            double startLng = body["start"]["lng"].d();
            double endLat   = body["end"]["lat"].d();
            double endLng   = body["end"]["lng"].d();

            long long startNode = findNearestNode(g, startLat, startLng);
            long long endNode   = findNearestNode(g, endLat, endLng);

            cout<<"Start Node: "<<startNode;
            cout<<"End Node: "<<endNode;

            if (startNode == -1 || endNode == -1) {
                return crow::response(500, "Failed to find nearest nodes");
            }

            // Run Dijkstra
            algo.Dijkstra(g, startNode, endNode);

            // Read path coordinates from file saved by Dijkstra
            std::ifstream pathFile("path_cordinates.csv");
            if (!pathFile.is_open()) {
                return crow::response(500, "Failed to read path coordinates");
            }

            std::string line;
            std::getline(pathFile, line); // Skip header
            crow::json::wvalue result;
            result["path"] = crow::json::wvalue::list();
            int idx = 0;

            while (std::getline(pathFile, line)) {
                std::stringstream ss(line);
                std::string latStr, lonStr;
                if (!std::getline(ss, latStr, ',')) break;
                if (!std::getline(ss, lonStr, ',')) break;

                result["path"][idx]["lat"] = std::stod(latStr);
                result["path"][idx]["lng"] = std::stod(lonStr);
                idx++;
            }

            pathFile.close();
            crow::response res(result);
            res.add_header("Content-Type", "application/json");
            return res;

        } catch (const std::exception& e) {
            std::cerr << "❌ Error: " << e.what() << std::endl;
            return crow::response(500, "Internal server error");
        }
    });

    std::cout << "🚀 Crow server started on port 5000\n";
    app.port(5000).multithreaded().run();
}
