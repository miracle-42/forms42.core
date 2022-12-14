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

export class DatabaseResponse
{
	private response$:any;
	private columns$:string[] = [];
	private converted$:boolean = false;

	constructor(response:any, columns?:string[])
	{
		this.response$ = response;

		if (columns != null)
		{
			for (let i = 0; i < columns.length; i++)
				this.columns$.push(columns[i].toLowerCase());
		}
	}

	public get failed() : boolean
	{
		return(!this.response$.success);
	}

	public getValue(column:string) : any
	{
		if (!this.response$.rows)
			return(null);

		if (typeof this.response$.rows != "object")
			return(null);

		column = column?.toLowerCase();
		let row:any = this.response$.rows[0];

		if (!Array.isArray(row) && !this.converted$)
		{
			let flat:any[] = [];
			Object.values(row).forEach((val) => flat.push(val));

			row = flat;
			this.converted$ = true;
			this.response$.rows[0] = flat;
		}

		return(row[this.columns$.indexOf(column)]);
	}
}