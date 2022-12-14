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

import { SQLRest } from "./SQLRest.js";
import { BindValue } from "./BindValue.js";
import { Record } from "../model/Record.js";
import { Filters } from "../model/filters/Filters.js";
import { Filter } from "../model/interfaces/Filter.js";
import { Parameter, ParameterType } from "./Parameter.js";
import { FilterStructure } from "../model/FilterStructure.js";

export class SQLRestBuilder
{
	public static proc(name:string, parameters:Parameter[], retparam:Parameter) : SQLRest
	{
		let plist:string = "";
		let param:Parameter = null;
		let bindv:BindValue = null;
		let bindvalues:BindValue[] = [];

		if (retparam != null)
		{
			bindv = new BindValue(retparam.name,retparam.value,retparam.dtype);
			bindv.outtype = true;
			bindvalues.push(bindv);
		}

		for (let i = 0; i < parameters.length; i++)
		{
			param = parameters[i];
			if (i > 0) plist += ",";

			if (param.ptype == ParameterType.in) plist += ":";
			else											 plist += "&";

			plist += param.name;
			bindv = new BindValue(param.name,param.value,param.dtype);

			if (param.ptype == ParameterType.out)
				bindv.outtype = true;

			bindvalues.push(bindv);
		}

		let stmt:string = name+"("+plist+")";

		if (retparam != null)
			stmt = retparam.name+" = " + stmt;

		let parsed:SQLRest = new SQLRest();

		parsed.stmt = stmt;
		parsed.bindvalues = bindvalues;

		return(parsed);
	}

	public static select(table:string, columns:string[], filter:FilterStructure, order:string) : SQLRest
	{
		let parsed:SQLRest =
			new SQLRest();

		let stmt:string = "select ";

		for (let i = 0; i < columns.length; i++)
		{
			if (i > 0) stmt += ",";
			stmt += columns[i];
		}

		stmt += " from "+table;

		if (filter && !filter.empty)
			stmt += " where " + filter.asSQL();

		if (order)
			stmt += " order by "+order;

		parsed.stmt = stmt;
		parsed.bindvalues = filter?.getBindValues();

		return(parsed);
	}

	public static finish(sql:string, filter:FilterStructure, bindings:BindValue[], order:string) : SQLRest
	{
		let parsed:SQLRest = new SQLRest();

		parsed.stmt = sql;

		if (filter && !filter.empty)
			parsed.stmt += " and " + filter.asSQL();

		if (order)
			parsed.stmt += " order by "+order;

		parsed.bindvalues = filter?.getBindValues();
		if (bindings) parsed.bindvalues.push(...bindings);
		
		return(parsed);
	}

	public static lock(table:string, pkey:string[], columns:string[], record:Record) : SQLRest
	{
		let parsed:SQLRest =
			new SQLRest();

		let stmt:string = "select ";

		for (let i = 0; i < columns.length; i++)
		{
			if (i > 0) stmt += ",";
			stmt += columns[i];
		}

		stmt += " from "+table+" where ";

		let filters:FilterStructure = new FilterStructure();

		for (let i = 0; i < pkey.length; i++)
		{
			let filter:Filter = Filters.Equals(pkey[i]);
			let value:any = record.getInitialValue(pkey[i]);
			filters.and(filter.setConstraint(value),pkey[i]);
		}

		stmt += filters.asSQL();
		stmt += " for update nowait";

		parsed.stmt = stmt;
		parsed.bindvalues = filters.getBindValues();

		return(parsed);
	}

	public static refresh(table:string, pkey:string[], columns:string[], record:Record) : SQLRest
	{
		let parsed:SQLRest =
			new SQLRest();

		let stmt:string = "select ";

		for (let i = 0; i < columns.length; i++)
		{
			if (i > 0) stmt += ",";
			stmt += columns[i];
		}

		stmt += " from "+table+" where ";

		let filters:FilterStructure = new FilterStructure();

		for (let i = 0; i < pkey.length; i++)
		{
			let filter:Filter = Filters.Equals(pkey[i]);
			let value:any = record.getInitialValue(pkey[i]);
			filters.and(filter.setConstraint(value),pkey[i]);
		}

		stmt += filters.asSQL();

		parsed.stmt = stmt;
		parsed.bindvalues = filters.getBindValues();

		return(parsed);
	}

	public static fetch(cursor:string) : SQLRest
	{
		let parsed:SQLRest = new SQLRest();
		parsed.stmt = '{"cursor": "'+ cursor+'" }';
		return(parsed);
	}

	public static insert(table:string, columns:string[], record:Record, returncolumns:string[]) : SQLRest
	{
		let binds:BindValue[] = [];
		let parsed:SQLRest = new SQLRest();

		let stmt:string = "insert into "+table+"(";

		for (let i = 0; i < columns.length; i++)
		{
			if (i > 0) stmt += ",";
			stmt += columns[i];
		}

		stmt += ") values (";

		for (let i = 0; i < columns.length; i++)
		{
			if (i > 0) stmt += ",";
			stmt += ":"+columns[i];

			binds.push(new BindValue(columns[i],record.getValue(columns[i])))
		}

		stmt += ")";

		if (returncolumns != null && returncolumns.length > 0)
		{
			stmt += " returning ";
			parsed.returnclause = true;

			for (let i = 0; i < returncolumns.length; i++)
			{
				if (i > 0) stmt += ",";
				stmt += returncolumns[i];
			}
		}

		parsed.stmt = stmt;
		parsed.bindvalues = binds;

		return(parsed);
	}

	public static update(table:string, pkey:string[], columns:string[], record:Record, returncolumns:string[]) : SQLRest
	{
		let idx:number = 0;
		let value:any = null;
		let bv:BindValue = null;
		let binds:BindValue[] = [];

		let parsed:SQLRest = new SQLRest();
		let dirty:string[] = record.getDirty();
		let filters:FilterStructure = new FilterStructure();

		let cnames:string[] = [];
		columns.forEach((col) => cnames.push(col.toLowerCase()));

		let stmt:string = "update "+table+" set ";

		for (let i = 0; i < dirty.length; i++)
		{
			idx = cnames.indexOf(dirty[i]);
			value = record.getValue(dirty[i]);

			if (i > 0) stmt += ", ";
			stmt += columns[idx] + " = :b"+i;

			bv = new BindValue("b"+i,value);
			bv.column = columns[idx];

			binds.push(bv);
		}

		for (let i = 0; i < pkey.length; i++)
		{
			let filter:Filter = Filters.Equals(pkey[i]);
			let value:any = record.getInitialValue(pkey[i]);
			filters.and(filter.setConstraint(value),pkey[i]);
		}

		stmt += " where "+filters.asSQL();

		if (returncolumns != null && returncolumns.length > 0)
		{
			stmt += " returning ";
			parsed.returnclause = true;

			for (let i = 0; i < returncolumns.length; i++)
			{
				if (i > 0) stmt += ",";
				stmt += returncolumns[i];
			}
		}

		parsed.stmt = stmt;
		parsed.bindvalues = filters.getBindValues();
		parsed.bindvalues.push(...binds);

		return(parsed);
	}

	public static delete(table:string, pkey:string[], record:Record, returncolumns:string[]) : SQLRest
	{
		let parsed:SQLRest = new SQLRest();
		let stmt:string = "delete from "+table+" where ";

		let filters:FilterStructure = new FilterStructure();

		for (let i = 0; i < pkey.length; i++)
		{
			let filter:Filter = Filters.Equals(pkey[i]);
			let value:any = record.getInitialValue(pkey[i]);
			filters.and(filter.setConstraint(value),pkey[i]);
		}

		stmt += filters.asSQL();


		if (returncolumns != null && returncolumns.length > 0)
		{
			stmt += " returning ";
			parsed.returnclause = true;

			for (let i = 0; i < returncolumns.length; i++)
			{
				if (i > 0) stmt += ",";
				stmt += returncolumns[i];
			}
		}

		parsed.stmt = stmt;
		parsed.bindvalues = filters.getBindValues();

		return(parsed);
	}

	public static subquery(table:string, mstcols:string[], detcols:string[], filter:FilterStructure) : SQLRest
	{
		let sql:SQLRest = new SQLRest();

		sql.stmt = "(";

		for (let i = 0; i < mstcols.length; i++)
		{
			if (i > 0) sql.stmt += ",";
			sql.stmt += mstcols[i];
		}

		sql.stmt += ") in (select ";

		for (let i = 0; i < detcols.length; i++)
		{
			if (i > 0) sql.stmt += ",";
			sql.stmt += detcols[i];
		}

		sql.stmt += " from "+table;

		if (filter && !filter.empty)
			sql.stmt += " where " + filter.asSQL();

		sql.stmt += ")";
		sql.bindvalues = filter?.getBindValues();

		return(sql);
	}
}