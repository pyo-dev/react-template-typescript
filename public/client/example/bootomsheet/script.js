const bottomSheet = document.querySelector(".bottom-sheet");
const dragHandle = document.querySelector(".drag-handle");

let isDragging = false;
let startY = 0;
let sheetHeight = 10; // 기본 닫힌 상태 (50% 높이)
const OPEN_HEIGHT = 80; // 완전히 열리는 높이 (80%)
const CLOSE_HEIGHT = 10; // 완전히 닫히는 높이 (50%)
const THRESHOLD = 10; // 📌 최소 드래그 거리 (10% 화면 크기)
const ANITIMER = 0.3; // 애니메이션 속도

// ✅ 열기 및 닫기 함수
const openSheet = () => {
	sheetHeight = OPEN_HEIGHT;
	bottomSheet.style.transition = `transform ${ANITIMER}s ease-out`;
	bottomSheet.style.transform = `translateY(${100 - sheetHeight}%)`;
};

const closeSheet = () => {
	sheetHeight = CLOSE_HEIGHT;
	bottomSheet.style.transition = `transform ${ANITIMER}s ease-out`;
	bottomSheet.style.transform = `translateY(${100 - sheetHeight}%)`;
};

// ✅ 드래그 시작 (공통)
const startDrag = (y) => {
	isDragging = true;
	startY = y;
	bottomSheet.style.transition = "none"; // 드래그 중에는 애니메이션 제거
};

// ✅ 드래그 이동
const moveDrag = (y) => {
	if (!isDragging) return;

	let delta = startY - y;
	let newHeight = sheetHeight + (delta / window.innerHeight) * 100;

	// 범위 제한
	if (newHeight > OPEN_HEIGHT) newHeight = OPEN_HEIGHT;
	if (newHeight < CLOSE_HEIGHT) newHeight = CLOSE_HEIGHT;

	bottomSheet.style.transform = `translateY(${100 - newHeight}%)`;
};

// ✅ 드래그 종료 (드래그 거리 기준으로 결정)
const endDrag = (y) => {
	isDragging = false;
	let delta = startY - y;
	let dragDistance = (delta / window.innerHeight) * 100; // 📌 드래그 거리 계산

	// 🔥 특정 높이 이상 올리거나 내릴 때만 작동
	if (dragDistance > THRESHOLD) {
		openSheet(); // 일정 이상 올리면 열기
	} else if (dragDistance < -THRESHOLD) {
		closeSheet(); // 일정 이상 내리면 닫기
	} else {
		// 🔥 중간에서 멈추면 원래 위치로 되돌림
		if (sheetHeight < (OPEN_HEIGHT + CLOSE_HEIGHT) / 2) {
			closeSheet();
		} else {
			openSheet();
		}
	}
};

// 📱 **모바일 터치 이벤트**
dragHandle.addEventListener(
	"touchstart",
	(e) => startDrag(e.touches[0].clientY),
	{ passive: true }
);
dragHandle.addEventListener(
	"touchmove",
	(e) => {
		e.preventDefault();
		moveDrag(e.touches[0].clientY);
	},
	{ passive: false }
);
dragHandle.addEventListener(
	"touchend",
	(e) => endDrag(e.changedTouches[0].clientY),
	{ passive: true }
);

// 🖥️ **PC 마우스 이벤트**
dragHandle.addEventListener("mousedown", (e) => {
	startDrag(e.clientY);
	document.addEventListener("mousemove", onMouseMove);
	document.addEventListener("mouseup", onMouseUp);
});

const onMouseMove = (e) => moveDrag(e.clientY);
const onMouseUp = (e) => {
	endDrag(e.clientY);
	document.removeEventListener("mousemove", onMouseMove);
	document.removeEventListener("mouseup", onMouseUp);
};

// 📌 **클릭하면 자동으로 열리고 닫힘**
dragHandle.addEventListener(
	"click",
	() => {
		if (sheetHeight === CLOSE_HEIGHT) {
			openSheet();
		} else {
			closeSheet();
		}
	},
	{ passive: true }
);

// 기본적으로 닫힌 상태로 시작
closeSheet();
