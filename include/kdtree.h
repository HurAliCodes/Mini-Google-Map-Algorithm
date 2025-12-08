#pragma once
#include <vector>
#include <functional>
#include <limits>
#include <algorithm>
#include <queue>
#include <cmath>

struct KDPoint {
    long long id;
    double lat; // degrees
    double lon; // degrees
    double x = 0.0; // projected meters
    double y = 0.0;
};

struct KDNode {
    KDPoint pt;
    KDNode *left = nullptr;
    KDNode *right = nullptr;
    KDNode(const KDPoint &p) : pt(p) {}
};

class KDTree {
public:
    KDTree() : root(nullptr), ref_lat_deg(0.0) {}
    ~KDTree() { deleteAll(root); }

    void build(const std::vector<KDPoint> &points);

    long long nearest(double lat, double lon) const;
    long long nearest(double lat, double lon, const std::function<bool(long long)> &valid) const;

    long long secondNearest(double lat, double lon) const;

    std::vector<long long> kNearest(double lat, double lon, int k) const;
    std::vector<long long> kNearest(double lat, double lon, int k,
                                    const std::function<bool(long long)> &valid) const;

private:
    KDNode *root;
    std::vector<KDPoint> pts_copy;
    double ref_lat_deg;
    static constexpr double EARTH_RADIUS_M = 6371000.0;

    KDNode* buildRec(int l, int r, int depth);
    void deleteAll(KDNode *n);

    void nearestRec(KDNode *node, double qx, double qy, int depth,
                    long long &bestId, double &bestDist,
                    const std::function<bool(long long)> &valid) const;

    static void projectLatLonToMeters(double lat_deg, double lon_deg, double ref_lat_deg,
                                      double &out_x, double &out_y);
    static double sqDist(double x1, double y1, double x2, double y2);

    template<typename HeapType>
    void kNearestRec(KDNode *node, double qx, double qy, int depth, int k,
                     HeapType &heap, const std::function<bool(long long)> &valid) const;
};
