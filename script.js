
const links = document.querySelectorAll("nav a");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("page-title");

links.forEach(link => {

    link.addEventListener("click", function(event) {

        event.preventDefault();

        // Remove active class
        links.forEach(item => {
            item.classList.remove("active");
        });

        // Activate clicked link
        this.classList.add("active");

        // Hide all pages
        pages.forEach(page => {
            page.classList.add("hidden");
        });

        // Show selected page
        const selectedPage = this.dataset.page;

        document.getElementById(selectedPage)
            .classList.remove("hidden");

        pageTitle.textContent =
            this.textContent.trim();

    });

});
// Search road damage reports

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function() {

    const searchValue = this.value.toLowerCase();

    const rows = document.querySelectorAll("#reportTable tr");

    rows.forEach(row => {

        const rowText = row.textContent.toLowerCase();

        if (rowText.includes(searchValue)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }

    });

});

// ROADGUARD AI - REPORT MANAGEMENT


const damageForm = document.getElementById("damageForm");
const reportForm = document.getElementById("reportForm");
const addReportBtn = document.getElementById("addReportBtn");
const cancelReport = document.getElementById("cancelReport");
const allReports = document.getElementById("allReports");
const emptyMessage = document.getElementById("emptyMessage");

// Load saved reports
let reports = JSON.parse(
    localStorage.getItem("roadReports") || "[]"
);

// Open form
addReportBtn.addEventListener("click", () => {
    reportForm.classList.remove("hidden");
});

// Close form
cancelReport.addEventListener("click", () => {
    reportForm.classList.add("hidden");
    damageForm.reset();
});

// Save reports
function saveReports() {
    localStorage.setItem(
        "roadReports",
        JSON.stringify(reports)
    );
}

// Generate report ID
function generateReportID() {
    const nextNumber = reports.length + 1;
    return "RG" + String(nextNumber).padStart(3, "0");
}

// Add new report
damageForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const file = document.getElementById("photo").files[0];

    const newReport = {
        id: generateReportID(),
        location: document.getElementById("location").value.trim(),
        type: document.getElementById("damageType").value,
        severity: document.getElementById("severity").value,
        description: document.getElementById("description").value.trim(),

        latitude: Number(document.getElementById("latitude").value),
        longitude: Number(document.getElementById("longitude").value),

        photo: "",
        status: "Pending",
        date: new Date().toLocaleDateString()
    };

    // Read optional photograph
    if (file) {

        if (!file.type.startsWith("image/")) {
            alert("Please select an image.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be smaller than 2 MB.");
            return;
        }

        const reader = new FileReader();

        reader.onload = function() {
            newReport.photo = reader.result;
            reports.push(newReport);
            finishSaving();
        };

        reader.readAsDataURL(file);

    } else {

        reports.push(newReport);
        finishSaving();

    }

});

// Save and display
function finishSaving() {

    saveReports();
    renderReports();

    damageForm.reset();
    reportForm.classList.add("hidden");

    alert("Road damage report saved!");
}

// Display reports
function renderReports() {

    allReports.innerHTML = "";

    emptyMessage.classList.toggle(
        "hidden",
        reports.length !== 0
    );

    reports.forEach(report => {

        const row = document.createElement("tr");

        const cells = [
            report.id,
            report.location,
            report.type,
            report.severity,
            report.status
        ];

        cells.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", () => {

            if (confirm("Delete this report?")) {

                reports = reports.filter(
                    item => item.id !== report.id
                );

                saveReports();
                renderReports();

            }

        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        allReports.appendChild(row);

    });

}

// Initial display
renderReports();


// Get current GPS location

document.getElementById("getGPS").addEventListener("click", () => {

    if (!navigator.geolocation) {
        alert("GPS is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        position => {

            document.getElementById("latitude").value =
                position.coords.latitude;

            document.getElementById("longitude").value =
                position.coords.longitude;

        },

        error => {
            alert("Unable to get location. Check GPS permission.");
        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }

    );

});

// ===================================
// ROADGUARD AI - INTERACTIVE MAP
// ===================================

let damageMap = null;
let damageMarkers = null;

// Initialize map
function initializeMap() {

    if (damageMap) {
        damageMap.invalidateSize();
        renderMapMarkers();
        return;
    }

    damageMap = L.map("damageMap").setView(
        [20.2961, 85.8245], 12
    );

    // OpenStreetMap tiles
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
    ).addTo(damageMap);

    damageMarkers = L.layerGroup().addTo(damageMap);

    renderMapMarkers();

}

// Severity colors
function getSeverityColor(severity) {

    if (severity === "High") return "#ef4444";
    if (severity === "Medium") return "#f59e0b";

    return "#22c55e";

}

// Display reports on map
function renderMapMarkers() {

    if (!damageMarkers) return;

    damageMarkers.clearLayers();

    const filter = document.getElementById(
        "severityFilter"
    ).value;

    reports.forEach(report => {

        const lat = Number(report.latitude);
        const lng = Number(report.longitude);

        // Skip reports without valid coordinates
        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 || lat > 90 ||
            lng < -180 || lng > 180
        ) return;

        if (
            filter !== "All" &&
            report.severity !== filter
        ) return;

        const marker = L.circleMarker(
            [lat, lng],
            {
                radius: 9,
                color: getSeverityColor(report.severity),
                fillColor: getSeverityColor(report.severity),
                fillOpacity: 0.85
            }
        );

        marker.bindPopup(`
            <b>${escapeHTML(report.id)}</b><br>
            Location: ${escapeHTML(report.location)}<br>
            Damage: ${escapeHTML(report.type)}<br>
            Severity: ${escapeHTML(report.severity)}<br>
            Status: ${escapeHTML(report.status)}
        `);

        marker.addTo(damageMarkers);

    });

}

// Safely display report data in map popups
function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]
    );
}

// Open map when user clicks Map navigation
document.querySelector('[data-page="map"]')
    .addEventListener("click", () => {

        setTimeout(initializeMap, 100);

    });

// Filter map markers
document.getElementById("severityFilter")
    .addEventListener("change", renderMapMarkers);

// Locate current position
document.getElementById("locateMe")
    .addEventListener("click", () => {

        if (!navigator.geolocation) {
            alert("GPS is not supported.");
            return;
        }

        navigator.geolocation.getCurrentPosition(

            position => {

                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                initializeMap();

                damageMap.setView([lat, lng], 16);

                L.marker([lat, lng])
                    .addTo(damageMap)
                    .bindPopup("Your current location")
                    .openPopup();

            },

            () => alert("Location permission denied or unavailable.")

        );

    });

