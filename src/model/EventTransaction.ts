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

import { Block } from "./Block.js";
import { Record } from "./Record.js";
import { EventType } from "../control/events/EventType.js";

export class EventTransaction
{
	private transactions:Map<string,Transaction> =
		new Map<string,Transaction>();

	public start(event:EventType, block:Block, record:Record) : EventType
	{
		let running:EventType = this.getTrxSlot(block);
		if (running) return(running);

		this.transactions.set(block?.name,new Transaction(event,block,record));
		return(null);
	}

	public running() : number
	{
		return(this.transactions.size);
	}

	public clear() : void
	{
		this.transactions.clear();
	}

	public finish(block:Block) : void
	{
		this.transactions.delete(block?.name);
	}

	public getEvent(block:Block) : EventType
	{
		return(this.transactions.get(block?.name)?.event);
	}

	public getRecord(block:Block) : Record
	{
		return(this.transactions.get(block?.name)?.record);
	}

	public getTrxSlot(block:Block) : EventType
	{
		let trx:Transaction = this.transactions.get(block?.name);
		return(trx?.event);
	}
}

class Transaction
{
	block:Block = null;
	record?:Record = null;
	event:EventType = null;

	constructor(event:EventType, block:Block, record:Record)
	{
		this.event = event;
		this.block = block;
		this.record = record;
	}
}
