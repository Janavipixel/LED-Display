/* =====================================================
   SIES GST
   CSE IoT LED DISPLAY MANAGEMENT SYSTEM
   Original Teal-and-White Frontend Controller
===================================================== */

/* =====================================================
   INITIAL DATA & STATE
===================================================== */

let messages = [];

let historyData = [];

let selectedMessageId = null;

let currentPreviewIndex = 0;

let previewTimer = null;

let authToken = localStorage.getItem("sies_gst_led_auth_token") || null;

/* =====================================================
   DOM ELEMENTS
===================================================== */

const loginScreen = document.getElementById("loginScreen");

const mainApp = document.getElementById("mainApp");

const loginForm = document.getElementById("loginForm");

const loginMessage = document.getElementById("loginMessage");

const logoutBtn = document.getElementById("logoutBtn");

const messageList = document.getElementById("messageList");

const messageForm = document.getElementById("messageForm");

const emptyEditor = document.getElementById("emptyEditor");

const messageText = document.getElementById("messageText");

const messageEffect = document.getElementById("messageEffect");

const messageDuration = document.getElementById("messageDuration");

const characterCount = document.getElementById("characterCount");

const deleteMessageBtn = document.getElementById("deleteMessageBtn");

const addMessageBtn = document.getElementById("addMessageBtn");

const ledMessage = document.getElementById("ledMessage");

const previewMessage = document.getElementById("previewMessage");

const previewEffect = document.getElementById("previewEffect");

const displayCounter = document.getElementById("displayCounter");

const historyList = document.getElementById("historyList");

const activityList = document.getElementById("activityList");

const totalMessages = document.getElementById("totalMessages");

const activeMessages = document.getElementById("activeMessages");

const queuedMessages = document.getElementById("queuedMessages");

const messageCountBadge = document.getElementById("messageCountBadge");

/* Pagination & View State */
let messagesLimit = 5;
let isMessagesExpanded = false;

let historyLimit = 5;
let isHistoryExpanded = false;

const messageListStatus = document.getElementById("messageListStatus");
const loadMoreMessagesBtn = document.getElementById("loadMoreMessagesBtn");
const toggleMessagesViewBtn = document.getElementById("toggleMessagesViewBtn");

const historyStatusBadge = document.getElementById("historyStatusBadge");
const loadMoreHistoryBtn = document.getElementById("loadMoreHistoryBtn");
const toggleHistoryViewBtn = document.getElementById("toggleHistoryViewBtn");

/* =====================================================
   LOGIN
===================================================== */

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    /*
     * Email must end with @sies.edu.in
     */
    const emailPattern = /^[^\s@]+@sies\.edu\.in$/i;

    if (!emailPattern.test(email)) {
        loginMessage.textContent = "Please use a valid SIES email ending with @sies.edu.in.";
        return;
    }

    if (!password || password.length < 6) {
        loginMessage.textContent = "Password must be at least 6 characters.";
        return;
    }

    loginMessage.textContent = "Authenticating...";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            loginMessage.textContent = data.error || "Invalid credentials.";
            return;
        }

        // Store authentication token
        authToken = data.token;
        if (authToken) {
            localStorage.setItem("sies_gst_led_auth_token", authToken);
        }

        loginMessage.textContent = "";
        loginScreen.classList.add("hidden");
        mainApp.classList.remove("hidden");

        await initializeApplication();
    } catch (error) {
        console.error("Login request error:", error);
        loginMessage.textContent = "Unable to connect to server. Please try again.";
    }
});

/* =====================================================
   LOGOUT
===================================================== */

logoutBtn.addEventListener("click", function () {
    authToken = null;
    localStorage.removeItem("sies_gst_led_auth_token");

    mainApp.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    loginForm.reset();
    loginMessage.textContent = "";

    clearTimeout(previewTimer);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

/* =====================================================
   DATA FETCHING (CONNECTS TO EXPRESS BACKEND)
===================================================== */

async function loadMessages() {
    try {
        const headers = {};
        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch("/api/messages", { headers });

        if (!response.ok) {
            throw new Error("Could not load messages from server");
        }

        const result = await response.json();
        const data = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);

        messages = data.map((item) => ({
            id: item._id || item.id,
            text: String(item.text !== undefined ? item.text : item.message),
            effect: item.effect || "static",
            duration: Number(item.duration) || 10,
            status: item.status === "active" ? "Active" : (item.status === "queued" ? "Queued" : "Active")
        }));
    } catch (error) {
        console.error("Error loading messages:", error);
    }
}

async function loadHistory() {
    try {
        const headers = {};
        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch("/api/activity", { headers });

        if (response.ok) {
            const result = await response.json();
            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                historyData = result.data.map(item => {
                    const dateObj = new Date(item.timestamp || item.createdAt || Date.now());
                    return {
                        date: dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
                        time: dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                        action: item.action === "CREATED" ? "Added" : (item.action === "UPDATED" ? "Edited" : (item.action === "DELETED" ? "Deleted" : item.action)),
                        message: item.messageText || item.details || "—",
                        effect: formatEffect(item.effect || "static"),
                        status: item.action === "DELETED" ? "Removed" : "Displayed"
                    };
                });
            }
        }
    } catch (err) {
        console.error("Error loading history:", err);
    }
}

/* =====================================================
   INITIALIZE
===================================================== */

async function initializeApplication() {
    await loadMessages();
    await loadHistory();

    renderMessages();
    renderHistory();
    renderActivity();
    updateStats();
    startPreview();
}

/* =====================================================
   RENDER MESSAGE LIST
===================================================== */

function renderMessages() {
    messageList.innerHTML = "";

    const totalCount = messages.length;
    const currentLimit = isMessagesExpanded ? totalCount : messagesLimit;
    const countToShow = Math.min(currentLimit, totalCount);
    const visibleMessages = messages.slice(0, countToShow);

    visibleMessages.forEach(function (message, index) {
        const card = document.createElement("div");

        card.className = "message-card";

        if (selectedMessageId === message.id) {
            card.classList.add("selected");
        }

        const actualIndex = messages.findIndex(m => m.id === message.id);
        const displayIndex = actualIndex >= 0 ? actualIndex + 1 : index + 1;

        card.innerHTML = `
            <div class="message-card-top">
                <span class="message-number">
                    MESSAGE ${displayIndex}
                </span>
                <span class="message-card-effect">
                    ${formatEffect(message.effect)}
                </span>
            </div>
            <h4>
                ${escapeHTML(message.text)}
            </h4>
            <div class="message-card-bottom">
                <span>
                    ${message.duration}s display
                </span>
                <span>
                    ${message.status}
                </span>
            </div>
        `;

        card.addEventListener("click", function () {
            selectMessage(message.id);
        });

        messageList.appendChild(card);
    });

    // Update Header Badge
    if (messageCountBadge) {
        if (totalCount <= 5 || isMessagesExpanded || countToShow >= totalCount) {
            messageCountBadge.textContent = totalCount + (totalCount === 1 ? " message" : " messages");
        } else {
            messageCountBadge.textContent = `${countToShow} of ${totalCount} messages`;
        }
    }

    // Update message controls
    const messagePaginationControls = document.getElementById("messagePaginationControls");
    if (messagePaginationControls) {
        if (totalCount <= 5) {
            messagePaginationControls.style.display = "none";
        } else {
            messagePaginationControls.style.display = "flex";
            if (messageListStatus) {
                if (isMessagesExpanded || countToShow >= totalCount) {
                    messageListStatus.textContent = `Showing all ${totalCount} messages`;
                } else {
                    messageListStatus.textContent = `Showing ${countToShow} of ${totalCount} messages`;
                }
            }

            if (toggleMessagesViewBtn) {
                toggleMessagesViewBtn.textContent = (isMessagesExpanded || countToShow >= totalCount) ? "Show Default (5)" : `View All (${totalCount})`;
            }

            if (loadMoreMessagesBtn) {
                loadMoreMessagesBtn.style.display = (isMessagesExpanded || countToShow >= totalCount) ? "none" : "inline-block";
            }
        }
    }
}

/* =====================================================
   SELECT MESSAGE
===================================================== */

function selectMessage(id) {
    selectedMessageId = id;

    const message = messages.find(item => item.id === id);

    if (!message) {
        return;
    }

    emptyEditor.classList.add("hidden");
    messageForm.classList.remove("hidden");

    messageText.value = message.text;
    messageEffect.value = message.effect;
    messageDuration.value = String(message.duration);

    updateCharacterCount();
    renderMessages();
}

/* =====================================================
   ADD MESSAGE
===================================================== */

addMessageBtn.addEventListener("click", function () {
    const newId = Date.now();

    const newMessage = {
        id: newId,
        text: "New college announcement",
        effect: "scroll-left",
        duration: 10,
        status: "Active"
    };

    messages.unshift(newMessage);

    selectedMessageId = newId;

    selectMessage(newId);

    renderHistory();
    renderActivity();
    updateStats();
    restartPreview();

    const workspaceEl = document.getElementById("workspace");
    if (workspaceEl) {
        workspaceEl.scrollIntoView({ behavior: "smooth" });
    }
});

/* =====================================================
   SAVE MESSAGE
===================================================== */

messageForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const textVal = messageText.value.trim();
    const effectVal = messageEffect.value;
    const durationVal = Number(messageDuration.value);

    const messageData = {
        text: textVal,
        message: textVal,
        effect: effectVal,
        duration: durationVal,
        status: "active"
    };

    const headers = {
        "Content-Type": "application/json"
    };
    if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
    }

    try {
        const isExistingInDb = typeof selectedMessageId === "string" && selectedMessageId.length === 24;

        if (isExistingInDb) {
            // EDIT EXISTING RECORD
            const response = await fetch(`/api/messages/${selectedMessageId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(messageData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Update failed");
            }

            addHistory("Edited", textVal, effectVal);
        } else {
            // ADD NEW RECORD
            const response = await fetch("/api/messages", {
                method: "POST",
                headers,
                body: JSON.stringify(messageData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Save failed");
            }

            addHistory("Added", textVal, effectVal);
        }

        await loadMessages();
        await loadHistory();

        isMessagesExpanded = false;
        messagesLimit = 5;

        renderMessages();
        renderHistory();
        renderActivity();
        updateStats();
        restartPreview();

        alert("Message saved successfully.");
    } catch (error) {
        console.error("Save error:", error);
        alert("Could not save message: " + (error.message || "Error"));
    }
});

/* =====================================================
   DELETE MESSAGE
===================================================== */

deleteMessageBtn.addEventListener("click", async function () {
    if (selectedMessageId === null) {
        return;
    }

    const message = messages.find(item => item.id === selectedMessageId);

    if (!message) {
        return;
    }

    const shouldDelete = confirm("Delete this display message?");

    if (!shouldDelete) {
        return;
    }

    try {
        const isExistingInDb = typeof selectedMessageId === "string" && selectedMessageId.length === 24;

        if (isExistingInDb) {
            const headers = {};
            if (authToken) {
                headers["Authorization"] = `Bearer ${authToken}`;
            }

            const response = await fetch(`/api/messages/${selectedMessageId}`, {
                method: "DELETE",
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Delete failed");
            }
        }

        addHistory("Deleted", message.text, message.effect);

        selectedMessageId = null;

        messageForm.classList.add("hidden");
        emptyEditor.classList.remove("hidden");

        await loadMessages();
        await loadHistory();

        renderMessages();
        renderHistory();
        renderActivity();
        updateStats();
        restartPreview();

        alert("Message deleted successfully.");
    } catch (error) {
        console.error("Delete error:", error);
        alert("Could not delete message: " + (error.message || "Error"));
    }
});

/* =====================================================
   CHARACTER COUNT
===================================================== */

messageText.addEventListener("input", updateCharacterCount);

function updateCharacterCount() {
    characterCount.textContent = messageText.value.length + " / 100";
}

/* =====================================================
   PREVIEW
===================================================== */

function startPreview() {
    clearTimeout(previewTimer);

    if (messages.length === 0) {
        showEmptyPreview();
        return;
    }

    currentPreviewIndex = 0;
    showPreviewMessage();
}

function restartPreview() {
    clearTimeout(previewTimer);

    if (messages.length === 0) {
        showEmptyPreview();
        return;
    }

    currentPreviewIndex = 0;
    showPreviewMessage();
}

/* =====================================================
   SHOW PREVIEW MESSAGE
===================================================== */

function showPreviewMessage() {
    if (messages.length === 0) {
        showEmptyPreview();
        return;
    }

    const message = messages[currentPreviewIndex];

    if (!message) {
        return;
    }

    // Reset animation
    ledMessage.className = "led-message";
    ledMessage.style.animationDuration = "";
    ledMessage.style.removeProperty("--message-width");

    // Force reflow
    void ledMessage.offsetWidth;

    // Set text
    ledMessage.textContent = message.text;
    previewMessage.textContent = message.text;
    previewEffect.textContent = formatEffect(message.effect);
    displayCounter.textContent = (currentPreviewIndex + 1) + " / " + messages.length;

    // Add effect class
    ledMessage.classList.add(message.effect);

    requestAnimationFrame(function () {
        const screen = document.querySelector(".led-screen");
        if (!screen) return;

        const screenWidth = screen.clientWidth;
        const textWidth = ledMessage.scrollWidth;

        let displayTime;

        if (message.effect === "static" || message.effect === "blink") {
            displayTime = Math.max(Number(message.duration) * 1000, 4000);
        } else if (message.effect === "scroll-left" || message.effect === "scroll-right") {
            const distance = screenWidth + textWidth;
            const speed = window.innerWidth <= 600 ? 35 : 70;
            const animationTime = (distance / speed) * 1000;

            ledMessage.style.setProperty("--message-width", textWidth + "px");
            ledMessage.style.animationDuration = animationTime + "ms";

            displayTime = animationTime + 1000;
        } else {
            displayTime = Math.max(Number(message.duration) * 1000, 4000);
        }

        previewTimer = setTimeout(function () {
            if (messages.length === 0) return;
            currentPreviewIndex++;
            if (currentPreviewIndex >= messages.length) {
                currentPreviewIndex = 0;
            }
            showPreviewMessage();
        }, displayTime);
    });
}

/* =====================================================
   EMPTY PREVIEW
===================================================== */

function showEmptyPreview() {
    clearTimeout(previewTimer);

    ledMessage.className = "led-message static";
    ledMessage.style.animationDuration = "";
    ledMessage.textContent = "No messages available";

    previewMessage.textContent = "No messages available";
    previewEffect.textContent = "Static";
    displayCounter.textContent = "0 / 0";
}

/* =====================================================
   HISTORY
===================================================== */

function addHistory(action, message, effect) {
    const now = new Date();
    const date = now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
    const time = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });

    historyData.unshift({
        date: date,
        time: time,
        action: action,
        message: message,
        effect: formatEffect(effect),
        status: action === "Deleted" ? "Removed" : "Displayed"
    });

    if (historyData.length > 30) {
        historyData.pop();
    }
}

/* =====================================================
   RENDER HISTORY
===================================================== */

function renderHistory() {
    historyList.innerHTML = "";

    const historyPaginationControls = document.getElementById("historyPaginationControls");

    if (historyData.length === 0) {
        historyList.innerHTML = `
            <div class="history-row">
                <span>No history</span>
                <span>—</span>
                <span>—</span>
                <span>No changes recorded yet.</span>
                <span>—</span>
                <span>—</span>
            </div>
        `;
        if (historyPaginationControls) historyPaginationControls.style.display = "none";
        return;
    }

    const totalCount = historyData.length;
    const currentLimit = isHistoryExpanded ? totalCount : historyLimit;
    const countToShow = Math.min(currentLimit, totalCount);
    const visibleHistory = historyData.slice(0, countToShow);

    visibleHistory.forEach(function (item) {
        const row = document.createElement("div");
        row.className = "history-row";

        let actionClass = "action-edited";
        if (item.action === "Added") actionClass = "action-added";
        if (item.action === "Deleted") actionClass = "action-deleted";

        row.innerHTML = `
            <span>${item.date}</span>
            <span>${item.time}</span>
            <span class="${actionClass}">${item.action}</span>
            <span><strong>${escapeHTML(item.message)}</strong></span>
            <span>${item.effect}</span>
            <span>${item.status}</span>
        `;

        historyList.appendChild(row);
    });

    if (historyPaginationControls) {
        if (totalCount <= 5) {
            historyPaginationControls.style.display = "none";
        } else {
            historyPaginationControls.style.display = "flex";
            if (historyStatusBadge) {
                if (isHistoryExpanded || countToShow >= totalCount) {
                    historyStatusBadge.textContent = `Showing all ${totalCount} records`;
                } else {
                    historyStatusBadge.textContent = `Showing ${countToShow} of ${totalCount} most recent`;
                }
            }

            if (toggleHistoryViewBtn) {
                toggleHistoryViewBtn.textContent = (isHistoryExpanded || countToShow >= totalCount) ? "Show Recent (5)" : `View All (${totalCount})`;
            }

            if (loadMoreHistoryBtn) {
                loadMoreHistoryBtn.style.display = (isHistoryExpanded || countToShow >= totalCount) ? "none" : "inline-block";
            }
        }
    }
}

/* =====================================================
   LATEST ACTIVITY
===================================================== */

function renderActivity() {
    activityList.innerHTML = "";

    const total = messages.length;
    const active = messages.filter(item => item.status === "Active").length;
    const added = historyData.filter(item => item.action === "Added").length;
    const edited = historyData.filter(item => item.action === "Edited" || item.action === "Updated").length;
    const deleted = historyData.filter(item => item.action === "Deleted").length;

    let lastUpdated = "No updates yet";
    if (historyData.length > 0) {
        lastUpdated = historyData[0].date + " • " + historyData[0].time;
    }

    activityList.innerHTML = `
        <div class="activity-item">
            <div class="activity-content">
                <h3>Total Notices</h3>
                <p>Notices currently stored</p>
            </div>
            <div class="activity-status active-status">
                ${total}
            </div>
        </div>

        <div class="activity-item">
            <div class="activity-content">
                <h3>Active Notices</h3>
                <p>Currently active on display</p>
            </div>
            <div class="activity-status active-status">
                ${active}
            </div>
        </div>

        <div class="activity-item">
            <div class="activity-content">
                <h3>Added</h3>
                <p>Notices added</p>
            </div>
            <div class="activity-status active-status">
                ${added}
            </div>
        </div>

        <div class="activity-item">
            <div class="activity-content">
                <h3>Updated</h3>
                <p>Notices edited or updated</p>
            </div>
            <div class="activity-status active-status">
                ${edited}
            </div>
        </div>

        <div class="activity-item">
            <div class="activity-content">
                <h3>Deleted</h3>
                <p>Notices removed</p>
            </div>
            <div class="activity-status active-status">
                ${deleted}
            </div>
        </div>

        <div class="activity-item">
            <div class="activity-content">
                <h3>Last Updated</h3>
                <p>Most recent display change</p>
            </div>
            <div class="activity-time">
                ${lastUpdated}
            </div>
        </div>
    `;
}

/* =====================================================
   STATISTICS
===================================================== */

function updateStats() {
    totalMessages.textContent = messages.length;
    activeMessages.textContent = messages.filter(item => item.status === "Active").length;
    queuedMessages.textContent = Math.max(messages.length - 1, 0);
    historyCount.textContent = historyData.length;
}

/* =====================================================
   FORMAT EFFECT
===================================================== */

function formatEffect(effect) {
    const names = {
        "static": "Static",
        "scroll-left": "Scroll Left",
        "scroll-right": "Scroll Right",
        "slide-left": "Slide Left",
        "slide-right": "Slide Right",
        "blink": "Blink"
    };
    return names[effect] || "Static";
}

/* =====================================================
   SHORT ACTION
===================================================== */

function getActionShort(action) {
    if (action === "Added") return "ADD";
    if (action === "Deleted") return "DEL";
    return "EDIT";
}

/* =====================================================
   HTML SAFETY
===================================================== */

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/* =====================================================
   NAVBAR ACTIVE STATE
===================================================== */

const navLinks = document.querySelectorAll("nav a");
const sections = document.querySelectorAll("main section[id]");

window.addEventListener("scroll", function () {
    let current = "home";

    sections.forEach(function (section) {
        const sectionTop = section.offsetTop - 170;
        if (window.scrollY >= sectionTop) {
            current = section.id;
        }
    });

    navLinks.forEach(function (link) {
        link.classList.remove("active-nav");
        const target = link.getAttribute("href");
        if (target === "#" + current) {
            link.classList.add("active-nav");
        }
    });
});

/* =====================================================
   NAVBAR CLICK POSITION
===================================================== */

navLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
        const targetId = link.getAttribute("href");
        const target = document.querySelector(targetId);

        if (!target) return;

        event.preventDefault();

        const navbar = document.querySelector(".topbar");
        const navbarHeight = navbar ? navbar.offsetHeight : 70;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 10;

        window.scrollTo({
            top: targetPosition,
            behavior: "smooth"
        });
    });
});

/* =====================================================
   PAGINATION & VIEW ALL EVENT LISTENERS
===================================================== */

if (toggleMessagesViewBtn) {
    toggleMessagesViewBtn.addEventListener("click", function () {
        isMessagesExpanded = !isMessagesExpanded;
        if (!isMessagesExpanded) {
            messagesLimit = 5;
        }
        renderMessages();
    });
}

if (loadMoreMessagesBtn) {
    loadMoreMessagesBtn.addEventListener("click", function () {
        messagesLimit += 5;
        if (messagesLimit >= messages.length) {
            isMessagesExpanded = true;
        }
        renderMessages();
    });
}

if (toggleHistoryViewBtn) {
    toggleHistoryViewBtn.addEventListener("click", function () {
        isHistoryExpanded = !isHistoryExpanded;
        if (!isHistoryExpanded) {
            historyLimit = 5;
        }
        renderHistory();
    });
}

if (loadMoreHistoryBtn) {
    loadMoreHistoryBtn.addEventListener("click", function () {
        historyLimit += 5;
        if (historyLimit >= historyData.length) {
            isHistoryExpanded = true;
        }
        renderHistory();
    });
}
