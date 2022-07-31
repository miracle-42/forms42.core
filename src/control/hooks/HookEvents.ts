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
import { HookListener } from "./HookListener.js";
import { Logger, Type } from "../../application/Logger.js";

export class HookEvents
{
	public static async raise(form:Form, hook:Hook) : Promise<void>
	{
		let lsnrs:HookListener[] = HookListener.getHooks(form,hook);

		for (let i = 0; i < lsnrs.length; i++)
		{
			lsnrs[i].form[lsnrs[i].method]();
			Logger.log(Type.eventlisteners,Hook[hook]+" Invoking eventhandler: "+lsnrs[i]);
		}
	}
}