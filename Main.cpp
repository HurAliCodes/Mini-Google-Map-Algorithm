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
Graph loadGraph(const std::string& filename) {
    Graph g;
    std::ifstream in(filename);
    if (!in.is_open()) {
        std::cerr << "❌ Failed to open " << filename << std::endl;
        return g;
    }

    std::string line;
    long long currentNode = -1;

    while (std::getline(in, line)) {
        if (line.empty()) continue;
        std::stringstream ss(line);
        std::string token;
        ss >> token;

        if (token == "Node:") {
            ss >> currentNode;
            g.addNode(currentNode, 0.0, 0.0); // Lat/Lon placeholder
        } else {
            long long neighbor = std::stoll(token);
            double weight;
            ss >> weight;

            if (g.get_nodes().find(neighbor) == g.get_nodes().end()) {
                g.addNode(neighbor, 0.0, 0.0);
            }

            g.adEdge(currentNode, neighbor, weight);
        }
    }

    std::cout << "✅ Graph loaded from " << filename << std::endl;
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

    Graph g = loadGraph("nodes.txt");
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
