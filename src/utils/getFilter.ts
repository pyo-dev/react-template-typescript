type DateString = string | Date | null;

interface DateFormatOptions {
	dateSeparator?: string;
	timeSeparator?: string;
	showYear?: boolean;
	showMonth?: boolean;
	showDay?: boolean;
	showHours?: boolean;
	showMinutes?: boolean;
	showSeconds?: boolean;
}

interface DateUnits {
	setter: (date: Date, value: number) => void;
	getter: (date: Date) => number;
}

export const getFilter = {
	dateFormat: (
		targetDate: DateString,
		options: DateFormatOptions = {}
	): string | false => {
		if (!targetDate) return false;

		const reqDate = new Date(targetDate);
		const {
			dateSeparator = "-",
			timeSeparator = ":",
			showYear = true,
			showMonth = true,
			showDay = true,
			showHours = false,
			showMinutes = false,
			showSeconds = false,
		} = options;

		const padZero = (num: number): string =>
			num < 10 ? `0${num}` : num.toString();

		const year = showYear ? reqDate.getFullYear() : "";
		const month = showMonth ? padZero(reqDate.getMonth() + 1) : "";
		const day = showDay ? padZero(reqDate.getDate()) : "";
		const hours = showHours ? padZero(reqDate.getHours()) : "";
		const minutes = showMinutes ? padZero(reqDate.getMinutes()) : "";
		const seconds = showSeconds ? padZero(reqDate.getSeconds()) : "";

		const dateParts = [year, month, day]
			.filter(Boolean)
			.join(dateSeparator);
		const timeParts = [hours, minutes, seconds]
			.filter(Boolean)
			.join(timeSeparator);

		return [dateParts, timeParts].filter(Boolean).join(" ");
	},

	dateDday: (targetDate: DateString): number | false => {
		if (!targetDate) return false;

		const today = new Date();
		const timeDiff = new Date(targetDate).getTime() - today.getTime();
		return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
	},

	dateBetween: (
		startDate: DateString,
		endDate: DateString
	): number | false => {
		if (!startDate || !endDate) return false;

		const timeDiff =
			new Date(endDate).getTime() - new Date(startDate).getTime();
		return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
	},

	dateInCheck: (
		startDate: DateString,
		endDate: DateString,
		checkDate: DateString
	): boolean | false => {
		if (!startDate || !endDate || !checkDate) return false;

		const startMs = new Date(startDate).getTime();
		const endMs = new Date(endDate).getTime();
		const checkMs = new Date(checkDate).getTime();
		return checkMs >= startMs && checkMs <= endMs;
	},

	dateByOffset: (
		offset: number,
		unit: "day" | "month" | "year" = "day",
		baseDate: DateString = new Date()
	): string | false => {
		if (!offset || !baseDate) return false;

		const dateUnits: Record<"day" | "month" | "year", DateUnits> = {
			day: {
				setter: (date, value) => date.setDate(date.getDate() + value),
				getter: (date) => date.getDate(),
			},
			month: {
				setter: (date, value) => date.setMonth(date.getMonth() + value),
				getter: (date) => date.getMonth(),
			},
			year: {
				setter: (date, value) =>
					date.setFullYear(date.getFullYear() + value),
				getter: (date) => date.getFullYear(),
			},
		};

		const currentDate = new Date(baseDate);
		const resultDate = new Date(currentDate);

		const { setter } = dateUnits[unit];
		setter(resultDate, offset);

		return getFilter.dateFormat(resultDate);
	},

	chooseCharacters: (
		inputString: string,
		languages: ("ko" | "eng" | "num" | "special")[] = ["ko"]
	): string | false => {
		if (!inputString) return false;

		const supportedLanguages: Record<string, RegExp> = {
			ko: /[가-힣ㄱ-ㅎㅏ-ㅣ]/g, // 한글
			eng: /[a-zA-Z]/g, // 영어
			num: /[0-9]/g, // 숫자
			special: /[!@#$%^&*()_+\-=]/g, // 특수문자
		};

		return [...inputString]
			.filter((char) =>
				languages.some((lang) => char.match(supportedLanguages[lang]))
			)
			.join("");
	},

	checkPhoneNumber: (phoneNumber: string): boolean => {
		if (!phoneNumber) return false;

		const phoneRegex = /^(01[016789]{1})-?[0-9]{3,4}-?[0-9]{4}$/;
		return phoneRegex.test(phoneNumber);
	},

	checkEmail: (email: string): boolean => {
		if (!email) return false;

		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		return emailRegex.test(email);
	},

	replaceNewlinesWithBr: (text: string): string | false => {
		if (!text) return false;
		return text.replace(/\\r|\r|\\n|\n|<br>/g, "<br />");
	},

	spaceDelet: (text: string): string => {
		if (!text) return "";
		return text.replace(/\s+/g, "");
	},

	getDeviceCheck: (): "MOBILE_WEB" | "PC" => {
		return /Mobi|Android/i.test(navigator.userAgent) ? "MOBILE_WEB" : "PC";
	},
};
