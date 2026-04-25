cmake_minimum_required(VERSION 3.14)
project(minimap_server)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Threads REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(ZLIB REQUIRED)

include_directories(include)

add_executable(minimap_server
    Main.cpp
    src/Algo.cpp
    src/Graph.cpp
    src/kdtree.cpp
    src/Navigation.cpp
    src/Node.cpp
    src/parsing.cpp
)

target_link_libraries(minimap_server
    Threads::Threads
    OpenSSL::SSL
    OpenSSL::Crypto
    ZLIB::ZLIB
)
