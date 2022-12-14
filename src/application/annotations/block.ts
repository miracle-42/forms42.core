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

import { Logger, Type } from '../Logger.js';
import { Form } from '../../public/Form.js';
import { FormMetaData } from '../FormMetaData.js';

export const block = (block:string) =>
{
	function define(form:Form, attr:string)
	{
		block = block?.toLowerCase();
		FormMetaData.get(form,true).blockattrs.set(attr,block);
		Logger.log(Type.metadata,"Setting variable "+attr+" on form: "+form.name+" to block: "+block);
	}

	return(define);
}
