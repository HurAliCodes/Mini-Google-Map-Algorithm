#include "include/crow.h"
#include <iostream>

int main()
{
    crow::SimpleApp app; // Crow app instance

    // Example endpoint: send map data
    CROW_ROUTE(app, "/mapdata")
    ([]
    {
        crow::json::wvalue response;
        response["markers"] = crow::json::list({ 
            crow::json::wvalue{{"lat", 31.582045}, {"lng", 74.329376}}, 
            crow::json::wvalue{{"lat", 24.860735}, {"lng", 67.001137}} 
        });
        return response;
    });

    // Example POST endpoint
    CROW_ROUTE(app, "/addpoint").methods("POST"_method)
    ([](const crow::request& req){
        auto body = crow::json::load(req.body);
        if (!body)
            return crow::response(400);
        std::cout << "Received point: " << body["lat"].d() << ", " << body["lng"].d() << std::endl;
        return crow::response(200, "Point added successfully");
    });

    // Start server on port 8080
    app.port(8080).multithreaded().run();
}
