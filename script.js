// Workout Plan Data
const workoutPlan = {
    1: {
        name: "Push (Chest, Shoulders, Triceps)",
        exercises: [
            "Warm-Up: 5–10 min dynamic stretches (arm circles, jumping jacks)",
            "Dumbbell Bench Press: 4 sets of 10–12 reps (slow descent)",
            "Incline Push-Ups: 3 sets of 12–15 reps",
            "Dumbbell Shoulder Press: 3 sets of 10–12 reps",
            "Dumbbell Lateral Raises: 3 sets of 12–15 reps",
            "Tricep Dips: 3 sets of 12–15 reps",
            "Overhead Tricep Extension: 3 sets of 12–15 reps",
            "Cool-Down: Chest, shoulder, tricep stretches"
        ]
    },
    2: {
        name: "Pull (Back, Biceps, Rear Delts)",
        exercises: [
            "Warm-Up: 5–10 min light cardio, arm swings",
            "Pull-Ups: 4 sets of 6–10 reps (or negatives)",
            "Dumbbell Bent-Over Rows: 3 sets of 10–12 reps per arm",
            "Inverted Rows: 3 sets of 12–15 reps",
            "Dumbbell Rear Delt Flys: 3 sets of 12–15 reps",
            "Dumbbell Bicep Curls: 3 sets of 10–12 reps",
            "Bodyweight Chin-Ups: 3 sets of 6–10 reps",
            "Cool-Down: Lats, biceps, lower back stretches"
        ]
    },
    3: {
        name: "Legs and Core",
        exercises: [
            "Warm-Up: 5–10 min bodyweight squats, leg swings",
            "Dumbbell Goblet Squats: 4 sets of 10–12 reps",
            "Romanian Deadlifts: 3 sets of 10–12 reps",
            "Bulgarian Split Squats: 3 sets of 10–12 reps per leg",
            "Calf Raises: 3 sets of 15–20 reps",
            "Plank: 3 sets of 45–60 seconds",
            "Hanging Leg Raises: 3 sets of 12–15 reps",
            "Cool-Down: Quads, hamstrings, calves stretches"
        ]
    },
    4: {
        name: "Rest or Active Recovery",
        exercises: [
            "Optional Activity: 20–30 min light cardio (walking, cycling, yoga)",
            "Focus: Mobility work and stretching"
        ]
    },
    5: {
        name: "Full Body",
        exercises: [
            "Warm-Up: 5–10 min jumping jacks/light cardio",
            "Dumbbell Floor Press: 3 sets of 10–12 reps",
            "Pull-Ups: 3 sets of 6–10 reps",
            "Dumbbell Goblet Squats: 3 sets of 10–12 reps",
            "Dumbbell Shoulder Press: 3 sets of 10–12 reps",
            "Push-Ups: 3 sets to failure (slow tempo)",
            "Farmer’s Carry: 3 sets of 30 seconds",
            "Cool-Down: Full-body stretches"
        ]
    },
    6: {
        name: "Cardio and Core",
        exercises: [
            "Warm-Up: 5 min jogging or jumping jacks",
            "HIIT Cardio: 20 min (e.g. 30 sec burpees, 1 min rest)",
            "Bicycle Crunches: 3 sets of 15–20 reps per side",
            "Russian Twists: 3 sets of 20 reps per side",
            "Hanging Knee Tucks: 3 sets of 12–15 reps",
            "Cool-Down: Abs and lower back stretches"
        ]
    },
    7: {
        name: "Rest",
        exercises: [
            "Focus: Full rest, hydration, sleep, recovery"
        ]
    }
};

// App State
let db;
let currentExerciseIndex = 0;
let workoutTimer = null;
let restTimer = null;
let isRestTimerRunning = false;
let restTimeLeft = 0;
let exerciseRepsData = {};
let exerciseWeightData = {};
let personalRecords = {};
let workoutNotes = {};
let setsCompleted = 0;
let totalVolume = 0;
let currentDay = null;
let totalExercises = 0;
let notificationsEnabled = false;

// Initialize database
async function initDatabase() {
    try {
        const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
        db = new SQL.Database();
        
        // Create a table for workouts
        db.run(`CREATE TABLE IF NOT EXISTS workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            day INTEGER,
            workoutName TEXT,
            exercises TEXT,
            notes TEXT
        );`);
        
        // Create a table for personal records
        db.run(`CREATE TABLE IF NOT EXISTS personal_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exercise TEXT,
            weight REAL,
            reps INTEGER,
            date TEXT
        );`);
        
        loadPersonalRecords();
        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Error initializing database:", error);
    }
}

// Load personal records from database
function loadPersonalRecords() {
    try {
        if (!db) return;
        
        const result = db.exec("SELECT exercise, weight, reps FROM personal_records");
        
        if (result.length && result[0].values.length) {
            result[0].values.forEach(row => {
                const [exercise, weight, reps] = row;
                
                if (!personalRecords[exercise]) {
                    personalRecords[exercise] = {};
                }
                
                personalRecords[exercise][`${weight}kg`] = reps;
            });
        }
    } catch (error) {
        console.error("Error loading personal records:", error);
    }
}

// Theme Toggle
function initThemeToggle() {
    const themeSwitch = document.getElementById("theme-switch");
    const htmlElement = document.documentElement;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        htmlElement.setAttribute("data-theme", "dark");
        themeSwitch.checked = true;
    }
    
    // Add theme toggle event listener
    themeSwitch.addEventListener("change", function() {
        if (this.checked) {
            htmlElement.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
        } else {
            htmlElement.setAttribute("data-theme", "light");
            localStorage.setItem("theme", "light");
        }
    });
}

// Notification system
function initNotifications() {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return;
    }
    
    // Check if user has already made a choice
    if (Notification.permission === "granted") {
        notificationsEnabled = true;
    } else if (Notification.permission !== "denied") {
        // Show our custom prompt
        const notificationDialog = document.getElementById("notification-permission");
        notificationDialog.classList.remove("hidden");
        
        document.getElementById("enable-notifications").addEventListener("click", function() {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    notificationsEnabled = true;
                }
                notificationDialog.classList.add("hidden");
            });
        });
        
        document.getElementById("disable-notifications").addEventListener("click", function() {
            notificationDialog.classList.add("hidden");
        });
    }
}

function sendNotification(title, message) {
    if (notificationsEnabled && document.visibilityState !== "visible") {
        const notification = new Notification(title, {
            body: message,
            icon: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png"
        });
        
        notification.onclick = function() {
            window.focus();
            this.close();
        };
    }
}

// Sound effects
function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        // Check if the browser supports the play method
        if (typeof sound.play === 'function') {
            // Try to play the sound, but catch any errors to prevent app from getting stuck
            sound.currentTime = 0;
            sound.play().catch(e => {
                console.log("Sound play error or notification not allowed:", e);
                // Continue with app functionality even if sound fails
            });
        }
    }
}

// Workout timer functionality
function toggleWorkoutTimer() {
    const timerDisplay = document.getElementById("workout-timer-display");
    const startPauseButton = document.getElementById("start-pause-timer");
    
    if (isTimerRunning) {
        // Pause timer
        clearInterval(workoutTimer);
        savedElapsedTime += Date.now() - timerStartTime;
        isTimerRunning = false;
        startPauseButton.innerHTML = '<i class="fas fa-play"></i> Start';
    } else {
        // Start timer
        timerStartTime = Date.now();
        isTimerRunning = true;
        startPauseButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
        
        workoutTimer = setInterval(() => {
            const elapsedTime = savedElapsedTime + (Date.now() - timerStartTime);
            const minutes = Math.floor(elapsedTime / 60000);
            const seconds = Math.floor((elapsedTime % 60000) / 1000);
            timerDisplay.textContent = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
            
            // Save the elapsed time to localStorage
            localStorage.setItem("workoutTimer", JSON.stringify({
                savedElapsedTime: savedElapsedTime,
                startTime: timerStartTime,
                isRunning: isTimerRunning
            }));
        }, 1000);
    }
}

// Variable declarations for timer
let isTimerRunning = false;
let timerStartTime = null;
let savedElapsedTime = 0;

// This function is being replaced - keep this as a reference but it will not be used
function startWorkoutDurationTimer() {
    // This function is being replaced by toggleWorkoutTimer
    // It's kept here for reference but won't be called
}

// Rest timer functionality
function initializeRestTimer() {
    const restTimerContainer = document.getElementById("rest-timer-container");
    
    restTimerContainer.innerHTML = `
        <h4 class="timer-title"><i class="fas fa-hourglass-half"></i> Rest Timer</h4>
        <div class="timer-circle-container">
            <div class="timer-circle">
                <span class="timer-display" id="rest-timer-display">Ready</span>
            </div>
        </div>
        <div class="timer-input">
            <input type="number" id="rest-time" placeholder="Seconds" min="1" max="300">
        </div>
        <div class="timer-presets">
            <button class="preset-btn" data-time="30">30s</button>
            <button class="preset-btn" data-time="60">60s</button>
            <button class="preset-btn" data-time="90">90s</button>
            <button class="preset-btn" data-time="120">2m</button>
        </div>
        <div class="timer-controls">
            <button id="toggle-rest-timer" class="btn primary-btn">
                <i class="fas fa-play"></i> Start
            </button>
        </div>
    `;
    
    // Add event listeners for preset buttons
    document.querySelectorAll('.preset-btn').forEach(button => {
        button.addEventListener('click', function() {
            const time = this.getAttribute('data-time');
            document.getElementById('rest-time').value = time;
        });
    });
    
    document.getElementById("toggle-rest-timer").addEventListener("click", function() {
        const restTimeInput = parseInt(document.getElementById("rest-time").value, 10);
        
        if (!isRestTimerRunning && (isNaN(restTimeInput) || restTimeInput <= 0)) {
            alert("Please enter a valid rest time (1-300 seconds).");
            return;
        }
        
        toggleRestTimer(restTimeInput);
    });
}

function toggleRestTimer(restTime) {
    const timerDisplay = document.getElementById("rest-timer-display");
    const toggleButton = document.getElementById("toggle-rest-timer");
    const timerCircle = document.querySelector(".timer-circle");
    
    if (isRestTimerRunning) {
        // Pause timer
        clearInterval(restTimer);
        isRestTimerRunning = false;
        toggleButton.innerHTML = '<i class="fas fa-play"></i> Resume';
    } else {
        // Start or resume timer
        if (restTimeLeft <= 0) {
            restTimeLeft = restTime;
        }
        
        isRestTimerRunning = true;
        toggleButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
        
        restTimer = setInterval(() => {
            if (restTimeLeft <= 0) {
                clearInterval(restTimer);
                isRestTimerRunning = false;
                toggleButton.innerHTML = '<i class="fas fa-play"></i> Start';
                timerDisplay.textContent = "Done!";
                timerCircle.style.setProperty("--progress", "100%");
                
                // Try to play sound but don't block if it fails
                playSound("timer-complete");
                sendNotification("Rest Timer Complete", "Time to start your next set!");
            } else {
                restTimeLeft--;
                const progress = ((restTime - restTimeLeft) / restTime) * 100;
                timerCircle.style.setProperty("--progress", `${progress}%`);
                
                // Format time as mm:ss
                const minutes = Math.floor(restTimeLeft / 60);
                const seconds = restTimeLeft % 60;
                timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
}

// Exercise display and navigation
function saveRepsData(day, exerciseIndex) {
    if (!exerciseRepsData[day]) {
        exerciseRepsData[day] = {};
    }
    
    const sets = [];
    let setsCompleted = 0;
    let totalVolume = 0;
    
    for (let setIndex = 0; setIndex < 4; setIndex++) {
        const repsInput = document.getElementById(`reps-${exerciseIndex}-set-${setIndex}`);
        const weightInput = document.getElementById(`weight-${exerciseIndex}-set-${setIndex}`);
        
        if (repsInput) {
            const reps = repsInput.value || "";
            const weight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
            
            sets.push({ reps, weight });
            
            if (reps && weight) {
                setsCompleted++;
                totalVolume += parseInt(reps) * weight;
                
                // Check for personal record
                checkForPersonalRecord(workoutPlan[day].exercises[exerciseIndex], weight, parseInt(reps));
            }
        }
    }
    
    exerciseRepsData[day][exerciseIndex] = sets;
    
    // Update workout stats
    updateWorkoutStats(setsCompleted, totalVolume);
}

function saveAllSetsData(day) {
    // Reset stats
    setsCompleted = 0;
    totalVolume = 0;
    
    // Loop through all exercises
    for (let exerciseIndex = 0; exerciseIndex < workoutPlan[day].exercises.length; exerciseIndex++) {
        saveRepsData(day, exerciseIndex);
    }
    
    // Save workout notes
    const notes = document.getElementById("session-notes").value;
    workoutNotes[day] = notes;
    
    console.log("All sets data saved successfully!");
}

function restoreRepsData(day, exerciseIndex) {
    if (exerciseRepsData[day] && exerciseRepsData[day][exerciseIndex]) {
        const sets = exerciseRepsData[day][exerciseIndex];
        sets.forEach((set, setIndex) => {
            const repsInput = document.getElementById(`reps-${exerciseIndex}-set-${setIndex}`);
            const weightInput = document.getElementById(`weight-${exerciseIndex}-set-${setIndex}`);
            
            if (repsInput) {
                repsInput.value = set.reps || "";
            }
            
            if (weightInput) {
                weightInput.value = set.weight || "";
            }
        });
    }
}

function updateWorkoutStats(setsDone, volume) {
    // Add to existing stats
    setsCompleted += setsDone;
    totalVolume += volume;
    
    // Update display
    document.getElementById("sets-completed").textContent = setsCompleted;
    document.getElementById("total-volume").textContent = `${totalVolume}kg`;
}

function updateProgressBar() {
    const progressBar = document.getElementById("exercise-progress-bar");
    const progressText = document.getElementById("progress-text");
    
    if (totalExercises > 0) {
        const progress = ((currentExerciseIndex + 1) / totalExercises) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Exercise ${currentExerciseIndex + 1} of ${totalExercises}`;
    }
}

function checkForPersonalRecord(exercise, weight, reps) {
    if (!personalRecords[exercise] || 
        !personalRecords[exercise][`${weight}kg`] || 
        personalRecords[exercise][`${weight}kg`] < reps) {
        
        // New personal record!
        if (!personalRecords[exercise]) {
            personalRecords[exercise] = {};
        }
        
        personalRecords[exercise][`${weight}kg`] = reps;
        
        // Save to database
        try {
            if (db) {
                // Check if record already exists
                const result = db.exec(`SELECT id FROM personal_records WHERE exercise='${exercise}' AND weight=${weight}`);
                
                if (result.length && result[0].values.length) {
                    // Update existing record
                    const id = result[0].values[0][0];
                    db.run(`UPDATE personal_records SET reps=${reps}, date=date('now') WHERE id=${id}`);
                } else {
                    // Insert new record
                    db.run(`INSERT INTO personal_records (exercise, weight, reps, date) VALUES (?, ?, ?, date('now'))`, 
                        [exercise, weight, reps]);
                }
            }
        } catch (error) {
            console.error("Error saving personal record:", error);
        }
        
        // Show PR notification
        const prBadge = document.createElement("div");
        prBadge.className = "pr-badge";
        prBadge.innerHTML = '<i class="fas fa-trophy"></i> New PR!';
        
        const exerciseCard = document.querySelector(".exercise-card");
        if (exerciseCard) {
            exerciseCard.appendChild(prBadge);
            
            // Play sound
            playSound("pr-sound");
            
            // Remove after 3 seconds
            setTimeout(() => {
                prBadge.remove();
            }, 3000);
        }
    }
}

function getExerciseIcon(exerciseName) {
    const lowerName = exerciseName.toLowerCase();
    
    if (lowerName.includes("bench") || lowerName.includes("press") || lowerName.includes("push")) {
        return "fa-dumbbell";
    } else if (lowerName.includes("squat") || lowerName.includes("leg") || lowerName.includes("lunge")) {
        return "fa-person";
    } else if (lowerName.includes("cardio") || lowerName.includes("run") || lowerName.includes("jog")) {
        return "fa-heart-pulse";
    } else if (lowerName.includes("stretch") || lowerName.includes("yoga") || lowerName.includes("mobility")) {
        return "fa-child-reaching";
    } else if (lowerName.includes("pull") || lowerName.includes("row") || lowerName.includes("chin")) {
        return "fa-arrow-up-from-bracket";
    } else if (lowerName.includes("curl") || lowerName.includes("bicep")) {
        return "fa-dumbbell";
    } else if (lowerName.includes("plank") || lowerName.includes("core") || lowerName.includes("abs")) {
        return "fa-person-rays";
    } else {
        return "fa-dumbbell";
    }
}

function showExercise(day) {
    const workout = workoutPlan[day];
    const exercise = workout.exercises[currentExerciseIndex];
    
    const workoutDetails = document.getElementById("workout-details");
    
    workoutDetails.innerHTML = `
        <h3><i class="fas fa-list-check"></i> ${workout.name}</h3>
        <div class="exercise-card">
            <div class="exercise-title">
                <span><i class="fas ${getExerciseIcon(exercise)}"></i> ${exercise}</span>
                <span>${currentExerciseIndex + 1}/${totalExercises}</span>
            </div>
            <div class="sets-container">
                ${[...Array(4)].map((_, setIndex) => `
                    <div class="set-group">
                        <div class="set-input">
                            <button>Set ${setIndex + 1}</button>
                            <select id="reps-${currentExerciseIndex}-set-${setIndex}" class="reps-select">
                                <option value="">Select reps</option>
                                ${[...Array(20)].map((_, i) => 
                                    `<option value="${i+1}">${i+1} reps</option>`
                                ).join('')}
                            </select>
                        </div>
                        <input type="number" id="weight-${currentExerciseIndex}-set-${setIndex}" class="weight-input" placeholder="kg" min="0" step="0.5">
                    </div>
                `).join('')}
            </div>
            <div class="exercise-navigation">
                <button id="prev-exercise" class="btn secondary-btn ${currentExerciseIndex === 0 ? 'hidden' : ''}">
                    <i class="fas fa-arrow-left"></i> Previous
                </button>
                <button id="next-exercise" class="btn primary-btn">
                    ${currentExerciseIndex < totalExercises - 1 ? '<i class="fas fa-arrow-right"></i> Next' : '<i class="fas fa-check"></i> Finish Workout'}
                </button>
            </div>
        </div>
    `;
    
    // Restore any previously entered reps data
    restoreRepsData(day, currentExerciseIndex);
    
    // Update progress indicator
    updateProgressBar();
    
    // Add event listeners
    document.getElementById("next-exercise").addEventListener("click", function() {
        // Always save the current exercise data
        saveRepsData(day, currentExerciseIndex);
        
        if (currentExerciseIndex < totalExercises - 1) {
            currentExerciseIndex++;
            showExercise(day);
        } else {
            // This is the "Finish Workout" button
            // Save all data for all exercises first
            saveAllSetsData(day);
            
            // Then save the workout to the database
            saveWorkoutToDatabase(day);
            
            // Show completion message
            alert("Workout complete! All your sets have been saved!");
            
            // Reset to first exercise
            currentExerciseIndex = 0;
            showExercise(day);
        }
    });
    
    if (currentExerciseIndex > 0) {
        document.getElementById("prev-exercise").addEventListener("click", function() {
            // Save current exercise data before going back
            saveRepsData(day, currentExerciseIndex);
            
            currentExerciseIndex--;
            showExercise(day);
        });
    }
}

// Notes functionality
function initializeWorkoutNotes() {
    const saveNotesButton = document.getElementById("save-notes");
    saveNotesButton.addEventListener("click", function() {
        const notes = document.getElementById("session-notes").value;
        if (currentDay) {
            workoutNotes[currentDay] = notes;
            
            // Show success message
            saveNotesButton.innerHTML = '<i class="fas fa-check"></i> Saved!';
            setTimeout(() => {
                saveNotesButton.innerHTML = 'Save Notes';
            }, 2000);
        }
    });
}

function restoreWorkoutNotes(day) {
    const notesTextarea = document.getElementById("session-notes");
    if (workoutNotes[day]) {
        notesTextarea.value = workoutNotes[day];
    } else {
        notesTextarea.value = '';
    }
}

// Database operations
function saveWorkoutToDatabase(day) {
    try {
        if (!db) {
            console.error("Database not initialized");
            return;
        }
        
        const workout = workoutPlan[day];
        const workoutName = workout.name;
        const notes = workoutNotes[day] || '';
        
        // Collect all exercise data
        const exercisesData = [];
        for (let i = 0; i < workout.exercises.length; i++) {
            const exercise = workout.exercises[i];
            const sets = [];
            
            if (exerciseRepsData[day] && exerciseRepsData[day][i]) {
                exerciseRepsData[day][i].forEach((set, setIndex) => {
                    if (set.reps) {
                        sets.push({ 
                            set: setIndex + 1, 
                            reps: parseInt(set.reps, 10) || 0,
                            weight: parseFloat(set.weight) || 0
                        });
                    }
                });
            }
            
            exercisesData.push({ exercise, sets });
        }
        
        const today = new Date().toISOString().split("T")[0];
        const exercisesJSON = JSON.stringify(exercisesData);
        
        db.run(`INSERT INTO workouts (date, day, workoutName, exercises, notes) VALUES (?, ?, ?, ?, ?);`, 
            [today, day, workoutName, exercisesJSON, notes]);
        
        console.log("Workout data saved to database");
    } catch (error) {
        console.error("Error saving to database:", error);
    }
}

function exportToCSV() {
    try {
        if (!db) {
            alert("No workout data to export.");
            return;
        }
        
        // Get workout history
        const result = db.exec("SELECT date, workoutName, exercises FROM workouts ORDER BY date DESC");
        
        if (!result.length || !result[0].values.length) {
            alert("No workout history found to export.");
            return;
        }
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Workout,Exercise,Set,Reps,Weight\n";
        
        result[0].values.forEach(row => {
            const [date, workoutName, exercisesJSON] = row;
            const exercises = JSON.parse(exercisesJSON);
            
            exercises.forEach(e => {
                if (e.sets && e.sets.length > 0) {
                    e.sets.forEach(set => {
                        csvContent += `${date},${workoutName},"${e.exercise}",${set.set},${set.reps},${set.weight || 0}\n`;
                    });
                }
            });
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `workout_history_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error exporting CSV:", error);
    }
}

function exportDatabase() {
    try {
        if (!db) {
            alert("No workout data to export.");
            return;
        }
        
        const binaryArray = db.export();
        const blob = new Blob([binaryArray], { type: "application/octet-stream" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `workout_database_${new Date().toISOString().slice(0, 10)}.sqlite`;
        link.click();
    } catch (error) {
        console.error("Error exporting database:", error);
    }
}

function viewWorkoutHistory() {
    try {
        if (!db) {
            alert("No workout history available.");
            return;
        }
        
        const historyContainer = document.getElementById("history-container");
        const calendarContainer = document.getElementById("calendar-container");
        
        // Hide calendar if visible
        calendarContainer.classList.add("hidden");
        
        // Toggle history visibility
        if (historyContainer.classList.contains("hidden")) {
            historyContainer.classList.remove("hidden");
            document.getElementById("view-history").innerHTML = '<i class="fas fa-eye-slash"></i> Hide History';
            
            // Get workout history
            const result = db.exec("SELECT * FROM workouts ORDER BY date DESC LIMIT 10");
            
            if (!result.length || !result[0].values.length) {
                historyContainer.innerHTML = `
                    <div class="workout-history-entry">
                        <p>No workout history found. Complete a workout to see your history.</p>
                    </div>
                `;
                return;
            }
            
            let historyHTML = '';
            
            result[0].values.forEach(row => {
                const [id, date, day, name, exercisesJSON, notes] = row;
                const exercises = JSON.parse(exercisesJSON);
                
                historyHTML += `
                    <div class="workout-history-entry">
                        <div class="workout-history-date">${formatDate(date)}</div>
                        <div class="workout-history-name">${name}</div>
                `;
                
                if (notes) {
                    historyHTML += `
                        <div class="workout-history-notes">
                            <em>${notes}</em>
                        </div>
                    `;
                }
                
                historyHTML += `<ul class="exercise-history-list">`;
                
                exercises.forEach(e => {
                    if (e.sets && e.sets.length > 0) {
                        historyHTML += `
                            <li class="exercise-history-item">
                                ${e.exercise}
                                <div class="sets-history">
                                    ${e.sets.map(set => `
                                        <span class="set-history-pill">Set ${set.set}: ${set.reps} reps @ ${set.weight || 0}kg</span>
                                    `).join('')}
                                </div>
                            </li>
                        `;
                    }
                });
                
                historyHTML += `
                        </ul>
                        <button class="btn delete-btn" onclick="deleteWorkout(${id})"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                `;
            });
            
            historyContainer.innerHTML = historyHTML;
        } else {
            historyContainer.classList.add("hidden");
            document.getElementById("view-history").innerHTML = '<i class="fas fa-chart-line"></i> View History';
        }
    } catch (error) {
        console.error("Error viewing history:", error);
    }
}

function viewCalendar() {
    try {
        if (!db) {
            alert("No workout data available for calendar view.");
            return;
        }
        
        const historyContainer = document.getElementById("history-container");
        const calendarContainer = document.getElementById("calendar-container");
        
        // Hide history if visible
        historyContainer.classList.add("hidden");
        
        // Toggle calendar visibility
        if (calendarContainer.classList.contains("hidden")) {
            calendarContainer.classList.remove("hidden");
            document.getElementById("view-calendar").innerHTML = '<i class="fas fa-eye-slash"></i> Hide Calendar';
            
            // Get current month and year
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            renderCalendar(currentMonth, currentYear);
        } else {
            calendarContainer.classList.add("hidden");
            document.getElementById("view-calendar").innerHTML = '<i class="fas fa-calendar"></i> Calendar View';
        }
    } catch (error) {
        console.error("Error viewing calendar:", error);
    }
}

function renderCalendar(month, year) {
    const calendarContainer = document.getElementById("calendar-container");
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get workout dates for current month
    const workoutDates = getWorkoutDatesForMonth(month, year);
    
    // Month names
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    
    // Day names
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    let calendarHTML = `
        <div class="calendar-header">
            <div class="calendar-month">${monthNames[month]} ${year}</div>
            <div class="calendar-navigation">
                <button id="prev-month" class="btn secondary-btn"><i class="fas fa-chevron-left"></i></button>
                <button id="next-month" class="btn secondary-btn"><i class="fas fa-chevron-right"></i></button>
            </div>
        </div>
        <div class="calendar">
    `;
    
    // Add day headers
    dayNames.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<div class="calendar-day"></div>`;
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const hasWorkout = workoutDates[dateStr];
        
        calendarHTML += `
            <div class="calendar-day ${hasWorkout ? 'has-workout' : ''}">
                <div class="calendar-day-number">${day}</div>
                ${hasWorkout ? `<div class="calendar-workout-info">${hasWorkout}</div>` : ''}
            </div>
        `;
    }
    
    calendarHTML += `</div>`;
    
    calendarContainer.innerHTML = calendarHTML;
    
    // Add event listeners for month navigation
    document.getElementById("prev-month").addEventListener("click", function() {
        const newMonth = month === 0 ? 11 : month - 1;
        const newYear = month === 0 ? year - 1 : year;
        renderCalendar(newMonth, newYear);
    });
    
    document.getElementById("next-month").addEventListener("click", function() {
        const newMonth = month === 11 ? 0 : month + 1;
        const newYear = month === 11 ? year + 1 : year;
        renderCalendar(newMonth, newYear);
    });
}

function getWorkoutDatesForMonth(month, year) {
    const workoutDates = {};
    
    try {
        if (!db) return workoutDates;
        
        const monthStr = (month + 1).toString().padStart(2, '0');
        const result = db.exec(`SELECT date, workoutName FROM workouts WHERE date LIKE '${year}-${monthStr}-%'`);
        
        if (result.length && result[0].values.length) {
            result[0].values.forEach(row => {
                const [date, workoutName] = row;
                workoutDates[date] = workoutName;
            });
        }
    } catch (error) {
        console.error("Error getting workout dates:", error);
    }
    
    return workoutDates;
}

function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Add Delete Functionality for workout history
function deleteWorkout(workoutId) {
    try {
        if (!db) {
            alert("Database not initialized");
            return;
        }
        
        // Delete the workout from the database
        db.run(`DELETE FROM workouts WHERE id = ?;`, [workoutId]);
        
        // Refresh the history view
        viewWorkoutHistory();
        
        // Show success message
        alert("Workout deleted successfully!");
    } catch (error) {
        console.error("Error deleting workout:", error);
        alert("Error deleting workout. Please try again.");
    }
}

// Add LocalStorage functionality for data persistence
function saveToLocalStorage() {
    // Save all workout data
    const dataToSave = {
        exerciseRepsData: exerciseRepsData,
        workoutNotes: workoutNotes,
        personalRecords: personalRecords,
        setsCompleted: setsCompleted,
        totalVolume: totalVolume,
        timerData: {
            savedElapsedTime: savedElapsedTime,
            isRunning: isTimerRunning
        }
    };
    
    localStorage.setItem('workoutAppData', JSON.stringify(dataToSave));
    console.log('Data saved to localStorage');
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('workoutAppData');
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            
            // Restore all workout data
            if (parsedData.exerciseRepsData) exerciseRepsData = parsedData.exerciseRepsData;
            if (parsedData.workoutNotes) workoutNotes = parsedData.workoutNotes;
            if (parsedData.personalRecords) personalRecords = parsedData.personalRecords;
            if (parsedData.setsCompleted) setsCompleted = parsedData.setsCompleted;
            if (parsedData.totalVolume) totalVolume = parsedData.totalVolume;
            
            // Restore timer data
            if (parsedData.timerData) {
                savedElapsedTime = parsedData.timerData.savedElapsedTime || 0;
                isTimerRunning = false; // Always start paused on page load
                
                // Update timer display
                const minutes = Math.floor(savedElapsedTime / 60000);
                const seconds = Math.floor((savedElapsedTime % 60000) / 1000);
                const timerDisplay = document.getElementById("workout-timer-display");
                if (timerDisplay) {
                    timerDisplay.textContent = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
                }
            }
            
            console.log('Data loaded from localStorage');
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
        }
    }
}

// Save data periodically and on certain actions
function setupAutosave() {
    // Save data every 30 seconds
    setInterval(saveToLocalStorage, 30000);
    
    // Save data before page unload (when closing or refreshing)
    window.addEventListener('beforeunload', saveToLocalStorage);
    
    // Save when completing sets
    const originalSaveRepsData = saveRepsData;
    saveRepsData = function(day, exerciseIndex) {
        originalSaveRepsData(day, exerciseIndex);
        saveToLocalStorage();
    };
    
    // Save when completing workout
    const originalSaveWorkoutToDatabase = saveWorkoutToDatabase;
    saveWorkoutToDatabase = function(day) {
        originalSaveWorkoutToDatabase(day);
        saveToLocalStorage();
    };
}

// Function to clear all stored data
function clearAllData() {
    // Ask for confirmation before clearing
    if (confirm("Are you sure you want to clear all saved workout data? This cannot be undone.")) {
        // Clear localStorage data
        localStorage.removeItem('workoutAppData');
        localStorage.removeItem('workoutTimer');
        
        // Reset app state
        exerciseRepsData = {};
        workoutNotes = {};
        setsCompleted = 0;
        totalVolume = 0;
        savedElapsedTime = 0;
        isTimerRunning = false;
        
        // Update display
        document.getElementById("workout-timer-display").textContent = "0m 0s";
        document.getElementById("sets-completed").textContent = "0";
        document.getElementById("total-volume").textContent = "0kg";
        
        // Clear the session notes
        document.getElementById("session-notes").value = "";
        
        // Try to clear IndexedDB data if used by sql.js
        try {
            indexedDB.deleteDatabase("SQL-JS");
        } catch (e) {
            console.error("Error clearing IndexedDB:", e);
        }
        
        // Re-initialize database
        initDatabase().then(() => {
            alert("All workout data has been cleared!");
            
            // Refresh the page to ensure everything is reset
            window.location.reload();
        });
    }
}

// Event listeners and initialization
document.addEventListener("DOMContentLoaded", function() {
    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize database
    initDatabase().then(() => {
        console.log("App initialized successfully");
        
        // Initialize notifications
        initNotifications();
        
        // Initialize workout notes
        initializeWorkoutNotes();
        
        // Add event listener for the workout timer button
        document.getElementById("start-pause-timer").addEventListener("click", toggleWorkoutTimer);
        
        // Add day selection event listener
        document.getElementById("day").addEventListener("change", function() {
            currentDay = this.value;
            currentExerciseIndex = 0;
            totalExercises = workoutPlan[currentDay].exercises.length;
            
            // Reset workout stats
            setsCompleted = 0;
            totalVolume = 0;
            document.getElementById("sets-completed").textContent = "0";
            document.getElementById("total-volume").textContent = "0";
            
            // Initialize rest timer
            initializeRestTimer();
            
            // Restore workout notes
            restoreWorkoutNotes(currentDay);
            
            // Show first exercise
            showExercise(currentDay);
        });
        
        // View history button
        document.getElementById("view-history").addEventListener("click", viewWorkoutHistory);
        
        // Export to CSV button
        document.getElementById("export-csv").addEventListener("click", exportToCSV);
        
        // Calendar view button
        document.getElementById("view-calendar").addEventListener("click", viewCalendar);
        
        // Clear all data button
        document.getElementById("clear-all-data").addEventListener("click", clearAllData);
        
        // Load data from localStorage
        loadFromLocalStorage();
        
        // Setup autosave functionality
        setupAutosave();
        
        // Select first day by default
        document.getElementById("day").value = "1";
        document.getElementById("day").dispatchEvent(new Event("change"));
    });
});
