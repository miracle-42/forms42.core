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

import { Tag } from "./Tag.js";
import { Form } from "../../public/Form.js";
import { Class } from "../../types/Class.js";
import { Properties } from "../Properties.js";
import { Form as InternalForm } from "../../internal/Form.js";
import { FieldInstance } from "../../view/fields/FieldInstance.js";

export class FromAttribute implements Tag
{
	public parse(component:any, tag:HTMLElement, attr:string) : string|HTMLElement|HTMLElement[]
	{
		if (component == null)
			throw "@Field: component is null";

		if (!(component instanceof Form) && !(component instanceof InternalForm))
			throw "@Field: Fields cannot be placed on non-forms "+component.constructor.name;

		let binding:string = tag.getAttribute(attr);

		if (binding == null)
		{
			attr = Properties.AttributePrefix+attr;
			tag.setAttribute(Properties.BindAttr,tag.getAttribute(attr));
		}

		let type:string = tag.getAttribute("type")?.toLowerCase();
		let btag:Class<Tag> = Properties.FieldTypeLibrary.get(type);

		if (btag != null)
			return(new btag().parse(component,tag,attr));

		if (attr != Properties.BindAttr) tag.removeAttribute(attr);
		let field:FieldInstance = new FieldInstance(component,tag);

		return(field.element);
	}
}