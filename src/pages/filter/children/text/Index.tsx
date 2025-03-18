import Highlight from "react-highlight";

const filterJsIm = `// javascript
<script src="/js/lmFilter.js"></script>

// react
import { getFilter } from '@/utils/getFilter';`;

const filterJs = `// 원하는 문자만 출력
getFilter.chooseCharacters(
	'입력', // 입력 테스트 String !필수 값
	'포함단어' // 포함문자 한글,영어,숫자,특수문자(ko,eng,num,special) !default ['ko'] !생략 가능
);

// 핸드폰 번호 유효성 검사 첫3자리(010,011,016,017,018,019) 중간3~4자리 마지막4자리
getFilter.checkPhoneNumber(
	'입력' // 입력 테스트 String !필수 값
);

// 이메일 유효성 검사 아이디(영문,숫자,특수문자[_,%,+,-]) @ 주소([영문,숫자].2자리이상)
getFilter.checkEmail(
	'입력' // 입력 테스트 String !필수 값
);

// 내려쓰기 전부 치환
getFilter.replaceNewlinesWithBr(
	'입력' // 입력 테스트 String !필수 값
);

// 스페이스 삭제
getFilter.spaceDelet(
	'입력' // 입력 테스트 String !필수 값
);
`;

const sampleJs = `// 원하는 문자만 출력
getFilter.chooseCharacters('홍길동go@@##11');
// output: 홍길동

getFilter.chooseCharacters('홍길동go@@##11', ['eng']);
// output: go

getFilter.chooseCharacters('홍길동go@@##11', ['num']);
// output: 11

getFilter.chooseCharacters('홍길동go@@##11', ['special']);
// output: @@##

getFilter.chooseCharacters('홍길동go@@##11', ['ko','special']);
// output: 홍길동@@##

// 핸드폰 번호 유효성 검사
getFilter.checkPhoneNumber('010-123-4567');
getFilter.checkPhoneNumber('010-1234-5678');
getFilter.checkPhoneNumber('0101234567');
getFilter.checkPhoneNumber('01012345678');
getFilter.checkPhoneNumber('016-1234-5678');
getFilter.checkPhoneNumber('01612345678');
// output: true

getFilter.checkPhoneNumber('010-12-4567');
getFilter.checkPhoneNumber('013-1234-4567');
getFilter.checkPhoneNumber('013-123-4567');
getFilter.checkPhoneNumber('013-12-4567');
// output: false

// 이메일 유효성 검사
getFilter.checkEmail('pyo-dev@co.kr');
// output: true

getFilter.checkEmail('pyo-dev@co');
getFilter.checkEmail('leade@123@co.kr');
// output: false

// 내려쓰기 전부 치환
getFilter.replaceNewlinesWithBr('내용은 내용\\n내용\\r\\n다른 내용<br>이것도 줄바꿈입니다.')
// output: 내용은 내용<br />내용<br /><br />다른 내용<br />이것도 줄바꿈입니다.

// 스페이스 삭제
getFilter.spaceDelet('  입력 하시오 크크크  ');
// output: 입력하시오크크크
`;

export const FilterText = () => {
	return (
		<div className="lm-panel lm-panel-flex-wrap">
			<Highlight className="javascript lm-panel-code">
				{filterJsIm}
			</Highlight>
			<Highlight className="javascript lm-panel-code">
				{filterJs}
			</Highlight>
			<Highlight className="javascript lm-panel-code">
				{sampleJs}
			</Highlight>
		</div>
	);
};
