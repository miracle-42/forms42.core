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

import { Filter } from './Filter.js';
import { Record } from '../Record.js';

export interface DataSource
{
	arrayfecth:number;

	queryable:boolean;
	insertable:boolean;
	updateable:boolean;
	deleteable:boolean;

	getFilters() : Filter[];
	addFilter(filter:Filter) : void;
	setFilters(filters:Filter[]) : void;

	closeCursor() : void;
	post() : Promise<boolean>;
	query() : Promise<boolean>;
	fetch() : Promise<Record[]>;
	refresh(record:Record) : Promise<void>;
	lock(record:Record) : Promise<boolean>;
	insert(record:Record) : Promise<boolean>;
	update(record:Record) : Promise<boolean>;
	delete(record:Record) : Promise<boolean>;
}