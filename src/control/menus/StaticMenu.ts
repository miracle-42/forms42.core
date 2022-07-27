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

import { Menu } from "./interfaces/Menu.js";
import { MenuEntry } from "./interfaces/MenuEntry.js";
import { StaticMenuEntry } from "./interfaces/StaticMenuEntry.js";

export abstract class StaticMenu implements Menu
{
	private root:StaticMenuEntry = null;
	private menu:Map<string,StaticMenuEntry> = new Map<string,StaticMenuEntry>();

	constructor(public entries:StaticMenuEntry)
	{
		this.root = entries;
		this.index("/"+this.root.id,entries);
	}

	public getRoot() : MenuEntry
	{
		return(this.root);
	}

	public getEntries(path:string) : MenuEntry[]
	{
		let entry:StaticMenuEntry = this.menu.get(path);
		if (entry != null) return(entry.entries);
		return(null);
	}

	abstract execute(path:string) : Promise<boolean>;

	public index(path:string, entry:StaticMenuEntry) : void
	{
		this.menu.set(path,entry);

		for (let i = 0; entry.entries != null && i < entry.entries.length; i++)
		{
			let npath:string = path;
			if (npath.length > 1) npath += "/";
			npath += entry.entries[i].id;
			this.index(npath,entry.entries[i]);
		}
	}
}