let selectedPolygon = null; // Track the drawn polygon

// Expose initMap globally for Google Maps API callback
window.initMap = function () {
  // Create map (no center yet — we'll set it after getting location)
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 5,
    mapTypeId: google.maps.MapTypeId.HYBRID, // Satellite + street names
    mapTypeControl: true,
    streetViewControl: true,
  });

  // Try to get user's current location FIRST
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        map.setCenter(userLocation);
        map.setZoom(17); // Street level zoom
      },
      () => {
        console.warn("Geolocation denied. Using India as fallback.");
        map.setCenter({ lat: 20.5937, lng: 78.9629 });
      }
    );
  } else {
    console.warn("Geolocation not supported. Using India as fallback.");
    map.setCenter({ lat: 20.5937, lng: 78.9629 });
  }

  // Drawing Manager for polygon selection
  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: ["polygon"],
    },
    polygonOptions: {
      fillColor: "#00FF00",
      fillOpacity: 0.3,
      strokeWeight: 2,
      clickable: true,
      editable: true,
      zIndex: 1,
    },
  });
  drawingManager.setMap(map);

  // Handle polygon complete
  google.maps.event.addListener(drawingManager, "overlaycomplete", (event) => {
    if (event.type === google.maps.drawing.OverlayType.POLYGON) {
      if (selectedPolygon) selectedPolygon.setMap(null);
      selectedPolygon = event.overlay;

      const path = selectedPolygon.getPath();
      const coordinates = [];
      for (let i = 0; i < path.getLength(); i++) {
        const latLng = path.getAt(i);
        coordinates.push({ lat: latLng.lat(), lng: latLng.lng() });
      }

      document.getElementById("waypoints").value = JSON.stringify(coordinates);
    }
  });

  // Form submission
  document.getElementById("missionForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const waypointsValue = document.getElementById("waypoints").value;
    if (!waypointsValue) {
      alert("Please draw the farm boundary before submitting.");
      return;
    }

    const scheduleData = {
      farmer_name: document.getElementById("farmerName").value.trim(),
      crop_type: document.getElementById("crop").value,
      mission_datetime: document.getElementById("datetime").value,
      drone_id: document.getElementById("drone").value,
      waypoints: JSON.parse(waypointsValue),
    };

    try {
      const res = await fetch("http://localhost:3000/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Mission scheduled successfully!");
        document.getElementById("missionForm").reset();
        if (selectedPolygon) selectedPolygon.setMap(null);
        document.getElementById("waypoints").value = "";
      } else {
        alert(`❌ Error: ${data.message || "Could not save mission."}`);
      }
    } catch (err) {
      console.error("Error sending data:", err);
      alert("⚠ Could not connect to the server.");
    }
  });
};
