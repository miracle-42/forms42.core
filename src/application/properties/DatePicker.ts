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

export class DatePicker
{
	public static datePickerStyle:string = 
	`
		width: 180px;
	`;

	public static datePickerDateStyle:string = 
	`
		margin-top: 10px;
    	display: flex;
    	justify-content: center;
	`;

	public static datePickerMonthStyle:string =
	`
		display:flex;
		font-size: 13px;
		margin-bottom:10px;
		align-items: center;
		justify-content: space-between;
		border-bottom: 2px solid rgb(155, 155, 155);
	`;

	public static datePickerMthTextStyle:string =
	`
		margin-top:0px;
	`

	public static datePickerArrowStyle:string =
	`
		width: 35px;
		height:35px;
		display:flex;
		cursor: default;
		font-size: 20px;
		align-items: center;
		justify-content: center;
	`;

	public static datePickerWeekStyle:string =
	`
		display:grid;
		grid-template-columns: repeat(7,1fr);
	`;

	public static datePickerDayStyle:string =
	`
		height:15px;
		display:flex;
		font-size: 12px;
		cursor: default;
		align-items: center;
		justify-content: center;
	`;

	public static datePickerSelectedDay:string =
	`
		background-color: #a8a8a8;
	`;

	public static datePickerSelectedDate:string =
	`
		width:100%;
		height: 100%;
		display:flex;
		font-size: 14px;
		align-items: center;
		justify-content: center;
	`;

	public static styleDatePicker(view:HTMLElement) : void
	{
		let body:HTMLElement = view.querySelector("div[name='date-picker']")
		if(body)
		{
			let mth:HTMLElement = body.querySelector("div[name='mth']");
			let date:HTMLElement = body.querySelector("div[name='date']");
			let month:HTMLElement = body.querySelector("div[name='month']");
			let day:NodeListOf<HTMLElement>= body.querySelectorAll("div[name='day']");
			let week:NodeListOf<HTMLElement> = body.querySelectorAll("div[name='week']");
			let arrow:NodeListOf<HTMLElement>= body.querySelectorAll("div[name='prev'],div[name='next']");

			if (body && DatePicker.datePickerStyle) body.style.cssText = DatePicker.datePickerStyle;
			
			if (date && DatePicker.datePickerStyle) date.style.cssText = DatePicker.datePickerDateStyle;
			if(mth && DatePicker.datePickerMthTextStyle) mth.style.cssText = DatePicker.datePickerMthTextStyle;
			if(month && DatePicker.datePickerMonthStyle) month.style.cssText = DatePicker.datePickerMonthStyle;

			if (DatePicker.datePickerDayStyle) day.forEach((day) => day.style.cssText = DatePicker.datePickerDayStyle);
			if (DatePicker.datePickerWeekStyle) week.forEach((week) => week.style.cssText = DatePicker.datePickerWeekStyle);
			if (DatePicker.datePickerArrowStyle) arrow.forEach((arrow) => arrow.style.cssText = DatePicker.datePickerArrowStyle);
		}

	}
}
