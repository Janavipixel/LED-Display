/* =========================
   LOGIN
========================= */

const loginScreen =
    document.getElementById("loginScreen");

const mainApp =
    document.getElementById("mainApp");

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");


loginForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const username =
            document.getElementById("username")
                .value
                .trim();

        const password =
            document.getElementById("password")
                .value
                .trim();


        if (
            username === "" ||
            password === ""
        ) {

            loginMessage.textContent =
                "Please enter your user ID and password.";

            return;
        }


        loginMessage.textContent = "";

        loginScreen.classList.add("hidden");

        mainApp.classList.remove("hidden");

        window.scrollTo(0, 0);

    }
);


/* =========================
   LOGOUT
========================= */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        function () {

            mainApp.classList.add("hidden");

            loginScreen.classList.remove("hidden");

            document.getElementById("username").value = "";

            document.getElementById("password").value = "";

            window.scrollTo(0, 0);

        }
    );


/* =========================
   MESSAGE DATA
========================= */

let messages = [

    {
        id: 1,
        category: "topper",
        text: "CONGRATULATIONS TO OUR TOPPERS",
        effect: "scroll-left",
        duration: 5,
        priority: "normal"
    },

    {
        id: 2,
        category: "event",
        text: "IOT WORKSHOP ON 25 AUGUST",
        effect: "scroll-left",
        duration: 5,
        priority: "normal"
    },

    {
        id: 3,
        category: "notice",
        text: "INTERNAL ASSESSMENT STARTS MONDAY",
        effect: "static",
        duration: 5,
        priority: "high"
    }

];


let selectedMessageIndex = 0;

let displayIndex = 0;

let rotationTimer = null;


/* =========================
   HISTORY DATA
========================= */

let history = [];


/* =========================
   ELEMENTS
========================= */

const messageList =
    document.getElementById("messageList");

const messageEditor =
    document.getElementById("messageEditor");

const emptyEditor =
    document.getElementById("emptyEditor");

const addMessageBtn =
    document.getElementById("addMessageBtn");

const queueCount =
    document.getElementById("queueCount");

const category =
    document.getElementById("category");

const messageInput =
    document.getElementById("message");

const effect =
    document.getElementById("effect");

const duration =
    document.getElementById("duration");

const priority =
    document.getElementById("priority");

const charCount =
    document.getElementById("charCount");

const saveMessageBtn =
    document.getElementById("saveMessageBtn");

const deleteMessageBtn =
    document.getElementById("deleteMessageBtn");

const ledMessage =
    document.getElementById("ledMessage");

const currentMessageNumber =
    document.getElementById("currentMessageNumber");

const totalMessages =
    document.getElementById("totalMessages");

const previewNumber =
    document.getElementById("previewNumber");

const previewEffect =
    document.getElementById("previewEffect");

const historyRows =
    document.getElementById("historyRows");

const messageCount =
    document.getElementById("messageCount");


/* =========================
   DATE + TIME
========================= */

function getDateTime() {

    const now = new Date();

    const date =
        now.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    const time =
        now.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

    return {
        date: date,
        time: time
    };

}


/* =========================
   ADD HISTORY
========================= */

function addHistory(
    action,
    message,
    categoryValue,
    effectValue
) {

    const dateTime =
        getDateTime();


    history.unshift({

        date:
            dateTime.date,

        time:
            dateTime.time,

        action:
            action,

        message:
            message || "No message",

        category:
            categoryName(categoryValue),

        effect:
            effectName(effectValue)

    });


    renderHistory();

}


/* =========================
   CATEGORY NAME
========================= */

function categoryName(value) {

    const names = {

        notice:
            "College Notice",

        topper:
            "Topper / Achievement",

        event:
            "Event / Workshop",

        emergency:
            "Important Alert",

        custom:
            "Custom Message"

    };

    return names[value]
        || "Custom Message";
}


/* =========================
   EFFECT NAME
========================= */

function effectName(value) {

    const names = {

        static:
            "Static",

        "scroll-left":
            "Scroll Left",

        "scroll-right":
            "Scroll Right",

        "slide-left":
            "Slide Left",

        "slide-right":
            "Slide Right",

        blink:
            "Blink"

    };

    return names[value]
        || "Static";
}


/* =========================
   RENDER MESSAGE LIST
========================= */

function renderMessageList() {

    messageList.innerHTML = "";


    messages.forEach(
        function (item, index) {

            const card =
                document.createElement("div");


            card.className =
                "message-card";


            if (
                index === selectedMessageIndex
            ) {

                card.classList.add(
                    "selected"
                );

            }


            card.innerHTML = `

                <div class="message-card-top">

                    <span class="message-number">
                        MESSAGE ${index + 1}
                    </span>

                    <span class="message-card-effect">
                        ${effectName(item.effect)}
                    </span>

                </div>


                <h4>
                    ${item.text || "Empty message"}
                </h4>


                <div class="message-card-bottom">

                    <span>
                        ${categoryName(item.category)}
                    </span>

                    <span>
                        ${item.duration}s
                    </span>

                </div>

            `;


            card.addEventListener(
                "click",
                function () {

                    selectMessage(index);

                }
            );


            messageList.appendChild(card);

        }
    );


    queueCount.textContent =
        `${messages.length} messages`;


    messageCount.textContent =
        String(messages.length)
            .padStart(2, "0");


    totalMessages.textContent =
        messages.length;


    renderLatestUpdates();

}


/* =========================
   SELECT MESSAGE
========================= */

function selectMessage(index) {

    if (!messages[index]) {
        return;
    }


    selectedMessageIndex =
        index;


    const item =
        messages[index];


    emptyEditor.classList.add(
        "hidden"
    );

    messageEditor.classList.remove(
        "hidden"
    );


    category.value =
        item.category;

    messageInput.value =
        item.text;

    effect.value =
        item.effect;

    duration.value =
        item.duration;

    priority.value =
        item.priority;


    updateCharacterCount();

    renderMessageList();

}


/* =========================
   ADD MESSAGE
========================= */

addMessageBtn.addEventListener(
    "click",
    function () {

        const newMessage = {

            id:
                Date.now(),

            category:
                "custom",

            text:
                "NEW DISPLAY MESSAGE",

            effect:
                "scroll-left",

            duration:
                5,

            priority:
                "normal"

        };


        messages.push(
            newMessage
        );


        selectedMessageIndex =
            messages.length - 1;


        addHistory(
            "Added",
            newMessage.text,
            newMessage.category,
            newMessage.effect
        );


        renderMessageList();

        selectMessage(
            selectedMessageIndex
        );


        startDisplayRotation();


        document
            .getElementById("create")
            .scrollIntoView({
                behavior: "smooth"
            });

    }
);


/* =========================
   SAVE / EDIT MESSAGE
========================= */

saveMessageBtn.addEventListener(
    "click",
    function () {

        if (
            !messages[selectedMessageIndex]
        ) {

            return;
        }


        const oldMessage =
            messages[selectedMessageIndex];


        const updatedMessage = {

            ...oldMessage,

            category:
                category.value,

            text:
                messageInput.value.trim()
                || "NEW DISPLAY MESSAGE",

            effect:
                effect.value,

            duration:
                Number(duration.value),

            priority:
                priority.value

        };


        messages[
            selectedMessageIndex
        ] = updatedMessage;


        addHistory(
            "Edited",
            updatedMessage.text,
            updatedMessage.category,
            updatedMessage.effect
        );


        renderMessageList();

        startDisplayRotation();


        saveMessageBtn.textContent =
            "Saved ✓";


        setTimeout(
            function () {

                saveMessageBtn.textContent =
                    "Save Message";

            },
            1200
        );

    }
);


/* =========================
   DELETE MESSAGE
========================= */

deleteMessageBtn.addEventListener(
    "click",
    function () {

        if (
            messages.length === 1
        ) {

            alert(
                "At least one display message is required."
            );

            return;

        }


        const deletedMessage =
            messages[selectedMessageIndex];


        addHistory(
            "Deleted",
            deletedMessage.text,
            deletedMessage.category,
            deletedMessage.effect
        );


        messages.splice(
            selectedMessageIndex,
            1
        );


        if (
            selectedMessageIndex >=
            messages.length
        ) {

            selectedMessageIndex =
                messages.length - 1;

        }


        renderMessageList();

        selectMessage(
            selectedMessageIndex
        );

        startDisplayRotation();

    }
);


/* =========================
   CHARACTER COUNT
========================= */

function updateCharacterCount() {

    charCount.textContent =
        messageInput.value.length;

}


messageInput.addEventListener(
    "input",
    updateCharacterCount
);


/* =========================
   DISPLAY MESSAGE
========================= */

function displayMessage(index) {

    if (
        messages.length === 0
    ) {

        ledMessage.textContent =
            "ADD A MESSAGE";

        return;

    }


    displayIndex =
        index % messages.length;


    const item =
        messages[displayIndex];


    ledMessage.className =
        "led-message";


    ledMessage.classList.add(
        item.effect
    );


    ledMessage.textContent =
        item.text
        || "NO MESSAGE";


    currentMessageNumber.textContent =
        displayIndex + 1;


    totalMessages.textContent =
        messages.length;


    previewNumber.textContent =
        `Message ${displayIndex + 1}`;


    previewEffect.textContent =
        effectName(item.effect);


    ledMessage.style.animation =
        "none";

    void ledMessage.offsetWidth;

    ledMessage.style.animation =
        "";


    startNextRotation(
        item.duration
    );

}


/* =========================
   ROTATION
========================= */

function startNextRotation(seconds) {

    clearTimeout(
        rotationTimer
    );


    rotationTimer =
        setTimeout(
            function () {

                displayIndex++;


                if (
                    displayIndex >=
                    messages.length
                ) {

                    displayIndex = 0;

                }


                displayMessage(
                    displayIndex
                );

            },

            seconds * 1000

        );

}


function startDisplayRotation() {

    clearTimeout(
        rotationTimer
    );


    displayIndex = 0;


    if (
        messages.length > 0
    ) {

        displayMessage(0);

    }

}


/* =========================
   HISTORY TABLE
========================= */

function renderHistory() {

    historyRows.innerHTML = "";


    if (
        history.length === 0
    ) {

        historyRows.innerHTML = `

            <div class="history-empty">

                No changes recorded yet.

            </div>

        `;

        return;

    }


    history.forEach(
        function (item) {

            const row =
                document.createElement("div");


            row.className =
                "history-row";


            let actionClass =
                "action-added";


            if (
                item.action === "Edited"
            ) {

                actionClass =
                    "action-edited";

            }


            if (
                item.action === "Deleted"
            ) {

                actionClass =
                    "action-deleted";

            }


            row.innerHTML = `

                <div>
                    ${item.date}
                </div>


                <div>
                    ${item.time}
                </div>


                <div
                    class="history-action ${actionClass}"
                >
                    ${item.action}
                </div>


                <div>

                    <strong>
                        ${item.message}
                    </strong>

                </div>


                <div>
                    ${item.category}
                </div>


                <div>
                    ${item.effect}
                </div>

            `;


            historyRows.appendChild(
                row
            );

        }
    );

}


/* =========================
   LATEST UPDATES
========================= */

function renderLatestUpdates() {

    /*
       Latest Updates remains a separate
       section and is intentionally not
       replaced by the history table.
    */

}


/* =========================
   DIGITAL CLOCK
========================= */

function updateClock() {

    const now =
        new Date();


    const hours =
        String(
            now.getHours()
        ).padStart(
            2,
            "0"
        );


    const minutes =
        String(
            now.getMinutes()
        ).padStart(
            2,
            "0"
        );


    const seconds =
        String(
            now.getSeconds()
        ).padStart(
            2,
            "0"
        );


    document.getElementById(
        "clock"
    ).textContent =
        `${hours}:${minutes}:${seconds}`;

}


setInterval(
    updateClock,
    1000
);

updateClock();


/* =========================
   INITIAL LOAD
========================= */

renderMessageList();

selectMessage(0);

renderHistory();

startDisplayRotation();