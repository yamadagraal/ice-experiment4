"use strict";

/* ===================================
   画像設定
=================================== */

/*
imagesフォルダの中に、以下の名前で画像を入れてください。

practice01.jpg ～ practice03.jpg
A01.jpg ～ A12.jpg
B01.jpg ～ B12.jpg
*/

const IMAGE_SETS = {
    practice: [
        "images/practice01.jpg",
        "images/practice02.jpg",
        "images/practice03.jpg"
    ],

    // Session 2前の練習でも同じ練習画像を使用
    practice2: [
        "images/practice01.jpg",
        "images/practice02.jpg",
        "images/practice03.jpg"
    ],

    // Version B：Session 1はB画像
    session1: [
        "images/B01.jpg",
        "images/B02.jpg",
        "images/B03.jpg",
        "images/B04.jpg",
        "images/B05.jpg",
        "images/B06.jpg",
        "images/B07.jpg",
        "images/B08.jpg",
        "images/B09.jpg",
        "images/B10.jpg",
        "images/B11.jpg",
        "images/B12.jpg"
    ],

    // Version B：Session 2はA画像
    session2: [
        "images/A01.jpg",
        "images/A02.jpg",
        "images/A03.jpg",
        "images/A04.jpg",
        "images/A05.jpg",
        "images/A06.jpg",
        "images/A07.jpg",
        "images/A08.jpg",
        "images/A09.jpg",
        "images/A10.jpg",
        "images/A11.jpg",
        "images/A12.jpg"
    ]
};


/* ===================================
   実験設定
=================================== */

const EXPERIMENT = {
    LIMIT_TIME: 5,

    SWIPE_DISTANCE: 70,

    SWIPE_DIRECTION: {
    practice: "up",
    practice2: "down",
    session1: "up",
    session2: "down"
}
};


/* ===================================
   HTML要素
=================================== */

const screens = {
    start: document.getElementById("startScreen"),
    instruction: document.getElementById("instructionScreen"),
    experiment: document.getElementById("experimentScreen"),
    message: document.getElementById("messageScreen"),
    finish: document.getElementById("finishScreen")
};

const startButton = document.getElementById("startButton");
const practiceButton = document.getElementById("practiceButton");
const nextButton = document.getElementById("nextButton");

const sessionName = document.getElementById("sessionName");
const progress = document.getElementById("progress");

const timerCircle = document.getElementById("timerCircle");
const timerText = document.getElementById("timer");

const experimentScreen = document.getElementById("experimentScreen");

const imageCard = document.querySelector(".imageCard");
const iceImage = document.getElementById("iceImage");

const likeButton = document.getElementById("likeButton");
const dislikeButton = document.getElementById("dislikeButton");

const guide = document.getElementById("guide");

const messageTitle = document.getElementById("messageTitle");
const messageBody = document.getElementById("messageBody");


/* ===================================
   状態管理
=================================== */

let currentMode = "practice";
let currentIndex = 0;

let answered = false;
let selectedAnswer = null;

let remainingTime = EXPERIMENT.LIMIT_TIME;
let timerId = null;

let touchStartX = 0;
let touchStartY = 0;

let mouseStartX = 0;
let mouseStartY = 0;
let isMouseDown = false;

let nextAction = null;
let isMoving = false;


/* ===================================
   画面切り替え
=================================== */

function showScreen(screenName) {
    Object.values(screens).forEach((screen) => {
        screen.classList.remove("active");
    });

    screens[screenName].classList.add("active");

    const experimentActive = screenName === "experiment";

    document.documentElement.classList.toggle(
        "experiment-mode",
        experimentActive
    );

    document.body.classList.toggle(
        "experiment-mode",
        experimentActive
    );

    if (experimentActive) {
        window.scrollTo(0, 0);
    }
}


/* ===================================
   ボタンイベント
=================================== */

startButton.addEventListener("click", () => {
    showScreen("instruction");
});


practiceButton.addEventListener("click", () => {
    startMode("practice");
});


nextButton.addEventListener("click", () => {
    if (typeof nextAction === "function") {
        nextAction();
    }
});


likeButton.addEventListener("click", () => {
    selectAnswer("like");
});


dislikeButton.addEventListener("click", () => {
    selectAnswer("dislike");
});


/* ===================================
   モード開始
=================================== */

function startMode(mode) {
    currentMode = mode;
    currentIndex = 0;
    isMoving = false;

    showScreen("experiment");
    showCurrentImage();
}


/* ===================================
   画像表示
=================================== */

function showCurrentImage() {
    stopTimer();

    answered = false;
    selectedAnswer = null;
    isMoving = false;

    remainingTime = EXPERIMENT.LIMIT_TIME;

    imageCard.classList.add("loading");

    resetCardAnimation();
    resetAnswerButtons();

    const images = IMAGE_SETS[currentMode];
    const imagePath = images[currentIndex];

    sessionName.textContent = getSessionName();
    progress.textContent = `${currentIndex + 1} / ${images.length}`;

    iceImage.alt = `${getSessionName()}の画像${currentIndex + 1}`;

    iceImage.onload = () => {
        imageCard.classList.remove("loading");

        likeButton.disabled = false;
        dislikeButton.disabled = false;

        startTimer();
    };

    iceImage.src = imagePath;

    updateGuideBeforeAnswer();
    updateTimerDisplay();

    likeButton.disabled = false;
    dislikeButton.disabled = false;
}


/* ===================================
   セッション名
=================================== */

function getSessionName() {
    switch (currentMode) {
        case "practice":
            return "練習";

        case "practice2":
            return "Session 2前の練習";

        case "session1":
            return "Session 1";

        case "session2":
            return "Session 2";

        default:
            return "";
    }
}


/* ===================================
   評価ボタン
=================================== */

function selectAnswer(answer) {
    if (answered || isMoving) {
        return;
    }

    answered = true;
    selectedAnswer = answer;

    stopTimer();

    likeButton.disabled = true;
    dislikeButton.disabled = true;

    if (answer === "like") {
        likeButton.classList.add("selected");
    }

    if (answer === "dislike") {
        dislikeButton.classList.add("selected");
    }

    updateGuideAfterAnswer();
}


function resetAnswerButtons() {
    likeButton.classList.remove("selected");
    dislikeButton.classList.remove("selected");

    likeButton.disabled = false;
    dislikeButton.disabled = false;
}


/* ===================================
   ガイド表示
=================================== */

function updateGuideBeforeAnswer() {
    guide.style.color = "#4A90E2";
    guide.textContent = "5秒以内に評価してください";
}


function updateGuideAfterAnswer() {
    guide.style.color = "#4A90E2";

    const direction = EXPERIMENT.SWIPE_DIRECTION[currentMode];

    if (direction === "up") {
        guide.textContent = "下から上へスワイプしてください ↑";
    } else {
        guide.textContent = "上から下へスワイプしてください ↓";
    }
}


function showGuideError(message) {
    guide.style.color = "#E74C3C";
    guide.textContent = message;

    window.setTimeout(() => {
        if (answered) {
            updateGuideAfterAnswer();
        } else {
            updateGuideBeforeAnswer();
        }
    }, 1000);
}


/* ===================================
   タイマー
=================================== */

function startTimer() {
    stopTimer();

    const startTime = performance.now();
    const endTime = startTime + EXPERIMENT.LIMIT_TIME * 1000;

    timerId = window.setInterval(() => {
        const now = performance.now();
        const difference = endTime - now;

        remainingTime = Math.max(0, difference / 1000);

        updateTimerDisplay();

        if (difference <= 0) {
            handleTimeUp();
        }
    }, 50);
}


function stopTimer() {
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
}


function updateTimerDisplay() {
    timerText.textContent = remainingTime.toFixed(1);

    const ratio = remainingTime / EXPERIMENT.LIMIT_TIME;

    if (ratio > 0.5) {
        timerCircle.style.background = "#79C8FF";
    } else if (ratio > 0.2) {
        timerCircle.style.background = "#F5B041";
    } else {
        timerCircle.style.background = "#FF6B6B";
    }
}


/* ===================================
   時間切れ
=================================== */

function handleTimeUp() {
    if (answered || isMoving) {
        return;
    }

    stopTimer();

    remainingTime = 0;
    updateTimerDisplay();

    answered = true;
    selectedAnswer = "timeout";

    likeButton.disabled = true;
    dislikeButton.disabled = true;

    guide.style.color = "#E74C3C";
    guide.textContent = "時間切れです";

    window.setTimeout(() => {
        moveToNextImage();
    }, 600);
}


/* ===================================
   タッチ操作
=================================== */

imageCard.addEventListener(
    "touchstart",
    (event) => {
        if (event.touches.length !== 1 || isMoving) {
            return;
        }

        const touch = event.touches[0];

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    },
    {
        passive: true
    }
);

imageCard.addEventListener(
    "touchmove",
    (event) => {
        event.preventDefault();
    },
    {
        passive: false
    }
);

imageCard.addEventListener(
    "touchend",
    (event) => {
        if (isMoving || event.changedTouches.length === 0) {
            return;
        }

        const touch = event.changedTouches[0];

        handleSwipe(
            touchStartX,
            touchStartY,
            touch.clientX,
            touch.clientY
        );
    },
    {
        passive: true
    }
);


/* ===================================
   パソコンでの動作確認用マウス操作
=================================== */

experimentScreen.addEventListener("mousedown", (event) => {
    if (isMoving) {
        return;
    }

    isMouseDown = true;

    mouseStartX = event.clientX;
    mouseStartY = event.clientY;
});


experimentScreen.addEventListener("mouseup", (event) => {
    if (!isMouseDown || isMoving) {
        return;
    }

    isMouseDown = false;

    handleSwipe(
        mouseStartX,
        mouseStartY,
        event.clientX,
        event.clientY
    );
});


experimentScreen.addEventListener("mouseleave", () => {
    isMouseDown = false;
});


/* ===================================
   スワイプ判定
=================================== */

function handleSwipe(startX, startY, endX, endY) {
    const differenceX = endX - startX;
    const differenceY = endY - startY;

    const horizontalDistance = Math.abs(differenceX);
    const verticalDistance = Math.abs(differenceY);

    /*
    縦方向の移動より横方向の移動が大きい場合は、
    スワイプとして扱いません。
    */

    if (horizontalDistance > verticalDistance) {
        return;
    }

    if (verticalDistance < EXPERIMENT.SWIPE_DISTANCE) {
        return;
    }

    if (!answered) {
        showGuideError("先に「好き」か「嫌い」を押してください");
        return;
    }

    const detectedDirection =
        differenceY < 0 ? "up" : "down";

    const correctDirection =
        EXPERIMENT.SWIPE_DIRECTION[currentMode];

    if (detectedDirection !== correctDirection) {
        if (correctDirection === "up") {
            showGuideError("下から上へスワイプしてください ↑");
        } else {
            showGuideError("上から下へスワイプしてください ↓");
        }

        shakeImageCard();
        return;
    }

    playSwipeAnimation(correctDirection);
}


/* ===================================
   正しいスワイプ
=================================== */

function playSwipeAnimation(direction) {
    if (isMoving) {
        return;
    }

    isMoving = true;
    stopTimer();

    if (direction === "up") {
        imageCard.classList.add("swipeUp");
    } else {
        imageCard.classList.add("swipeDown");
    }

    window.setTimeout(() => {
        moveToNextImage();
    }, 350);
}


/* ===================================
   間違った方向の演出
=================================== */

function shakeImageCard() {
    imageCard.animate(
        [
            {
                transform: "translateX(0)"
            },
            {
                transform: "translateX(-10px)"
            },
            {
                transform: "translateX(10px)"
            },
            {
                transform: "translateX(-7px)"
            },
            {
                transform: "translateX(7px)"
            },
            {
                transform: "translateX(0)"
            }
        ],
        {
            duration: 350
        }
    );
}


/* ===================================
   カードアニメーションの初期化
=================================== */

function resetCardAnimation() {
    imageCard.classList.remove("swipeUp");
    imageCard.classList.remove("swipeDown");

    /*
    CSSアニメーションを確実にリセットするため、
    一度ブラウザに再計算させます。
    */

    void imageCard.offsetWidth;
}


/* ===================================
   次の画像
=================================== */

function moveToNextImage() {
    if (!isMoving) {
        isMoving = true;
    }

    stopTimer();

    const images = IMAGE_SETS[currentMode];

    currentIndex += 1;

    if (currentIndex < images.length) {
        showCurrentImage();
        return;
    }

    finishCurrentMode();
}


/* ===================================
   各モード終了時
=================================== */

function finishCurrentMode() {
    stopTimer();
    isMoving = false;

    if (currentMode === "practice") {
        showPracticeComplete();
        return;
    }

    if (currentMode === "practice2") {
        showPractice2Complete();
        return;
    }

    if (currentMode === "session1") {
        showBreakScreen();
        return;
    }

    if (currentMode === "session2") {
        showScreen("finish");
    }
}


/* ===================================
   最初の練習終了画面
=================================== */

function showPracticeComplete() {
    messageTitle.textContent = "練習終了";

    messageBody.innerHTML =
        "これから本番を開始します<br>" +
        "Session 1では、評価後に<br>" +
        "下から上へスワイプしてください";

    nextButton.textContent = "Session 1を始める";

    nextAction = () => {
        startMode("session1");
    };

    showScreen("message");
}


/* ===================================
   Session 2前の練習終了画面
=================================== */

function showPractice2Complete() {
    messageTitle.textContent = "練習終了";

    messageBody.innerHTML =
        "これから本番を開始します<br>" +
        "Session 2では、評価後に<br>" +
        "上から下へスワイプしてください";

    nextButton.textContent = "Session 2を始める";

    nextAction = () => {
        startMode("session2");
    };

    showScreen("message");
}



/* ===================================
   Session 1終了・休憩画面
=================================== */

function showBreakScreen() {
    messageTitle.textContent = "休憩";

    messageBody.innerHTML =
        "準備ができたら<br>" +
        "Session 2を始めてください<br><br>" +
        "評価後は上から下へ<br>" +
        "スワイプしてください";

    nextButton.textContent = "練習を始める";

    nextAction = () => {
        startMode("practice2");
    };

    showScreen("message");
}


/* ===================================
   画像読み込みエラー
=================================== */

iceImage.addEventListener("error", () => {
    guide.style.color = "#E74C3C";

    guide.textContent =
        "画像を読み込めません ファイル名を確認してください";
});


/* ===================================
   初期表示
=================================== */

showScreen("start");