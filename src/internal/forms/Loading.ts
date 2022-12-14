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

import { Internals } from "../../application/properties/Internals.js";

export class Loading
{
	public static SHORTWHILE = 1;
	private static loader = new Loading();

	private threads:number = 0;
	private displayed:boolean = false;
	private view:HTMLDivElement = null;
	private element:HTMLElement = null;
	private jobs:Map<number,Running> = new Map<number,Running>();

	public static show(message:string) : number
	{
		let thread:number = Loading.loader.start(message);
		return(thread);
	}

	public static hide(thread:number) : void
	{
		Loading.loader.remove(thread);
	}

	private start(message:string) : number
	{
		this.threads++;
		this.jobs.set(this.threads,new Running(message));
		setTimeout(() => {Loading.loader.display()},Loading.SHORTWHILE*1000);
		return(this.threads);
	}

	private display() : void
	{
		if (!this.displayed)
			this.element = document.activeElement as HTMLElement;

		if (this.getOldest() < Loading.SHORTWHILE * 1000)
		{
			setTimeout(() => {Loading.loader.display()},Loading.SHORTWHILE*1000);
			return;
		}

		if (!this.displayed)
		{
			this.displayed = true;

			this.watch();
			this.prepare();

			document.body.appendChild(this.view);
			this.view.focus();
		}
	}

	private remove(thread:number) : void
	{
		this.threads--;
		this.jobs.delete(thread);

		if (this.displayed && this.threads == 0)
		{
			this.view.remove();
			this.element?.focus();
			this.displayed = false;
		}
	}

	private prepare() : void
	{
		if (this.view == null)
		{
			this.view = document.createElement("div") as HTMLDivElement;

			this.view.innerHTML = Loading.page;
			Internals.stylePopupWindow(this.view);

			this.view = this.view.childNodes.item(1) as HTMLDivElement;
			this.view.style.zIndex = Number.MAX_SAFE_INTEGER+"";
		}
	}

	private getOldest() : number
	{
		let oldest:number = 0;
		let now:Date = new Date();

		this.jobs.forEach((job) =>
		{
			let spend:number = now.getTime() - job.start.getTime();
			if (spend > oldest) oldest = spend;
		});

		return(oldest);
	}

	private watch() : void
	{
		this.jobs.forEach((job) =>
		{
			let now:Date = new Date();

			if (now.getTime() - job.start.getTime() > Loading.SHORTWHILE * 5000)
				console.log("running "+job.message);
		})

		if (this.jobs.size > 0)
			setTimeout(() => {this.watch()}, Loading.SHORTWHILE * 10000);
	}

	public static page:string =
	`
		<div tabindex="-1" style="position:absolute; top:0; left:0; width: 100%; height: 100%">
			<div name="loading"></div>
		</div>
	`
}

class Running
{
	public start:Date = new Date();
	constructor(public message:string) {}
}