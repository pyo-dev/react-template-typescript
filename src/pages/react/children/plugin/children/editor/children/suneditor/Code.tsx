import Highlight from 'react-highlight'

const codeHtml = `// 사용법
import { useState, useRef } from "react";
import SunEditor from "suneditor-react";
import { getFilter } from "@/utils/getFilter";
import "suneditor/dist/css/suneditor.min.css";

export const 컴포넌트이름 = () => {
const [device] = useState<string>(getFilter.getDeviceCheck());
const [value, setValue] = useState<string>("<p>테스트 1111</p>");
const editorRef = useRef<any>(); // SunEditor 인스턴스를 위한 ref

const setEditorRef = (editor: any) => {
	editorRef.current = editor;
};

const setOptions = {
	buttonList: [
		["undo", "redo"],
		["font", "fontSize"],
		[
			"bold",
			"underline",
			"italic",
			"strike",
			"subscript",
			"superscript",
		],
		["codeView"],
		["fontColor", "hiliteColor"],
		["align", "list", "lineHeight"],
		["outdent", "indent"],
		["table", "horizontalRule", "link", "image", "video"],
		["preview", "print"],
		["removeFormat"],
	],
	minHeight: "300px",
	showPathLabel: false,
	font: [
		"Logical",
		"Salesforce Sans",
		"Garamond",
		"Sans-Serif",
		"Serif",
		"Times New Roman",
		"Helvetica",
		"Arial",
		"Comic Sans MS",
		"Courier New",
		"Impact",
		"Georgia",
		"Tahoma",
		"Trebuchet MS",
		"Verdana",
	].sort(),
};

const handleChange = (content: string) => {
	setValue(content);
};

const handleKeyDown = (e: KeyboardEvent) => {
	const editor = editorRef.current;
	if (e.key === "Enter" && editor) {
		setTimeout(() => {
			editor.focus();
			if (device === "PC") {
				const selection = window.getSelection();
				if (selection && selection.rangeCount > 0) {
					const range = selection.getRangeAt(0);
					const cursorElement = range.startContainer
						.parentNode as HTMLElement;

					if (cursorElement) {
						const editorContainer = editor.context.element
							.wysiwyg as HTMLElement;
						const cursorRect =
							cursorElement.getBoundingClientRect();
						const editorRect =
							editorContainer.getBoundingClientRect();

						if (cursorRect.bottom > editorRect.bottom) {
							editorContainer.scrollTop +=
								cursorRect.bottom - editorRect.bottom;
						} else if (cursorRect.top < editorRect.top) {
							editorContainer.scrollTop -=
								editorRect.top - cursorRect.top;
						}
					}
				}
			}
		}, 0);
	}
};

const handleImageUpload = (
	targetImgElement: HTMLImageElement,
	_index: number, // index는 숫자 타입으로 전달됨
	state: "create" | "update" | "delete", // "create" | "update" | "delete" 타입으로 설정됨
	imageInfo: any, // UploadInfo 대신 any 사용
	_remainingFilesCount: number
) => {
	if (state === "create" && imageInfo.src) {
		// 이미지 정보에서 src를 확인하여 이미지를 처리
		targetImgElement.src =
			"https://shopby-images.cdn-nhncommerce.com/SERVICE/20241114/b726382d-6023-4217-8a6b-50649c6eb79f.jpg";
	}
};

return (
	<>
		<SunEditor
			getSunEditorInstance={setEditorRef}
			setContents={value}
			onChange={handleChange}
			setOptions={setOptions}
			onKeyDown={handleKeyDown}
			onImageUpload={handleImageUpload}
		/>
		<h2>Example value output:</h2>
		<textarea
			disabled
			value={JSON.stringify(value, null, 2)}
			style={{ width: "100%", resize: "none", height: "600px" }}
		/>
		<div dangerouslySetInnerHTML={{ __html: value }}></div>
	</>
);
};
`

export const LmPluginEditorCode = () => {
	return (
		<>
			<div className="lm-panel lm-panel-flex-wrap">
				<Highlight className="javascript lm-panel-code">
					{codeHtml}
				</Highlight>
			</div>
		</>
	);
};
