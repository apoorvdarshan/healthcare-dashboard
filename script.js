// Healthcare Dashboard JavaScript

// Global variables
let patientsData = [];
let currentPatient = null;

// API Configuration
const API_CONFIG = {
  baseUrl: "https://fedskillstest.coalitiontechnologies.workers.dev",
  auth: {
    username: "coalition",
    password: "skills-test",
  },
};

// DOM Content Loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Healthcare Dashboard loaded");

  // Initialize dashboard
  initializeDashboard();
});

// Initialize Dashboard
async function initializeDashboard() {
  try {
    // Show loading state
    showLoadingState();

    // Fetch patients data from API
    await fetchPatientsData();

    // Populate patients list
    populatePatientsList();

    // Set default patient (Jessica Taylor or first patient)
    setDefaultPatient();

    // Initialize other components
    initializeNavigation();
    initializeTimeSelector();

    // Hide loading state
    hideLoadingState();
  } catch (error) {
    console.error("Error initializing dashboard:", error);
    showErrorState();
  }
}

// Fetch Patients Data from API
async function fetchPatientsData() {
  try {
    const response = await fetch(API_CONFIG.baseUrl, {
      method: "GET",
      headers: {
        Authorization:
          "Basic " +
          btoa(API_CONFIG.auth.username + ":" + API_CONFIG.auth.password),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const allPatientsData = await response.json();

    // Filter patients to keep only up to Mike Nolan
    const mikeNolanIndex = allPatientsData.findIndex(
      (patient) => patient.name === "Mike Nolan"
    );
    if (mikeNolanIndex !== -1) {
      patientsData = allPatientsData.slice(0, mikeNolanIndex + 1);
    } else {
      patientsData = allPatientsData; // Fallback if Mike Nolan not found
    }

    console.log(
      "Patients data fetched successfully (filtered to Mike Nolan):",
      patientsData
    );
  } catch (error) {
    console.error("Error fetching patients data:", error);
    throw error;
  }
}

// Populate Patients List
function populatePatientsList() {
  const patientsList = document.querySelector(".patients-list");

  if (!patientsList || !patientsData.length) {
    console.error("No patients list container or data found");
    return;
  }

  // Clear existing list
  patientsList.innerHTML = "";

  // Create patient items
  patientsData.forEach((patient, index) => {
    const patientItem = createPatientItem(patient, index);
    patientsList.appendChild(patientItem);
  });

  // Initialize patient selection after creating items
  initializePatientSelection();
}

// Get Local Patient Image Path
function getLocalPatientImagePath(patientName) {
  // Convert patient name to filename format (lowercase with hyphens)
  const filename = patientName.toLowerCase().replace(/\s+/g, "-");
  return `assets/patients/${filename}.png`;
}

// Create Patient Item HTML
function createPatientItem(patient, index) {
  const patientItem = document.createElement("div");
  patientItem.className = "patient-item";
  patientItem.dataset.patientIndex = index;

  // Get local patient image path
  const localImagePath = getLocalPatientImagePath(patient.name);

  patientItem.innerHTML = `
        <img src="${localImagePath}" 
             alt="${patient.name}" 
             class="patient-avatar"
             onerror="this.src='${
               patient.profile_picture || "assets/patient-placeholder.jpg"
             }'">
        <div class="patient-info">
            <span class="patient-name">${patient.name}</span>
            <span class="patient-details">${patient.gender}, ${
    patient.age
  }</span>
        </div>
                 <img src="assets/hori-fill.svg" alt="More" class="patient-more">
    `;

  return patientItem;
}

// Set Default Patient
function setDefaultPatient() {
  if (patientsData.length > 0) {
    // Try to find Jessica Taylor, otherwise use first patient
    const jessicaIndex = patientsData.findIndex(
      (p) => p.name === "Jessica Taylor"
    );
    const defaultIndex = jessicaIndex !== -1 ? jessicaIndex : 0;

    selectPatient(defaultIndex);
  }
}

// Patient Selection Functionality
function initializePatientSelection() {
  const patientItems = document.querySelectorAll(".patient-item");

  patientItems.forEach((item) => {
    item.addEventListener("click", function () {
      const patientIndex = parseInt(this.dataset.patientIndex);
      selectPatient(patientIndex);
    });
  });
}

// Select Patient
function selectPatient(patientIndex) {
  if (patientIndex < 0 || patientIndex >= patientsData.length) {
    console.error("Invalid patient index:", patientIndex);
    return;
  }

  // Update current patient
  currentPatient = patientsData[patientIndex];

  // Update UI
  updateActivePatient(patientIndex);
  updatePatientDetails(currentPatient);
  updateDiagnosisHistory(currentPatient);
  updateVitalSigns(currentPatient);
  updateDiagnosticList(currentPatient);
  updateLabResults(currentPatient);

  console.log("Selected patient:", currentPatient.name);
}

// Update Active Patient in List
function updateActivePatient(patientIndex) {
  const patientItems = document.querySelectorAll(".patient-item");

  patientItems.forEach((item, index) => {
    if (index === patientIndex) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// Update Patient Details (Right Sidebar)
function updatePatientDetails(patient) {
  // Update profile image
  const profileImg = document.querySelector(".patient-profile-img");
  if (profileImg) {
    const localImagePath = getLocalPatientImagePath(patient.name);
    profileImg.src = localImagePath;
    profileImg.alt = patient.name;

    // Fallback to API image if local image fails
    profileImg.onerror = function () {
      this.src = patient.profile_picture || "assets/patient-placeholder.jpg";
      this.onerror = null; // Prevent infinite loop
    };
  }

  // Update patient name
  const patientNameEl = document.querySelector(
    ".patient-profile .patient-name"
  );
  if (patientNameEl) {
    patientNameEl.textContent = patient.name;
  }

  // Update patient details
  const detailsMap = {
    "Date Of Birth": formatDateOfBirth(patient.date_of_birth),
    Gender: patient.gender,
    "Contact Info.": patient.phone_number,
    "Emergency Contacts": patient.emergency_contact,
    "Insurance Provider": patient.insurance_type,
  };

  // Update gender icon based on patient gender
  const genderIcon = document.querySelector(
    '.patient-detail-item img[alt="Gender"]'
  );
  if (genderIcon) {
    genderIcon.src =
      patient.gender === "Female"
        ? "assets/detail-icons/FemaleIcon.svg"
        : "assets/detail-icons/MaleIcon.svg";
  }

  Object.entries(detailsMap).forEach(([label, value]) => {
    const detailElement = findDetailElement(label);
    if (detailElement && value) {
      const valueElement = detailElement.querySelector(".detail-value");
      if (valueElement) {
        valueElement.textContent = value;
      }
    }
  });
}

// Update Diagnosis History and Chart
function updateDiagnosisHistory(patient) {
  if (!patient.diagnosis_history || !patient.diagnosis_history.length) {
    return;
  }

  // Get latest diagnosis data
  const latestDiagnosis = patient.diagnosis_history[0];

  // Update blood pressure values in chart legend
  updateBloodPressureValues(latestDiagnosis.blood_pressure);

  // Update chart with diagnosis history
  updateChart(patient.diagnosis_history);
}

// Update Blood Pressure Values
function updateBloodPressureValues(bloodPressure) {
  // Update systolic values
  const systolicValue = document.querySelector(
    ".legend-item .legend-info .legend-value"
  );
  const systolicStatus = document.querySelector(
    ".legend-item .legend-info .legend-status"
  );

  if (systolicValue && bloodPressure.systolic) {
    systolicValue.textContent = bloodPressure.systolic.value;
  }
  if (systolicStatus && bloodPressure.systolic) {
    const arrowIcon = getStatusArrowIcon(bloodPressure.systolic.levels);
    systolicStatus.innerHTML = `${arrowIcon}${bloodPressure.systolic.levels}`;
  }

  // Update diastolic values
  const legendItems = document.querySelectorAll(".legend-item");
  if (legendItems.length > 1 && bloodPressure.diastolic) {
    const diastolicValue = legendItems[1].querySelector(".legend-value");
    const diastolicStatus = legendItems[1].querySelector(".legend-status");

    if (diastolicValue)
      diastolicValue.textContent = bloodPressure.diastolic.value;
    if (diastolicStatus) {
      const arrowIcon = getStatusArrowIcon(bloodPressure.diastolic.levels);
      diastolicStatus.innerHTML = `${arrowIcon}${bloodPressure.diastolic.levels}`;
    }
  }
}

// Helper function to get the appropriate arrow icon based on status
function getStatusArrowIcon(status) {
  if (status && status.toLowerCase().includes("higher")) {
    return '<img src="assets/ArrowUp.svg" alt="Up" class="status-arrow">';
  } else if (status && status.toLowerCase().includes("lower")) {
    return '<img src="assets/ArrowDown.svg" alt="Down" class="status-arrow">';
  }
  return ""; // No arrow for normal/other statuses
}

// Update Vital Signs
function updateVitalSigns(patient) {
  if (!patient.diagnosis_history || !patient.diagnosis_history.length) {
    return;
  }

  const latestDiagnosis = patient.diagnosis_history[0];

  // Update respiratory rate
  updateVitalCard(
    "respiratory",
    "Respiratory Rate",
    `${latestDiagnosis.respiratory_rate.value} bpm`,
    latestDiagnosis.respiratory_rate.levels
  );

  // Update temperature
  updateVitalCard(
    "temperature",
    "Temperature",
    `${latestDiagnosis.temperature.value}°F`,
    latestDiagnosis.temperature.levels
  );

  // Update heart rate
  updateVitalCard(
    "heart-rate",
    "Heart Rate",
    `${latestDiagnosis.heart_rate.value} bpm`,
    latestDiagnosis.heart_rate.levels
  );
}

// Update Individual Vital Card
function updateVitalCard(cardClass, label, value, status) {
  const card = document.querySelector(`.vital-card.${cardClass}`);
  if (!card) return;

  const labelEl = card.querySelector(".vital-label");
  const valueEl = card.querySelector(".vital-value");
  const statusEl = card.querySelector(".vital-status");

  if (labelEl) labelEl.textContent = label;
  if (valueEl) valueEl.textContent = value;
  if (statusEl) {
    const arrowIcon = getVitalStatusArrowIcon(status);
    statusEl.innerHTML = `${arrowIcon}${status}`;
  }
}

// Helper function to get the appropriate arrow icon for vital status
function getVitalStatusArrowIcon(status) {
  if (status && status.toLowerCase().includes("higher")) {
    return '<img src="assets/ArrowUp.svg" alt="Up" class="vital-status-arrow">';
  } else if (status && status.toLowerCase().includes("lower")) {
    return '<img src="assets/ArrowDown.svg" alt="Down" class="vital-status-arrow">';
  }
  return ""; // No arrow for normal/other statuses
}

// Update Diagnostic List
function updateDiagnosticList(patient) {
  const tableBody = document.querySelector(".diagnostic-table tbody");
  if (!tableBody || !patient.diagnostic_list) {
    return;
  }

  // Clear existing rows
  tableBody.innerHTML = "";

  // Add new rows
  patient.diagnostic_list.forEach((diagnostic) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${diagnostic.name}</td>
            <td>${diagnostic.description}</td>
            <td><span class="status ${getStatusClass(diagnostic.status)}">${
      diagnostic.status
    }</span></td>
        `;
    tableBody.appendChild(row);
  });
}

// Update Lab Results
function updateLabResults(patient) {
  const labResultsContainer = document.querySelector(".lab-results");
  if (!labResultsContainer || !patient.lab_results) {
    return;
  }

  // Find existing lab results list or create new one
  let labResultsList = labResultsContainer.querySelector(".lab-results-list");
  if (!labResultsList) {
    const h3 = labResultsContainer.querySelector("h3");
    labResultsList = document.createElement("div");
    labResultsList.className = "lab-results-list";
    if (h3 && h3.nextSibling) {
      labResultsContainer.insertBefore(labResultsList, h3.nextSibling);
    } else {
      labResultsContainer.appendChild(labResultsList);
    }
  }

  // Clear existing results
  labResultsList.innerHTML = "";

  // Add new results
  patient.lab_results.forEach((labTest) => {
    const resultItem = document.createElement("div");
    resultItem.className = "lab-result-item";
    resultItem.innerHTML = `
            <span class="lab-test-name">${labTest}</span>
            <img src="assets/download.svg" alt="Download" class="download-icon">
        `;
    labResultsList.appendChild(resultItem);
  });

  // Reinitialize download functionality
  initializeLabResults();
}

// Global chart variable
let bloodPressureChart;

// Update Chart with Historical Data
function updateChart(diagnosisHistory) {
  const canvas = document.getElementById("bloodPressureChart");

  if (canvas && diagnosisHistory) {
    // Destroy existing chart if it exists
    if (bloodPressureChart) {
      bloodPressureChart.destroy();
    }

    const ctx = canvas.getContext("2d");
    createBloodPressureChart(ctx, diagnosisHistory);
  }
}

// Create Blood Pressure Chart using Chart.js
function createBloodPressureChart(ctx, diagnosisHistory) {
  if (!diagnosisHistory || diagnosisHistory.length === 0) {
    // Show empty chart with message when no data is available
    bloodPressureChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    });
    return;
  }

  // Prepare data points (show last 6 months, reversed for chronological order)
  const dataPoints = diagnosisHistory.slice(0, 6).reverse();

  // Prepare labels and data
  const labels = dataPoints.map(
    (point) => `${point.month.substring(0, 3)} ${point.year}`
  );
  const systolicData = dataPoints.map(
    (point) => point.blood_pressure.systolic.value
  );
  const diastolicData = dataPoints.map(
    (point) => point.blood_pressure.diastolic.value
  );

  bloodPressureChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Systolic",
          data: systolicData,
          borderColor: "#e066ff",
          backgroundColor: "#e066ff",
          pointBackgroundColor: "#e066ff",
          pointBorderColor: "#e066ff",
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Diastolic",
          data: diastolicData,
          borderColor: "#8c6fe6",
          backgroundColor: "#8c6fe6",
          pointBackgroundColor: "#8c6fe6",
          pointBorderColor: "#8c6fe6",
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // We have our own legend
        },
        tooltip: {
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          titleColor: "#333",
          bodyColor: "#333",
          borderColor: "#ddd",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y} mmHg`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: "#f0f0f0",
            drawBorder: false,
          },
          ticks: {
            color: "#666",
            font: {
              size: 12,
            },
          },
        },
        y: {
          min: 60,
          max: 180,
          grid: {
            display: true,
            color: "#f0f0f0",
            drawBorder: false,
          },
          ticks: {
            color: "#666",
            font: {
              size: 12,
            },
            stepSize: 20,
          },
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
      elements: {
        point: {
          hoverBorderWidth: 3,
        },
      },
    },
  });
}

// Utility Functions
function formatDateOfBirth(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function findDetailElement(label) {
  const detailLabels = document.querySelectorAll(".detail-label");
  for (let labelEl of detailLabels) {
    if (labelEl.textContent.trim() === label) {
      return labelEl.closest(".patient-detail-item");
    }
  }
  return null;
}

function getStatusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

// Navigation functionality
function initializeNavigation() {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();

      // Remove active class from all nav items
      navItems.forEach((nav) => nav.classList.remove("active"));

      // Add active class to clicked item
      this.classList.add("active");

      // Handle navigation (placeholder)
      const section = this.textContent.trim();
      console.log("Navigating to:", section);
    });
  });
}

// Lab Results Download Functionality
function initializeLabResults() {
  const downloadIcons = document.querySelectorAll(".download-icon");

  downloadIcons.forEach((icon) => {
    icon.addEventListener("click", function () {
      const testName =
        this.parentElement.querySelector(".lab-test-name").textContent;
      console.log("Downloading:", testName);

      // Placeholder for download functionality
      alert(`Downloading ${testName}...`);
    });
  });
}

// Time Selector Functionality
function initializeTimeSelector() {
  const timeSelector = document.querySelector(".time-selector");

  if (timeSelector) {
    timeSelector.addEventListener("change", function () {
      const selectedPeriod = this.value;
      console.log("Time period changed to:", selectedPeriod);

      if (currentPatient && currentPatient.diagnosis_history) {
        // Filter data based on selected period
        let filteredHistory = currentPatient.diagnosis_history;

        switch (selectedPeriod) {
          case "Last 3 months":
            filteredHistory = currentPatient.diagnosis_history.slice(0, 3);
            break;
          case "Last year":
            filteredHistory = currentPatient.diagnosis_history.slice(0, 12);
            break;
          default: // Last 6 months
            filteredHistory = currentPatient.diagnosis_history.slice(0, 6);
        }

        updateChart(filteredHistory);
      }
    });
  }
}

// Loading and Error States
function showLoadingState() {
  const mainContainer = document.querySelector(".main-container");
  if (mainContainer) {
    mainContainer.style.opacity = "0.5";
    mainContainer.style.pointerEvents = "none";
  }

  console.log("Loading patients data...");
}

function hideLoadingState() {
  const mainContainer = document.querySelector(".main-container");
  if (mainContainer) {
    mainContainer.style.opacity = "1";
    mainContainer.style.pointerEvents = "auto";
  }

  console.log("Dashboard loaded successfully");
}

function showErrorState() {
  const mainContainer = document.querySelector(".main-container");
  if (mainContainer) {
    mainContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <h2>Error Loading Dashboard</h2>
                <p>Unable to fetch patient data. Please check your connection and try again.</p>
                <button onclick="location.reload()" style="background: #01f0ff; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; margin-top: 1rem;">
                    Retry
                </button>
            </div>
        `;
  }
}

// Export functions for external use
window.HealthcareDashboard = {
  selectPatient,
  fetchPatientsData,
  currentPatient: () => currentPatient,
  patientsData: () => patientsData,
};
