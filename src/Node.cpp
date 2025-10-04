#include"Node.h"

Node::Node() : id(0), latitude(0.0), longitude(0.0){}

Node::Node(long long i, double lat, double lon){
    this->id = i;
    this->latitude = lat;
    this->longitude = lon;
}

long long Node::get_id() const{
    return id;
}
double Node::get_latitude() const{
    return latitude;
}
double Node::get_longitude() const{
    return longitude;
}

void Node::set_id(long long i){
    this->id = i;
}
void Node::set_latitude(double lat){
    this->latitude = lat;
}
void Node::set_longitude(double lon){
    this->longitude = lon;
}

void Node::print_Node() const{
    cout<<"ID: "<<id<<"\n-Latitude: "<<latitude<<" -Longitude: "<<longitude<<endl;
}