// main.cpp — optimized nearest lookup using KD-tree, preserves A* behaviour & CSV path read
#include "crow.h"
#include "Graph.h"
#include "Algo.h"
#include "kdtree.h"   // <- KD-tree header you integrated (kNearest(lat, lon, k, valid))
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

// Load node coordinates (unchanged)
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

// Load graph edges (unchanged)
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

int main()
{
    crow::App<CORS> app;

    Graph g;
    loadNodeCoordinates(g, "nodes.csv");
    loadGraph("nodes.txt", g);

    g.buildNodeIndexMapping();
    std::cout << "✅ Node index mapping built. Total indexed nodes: " << g.indexToId.size() << std::endl;

    Algorithms algo;

    // Build KD-tree from graph nodes (only once at startup)
    std::vector<KDPoint> kdpoints;
    kdpoints.reserve(g.get_nodes().size());
    for (const auto &p : g.get_nodes()) {
        long long id = p.first;
        const Node &node = p.second;
        KDPoint kp;
        kp.id = id;
        kp.lat = node.get_latitude();
        kp.lon = node.get_longitude();
        kdpoints.push_back(kp);
    }

    KDTree kdt;
    kdt.build(kdpoints); // expects KD-tree variant that projects lat/lon internally

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

            // Tune K as needed (8..32)
            const int K = 8;

            // Valid predicate for KD-tree: exclude nodes with no neighbors
            auto validPredicate = [&](long long id) -> bool {
                const auto &neighbors = g.getNeighbors(id);
                return !neighbors.empty();
            };

            // Get K nearest candidates for start and end
            auto startCandidates = kdt.kNearest(startLat, startLng, K, [&](long long id){
                // also require node exists and has neighbors
                if (!g.hasNode(id)) return false;
                return validPredicate(id);
            });

            auto endCandidates = kdt.kNearest(endLat, endLng, K, [&](long long id){
                if (!g.hasNode(id)) return false;
                return validPredicate(id);
            });

            if (startCandidates.empty() || endCandidates.empty()) {
                return crow::response(500, "Failed to find nearest connected nodes");
            }

            double totalDistance = std::numeric_limits<double>::infinity();
            long long chosenStart = -1, chosenEnd = -1;

            // Try A* on pairs of candidates until a path is found.
            // We keep the behavior "try multiple nearest" but avoid scanning entire graph.
            bool found = false;
            for (long long sId : startCandidates) {
                for (long long eId : endCandidates) {
                    // optional short-circuit: same node
                    if (sId == eId) {
                        // small sanity check: still run A* to ensure it's valid
                    }

                    // call A* (unchanged)
                    double dist = algo.Astar(g, sId, eId);

                    if (dist != std::numeric_limits<double>::infinity()) {
                        totalDistance = dist;
                        chosenStart = sId;
                        chosenEnd   = eId;
                        found = true;
                        break;
                    }
                    // else try next end candidate
                }
                if (found) break;
            }

            if (!found) {
                // If no path found among top-K candidates, you can choose to:
                //  - increase K and retry
                //  - or fallback to original scan behaviour (try nearest one-by-one).
                // For now, we will expand K progressively once (doubling) up to a reasonable cap.
                int newK = std::min((int)g.get_nodes().size(), K * 4);
                if (newK > K) {
                    auto startCandidates2 = kdt.kNearest(startLat, startLng, newK, [&](long long id){
                        if (!g.hasNode(id)) return false;
                        return validPredicate(id);
                    });
                    auto endCandidates2 = kdt.kNearest(endLat, endLng, newK, [&](long long id){
                        if (!g.hasNode(id)) return false;
                        return validPredicate(id);
                    });

                    for (long long sId : startCandidates2) {
                        for (long long eId : endCandidates2) {
                            double dist = algo.Astar(g, sId, eId);
                            if (dist != std::numeric_limits<double>::infinity()) {
                                totalDistance = dist;
                                chosenStart = sId;
                                chosenEnd   = eId;
                                found = true;
                                break;
                            }
                        }
                        if (found) break;
                    }
                }
            }

            if (!found)
                return crow::response(500, "No path found between nearest candidates");

            // Read path coordinates from file (preserving your existing Algo/printPath CSV behavior)
            std::ifstream pathFile("path_cordinates.csv");
            if (!pathFile.is_open()) return crow::response(500, "Failed to read path coordinates");

            std::string line;
            std::getline(pathFile, line); // skip header if present
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
            result["start_node"] = chosenStart;
            result["end_node"]   = chosenEnd;

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
