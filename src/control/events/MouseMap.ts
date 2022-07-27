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

import { BrowserEvent } from "../../view/BrowserEvent.js";

export enum MouseMap
{
	click,
	dblclick,
	contextmenu
}

export class MouseMapParser
{
	public static parseBrowserEvent(event:BrowserEvent) : MouseMap
	{
		if (event.type == "click") return(MouseMap.click);
		else if (event.type == "dblclick") return(MouseMap.dblclick);
		else if (event.type == "contextmenu") return(MouseMap.contextmenu);
		return(null);
	}
}