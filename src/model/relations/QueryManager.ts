
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

import { Block } from "../Block";

export class QueryManager
{
	qid$:number = 0;
	qmaster$:Block = null;
	running$:Map<Block,object> = new Map<Block,object>();

	public getQueryID() : object
	{
		return(this.qid$ as Number);
	}

	public startNewChain() : object
	{
		this.qid$ = this.qid$ + 1;
		return(this.qid$ as Number);
	}

	public stopAllQueries() : void
	{
		this.startNewChain();
	}

	public setRunning(block:Block, qid:object) : void
	{
		this.running$.set(block,qid);
	}

	public getRunning(block:Block) : object
	{
		return(this.running$.get(block));
	}

	public hasRunning() : boolean
	{
		let active:boolean = false;

		this.running$.forEach((qid) =>
		 {if (qid) active = true});

		return(active);
	}

	public get QueryMaster() : Block
	{
		return(this.qmaster$);
	}

	public set QueryMaster(qmaster:Block)
	{
		this.qmaster$ = qmaster;
	}

	public static sleep(ms:number) : Promise<void>
	{
		return(new Promise(resolve => setTimeout(resolve,ms)));
	}
}