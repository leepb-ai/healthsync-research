// ==========================================
// HealthSync Research - Logic Controller
// ==========================================

let currentStep = 0;
let userRole = null;

// Initialize data from local storage or start fresh
let surveyData = JSON.parse(localStorage.getItem('HealthSync_Research')) || {};

// The Strict Logic Gates (Must match HTML data-question attributes exactly)
const tracks = {
    clinical: [
        "0", "10", "11", "12", "vitals", "latency", "comm", 
        "overload", "accuracy", "bottleneck", "training", 
        "missed-decision","clinical-improvement", "complete"
    ],
    civilian: [
        "0", "exp-type", "anxiety", "wait-time", "wait-frequency", "clarity", 
        "fairness","patient-improvement" , "feedback","complete"
    ]
};

/**
 * Initializes the correct track based on user selection
 */
function setRole(role) {
    // CRITICAL: Wipe the old data so Clinical answers don't leak into Civilian records
    surveyData = { role: role }; 
    localStorage.setItem('HealthSync_Research', JSON.stringify(surveyData));

    userRole = role;
    currentStep = 0; 
    document.getElementById('subHeader').innerText = `Active Track: ${role.toUpperCase()}`;
    nextQuestion();
}

/**
 * Advances the UI to the next question in the assigned array
 */
function nextQuestion() {
    const activeTrack = tracks[userRole || 'clinical']; // Failsafe to clinical
    
    if (currentStep < activeTrack.length - 1) {
        currentStep++;
        navigateToQuestion(activeTrack[currentStep]);
    }
}

/**
 * Handles the DOM manipulation to hide/show cards
 */
function navigateToQuestion(targetId) {
    // 1. Clear active state from ALL cards
    document.querySelectorAll('.question-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // 2. Activate ONLY the targeted card
    const targetCard = document.querySelector(`[data-question="${targetId}"]`);
    if (targetCard) {
        targetCard.classList.add('active');
        updateProgress(targetId);
    } else {
        console.error(`HealthSync Routing Error: Card with data-question="${targetId}" not found.`);
    }
}

/**
 * Calculates and updates the visual progress bar
 */
function updateProgress(currentId) {
    const activeTrack = tracks[userRole || 'clinical'];
    const index = activeTrack.indexOf(currentId);
    
    // Calculate percentage (excluding the '0' start screen from the math)
    const progressPercentage = (index / (activeTrack.length - 1)) * 100;
    
    document.getElementById('progressBar').style.width = `${progressPercentage}%`;
}

/**
 * Core Data Pipeline: Saves to local storage and triggers visual feedback
 */
function saveData(key, value, showToast = true) {
    // Write to JS object
    surveyData[key] = value;
    
    // Serialize and push to browser storage
    localStorage.setItem('HealthSync_Research', JSON.stringify(surveyData));
    
    // Trigger the UI Toast Notification
    if (showToast) {
        const toastIndicator = document.getElementById('savedIndicator');
        if (toastIndicator) {
            // Reset animation if it's currently running
            toastIndicator.classList.remove('show');
            void toastIndicator.offsetWidth; // Trigger DOM reflow
            
            toastIndicator.classList.add('show');
            
            // Hide after 1.5 seconds
            setTimeout(() => {
                toastIndicator.classList.remove('show');
            }, 1500);
        }
    }
}

function toggleOtherInput(elementId) {
    const inputDiv = document.getElementById(elementId);
    inputDiv.style.display = inputDiv.style.display === 'none' ? 'block' : 'none';
    if(inputDiv.style.display === 'block') {
        inputDiv.querySelector('input').focus();
    }
}


async function syncToAirtable() {
    try {
        // Prepare the payload (Make sure these keys match Airtable columns!)
        const payload = {
            fields: {
                "Role": surveyData.role || "Unknown",
                "Core_Symptom": surveyData.core_symptom || "N/A",
                "Latency": surveyData.latency || "Not Asked",
                "Clinical_Wishlist": surveyData.clinical_wishlist || "N/A",
                "Patient_Feedback": surveyData.civilian_feedback || "N/A",
                "Wait_Time": surveyData.wait || "N/A"
            }
        };

        // This calls the "Shield" we are building in Netlify
        const response = await fetch('/.netlify/functions/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("✅ Sync Successful!");
            alert("Research Data Secured Successfully!");
        } else {
            const errorData = await response.json();
            console.error("❌ Rejected:", errorData);
            alert("Sync Failed: " + (errorData.message || "Check Console"));
        }
    } catch (err) {
        console.error("❌ Connection failed:", err);
        alert("Cloud connection failed. Data is still saved locally.");
    }
}
