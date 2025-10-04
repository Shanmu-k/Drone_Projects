document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("missionForm");
  const formStatus = document.getElementById("formStatus");

  let selectedLocation = ""; // Will store coordinates from map click

  // ✅ Initialize Map for Location Selection
  if (document.getElementById("map")) {
    const map = L.map("map").setView([20.5937, 78.9629], 5); // India center

    // Tile layer (replace YOUR_API_KEY with your actual key)
    L.tileLayer(`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, {
      maxZoom: 19,
    }).addTo(map);

    let marker;
    map.on("click", (e) => {
      selectedLocation = `${e.latlng.lat},${e.latlng.lng}`;

      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng).addTo(map);
      }

      document.getElementById("location").value = selectedLocation;
    });
  }

  // ✅ Form Submission Logic
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Get form values
      const farmerName = document.getElementById("farmerName").value.trim();
      const crop = document.getElementById("crop").value;
      const datetime = document.getElementById("datetime").value;
      const location = document.getElementById("location").value.trim();
      const drone = document.getElementById("drone").value;

      // Validation
      if (!farmerName || !crop || !datetime || !location || !drone) {
        formStatus.innerText = "Please fill in all fields.";
        formStatus.style.color = "red";
        return;
      }

      // Validate date/time
      const selectedDateTime = new Date(datetime);
      if (selectedDateTime < new Date()) {
        formStatus.innerText = "Please select a future mission date & time.";
        formStatus.style.color = "red";
        return;
      }

      // Data to send
      const missionData = {
        farmerName,
        crop,
        datetime,
        location,
        drone
      };

      try {
        const response = await fetch("http://localhost:3000/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(missionData)
        });

        const result = await response.json();

        if (response.ok) {
          formStatus.innerText = result.message || "Mission scheduled successfully!";
          formStatus.style.color = "green";
          form.reset();
        } else {
          formStatus.innerText = result.message || "Something went wrong.";
          formStatus.style.color = "red";
        }
      } catch (err) {
        console.error("Error:", err);
        formStatus.innerText = "Failed to connect to server.";
        formStatus.style.color = "red";
      }
    });
  }

  // ✅ Report Viewer Logic
  const reportTable = document.getElementById("reportTable");
  const reportStatus = document.getElementById("reportStatus");

  if (reportTable) {
    fetch("http://localhost:3000/api/reports")
      .then(res => res.json())
      .then(data => {
        const tbody = reportTable.querySelector("tbody");
        if (data.length === 0) {
          reportStatus.innerText = "No reports available yet.";
        } else {
          data.forEach(report => {
            const row = `
              <tr>
                <td>${report.mission_id}</td>
                <td>${report.farmer_name}</td>
                <td>${report.crop_type}</td>
                <td>${new Date(report.mission_date).toLocaleString()}</td>
                <td>${report.disease_detected || 'Healthy'}</td>
                <td>${report.confidence || '-'}%</td>
                <td><a href="http://localhost:3000/api/report/download/${report.report_id}" target="_blank">Download</a></td>
              </tr>
            `;
            tbody.innerHTML += row;
          });
        }
      })
      .catch(err => {
        console.error("Failed to fetch reports:", err);
        const tbody = reportTable.querySelector("tbody");
        tbody.innerHTML = `<tr><td colspan="7">⚠️ Error loading reports.</td></tr>`;
        reportStatus.innerText = "Server error while fetching reports.";
      });
  }
});
