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

import { Between } from "./Between.js";


export class DateInterval extends Between
{
	public Day(date?:Date) : DateInterval
	{
		if (date == null)
			date = new Date();

		let fr:Date = date;
		let to:Date = new Date(fr.getTime());

		fr.setHours(0,0,0,0);
		to.setHours(23,59,59,999);

		super.constraint = [fr,to];
		return(this);
	}

	public Week(date?:Date, start?:number) : DateInterval
	{
		if (start == null) start = 0;
		if (date == null) date = new Date();

		let f:number = date.getDate() - date.getDay();
		let l:number = f + 6;

		f += start;
		l += start;

		let fr:Date = new Date(date.setDate(f));
		let to:Date = new Date(date.setDate(l));

		fr.setHours(0,0,0,0);
		to.setHours(23,59,59,999);

		super.constraint = [fr,to];
		return(this);
	}

	public Month(date?:Date) : DateInterval
	{
		if (date == null)
			date = new Date();

		let m:number = date.getMonth();
		let y:number = date.getFullYear();

		let fr:Date = new Date(y,m,1);
		let to:Date = new Date(y,m+1,1);

		to = new Date(to.getTime() - 86400);

		fr.setHours(0,0,0,0);
		to.setHours(23,59,59,999);

		super.constraint = [fr,to];
		return(this);
	}

	public Year(date?:Date) : DateInterval
	{
		if (date == null)
			date = new Date();

		let y:number = date.getFullYear();

		let fr:Date = new Date(y,1,1);
		let to:Date = new Date(y,11,31);

		fr.setHours(0,0,0,0);
		to.setHours(23,59,59,999);

		super.constraint = [fr,to];
		return(this);
	}
}