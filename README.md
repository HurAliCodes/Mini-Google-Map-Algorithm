Download Pugixml headers Zipped file
https://drive.google.com/file/d/1-Bi5p-1cugX-sQzv-trhg1gRrftMdizA/view?usp=sharing
g++ -Iinclude src/*.cpp Main.cpp -o main.exe

### command to run server
g++ -std=c++17 -Iinclude main.cpp -o server -pthread -lws2_32 -lmswsock

.Gitignore (add this)
# Ignore large map and archive files
Karachi OSM/
*.osm
*.rar
