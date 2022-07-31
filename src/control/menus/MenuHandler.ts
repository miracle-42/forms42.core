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

import { Menu } from './interfaces/Menu.js';
import { MenuEntry } from './interfaces/MenuEntry.js';
import { MenuOptions } from './interfaces/MenuOptions.js';


export class MenuHandler implements EventListenerObject
{
	private menu:Menu = null;
	private levcls:string = null;
	private menucls:string = null;
	private linkcls:string = null;
	private target:HTMLElement = null;
	private options:MenuOptions = null;
    private open:Set<string> = new Set<string>();

	constructor(menu:Menu, target:HTMLElement, options?:MenuOptions)
	{
		this.menu = menu;
		this.target = target;
		this.options = options;
		if (options == null) this.options = {}

		if (this.options.classes == null) this.options.classes = {};
		if (this.options.skiproot == null) this.options.skiproot = false;
		if (this.options.singlepath == null) this.options.singlepath = true;
		if (this.options.classes.common == null) this.options.classes.common = "";
		if (this.options.classes.open == null) this.options.classes.open = "menu-open";
		if (this.options.classes.menuitem == null) this.options.classes.menuitem = "menu-item";
		if (this.options.classes.linkitem == null) this.options.classes.linkitem = "link-item";
		if (this.options.classes.container == null) this.options.classes.container = "menu-items";

		this.levcls = (this.options.classes.common + " " + this.options.classes.container).trim();
		this.menucls = (this.options.classes.common + " " + this.options.classes.menuitem).trim();
		this.linkcls = (this.options.classes.common + " " + this.options.classes.linkitem).trim();
	}

	public show() : void
	{
		let start:MenuEntry[] = [this.menu.getRoot()];

		if (this.options.skiproot)
			start = this.menu.getEntries("/"+start[0].id);

		this.target.innerHTML = this.showEntry(start);

		let entries:NodeList = this.target.querySelectorAll("a");
		entries.forEach((link) => {link.addEventListener("click",this);});
	}

	public hide() : void
	{
		this.target.innerHTML = "";
	}

	public toggle(path:string) : void
	{
		let open:boolean = this.open.has(path);

		if (this.options.singlepath)
		{
			this.open.clear();

			let opath:string = "";
			let mpath:string[] = this.split(path);

			for (let i = 0; i < mpath.length; i++)
			{
				opath += "/" + mpath[i];
				this.open.add(opath);
			}

			if (open)
				this.open.delete(path);
		}
		else
		{
			if (!open) this.open.add(path);
			else	   this.open.delete(path);
		}

		this.show();
	}

	private showEntry(entries:MenuEntry[], path?:string, page?:string) : string
	{
		if (page == null) page = "";
		if (path == null) path = "/";
		if (path.length > 1) path += "/";
		if (entries == null) return(page);

		let empty:boolean = true;

		for (let i = 0; i < entries.length; i++)
		{
			if (!entries[i].disabled)
			{
				empty = false;
				break;
			}
		}

		if (empty) return(page);

		page += "<div class='"+this.levcls+"'>";
		for (let i = 0; i < entries.length; i++)
		{
			if (entries[i].disabled != null && entries[i].disabled)
				continue;

			let cmd:string = "";
			let classes:string = this.menucls;

			if (entries[i].command)
			{
				classes = this.linkcls;
				cmd = "command='"+entries[i].command+"'";
			}

			let npath:string = path+entries[i].id;

			if (this.open.has(npath))
			{
				classes += " "+this.options.classes.open;
				page += "<a class='"+classes+"' path='"+npath+"' "+cmd+">"+entries[i].text+"</a>";
				page = this.showEntry(this.menu.getEntries(npath),npath,page);
			}
			else
			{
				page += "<a class='"+classes+"' path='"+npath+"' "+cmd+">"+entries[i].text+"</a>";
			}

		}
		page += "</div>";

		return(page);
	}

	public async handleEvent(link:Event)
	{
		let elem:HTMLAnchorElement = link.target as HTMLAnchorElement;
		let path:string = elem.getAttribute("path");

		if (!elem.hasAttribute("command")) this.toggle(path);
		else if (await this.menu.execute(path)) this.hide();
	}

    private split(path:string) : string[]
    {
        let parts:string[] = [];
        let split:string[] = path.trim().split("/");

        split.forEach((elem) =>
        {
			elem = elem.trim();
            if (elem.length > 0) parts.push(elem);
        });

        return(parts);
    }
}