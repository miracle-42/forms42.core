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

import { Class } from "../../types/Class.js";
import { Radio } from "./implementations/Radio.js";
import { Input } from "./implementations/Input.js";
import { Select } from "./implementations/Select.js";
import { Display } from "./implementations/Display.js";
import { CheckBox } from "./implementations/CheckBox.js";
import { Textarea } from "./implementations/Textarea.js";
import { FieldImplementation } from "./interfaces/FieldImplementation.js";


export class FieldTypes
{
	private static implementations:Map<string,Class<FieldImplementation>> =
		FieldTypes.init();


	private static init() : Map<string,Class<FieldImplementation>>
	{
		let map:Map<string,Class<FieldImplementation>> =
			new Map<string,Class<FieldImplementation>>();

		map.set("input",Input);
		map.set("select",Select);
		map.set("textarea",Textarea);

		return(map);
	}

	public static get(tag:string, type?:string) : Class<FieldImplementation>
	{
		let impl:Class<FieldImplementation> = FieldTypes.implementations.get(tag.toLowerCase());
		if (impl == null) return(Display);

		if (impl == Input && type?.toLowerCase() == "radio")
			return(Radio);

		if (impl == Input && type?.toLowerCase() == "checkbox")
			return(CheckBox);

		return(impl);
	}
}