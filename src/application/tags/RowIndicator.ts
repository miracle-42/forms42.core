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
import { Properties } from "../Properties.js";
import { FormBacking } from "../FormBacking.js";

export class RowIndicator implements Tag
{
	public row:number = -1;
	public binding:string = null;
	public element:HTMLElement = null;

	public parse(component:any, tag:HTMLElement, attr:string) : HTMLElement
	{
		let row:string = tag.getAttribute("row");
		let binding:string = tag.getAttribute(attr);
		if (attr != Properties.BindAttr) tag.removeAttribute(attr);

		if (row == null)
			throw "@Indicator: row attribute missing";

		if (isNaN(+row))
			throw "@Indicator: row attribute is not a number";

		if (!(component instanceof Form))
			throw "@Indicator: Indicators cannot be placed on non-forms "+component.constructor.name;

		this.row = +row;
		this.element = tag;
		this.binding = binding;

		FormBacking.getViewForm(component,true)?.addIndicator(this);
		return(tag);
	}
}