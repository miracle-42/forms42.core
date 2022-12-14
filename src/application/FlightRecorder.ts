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


export class FlightRecorder
{
	public static MESSAGES:number = 50;

	private static messages$:any[] = [];
	private static debug$:boolean = false;

	public static add(message:any) : void
	{
		this.messages$.push(message);
		if (this.debug$) console.log(message);
		if (this.messages$.length > this.MESSAGES) this.messages$.shift();
	}

	public static debug(message:any) : void
	{
		if (this.debug$)
		{
			console.log(message);
			this.messages$.push(message);
			if (this.messages$.length > this.MESSAGES) this.messages$.shift();
		}
	}

	public static dump() : void
	{
		this.debug$ = true;
		console.log("**** dump ****");
		this.messages$.forEach((msg) =>
			{console.log(msg);})
	}
}