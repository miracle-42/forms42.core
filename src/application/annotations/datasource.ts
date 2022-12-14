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
import { Class } from '../../types/Class.js';
import { Block } from '../../public/Block.js';
import { FormMetaData } from '../FormMetaData.js';
import { DataSource } from '../../model/interfaces/DataSource.js';

export const datasource = (block:Block|string, source:Class<DataSource>|DataSource) =>
{
	function define(form:Class<Form>)
	{
		if (!(typeof block === "string")) block = block.name;
		FormMetaData.get(form,true).addDataSource(block,source);
		Logger.log(Type.metadata,"Setting datasource on form: "+form.name+" block: "+block);
	}

	return(define);
}
