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
import { Class } from '../../types/Class.js';
import { Components } from '../Components.js';
import { FormsModule } from '../FormsModule.js';


export interface Component
{
	path:string;
	class:Class<any>;
}

function isComponent(object: any) : object is Component
{
	return('path' in object && 'class' in object);
}

export const FormsPathMapping = (components:(Class<any> | Component)[]) =>
{
	function define(_comp_:Class<FormsModule>)
	{
		components.forEach(element =>
		{
			let path:string = null;
			let clazz:Class<any> = null;

			if (isComponent(element))
			{
				clazz = (element as Component).class;
				path = (element as Component).path.toLowerCase();
			}
			else
			{
				clazz = element as Class<any>;
				path = (element as Class<any>).name.toLowerCase();
			}

			Components.classmap.set(path,clazz);
			Components.classurl.set(clazz.name,path);

			Logger.log(Type.classloader,"Loading class: "+clazz.name+" into position: "+path);
		});
	 }

	 return(define);
}
