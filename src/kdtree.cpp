#include "kdtree.h"
#define _USE_MATH_DEFINES
#include <cmath>
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif


void KDTree::build(const std::vector<KDPoint> &points) {
    pts_copy = points;
    if (pts_copy.empty()) { deleteAll(root); root = nullptr; return; }

    double sumLat = 0.0;
    for (auto &p : pts_copy) sumLat += p.lat;
    ref_lat_deg = sumLat / pts_copy.size();

    for (auto &p : pts_copy)
        projectLatLonToMeters(p.lat, p.lon, ref_lat_deg, p.x, p.y);

    deleteAll(root);
    root = buildRec(0, int(pts_copy.size()) - 1, 0);
}

KDNode* KDTree::buildRec(int l, int r, int depth) {
    if (l > r) return nullptr;
    int axis = depth % 2;
    int mid = (l + r) / 2;

    auto comp = [axis](const KDPoint &a, const KDPoint &b){ return axis == 0 ? a.x < b.x : a.y < b.y; };
    std::nth_element(pts_copy.begin()+l, pts_copy.begin()+mid, pts_copy.begin()+r+1, comp);

    KDNode *node = new KDNode(pts_copy[mid]);
    node->left = buildRec(l, mid-1, depth+1);
    node->right = buildRec(mid+1, r, depth+1);
    return node;
}

void KDTree::deleteAll(KDNode *n) {
    if (!n) return;
    deleteAll(n->left);
    deleteAll(n->right);
    delete n;
}

void KDTree::projectLatLonToMeters(double lat_deg, double lon_deg, double ref_lat_deg,
                                   double &out_x, double &out_y) {
    const double deg2rad = M_PI/180.0;
    double lat = lat_deg*deg2rad;
    double lon = lon_deg*deg2rad;
    double ref_lat = ref_lat_deg*deg2rad;
    out_x = EARTH_RADIUS_M * lon * std::cos(ref_lat);
    out_y = EARTH_RADIUS_M * lat;
}

double KDTree::sqDist(double x1, double y1, double x2, double y2) {
    double dx = x1-x2, dy = y1-y2;
    return dx*dx + dy*dy;
}

long long KDTree::nearest(double lat, double lon) const {
    return nearest(lat, lon, [](long long){ return true; });
}

long long KDTree::nearest(double lat, double lon, const std::function<bool(long long)> &valid) const {
    if (!root) return -1;
    double qx, qy;
    projectLatLonToMeters(lat, lon, ref_lat_deg, qx, qy);

    long long bestId = -1;
    double bestDist = std::numeric_limits<double>::infinity();
    nearestRec(root, qx, qy, 0, bestId, bestDist, valid);
    return bestId;
}

long long KDTree::secondNearest(double lat, double lon) const {
    long long first = nearest(lat, lon);
    if (first==-1) return -1;
    return nearest(lat, lon, [first](long long id){ return id != first; });
}

void KDTree::nearestRec(KDNode *node, double qx, double qy, int depth,
                        long long &bestId, double &bestDist,
                        const std::function<bool(long long)> &valid) const
{
    if (!node) return;
    double d2 = sqDist(node->pt.x, node->pt.y, qx, qy);
    if (valid(node->pt.id) && d2 < bestDist) { bestDist = d2; bestId = node->pt.id; }
    int axis = depth%2;
    double diff = (axis==0 ? qx-node->pt.x : qy-node->pt.y);
    KDNode *first = diff<0 ? node->left : node->right;
    KDNode *second = diff<0 ? node->right : node->left;
    nearestRec(first, qx, qy, depth+1, bestId, bestDist, valid);
    if (second && diff*diff < bestDist)
        nearestRec(second, qx, qy, depth+1, bestId, bestDist, valid);
}

std::vector<long long> KDTree::kNearest(double lat, double lon, int k) const {
    return kNearest(lat, lon, k, [](long long){ return true; });
}

std::vector<long long> KDTree::kNearest(double lat, double lon, int k,
                                        const std::function<bool(long long)> &valid) const
{
    std::vector<long long> out;
    if (!root || k<=0) return out;
    double qx, qy;
    projectLatLonToMeters(lat, lon, ref_lat_deg, qx, qy);

    using Pair = std::pair<double,long long>;
    auto cmp = [](const Pair &a, const Pair &b){ return a.first < b.first; };
    std::priority_queue<Pair, std::vector<Pair>, decltype(cmp)> heap(cmp);

    kNearestRec(root, qx, qy, 0, k, heap, valid);

    std::vector<Pair> items;
    while (!heap.empty()){ items.push_back(heap.top()); heap.pop(); }
    std::sort(items.begin(), items.end(), [](const Pair &a, const Pair &b){ return a.first < b.first; });
    for (auto &p: items) out.push_back(p.second);
    return out;
}

// Template version fixes the priority_queue type issue
template<typename HeapType>
void KDTree::kNearestRec(KDNode *node, double qx, double qy, int depth, int k,
                         HeapType &heap, const std::function<bool(long long)> &valid) const
{
    if (!node) return;
    double d2 = sqDist(node->pt.x, node->pt.y, qx, qy);
    if (valid(node->pt.id)) {
        if ((int)heap.size()<k) heap.emplace(d2, node->pt.id);
        else if (d2<heap.top().first){ heap.pop(); heap.emplace(d2,node->pt.id); }
    }
    int axis = depth%2;
    double diff = axis==0 ? qx-node->pt.x : qy-node->pt.y;
    KDNode *first = diff<0 ? node->left : node->right;
    KDNode *second = diff<0 ? node->right : node->left;
    kNearestRec(first,qx,qy,depth+1,k,heap,valid);
    double worstDist = heap.empty() ? std::numeric_limits<double>::infinity() : heap.top().first;
    if (second && diff*diff<worstDist) kNearestRec(second,qx,qy,depth+1,k,heap,valid);
}
