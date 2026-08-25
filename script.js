/* =====================================================
   SIES GST
   CSE IoT LED DISPLAY MANAGEMENT SYSTEM
===================================================== */


/* =====================================================
   INITIAL DATA
===================================================== */

let messages = [

    {
        id: 1,
        text: "Congratulations to all CSE IoT achievers!",
        effect: "scroll-left",
        duration: 10,
        status: "Active"
    },

    {
        id: 2,
        text: "Internal Assessment schedule has been updated.",
        effect: "static",
        duration: 10,
        status: "Active"
    },

    {
        id: 3,
        text: "All students are required to check the latest notice.",
        effect: "scroll-left",
        duration: 10,
        status: "Active"
    }

];


let historyData = [

    {
        date: "21 Aug 2026",
        time: "10:30 AM",
        action: "Added",
        message: "Congratulations to all CSE IoT achievers!",
        effect: "Scroll Left",
        status: "Displayed"
    },

    {
        date: "21 Aug 2026",
        time: "11:05 AM",
        action: "Edited",
        message: "Internal Assessment schedule has been updated.",
        effect: "Static",
        status: "Displayed"
    }

];


let selectedMessageId = null;

let currentPreviewIndex = 0;

let previewTimer = null;



/* =====================================================
   DOM ELEMENTS
===================================================== */

const loginScreen =
    document.getElementById("loginScreen");

const mainApp =
    document.getElementById("mainApp");

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const logoutBtn =
    document.getElementById("logoutBtn");

const messageList =
    document.getElementById("messageList");

const messageForm =
    document.getElementById("messageForm");

const emptyEditor =
    document.getElementById("emptyEditor");

const messageText =
    document.getElementById("messageText");

const messageEffect =
    document.getElementById("messageEffect");

const messageDuration =
    document.getElementById("messageDuration");

const characterCount =
    document.getElementById("characterCount");

const deleteMessageBtn =
    document.getElementById("deleteMessageBtn");

const addMessageBtn =
    document.getElementById("addMessageBtn");

const ledMessage =
    document.getElementById("ledMessage");

const previewMessage =
    document.getElementById("previewMessage");

const previewEffect =
    document.getElementById("previewEffect");

const displayCounter =
    document.getElementById("displayCounter");

const historyList =
    document.getElementById("historyList");

const activityList =
    document.getElementById("activityList");

const totalMessages =
    document.getElementById("totalMessages");

const activeMessages =
    document.getElementById("activeMessages");

const queuedMessages =
    document.getElementById("queuedMessages");

const historyCount =
    document.getElementById("historyCount");

const messageCountBadge =
    document.getElementById("messageCountBadge");



/* =====================================================
   LOGIN VALIDATION
===================================================== */

loginForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        /*
         * Email must end with @SIES.edu.in
         */

        const emailPattern =
            /^[^\s@]+@sies\.edu\.in$/;


        /*
         * Password:
         *
         * Exactly 8 characters
         * At least one uppercase
         * At least one lowercase
         * At least one number
         * At least one special character
         */

        const passwordPattern =
            /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8}$/;


        if (!emailPattern.test(email)) {

            loginMessage.textContent =
                "Please use a valid SIES email ending with @SIES.edu.in.";

            return;
        }


        if (!passwordPattern.test(password)) {

            loginMessage.textContent =
                "Password must be exactly 8 characters and contain uppercase, lowercase, number and special character.";

            return;
        }


        /*
         * Prototype login.
         *
         * Backend authentication will be connected later.
         */

        loginMessage.textContent = "";


        loginScreen.classList.add("hidden");

        mainApp.classList.remove("hidden");


        initializeApplication();

    }
);



/* =====================================================
   LOGOUT
===================================================== */

logoutBtn.addEventListener(
    "click",
    function () {

        mainApp.classList.add("hidden");

        loginScreen.classList.remove("hidden");

        loginForm.reset();

        loginMessage.textContent = "";

        clearTimeout(previewTimer);


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }
);



/* =====================================================
   INITIALIZE
===================================================== */

function initializeApplication() {

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


    messages.forEach(
        function (message, index) {


            const card =
                document.createElement("div");


            card.className =
                "message-card";


            if (
                selectedMessageId === message.id
            ) {

                card.classList.add("selected");

            }


            card.innerHTML = `

                <div class="message-card-top">

                    <span class="message-number">
                        MESSAGE ${index + 1}
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


            card.addEventListener(
                "click",
                function () {

                    selectMessage(message.id);

                }
            );


            messageList.appendChild(card);

        }
    );


    messageCountBadge.textContent =
        messages.length +
        (
            messages.length === 1
                ? " message"
                : " messages"
        );

}



/* =====================================================
   SELECT MESSAGE
===================================================== */

function selectMessage(id) {

    selectedMessageId = id;


    const message =
        messages.find(
            item =>
                item.id === id
        );


    if (!message) {

        return;

    }


    emptyEditor.classList.add("hidden");

    messageForm.classList.remove("hidden");


    messageText.value =
        message.text;


    messageEffect.value =
        message.effect;


    messageDuration.value =
        message.duration;


    updateCharacterCount();

    renderMessages();

}



/* =====================================================
   ADD MESSAGE
===================================================== */

addMessageBtn.addEventListener(
    "click",
    function () {


        const newId =
            Date.now();


        const newMessage = {

            id: newId,

            text:
                "New college announcement",

            effect:
                "scroll-left",

            duration:
                10,

            status:
                "Active"

        };


        messages.push(newMessage);


        selectedMessageId =
            newId;


        addHistory(
            "Added",
            newMessage.text,
            newMessage.effect
        );


        selectMessage(newId);

        renderHistory();

        renderActivity();

        updateStats();

        restartPreview();


        document
            .getElementById("workspace")
            .scrollIntoView({

                behavior:
                    "smooth"

            });

    }
);



/* =====================================================
   SAVE MESSAGE
===================================================== */

messageForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();
    
        const backendResponse = await fetch("http://localhost:5000/api/messages", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        message: messageText.value.trim()
    })
});

const backendData = await backendResponse.json();

console.log("Backend Response:", backendData);

        if (
            selectedMessageId === null
        ) {

            return;

        }


        const message =
            messages.find(
                item =>
                    item.id === selectedMessageId
            );


        if (!message) {

            return;

        }


        const oldText =
            message.text;


        message.text =
            messageText.value.trim();


        message.effect =
            messageEffect.value;


        message.duration =
            Number(messageDuration.value);


        message.status =
            "Active";


        const action =
            oldText === message.text
                ? "Edited"
                : "Updated";


        addHistory(
            action,
            message.text,
            message.effect
        );


        renderMessages();

        renderHistory();

        renderActivity();

        updateStats();

        restartPreview();


        alert(
            "Message saved successfully."
        );

    }
);



/* =====================================================
   DELETE MESSAGE
===================================================== */

deleteMessageBtn.addEventListener(
    "click",
    function () {


        if (
            selectedMessageId === null
        ) {

            return;

        }


        const message =
            messages.find(
                item =>
                    item.id === selectedMessageId
            );


        if (!message) {

            return;

        }


        const shouldDelete =
            confirm(
                "Delete this display message?"
            );


        if (!shouldDelete) {

            return;

        }


        addHistory(
            "Deleted",
            message.text,
            message.effect
        );


        messages =
            messages.filter(
                item =>
                    item.id !== selectedMessageId
            );


        selectedMessageId =
            null;


        messageForm.classList.add("hidden");

        emptyEditor.classList.remove("hidden");


        renderMessages();

        renderHistory();

        renderActivity();

        updateStats();

        restartPreview();

    }
);



/* =====================================================
   CHARACTER COUNT
===================================================== */

messageText.addEventListener(
    "input",
    updateCharacterCount
);


function updateCharacterCount() {

    characterCount.textContent =
        messageText.value.length +
        " / 100";

}



/* =====================================================
   PREVIEW
===================================================== */

function startPreview() {

    clearTimeout(previewTimer);


    if (
        messages.length === 0
    ) {

        showEmptyPreview();

        return;

    }


    currentPreviewIndex =
        0;


    showPreviewMessage();

}



function restartPreview() {

    clearTimeout(previewTimer);


    if (
        messages.length === 0
    ) {

        showEmptyPreview();

        return;

    }


    currentPreviewIndex =
        0;


    showPreviewMessage();

}



/* =====================================================
   SHOW PREVIEW MESSAGE
===================================================== */

function showPreviewMessage() {


    if (
        messages.length === 0
    ) {

        showEmptyPreview();

        return;

    }


    const message =
        messages[currentPreviewIndex];


    if (!message) {

        return;

    }


    /*
     * Reset animation
     */

    ledMessage.className =
        "led-message";


    ledMessage.style.animationDuration =
        "";


    ledMessage.style.removeProperty(
        "--message-width"
    );


    /*
     * Force browser to restart animation
     */

    void ledMessage.offsetWidth;


    /*
     * Set text
     */

    ledMessage.textContent =
        message.text;


    previewMessage.textContent =
        message.text;


    previewEffect.textContent =
        formatEffect(
            message.effect
        );


    displayCounter.textContent =
        (
            currentPreviewIndex + 1
        ) +
        " / " +
        messages.length;


    /*
     * Add effect
     */

    ledMessage.classList.add(
        message.effect
    );


    /*
     * Wait until browser calculates
     * the actual text dimensions.
     */

    requestAnimationFrame(
        function () {


            const screen =
                document.querySelector(
                    ".led-screen"
                );


            if (!screen) {

                return;

            }


            const screenWidth =
                screen.clientWidth;


            const textWidth =
                ledMessage.scrollWidth;


            let displayTime;



            /* =========================================
               STATIC
            ========================================= */

            if (
                message.effect === "static"
            ) {


                /*
                 * Static message remains visible
                 * for the selected duration.
                 */

                displayTime =
                    Math.max(
                        Number(message.duration) *
                        1000,

                        5000
                    );


            }



            /* =========================================
               BLINK
            ========================================= */

            else if (
                message.effect === "blink"
            ) {


                displayTime =
                    Math.max(
                        Number(message.duration) *
                        1000,

                        5000
                    );


            }



            /* =========================================
               SCROLL LEFT / RIGHT
            ========================================= */

            else if (

                message.effect ===
                    "scroll-left"

                ||

                message.effect ===
                    "scroll-right"

            ) {


                /*
                 * Complete distance:
                 *
                 * screen width
                 * +
                 * complete text width
                 */

                const distance =
                    screenWidth +
                    textWidth;


                /*
                 * Mobile = slower
                 * Desktop = slightly faster
                 */

                const speed =
                    window.innerWidth <= 600
                        ? 35
                        : 70;


                const animationTime =
                    (
                        distance /
                        speed
                    ) * 1000;


                /*
                 * Tell CSS the actual
                 * width of this message.
                 */

                ledMessage.style.setProperty(
                    "--message-width",
                    textWidth + "px"
                );


                /*
                 * Set exact animation duration.
                 */

                ledMessage.style.animationDuration =
                    animationTime + "ms";


                /*
                 * Wait until the entire
                 * message has entered and
                 * completely left the screen.
                 */

                displayTime =
                    animationTime +
                    1200;

            }



            /* =========================================
               SLIDE
            ========================================= */

            else {


                displayTime =
                    Math.max(
                        Number(message.duration) *
                        1000,

                        5000
                    );

            }



            /* =========================================
               NEXT MESSAGE
            ========================================= */

            previewTimer =
                setTimeout(
                    function () {


                        if (
                            messages.length === 0
                        ) {

                            return;

                        }


                        currentPreviewIndex++;


                        if (
                            currentPreviewIndex >=
                            messages.length
                        ) {

                            currentPreviewIndex =
                                0;

                        }


                        showPreviewMessage();


                    },

                    displayTime

                );


        }
    );

}



/* =====================================================
   EMPTY PREVIEW
===================================================== */

function showEmptyPreview() {

    clearTimeout(previewTimer);


    ledMessage.className =
        "led-message static";


    ledMessage.style.animationDuration =
        "";


    ledMessage.textContent =
        "No messages available";


    previewMessage.textContent =
        "No messages available";


    previewEffect.textContent =
        "Static";


    displayCounter.textContent =
        "0 / 0";

}



/* =====================================================
   HISTORY
===================================================== */

function addHistory(
    action,
    message,
    effect
) {


    const now =
        new Date();


    const date =
        now.toLocaleDateString(
            "en-IN",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"
            }
        );


    const time =
        now.toLocaleTimeString(
            "en-IN",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );


    historyData.unshift({

        date:
            date,

        time:
            time,

        action:
            action,

        message:
            message,

        effect:
            formatEffect(effect),

        status:
            action === "Deleted"
                ? "Removed"
                : "Displayed"

    });


    if (
        historyData.length > 30
    ) {

        historyData.pop();

    }

}



/* =====================================================
   RENDER HISTORY
===================================================== */

function renderHistory() {

    historyList.innerHTML = "";


    if (
        historyData.length === 0
    ) {


        historyList.innerHTML = `

            <div class="history-row">

                <span>
                    No history
                </span>

                <span>
                    —
                </span>

                <span>
                    —
                </span>

                <span>
                    No changes recorded yet.
                </span>

                <span>
                    —
                </span>

                <span>
                    —
                </span>

            </div>

        `;


        return;

    }


    historyData.forEach(
        function (item) {


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "history-row";


            let actionClass =
                "action-edited";


            if (
                item.action === "Added"
            ) {

                actionClass =
                    "action-added";

            }


            if (
                item.action === "Deleted"
            ) {

                actionClass =
                    "action-deleted";

            }


            row.innerHTML = `

                <span>
                    ${item.date}
                </span>

                <span>
                    ${item.time}
                </span>

                <span class="${actionClass}">
                    ${item.action}
                </span>

                <span>
                    <strong>
                        ${escapeHTML(item.message)}
                    </strong>
                </span>

                <span>
                    ${item.effect}
                </span>

                <span>
                    ${item.status}
                </span>

            `;


            historyList.appendChild(
                row
            );

        }
    );

}



/* =====================================================
   LATEST ACTIVITY
===================================================== */

function renderActivity() {

    activityList.innerHTML = "";


    const recent =
        historyData.slice(
            0,
            5
        );


    if (
        recent.length === 0
    ) {


        activityList.innerHTML = `

            <div class="activity-item">

                <div class="activity-icon">
                    —
                </div>

                <div class="activity-content">

                    <h3>
                        No recent updates
                    </h3>

                    <p>
                        Display activity will appear here.
                    </p>

                </div>

            </div>

        `;


        return;

    }


    recent.forEach(
        function (item) {


            const activity =
                document.createElement(
                    "div"
                );


            activity.className =
                "activity-item";


            activity.innerHTML = `

                <div class="activity-icon">
                    ${getActionShort(item.action)}
                </div>

                <div class="activity-content">

                    <h3>
                        ${escapeHTML(item.message)}
                    </h3>

                    <p>
                        ${item.action} •
                        ${item.effect}
                    </p>

                </div>

                <div class="activity-time">

                    <strong>
                        ${item.time}
                    </strong>

                    <span>
                        ${item.date}
                    </span>

                </div>

                <div class="activity-status active-status">

                    ${item.status}

                </div>

            `;


            activityList.appendChild(
                activity
            );

        }
    );

}



/* =====================================================
   STATISTICS
===================================================== */

function updateStats() {

    totalMessages.textContent =
        messages.length;


    activeMessages.textContent =
        messages.filter(
            item =>
                item.status === "Active"
        ).length;


    queuedMessages.textContent =
        Math.max(
            messages.length - 1,
            0
        );


    historyCount.textContent =
        historyData.length;

}



/* =====================================================
   FORMAT EFFECT
===================================================== */

function formatEffect(effect) {

    const names = {

        "static":
            "Static",

        "scroll-left":
            "Scroll Left",

        "scroll-right":
            "Scroll Right",

        "slide-left":
            "Slide Left",

        "slide-right":
            "Slide Right",

        "blink":
            "Blink"

    };


    return names[effect] ||
        "Static";

}



/* =====================================================
   SHORT ACTION
===================================================== */

function getActionShort(action) {

    if (
        action === "Added"
    ) {

        return "ADD";

    }


    if (
        action === "Deleted"
    ) {

        return "DEL";

    }


    return "EDIT";

}



/* =====================================================
   HTML SAFETY
===================================================== */

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}



/* =====================================================
   NAVBAR ACTIVE STATE
===================================================== */

const navLinks =
    document.querySelectorAll(
        "nav a"
    );


const sections =
    document.querySelectorAll(
        "main section[id]"
    );


window.addEventListener(
    "scroll",
    function () {


        let current =
            "home";


        sections.forEach(
            function (section) {


                const sectionTop =
                    section.offsetTop -
                    170;


                if (
                    window.scrollY >=
                    sectionTop
                ) {

                    current =
                        section.id;

                }

            }
        );


        navLinks.forEach(
            function (link) {


                link.classList.remove(
                    "active-nav"
                );


                const target =
                    link.getAttribute(
                        "href"
                    );


                if (
                    target ===
                    "#" + current
                ) {

                    link.classList.add(
                        "active-nav"
                    );

                }

            }
        );

    }
);



/* =====================================================
   NAVBAR CLICK POSITION
===================================================== */

navLinks.forEach(
    function (link) {


        link.addEventListener(
            "click",
            async function (event) {


                const targetId =
                    link.getAttribute(
                        "href"
                    );


                const target =
                    document.querySelector(
                        targetId
                    );


                if (!target) {

                    return;

                }


                event.preventDefault();

                const backendResponse = await fetch("http://localhost:5000/api/messages", {
                    method: "POST",
                    headers: {
                         "Content-Type": "application/json"
                            },
                    body: JSON.stringify({
                    message: messageText.value.trim()
                }) 
            });

const backendData = await backendResponse.json();

console.log("Backend Response:", backendData);
                const navbar =
                    document.querySelector(
                        ".topbar"
                    );


                const navbarHeight =
                    navbar.offsetHeight;


                const targetPosition =
                    target
                        .getBoundingClientRect()
                        .top
                    +
                    window.pageYOffset
                    -
                    navbarHeight
                    -
                    10;


                window.scrollTo({

                    top:
                        targetPosition,

                    behavior:
                        "smooth"

                });

            }
        );

    }
);
