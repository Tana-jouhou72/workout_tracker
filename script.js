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
let currentDay = null;
let totalExercises = 0;

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
            exercises TEXT
        );`);
        
        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Error initializing database:", error);
    }
}

// Sound effects
function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Sound play error:", e));
    }
}

// Workout timer functionality
function startWorkoutDurationTimer() {
    const timerDisplay = document.getElementById("workout-timer-display");
    const startTime = Date.now();
    
    if (workoutTimer) {
        clearInterval(workoutTimer);
    }
    
    workoutTimer = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        timerDisplay.textContent = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }, 1000);
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
        <div class="timer-controls">
            <button id="toggle-rest-timer" class="btn primary-btn">
                <i class="fas fa-play"></i> Start
            </button>
        </div>
    `;
    
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
                playSound("timer-complete");
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
    for (let setIndex = 0; setIndex < 4; setIndex++) {
        const repsInput = document.getElementById(`reps-${exerciseIndex}-set-${setIndex}`);
        if (repsInput) {
            sets.push(repsInput.value || "");
        }
    }
    
    exerciseRepsData[day][exerciseIndex] = sets;
}

function restoreRepsData(day, exerciseIndex) {
    if (exerciseRepsData[day] && exerciseRepsData[day][exerciseIndex]) {
        const sets = exerciseRepsData[day][exerciseIndex];
        sets.forEach((reps, setIndex) => {
            const repsInput = document.getElementById(`reps-${exerciseIndex}-set-${setIndex}`);
            if (repsInput) {
                repsInput.value = reps;
            }
        });
    }
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
                    <div class="set-input">
                        <button>Set ${setIndex + 1}</button>
                        <input type="number" id="reps-${currentExerciseIndex}-set-${setIndex}" placeholder="Reps" min="0">
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

// Add this function to save all sets data for the current day
function saveAllSetsData(day) {
    // Loop through all exercises
    for (let exerciseIndex = 0; exerciseIndex < workoutPlan[day].exercises.length; exerciseIndex++) {
        saveRepsData(day, exerciseIndex);
    }
    console.log("All sets data saved successfully!");
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
        
        // Collect all exercise data
        const exercisesData = [];
        for (let i = 0; i < workout.exercises.length; i++) {
            const exercise = workout.exercises[i];
            const sets = [];
            
            if (exerciseRepsData[day] && exerciseRepsData[day][i]) {
                exerciseRepsData[day][i].forEach((reps, setIndex) => {
                    if (reps) {
                        sets.push({ set: setIndex + 1, reps: parseInt(reps, 10) });
                    }
                });
            }
            
            exercisesData.push({ exercise, sets });
        }
        
        const today = new Date().toISOString().split("T")[0];
        const exercisesJSON = JSON.stringify(exercisesData);
        
        db.run(`INSERT INTO workouts (date, day, workoutName, exercises) VALUES (?, ?, ?, ?);`, 
            [today, day, workoutName, exercisesJSON]);
        
        console.log("Workout data saved to database");
    } catch (error) {
        console.error("Error saving to database:", error);
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
        
        // Toggle visibility
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
                const [id, date, day, name, exercisesJSON] = row;
                const exercises = JSON.parse(exercisesJSON);
                
                historyHTML += `
                    <div class="workout-history-entry">
                        <div class="workout-history-date">${formatDate(date)}</div>
                        <div class="workout-history-name">${name}</div>
                        <ul class="exercise-history-list">
                `;
                
                exercises.forEach(e => {
                    if (e.sets && e.sets.length > 0) {
                        historyHTML += `
                            <li class="exercise-history-item">
                                ${e.exercise}
                                <div class="sets-history">
                                    ${e.sets.map(set => `
                                        <span class="set-history-pill">Set ${set.set}: ${set.reps} reps</span>
                                    `).join('')}
                                </div>
                            </li>
                        `;
                    }
                });
                
                historyHTML += `
                        </ul>
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

function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Event listeners and initialization
document.addEventListener("DOMContentLoaded", function() {
    // Initialize database
    initDatabase().then(() => {
        console.log("App initialized successfully");
        
        // Add day selection event listener
        document.getElementById("day").addEventListener("change", function() {
            currentDay = this.value;
            currentExerciseIndex = 0;
            totalExercises = workoutPlan[currentDay].exercises.length;
            
            // Start workout timer
            startWorkoutDurationTimer();
            
            // Initialize rest timer
            initializeRestTimer();
            
            // Show first exercise
            showExercise(currentDay);
        });
        
        // View history button
        document.getElementById("view-history").addEventListener("click", viewWorkoutHistory);
        
        // Select first day by default
        document.getElementById("day").value = "1";
        document.getElementById("day").dispatchEvent(new Event("change"));
    });
});
