const circleMenu = document.querySelector(".circle-menu");
const centerMenu = document.querySelector(".center-box");
const menuItems = document.querySelectorAll(".menu-item");
let currentRotation = 0; // 회전 값
let isDragging = false;
let startX = 0;
let startY = 0;
let lastAngle = 0;
const itemCount = menuItems.length; // 메뉴 항목 개수

// 각도를 계산하는 함수 (x, y로부터 각도 계산)
function calculateAngle(x, y) {
	const rect = circleMenu.getBoundingClientRect();
	const centerX = rect.left + rect.width / 2;
	const centerY = rect.top + rect.height / 2;
	return Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
}

// 메뉴 항목에 대해 회전 값을 동적으로 업데이트
function updateMenuItemTransforms(rotation) {
	menuItems.forEach((item, index) => {
		const angle = (360 / itemCount) * index + rotation; // 각 메뉴 항목의 회전 각도 계산
		// 버튼이 원에 가장자리에 배치되도록 `translateX(120px)`으로 고정하고,
		// 각 버튼의 회전 값으로 회전하도록 합니다.
		item.style.transform = `rotate(${angle}deg) translateX(120px) rotate(${-angle}deg)`; // 수평 유지
	});

	centerMenu.style.transform = `rotate(${rotation}deg)`; // 전체 메뉴와 중앙 박스를 동시에 회전
}

// 드래그 시작
function onMouseDown(e) {
	e.preventDefault();
	isDragging = true;
	startX = e.clientX || e.touches[0].clientX;
	startY = e.clientY || e.touches[0].clientY;
	lastAngle = calculateAngle(startX, startY);
	cancelAnimationFrame(animationFrameId);
}

// 드래그 중
function onMouseMove(e) {
	if (!isDragging) return;

	const x = e.clientX || e.touches[0].clientX;
	const y = e.clientY || e.touches[0].clientY;
	const angle = calculateAngle(x, y);
	const delta = angle - lastAngle;

	// 방향이 반대일 경우 회전 방향을 맞추기 위해 delta값을 수정
	if (delta < -180) {
		currentRotation += 360 + delta;
	} else if (delta > 180) {
		currentRotation += delta - 360;
	} else {
		currentRotation += delta;
	}

	lastAngle = angle;

	// 실시간으로 회전 값 업데이트
	updateMenuItemTransforms(currentRotation);
}

// 드래그 종료
function onMouseUp() {
	isDragging = false;
}

// 이벤트 리스너
circleMenu.addEventListener("mousedown", onMouseDown);
circleMenu.addEventListener("mousemove", onMouseMove);
circleMenu.addEventListener("mouseup", onMouseUp);
circleMenu.addEventListener("mouseleave", onMouseUp);

// 터치 이벤트 (모바일)
circleMenu.addEventListener("touchstart", onMouseDown);
circleMenu.addEventListener("touchmove", onMouseMove);
circleMenu.addEventListener("touchend", onMouseUp);
circleMenu.addEventListener("touchcancel", onMouseUp);
