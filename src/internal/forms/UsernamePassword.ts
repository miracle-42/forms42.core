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
import { EventType } from "../../control/events/EventType.js";
import { Internals } from "../../application/properties/Internals.js";

export class UsernamePassword extends Form
{
    public title:string = null;
    public username:string = null;
    public password:string = null;
	 public accepted:boolean = false;

	constructor()
	{
		super(UsernamePassword.page);

		this.addEventListener(this.initialize,{type: EventType.PostViewInit});
		this.addEventListener(this.close,{type: EventType.Key, key: KeyMap.escape});

		this.addEventListener(this.accept,
		[
			{type: EventType.Key, key:KeyMap.enter}
		]);
   }

	public async cancel(): Promise<boolean>
	{
		this.username = null;
		this.password = null;
		await this.close();
		return(false);
	}

	private async accept():Promise<boolean>
	{
		this.accepted = true;
		this.username = this.getValue("login","username");
		this.password = this.getValue("login","password");
		await this.close();
		return(false);
	}

	private async initialize() : Promise<boolean>
	{
		let view:HTMLElement = this.getView();

		this.setValue("login","username",this.username);
		this.setValue("login","password",this.password);

		if (this.title == null)
			this.title = "Login";

		Internals.stylePopupWindow(view,this.title);
		return(true);
	}

	public static page: string =
	Internals.header +
	`
   <div name="popup-body">
		<div name="loginimage"></div>
		<div name="login">
			<label for="username">Username</label>
			<input from="login" tabindex="0" name="username" size="20"/>
			<label for="password">Password</label>
			<input type="password" tabindex="1" from="login" name="password" size="20"/>
		</div>
		<div name="loginbutton">
			<button name="cancel" onclick="this.cancel()" tabindex="2">Cancel</button>
			<button name="ok"     onclick="this.accept()" tabindex="3">Ok</button>
		</div>
	</div>
   ` + Internals.footer
}