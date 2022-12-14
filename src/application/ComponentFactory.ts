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
import { Class } from '../types/Class.js';
import { FormBacking } from './FormBacking.js';
import { HTMLFragment } from './HTMLFragment.js';
import { Classes } from '../internal/Classes.js';
import { ComponentFactory as Factory } from './interfaces/ComponentFactory.js';

export class ComponentFactory implements Factory
{
	createBean(bean:Class<any>) : any {return(new bean())}
	createFragment(frag:Class<any>) : HTMLFragment {return(new frag())}

	async createForm(form:Class<Form>, parameters?:Map<any,any>) : Promise<Form>
	{
		let instance:Form = null;

		if (Classes.isInternal(form))	instance = new form();
		else									instance = new form();

		if (parameters != null) instance.parameters = parameters;

		let page:string|HTMLElement = FormBacking.getBacking(instance).page;

		if (page != null)
			await instance.setView(page);

		return(instance)
	}
}