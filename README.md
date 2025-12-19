# 🗺️ Mini Map – Karachi Navigation System

Mini Map is a lightweight navigation system inspired by Google Maps, built for **Karachi** using **OpenStreetMap data**.  
The project demonstrates real-world usage of **Data Structures and Algorithms** such as **Graphs, Dijkstra’s Algorithm, and A\***.

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
|----------------|-------|
| Graph (Adjacency List) | Represents Karachi road network |
| Priority Queue (Min-Heap) | Used in Dijkstra and A* |
| Hash Maps | Node ID to index mapping |
| Vectors (Dynamic Arrays) | Distance, parent, and path storage |
| KD-Tree | Nearest node search from coordinates |

---

## 🧮 Algorithms Implemented

- **Dijkstra’s Algorithm**  
  - Time Complexity: `O(E log V)`
- **A* Search Algorithm**  
  - Time Complexity: `O(E log V)` (faster in practice using heuristic)

---

## 🛠️ Tech Stack

**Backend**
- C++
- STL
- PugiXML
- OpenStreetMap (OSM)

**Frontend**
- React JS
- Leaflet
- Axios

---

## 📂 Project Structure

