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

import { Hook } from "./Hook.js";
import { Form } from "../../public/Form.js";
import { Logger, Type } from "../../application/Logger.js";

export class HookListener
{
	public method:string;

	private static frmhooks:Map<Form,Map<Hook|number,HookListener[]>> =
		new Map<Form,Map<Hook|number,HookListener[]>>();

	public static removeHook(form:Form, hook:Hook, id:object) : boolean
	{
		let frmmap:Map<Hook|number,HookListener[]> = HookListener.frmhooks.get(form);
		let lsnrs:HookListener[] = frmmap?.get(hook);

		for (let i = 0; lsnrs != null && i < lsnrs.length; i++)
		{
			if (lsnrs[i].id == id)
			{
				lsnrs = lsnrs.splice(i,1);
				return(true);
			}
		}

		return(false);
	}

	public static getHooks(form:Form, hook:Hook) : HookListener[]
	{
		let frmmap:Map<Hook|number,HookListener[]> = HookListener.frmhooks.get(form);
		let lsnrs:HookListener[] = frmmap?.get(hook);
		if (lsnrs == null) lsnrs = [];
		return(lsnrs);
	}

	public static addHook(form:Form, hook:Hook, method:Function|string) : object
	{
		let id:object = new Object();
		let lsnr:HookListener = new HookListener(id,form,method);
		let frmmap:Map<Hook|number,HookListener[]> = HookListener.frmhooks.get(form);

		if (frmmap == null)
		{
			frmmap = new Map<Hook|number,HookListener[]>();
			HookListener.frmhooks.set(form,frmmap);
		}

		let lsnrs:HookListener[] = frmmap.get(hook);

		if (lsnrs == null)
		{
			lsnrs = [];
			frmmap.set(hook,lsnrs);
		}

		lsnrs.push(lsnr);
		return(id);
	}

	private constructor(public id:object, public form:Form, method:Function|string)
	{
		if (typeof method === "string")
		{
			this.method = method;

			if (form[this.method] == null)
				throw "@HookListener: method '"+this.method+"' does not exist on form '"+form.constructor.name+"'";
		}
		else
		{
			this.method = method.name;

			if (form[this.method] == null)
				throw "@HookListener: method '"+this.method+"' does not exist on form '"+form.constructor.name+"'";

			if (form[this.method] != method)
				throw "@HookListener: method '"+this.method+"' does not match method defined on form '"+form.constructor.name+"'";
		}

		Logger.log(Type.formhooks,"formhook : "+this.toString());
	}

	public toString() : string
	{
		let str:string = this.form.constructor.name + "." + this.method;
		return(str);
	}
}