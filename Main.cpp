#include "crow.h"
#include "Graph.h"
#include "Algo.h"
#include <fstream>
#include <sstream>
#include <iostream>
#include <unordered_map>
#include <limits>
#include <cmath>
#include <vector>
#include <set>

struct CORS
{
    struct context {};

    void before_handle(crow::request &req, crow::response &res, context &ctx)
    {
        res.add_header("Access-Control-Allow-Origin", "*");
        res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization");

        if (req.method == "OPTIONS"_method)
        {
            res.code = 200;
            res.end();
        }
    }

    void after_handle(crow::request &req, crow::response &res, context &ctx)
    {
        if (!res.headers.count("Access-Control-Allow-Origin"))
        {
            res.add_header("Access-Control-Allow-Origin", "*");
            res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
            res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        }
    }
};

// Load node coordinates
void loadNodeCoordinates(Graph &g, const std::string &filename)
{
    std::ifstream in(filename);
    if (!in.is_open())
    {
        std::cerr << "❌ Failed to open " << filename << std::endl;
        return;
    }

    std::string line;
    std::getline(in, line); // skip header

    while (std::getline(in, line))
    {
        std::stringstream ss(line);
        std::string idStr, latStr, lonStr;
        if (!std::getline(ss, idStr, ',')) continue;
        if (!std::getline(ss, latStr, ',')) continue;
        if (!std::getline(ss, lonStr, ',')) continue;

        try
        {
            long long id = std::stoll(idStr);
            double lat = std::stod(latStr);
            double lon = std::stod(lonStr);
            g.addNode(id, lat, lon);
        }
        catch (...) { continue; }
    }

    std::cout << "✅ Node coordinates loaded from " << filename << std::endl;
}

// Load graph edges
Graph loadGraph(const std::string& filename, Graph& g) {
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
            if (!g.get_nodes().count(currentNode))
                g.addNode(currentNode, 0, 0); // placeholder
        } else {
            long long neighbor = std::stoll(token);
            double weight; ss >> weight;

            if (!g.get_nodes().count(neighbor))
                g.addNode(neighbor, 0, 0); // placeholder

            g.adEdge(currentNode, neighbor, weight);
        }
    }

    std::cout << "✅ Graph edges loaded from " << filename << std::endl;
    return g;
}

// Find nearest connected node (optional: next nearest if path fails)
long long findNearestConnectedNode(Graph& g, double lat, double lng, const std::set<long long>& exclude = {}) {
    double minDist = std::numeric_limits<double>::infinity();
    long long nearest = -1;
    for (auto& [id, node] : g.get_nodes()) {
        if (g.get_adjList()[id].empty()) continue; // skip disconnected
        if (exclude.count(id)) continue;
        double d = g.haversine(lat, node.get_latitude(), lng, node.get_longitude());
        if (d < minDist) {
            minDist = d;
            nearest = id;
        }
    }
    return nearest;
}

int main()
{
    crow::App<CORS> app;

    Graph g;
    loadNodeCoordinates(g, "nodes.csv");
    loadGraph("nodes.txt", g);

    g.buildNodeIndexMapping();
    std::cout << "✅ Node index mapping built. Total indexed nodes: " << g.indexToId.size() << std::endl;

    Algorithms algo;

    // Health check
    CROW_ROUTE(app, "/")([]() { return "✅ Server is running!"; });

    // Shortest path route
    CROW_ROUTE(app, "/shortest-path").methods("POST"_method)([&](const crow::request &req)
    {
        try {
            auto body = crow::json::load(req.body);
            if (!body || !body.has("start") || !body.has("end") ||
                !body["start"].has("lat") || !body["start"].has("lng") ||
                !body["end"].has("lat") || !body["end"].has("lng"))
            {
                return crow::response(400, "Invalid JSON or missing start/end lat/lng");
            }

            double startLat = body["start"]["lat"].d();
            double startLng = body["start"]["lng"].d();
            double endLat   = body["end"]["lat"].d();
            double endLng   = body["end"]["lng"].d();

            std::set<long long> triedStart, triedEnd;
            long long startNode = -1, endNode = -1;
            double totalDistance = std::numeric_limits<double>::infinity();

            // Try nearest connected nodes until a valid path is found
            while (totalDistance == std::numeric_limits<double>::infinity()) {
                startNode = findNearestConnectedNode(g, startLat, startLng, triedStart);
                endNode   = findNearestConnectedNode(g, endLat, endLng, triedEnd);

                if (startNode == -1 || endNode == -1)
                    return crow::response(500, "Failed to find nearest connected nodes");

                triedStart.insert(startNode);
                triedEnd.insert(endNode);

                totalDistance = algo.Astar(g, startNode, endNode);

                if (totalDistance != std::numeric_limits<double>::infinity())
                    break; // path found
            }

            // Read path coordinates from file
            std::ifstream pathFile("path_cordinates.csv");
            if (!pathFile.is_open()) return crow::response(500, "Failed to read path coordinates");

            std::string line;
            std::getline(pathFile, line); // skip header
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

            result["distance_meters"] = totalDistance;
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
