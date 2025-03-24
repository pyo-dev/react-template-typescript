import { useLocation } from 'react-router-dom';

import { PyoNavButton } from "@/components/PyoNavButton";
import { FormCheckRadio } from "./children/CheckRadio";
import { FormInput } from "./children/Input";
import { FormSelect } from "./children/Select";
import { FormTextarea } from "./children/Textarea";
import { FormTable } from "./children/Table";

export const PyoDesignForm = () => {
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth2: string = params.get('depth2') || 'checkradio';

	return (
		<>
			<div className="pyo-tab">
				<PyoNavButton to="/design?depth1=form"><div className="pyo-icon-pin"></div>Checkbox Radio</PyoNavButton>
				<PyoNavButton to="/design?depth1=form&depth2=input"><div className="pyo-icon-pin"></div>Input</PyoNavButton>
				<PyoNavButton to="/design?depth1=form&depth2=select"><div className="pyo-icon-pin"></div>Select</PyoNavButton>
				<PyoNavButton to="/design?depth1=form&depth2=textarea"><div className="pyo-icon-pin"></div>Textarea</PyoNavButton>
				<PyoNavButton to="/design?depth1=form&depth2=table"><div className="pyo-icon-pin"></div>Table ...etc</PyoNavButton>
			</div>
			{getDepth2 === 'checkradio' && <FormCheckRadio />}
			{getDepth2 === 'input' && <FormInput />}
			{getDepth2 === 'select' && <FormSelect />}
			{getDepth2 === 'textarea' && <FormTextarea />}
			{getDepth2 === 'table' && <FormTable />}
		</>
	);
};
