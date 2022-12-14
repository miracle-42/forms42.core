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

import { Case } from "./Case.js";
import { BindValue } from "../database/BindValue.js";
import { Filter } from "../model/interfaces/Filter.js";
import { DataSource } from "../model/interfaces/DataSource.js";

export interface LOVFilterPreProcessor
{
    (filter?:string) : string;
}


export interface ListOfValues
{
	rows?:number;
	title?:string;
	cssclass?:string;

	inQueryMode?:boolean;
	inReadOnlyMode?:boolean;

	datasource:DataSource;
	filter?:Filter|Filter[];
	bindvalue?:BindValue|BindValue[];

	filterCase?:Case;
	filterPrefix?:string;
	filterPostfix?:string;
	filterMinLength?:number;
	filterInitialValueFrom?:string;
	filterPreProcesser?:LOVFilterPreProcessor;

	sourcefields:string|string[];
	targetfields:string|string[];
	displayfields:string|string[];
}