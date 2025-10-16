import folium
import pandas as pd

# Load coordinates
path = pd.read_csv("path_cordinates.csv")

# Center map on first node
m = folium.Map(location=[path.lat[0], path.lon[0]], zoom_start=15)

# Draw polyline (path)
folium.PolyLine(
    locations=list(zip(path.lat, path.lon)),
    color="blue",
    weight=5,
    opacity=0.8
).add_to(m)

# Markers for start and destination
folium.Marker(
    [path.lat[0], path.lon[0]],
    popup="Start",
    icon=folium.Icon(color='green')
).add_to(m)

folium.Marker(
    [path.lat.iloc[-1], path.lon.iloc[-1]],
    popup="Destination",
    icon=folium.Icon(color='red')
).add_to(m)

m.save("shortest_path_map.html")
print("✅ Map saved as shortest_path_map.html")
