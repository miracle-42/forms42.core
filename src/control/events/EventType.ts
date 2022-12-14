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

/*
	OBS !!
	Pre- On- and When- cannot start new transaction in same block
*/

export enum EventType
{
	Key,
	Mouse,

	PreCommit,
	PostCommit,

	PreRollback,
	PostRollback,

	OnTransaction,

	Connect,
	Disconnect,

	OnCloseForm,
	PostViewInit,
	PostFormFocus,

	PreForm,
	PostForm,

	PreBlock,
	PostBlock,

	PreRecord,
	PostRecord,
	OnNewRecord,

	PreField,
	PostField,

	OnEdit,
	WhenValidateField,
	PostValidateField,

	OnFetch,
	PreQuery,
	PostQuery,

	PreInsert,
	PostInsert,

	PreUpdate,
	PostUpdate,

	PreDelete,
	PostDelete,

	OnLockRecord,
	WhenValidateRecord
}