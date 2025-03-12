# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# 설치
npm create vite@latest

## react 버전으로 설치가 안될경우 
- --legacy-peer-deps
- ex) npm install chart.js --legacy-peer-deps

## Dependencies: 프로덕션 코드에서 사용되는 패키지들입니다.
### 기본
- react: `^18.3.1`	
	React 라이브러리. UI를 구축하기 위한 핵심 라이브러리.
- react-dom: `^18.3.1`	
	React의 DOM 관련 기능을 제공. React와 DOM 간 상호작용을 처리.
### 추가 설치
- axios: `^1.7.9`	
	HTTP 요청을 처리하기 위한 라이브러리. API 호출 및 비동기 데이터 처리를 쉽게 함.	
	- react-router-dom과 함께 사용하여, 데이터 가져오기 후 페이지 이동을 처리하거나 URL에 따라 다른 데이터를 표시할 수 있음.
- recharts: `^2.15.0`	
	React에서 독립적으로 차트를 생성할 수 있는 라이브러리. chart.js와는 별개로 사용 가능.
- date-fns: `^4.1.0`	
	날짜 및 시간 처리를 위한 유틸리티 라이브러리. 경량화된 함수형 API 제공.
- exceljs: `^4.4.0`	
	Excel 파일 생성 및 읽기/쓰기를 지원하는 라이브러리.
- file-saver: `^2.0.5`	
	클라이언트에서 파일 다운로드를 쉽게 처리하는 라이브러리.	
	- exceljs와 함께 사용하여 생성된 Excel 파일을 클라이언트에서 바로 다운로드할 수 있도록 함.
- react-datepicker: `^7.5.0`	
	날짜 선택 UI를 구현하는 React 라이브러리.
- react-sortablejs: `^6.1.4`	
	React에서 드래그 앤 드롭 기능을 쉽게 구현할 수 있는 라이브러리.	
	- sortablejs와 함께 사용하여, 드래그 앤 드롭 기능을 React 애플리케이션에 통합할 수 있음.
- sortablejs: `^1.15.6`	
	드래그 앤 드롭 기능을 제공하는 핵심 라이브러리.	
	- react-sortablejs와 함께 사용하여 React에서 드래그 앤 드롭 기능을 쉽게 구현할 수 있음.
- recoil: `^0.7.7`	
	React 상태 관리를 위한 라이브러리. 전역 상태 관리에 유용.
- recoil-persist: `^5.1.0`	
	Recoil 상태를 브라우저 스토리지(localStorage 등)에 저장하고 복원하는 라이브러리.	
	- recoil과 함께 사용하여 애플리케이션의 전역 상태를 저장하고 페이지 새로 고침 시 복원할 수 있음.
- suneditor-react: `^3.6.1`	
	React에서 사용할 수 있는 WYSIWYG 에디터 라이브러리.
- swiper: `^11.1.15`	
	슬라이더 및 캐러셀 UI를 쉽게 구현할 수 있는 라이브러리.

## DevDependencies: 개발 환경에서만 사용되는 패키지들입니다.
### 기본
- @eslint/js: `^9.17.0`	
	코드 품질을 유지하고 오류를 방지하기 위한 정적 코드 분석 도구.
- @types/react: `^18.3.17`	
	TypeScript에서 React 타입을 사용할 수 있도록 도와주는 타입 정의 파일.
- @types/react-dom: `^18.3.5`	
	TypeScript에서 ReactDOM 관련 타입을 사용할 수 있도록 도와주는 타입 정의 파일.
- @vitejs/plugin-react: `^4.3.4`	
	Vite에서 React 프로젝트를 최적화하고 핫 리로드 등을 지원하는 플러그인.
- eslint: `^9.17.0`	
	코드 품질을 유지하고 오류를 방지하기 위한 정적 코드 분석 도구.
- eslint-plugin-react-hooks: `^5.0.0`	
	React Hooks 관련 올바른 코드 사용 패턴을 강제하는 ESLint 플러그인.
- eslint-plugin-react-refresh: `^0.4.16`	
	React Fast Refresh와 관련된 ESLint 규칙을 지원하는 플러그인.
- globals: `^15.13.0`	
	Node.js와 브라우저 환경에서 사용되는 글로벌 변수들의 타입을 정의하는 라이브러리.
- typescript: `~5.6.2`	
	TypeScript 지원을 위한 패키지.
- typescript-eslint: `^8.18.1`	
	TypeScript 프로젝트에서 ESLint를 사용할 수 있게 지원하는 플러그인.
- vite: `^6.0.3`	
	Vite는 빠르고 최적화된 빌드 툴로, 개발 서버와 번들링을 담당.
### 추가 설치
- @types/react-helmet: `^6.1.11`	
	react-helmet 라이브러리의 TypeScript 타입 정의 파일.
- @types/react-highlight: `^0.12.8`	
	react-highlight 라이브러리의 TypeScript 타입 정의 파일.
- sass-embedded: `^1.83.0`	
	Sass를 컴파일하는 도구. CSS 전처리기 Sass를 사용하도록 지원.