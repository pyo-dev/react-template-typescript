import { useLocation } from 'react-router-dom';

import { LmNavButton } from "@/components/LmNavButton";
import { FormCheckRadio } from "./children/CheckRadio";
import { FormInput } from "./children/Input";
import { FormSelect } from "./children/Select";
import { FormTextarea } from "./children/Textarea";
import { FormTable } from "./children/Table";

export const LmDesignForm = () => {
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth2: string = params.get('depth2') || 'checkradio';

	return (
		<>
			<div className="lm-tab">
				<LmNavButton to="/design?depth1=form"><div className="lm-icon-pin"></div>Checkbox Radio</LmNavButton>
				<LmNavButton to="/design?depth1=form&depth2=input"><div className="lm-icon-pin"></div>Input</LmNavButton>
				<LmNavButton to="/design?depth1=form&depth2=select"><div className="lm-icon-pin"></div>Select</LmNavButton>
				<LmNavButton to="/design?depth1=form&depth2=textarea"><div className="lm-icon-pin"></div>Textarea</LmNavButton>
				<LmNavButton to="/design?depth1=form&depth2=table"><div className="lm-icon-pin"></div>Table ...etc</LmNavButton>
			</div>
			{getDepth2 === 'checkradio' && <FormCheckRadio />}
			{getDepth2 === 'input' && <FormInput />}
			{getDepth2 === 'select' && <FormSelect />}
			{getDepth2 === 'textarea' && <FormTextarea />}
			{getDepth2 === 'table' && <FormTable />}
		</>
	);
};
