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

import { Cursor } from "./Cursor.js";
import { SQLRest } from "./SQLRest.js";
import { DataType } from "./DataType.js";
import { BindValue } from "./BindValue.js";
import { Connection } from "./Connection.js";
import { Alert } from "../application/Alert.js";
import { DatabaseConnection } from "../public/DatabaseConnection.js";

export class SQLStatement
{
	private pos:number = 0;
	private sql$:string = null;
	private response$:any = null;
	private types:string[] = null;
	private cursor$:Cursor = null;
	private patch$:boolean = false;
	private message$:string = null;
	private arrayfecth$:number = 1;
	private records$:any[][] = null;
	private conn$:Connection = null;
	private columns$:string[] = null;
	private bindvalues$:Map<string,BindValue> = new Map<string,BindValue>();

	public constructor(connection:DatabaseConnection)
	{

		if (connection == null)
		{
			Alert.fatal("Cannot create sql-statement when connection is null",this.constructor.name);
			return;
		}

		this.conn$ = connection["conn$"];
	}

	public get sql() : string
	{
		return(this.sql);
	}

	public set sql(sql:string)
	{
		this.sql$ = sql;
	}

	public set patch(flag:boolean)
	{
		this.patch$ = flag;
	}

	public get columns() : string[]
	{
		return(this.columns$);
	}

	public get arrayfetch() : number
	{
		return(this.arrayfecth$);
	}

	public set arrayfetch(size:number)
	{
		this.arrayfecth$ = size;
	}

	public error() : string
	{
		return(this.message$);
	}

	public bind(name:string, value:any, type?:DataType|string) : void
	{
		this.addBindValue(new BindValue(name,value,type));
	}

	public addBindValue(bindvalue:BindValue) : void
	{
		this.bindvalues$.set(bindvalue.name?.toLowerCase(),bindvalue);
	}

	public async execute() : Promise<boolean>
	{
		if (this.sql$ == null) return(false);
		let type:string = this.sql$.trim().substring(0,6);

		let sql:SQLRest = new SQLRest();

		sql.stmt = this.sql$;
		sql.bindvalues = [...this.bindvalues$.values()];

		if (type == "select")
		{
			this.cursor$ = new Cursor();
			this.cursor$.name = "sql"+(new Date().getTime());
		}

		switch(type?.toLowerCase())
		{
			case "insert" : this.response$ = await this.conn$.insert(sql); break;
			case "update" : this.response$ = await this.conn$.update(sql); break;
			case "delete" : this.response$ = await this.conn$.delete(sql); break;
			case "select" : this.response$ = await this.conn$.select(sql,this.cursor$,this.arrayfecth$,true); break;

			default: this.response$ = await this.conn$.execute(this.patch$,sql);
		}

		let success:boolean = this.response$.success;

		if (!success)
		{
			this.cursor$ = null;
			this.message$ = this.response$.message;
		}

		if (success && type == "select")
		{
			this.types = this.response$.types;
			this.columns$ = this.response$.columns;
			this.records$ = this.parse(this.response$);
		}

		return(success);
	}

	public async fetch() : Promise<any[]>
	{
		if (!this.cursor$)
			return(null);

		if (this.records$.length > this.pos)
			return(this.records$[this.pos++]);

		if (this.cursor$.eof)
			return(null);

		this.pos = 0;
		this.response$ = await this.conn$.fetch(this.cursor$);

		if (!this.response$.success)
		{
			this.message$ = this.response$.message;
			return(null);
		}

		this.records$ = this.parse(this.response$);
		return(this.fetch());
	}

	public async close() : Promise<boolean>
	{
		let response:any = null;

		if (this.cursor$ != null && !this.cursor$.eof)
			response = await this.conn$.close(this.cursor$);

		this.cursor$ = null;
		this.records$ = null;

		if (response)
			return(response.success);

		return(true);

	}

	private parse(response:any) : any[][]
	{
		if (!response.success)
		{
			this.cursor$ = null;
			return([]);
		}

		if (response.rows.length == 0)
			return([]);

		let rows:any[][] = response.rows;
		let columns:string[] = response.columns;

		let datetypes:string[] = ["date","datetime","timestamp"];

		for (let r = 0; r < rows.length; r++)
		{
			for (let c = 0; c < columns.length; c++)
			{
				if (datetypes.includes(this.types[c].toLowerCase()))
					rows[r][c] = new Date(rows[r][c]);
			}
		}

		return(rows);
	}
}