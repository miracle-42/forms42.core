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

import { Form } from '../public/Form.js';
import { FormsModule } from './FormsModule.js';
import { FormBacking } from './FormBacking.js';
import { Classes } from '../internal/Classes.js';
import { FlightRecorder } from './FlightRecorder.js';

export enum Type
{
	Log,
	Popup,
	PopAndLog
}

export class Alert
{
	public static async fatal(msg:string, title:string, type?:Type)
	{
		if (type == null)
			type = Type.PopAndLog;

		FlightRecorder.add("alert.fatal: "+title+" - "+msg);

		if (type == Type.Popup || type == Type.PopAndLog)
			Alert.callform(msg,title,false,true);

		if (type == Type.PopAndLog)
			console.log(title+": "+msg+" "+(new Error()).stack);
	}

	public static async warning(msg:string, title:string, type?:Type)
	{
		if (type == null)
			type = Type.Popup;

		if (type == Type.Popup || type == Type.PopAndLog)
			Alert.callform(msg,title,true,false);

		if (type == Type.PopAndLog)
			console.log(title+": "+msg+" "+(new Error()).stack);
	}

	public static async message(msg:string, title:string, type?:Type)
	{
		if (type == null)
			type = Type.Popup;

		if (type == Type.Popup || type == Type.PopAndLog)
			Alert.callform(msg,title,false,false);

		if (type == Type.PopAndLog)
			console.log(title+": "+msg+" "+(new Error()).stack);
	}

	public static async callform(msg:string, title:string, warning:boolean, fatal:boolean) : Promise<void>
	{
		let params:Map<string,any> = new Map<string,any>();

		params.set("title",title);
		params.set("message",msg);

		params.set("fatal",fatal);
		params.set("warning",warning);

		let curr:Form = FormBacking.getCurrentForm();
		if (curr) curr.callform(Classes.AlertClass,params);
		else FormsModule.get().showform(Classes.AlertClass,params);
	}
}