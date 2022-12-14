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

import { KeyMap, KeyMapping } from './KeyMap.js';
import { FormEvent, FormEvents } from './FormEvents.js';
import { MouseMap, MouseMapParser } from './MouseMap.js';
import { BrowserEvent } from '../../view/BrowserEvent.js';
import { FormBacking } from '../../application/FormBacking.js';
import { FlightRecorder } from '../../application/FlightRecorder.js';


export class ApplicationHandler implements EventListenerObject
{
	public static contextmenu:boolean = false;
	public static instance:ApplicationHandler;

	public static init() : void
	{
		ApplicationHandler.instance = new ApplicationHandler();
	}

	public static addContextListener() : void
	{
		if (!ApplicationHandler.contextmenu)
		{
			ApplicationHandler.contextmenu = true;
			document.addEventListener("contextmenu",ApplicationHandler.instance);
		}
	}

	private constructor()
	{
		this.addEvents();
	}

	private event:BrowserEvent = BrowserEvent.get();
	public async handleEvent(event:any) : Promise<void>
	{
      let bubble:boolean = false;
		this.event.setEvent(event);

		if (this.event.type == "wait")
			await this.event.wait();

		if (this.event.waiting)
			return;

		if (this.event.accept || this.event.cancel)
			bubble = true;

		if (this.event.bubbleMouseEvent)
			bubble = true;

		if (this.event.onScrollUp)
			bubble = true;

		if (this.event.onScrollDown)
			bubble = true;

		if (this.event.onCtrlKeyDown)
			bubble = true;

		if (this.event.onFuncKey)
			bubble = true;

		this.event.preventDefault();

		if (bubble)
		{
			if (this.event.type?.startsWith("key"))
			{
				let key:KeyMap = KeyMapping.parseBrowserEvent(this.event);
				let frmevent:FormEvent = FormEvent.KeyEvent(null,null,key);

				if (await FormEvents.raise(frmevent))
					this.keyhandler(key);
			}
			else
			{
				let mevent:MouseMap = MouseMapParser.parseBrowserEvent(this.event);
				let frmevent:FormEvent = FormEvent.MouseEvent(null,mevent);

				if (await FormEvents.raise(frmevent))
					this.mousehandler(mevent);
			}
		}
	}

	public async keyhandler(key:KeyMap) : Promise<boolean>
	{
		if (key == KeyMap.dump)
		{
			FlightRecorder.dump();
			return(true);
		}

		if (key == KeyMap.commit)
			return(FormBacking.save());

		if (key == KeyMap.rollback)
			return(FormBacking.undo());

		return(true);
	}

	public async mousehandler(_mevent:MouseMap) : Promise<boolean>
	{
		return(true);
	}

	private addEvents() : void
	{
		document.addEventListener("keyup",this);
		document.addEventListener("keydown",this);
		document.addEventListener("keypress",this);

		document.addEventListener("click",this);
		document.addEventListener("dblclick",this);
	}
}