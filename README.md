# 🗺️ Mini Map – Karachi Navigation System

Mini Map is a lightweight navigation system inspired by Google Maps, built for **Karachi** using **OpenStreetMap data**.  
The project demonstrates real-world usage of **Data Structures and Algorithms** such as **Graphs, Dijkstra’s Algorithm, and A\***.

---

## ▶️ Getting Started – How to Run the Application

Follow these steps to run the project locally:

### 🔹 1. Start the Backend Server
1. Navigate to the Mini-Google-Map-Algorithm directory.
2. Double-click on **`server.exe`** to start the backend server.
3. Keep this window running.

### 🔹 2. Run the Frontend
1. Open a terminal and go to the frontend folder:
```
   cd frontend/mini-google-maps-frontend
```
3. Install dependencies:
```
   npm install
```
4. Start the development server:
```
   npm run dev
```
### 🔹 3. Open in Browser
Once the frontend starts, open your browser and go to:
http://localhost:5173
(or the port shown in your terminal)

Your Mini Map application should now be running locally 🚀

### Rebuilding (optional)
if you want to make changes in backend and rebuil the server file then run this command in the terminal in your Mini-Google-Map-Algorithm directory.
```
g++ -std=c++17 main.cpp src/*.cpp -Iinclude -lpthread -lws2_32 -lmswsock -o server.exe
```
---

## 🚀 Features

- Shortest path computation between locations  
- Dijkstra’s Algorithm (guaranteed shortest path)  
- A* Search Algorithm (heuristic-based faster routing)  
- Add intermediate stops (multi-stop routing)  
- Automatic rerouting on deviation  
- Interactive map using Leaflet  
- Marker display for source, destination, and stops  
- Export route coordinates to CSV  
- Optimized backend for large graphs  

---

## 🧠 Data Structures Used

| Data Structure | Usage |
|----------------|--------|
| Graph (Adjacency List) | Represents Karachi road network |
| Priority Queue (Min-Heap) | Used in Dijkstra and A* |
| Hash Maps | Node ID to index mapping |
| Vectors (Dynamic Arrays) | Distance, parent, and path storage |
| KD-Tree | Nearest node search from coordinates |

---

## 🧮 Algorithms Implemented

- **Dijkstra’s Algorithm**  
  Time Complexity: O(E log V)

- **A* Search Algorithm**  
  Time Complexity: O(E log V) (faster in practice using heuristic)

---

## 🛠️ Tech Stack

Backend
- C++
- STL
- PugiXML
- OpenStreetMap (OSM)

Frontend
- React JS
- Leaflet
- Axios

---

## 👨‍👩‍👦 Developers

- Abdul Ahad Memon  
- Syed Aayan Mahmood  
- Syed Hur Ali Rizvi  
- Syed Muhammad Taha  

---

## 📌 Conclusion

Mini Map is an educational and transparent routing system that applies core Data Structure concepts to solve real-world navigation problems efficiently.

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---
