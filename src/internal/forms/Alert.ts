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

import { Form } from "../Form.js";
import { KeyMap } from "../../control/events/KeyMap.js";
import { MouseMap } from "../../control/events/MouseMap.js";
import { EventType } from "../../control/events/EventType.js";
import { Internals } from "../../application/properties/Internals.js";

export class Alert extends Form
{
	public static WIDTH:number = 300;
	public static HEIGHT:number = null;
	private closeButton:HTMLElement = null;

	public static BlurStyle:string =
	`
	`;

	constructor()
	{
		super(Alert.page);

		this.addEventListener(this.initialize,{type: EventType.PostViewInit});

		this.addEventListener(this.close,
		[
			{type: EventType.Key, key: KeyMap.enter},
			{type: EventType.Key, key: KeyMap.escape},
			{type: EventType.Key, key: KeyMap.space},
		]);

		this.addEventListener(this.closeAlert,
			{type:EventType.Mouse, mouse: MouseMap.click}
		);
	}

	private async closeAlert(): Promise<boolean>
	{
		setTimeout(() => {this.closeButton.focus()},5);
		return(true);
	}

	private async initialize() : Promise<boolean>
	{
		let view:HTMLElement = this.getView();
		let msg:string = this.parameters.get("message");
		let title:string = this.parameters.get("title");
		this.closeButton = view.querySelector('button[name="close"]');

		let fatal:boolean = this.parameters.get("fatal");
		let warning:boolean = this.parameters.get("warning");

		Internals.stylePopupWindow(view,title,Alert.HEIGHT,Alert.WIDTH);

	
		// Block everything else
		let block:HTMLElement = view.querySelector('div[id="block"]');

		block.style.top = "0";
		block.style.left = "0";
		block.style.position = "fixed";
		block.style.width = document.body.offsetWidth+"px";
		block.style.height = document.body.offsetHeight+"px";
		this.setValue("alert","msg",msg);
		setTimeout(() => {this.closeButton.focus()},5);
		return(true);
	}

	public static page:string =
		`<div id="block"></div>` +

		Internals.header +
		`
		<div name="popup-body">
			<div name="msg" from="alert"></div>
		</div>
		<div name="lowerright">
			<div name="buttonarea">
				<button name="close" onClick="this.close()">Ok</button>
			</div>
		</div>
		`
	+ 	Internals.footer;
}