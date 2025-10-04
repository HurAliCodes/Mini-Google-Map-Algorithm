#ifndef NODE_H
#define NODE_H

#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <climits>
#include<cmath>
#include <queue>
#include <unordered_set>

using namespace std;

class Node{
    private:
        long long id;
        double latitude, longitude;

    public:

        Node();

        Node(long long i, double lat, double lon);

        //Getters
        long long get_id() const;
        double get_latitude() const;
        double get_longitude() const;
        
        //Setters
        void set_id(long long i);
        void set_latitude(double lat);
        void set_longitude(double lon);

        void print_Node() const;
        
};

#endif