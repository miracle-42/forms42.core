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

import { MouseMap } from "./MouseMap.js";
import { EventType } from "./EventType.js";
import { Form } from "../../public/Form.js";
import { EventFilter } from "./EventFilter.js";
import { Logger, Type } from "../../application/Logger.js";

export class EventListener
{
	public method:string;

	constructor(public id:object, public form:Form, public clazz:any, method:Function|string, public filter:EventFilter)
	{
		if (typeof method === "string")
		{
			this.method = method;

			if (form[this.method] == null)
				throw "@EventListener: method '"+this.method+"' does not exist on form '"+form.constructor.name+"'";
		}
		else
		{
			this.method = method.name;

			if (form[this.method] == null)
				throw "@EventListener: method '"+this.method+"' does not exist on form '"+form.constructor.name+"'";

			if (form[this.method] != method)
				throw "@EventListener: method '"+this.method+"' does not match method defined on form '"+form.constructor.name+"'";
		}

		Logger.log(Type.eventlisteners,"eventlistener : "+this.toString());
	}

	public toString() : string
	{
		let filter:string = "{}";

		if (this.filter)
		{
			filter = "{";
			if (this.filter.type != null) filter += "type: "+EventType[this.filter.type]+", ";

			filter += "form: "+this.form?.constructor.name+", ";

			if (this.filter.block != null) filter += "block: "+this.filter.block+", ";
			if (this.filter.field != null) filter += "field: "+this.filter.field+", ";

			if (this.filter.key != null) filter += "key: "+this.filter.key+", ";
			if (this.filter.mouse != null) filter += "key: "+MouseMap[this.filter.mouse]+", ";

			filter = filter.substring(0,filter.length-2)+"}";
		}

		let str:string = this.clazz.constructor.name + "." + this.method + " filter: " + filter;
		return(str);
	}
}