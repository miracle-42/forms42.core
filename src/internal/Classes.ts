/*
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 3 only, as
 * published by the Free Software Foundation.

 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 */

import { Form } from './Form.js';
import { Class } from '../types/Class.js';

import { Alert } from './forms/Alert.js';
import { DatePicker } from './forms/DatePicker.js';
import { QueryEditor } from './forms/QueryEditor.js';
import { ListOfValues } from './forms/ListOfValues.js';

export class Classes
{
	public static AlertClass:Class<Form> = Alert;
	public static DatePickerClass:Class<Form> = DatePicker;
	public static QueryEditorClass:Class<Form> = QueryEditor;
	public static ListOfValuesClass:Class<Form> = ListOfValues;

	public static isInternal(clazz:Class<Form>) : boolean
	{
		if (clazz == Alert) return(true);
		if (clazz == DatePicker) return(true);
		if (clazz == QueryEditor) return(true);
		return(false);
	}
}
