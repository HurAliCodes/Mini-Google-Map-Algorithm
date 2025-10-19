#include "crow.h"  // or "crow.h" depending on your version

int main()
{
    crow::SimpleApp app;

    // --- GET route ---
    CROW_ROUTE(app, "/")([](){
        return "Server is running ✅";
    });

    // --- GET with parameter ---
    CROW_ROUTE(app, "/hello/<string>")
    ([](std::string name){
        return "Hello, " + name + " 👋";
    });

    // --- POST route ---
    CROW_ROUTE(app, "/data").methods("POST"_method)
    ([](const crow::request& req){
        crow::json::rvalue body = crow::json::load(req.body);
        if (!body)
            return crow::response(400, "Invalid JSON");

        std::string message = body["message"].s();
        crow::json::wvalue res;
        res["reply"] = "You sent: " + message;
        return crow::response(res);
    });

    // --- Start the server ---
    app.port(18080).multithreaded().run();
}
