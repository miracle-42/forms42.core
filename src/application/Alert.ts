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

		if (type == Type.Popup || type == Type.PopAndLog)
			window.alert(msg);

		if (type == Type.PopAndLog)
			console.log(title+": "+msg+" "+(new Error()).stack);
	}

	public static async warning(msg:string, title:string, type?:Type)
	{
		if (type == null)
			type = Type.PopAndLog;


		if (type == Type.Popup || type == Type.PopAndLog)
			window.alert(msg);

		if (type == Type.PopAndLog)
			console.log(title+": "+msg+" "+(new Error()).stack);
	}

	public static async message(msg:string, title:string, type?:Type)
	{
		if (type == null)
			type = Type.PopAndLog;

		if (type == Type.Popup || type == Type.PopAndLog)
			window.alert(msg);

		if (type == Type.PopAndLog)
			console.log(title+": "+msg+" "+(new Error()).stack);
	}
}