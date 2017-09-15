/*eslint
    max-len: ["error", 100]
    no-unused-vars: ["error", { "varsIgnorePattern": "[A-Z][a-z][a-zA-Z]+" }]
*/
/*global
    React ReactDOM window
*/
(function () {
    "use strict";


    // date day config options for calendar day cells
    const dayValueConfig = function (date, calendarMonth) {
        // the state property is used for setting the class on out of scope dates
        const state = date.getMonth() === calendarMonth
            ? "active"
            : "inactive";

        return {
            date: date.getDate(),
            key: date.getTime().toString(),
            state
        };
    };

    /*
        The matrix creates a 2d array
        consiting of 7 element arrays for each full week in the view
    */
    const matrixDays = function _viewDays(date, month, days) {
        date.setDate(date.getDate() + 1);

        return (date.getMonth() === month || date.getDay() !== 1)
            ? _viewDays(date, month, days.concat(dayValueConfig(date, month)))
            : days;
    };

    const matrixWeeks = function _viewWeeks(days, weeks, weekday) {
        const week = days.slice(weekday, weekday + 7);
        return week.length === 0
            ? weeks
            : _viewWeeks(days, weeks.concat([week]), weekday + 7);
    };

    const dateNow = function (date) {
        return {
            year: date.getFullYear(),
            month: date.getMonth()
        };
    };

    const parameters = function (date) {
        const [month, year] = date.split("/");

        // validate date parameter as mm/yyyy
        // else return now
        return (
            (/^(?:0[1-9]|1[012])$/).test(month) &&
                (/^(?:19|20|21)[0-9]{2}$/).test(year)
        )
            ? {year, month: (+month - 1)}
            : dateNow(new Date());
    };

    // week row day cell
    const DayValueCell = function (props) {
        const {date, state} = props;

        return (
            <div className={`calendar-day ${state}`}>
                {date}
            </div>
        );
    };

    // week row
    const weekRow = function (week, index) {
        return (
            <div className="calendar-week" key={`week-${index}`}>
                {week.map((day) => <DayValueCell {...day}/>)}
            </div>
        );
    };

    // day of the week heder row cell
    const dayHeaderCell = function (name) {
        return <div className="calendar-day" key={name}>{name}</div>;
    };

    // day of the week header row
    const DayHeaderRow = function (props) {
        return (
            <div className="calendar-week header">
                {props.dayNames.map(dayHeaderCell)}
            </div>
        );
    };

    // format the url hash as mm/yyyy
    const urlDateHash = function (date) {
        return "#" + String("0" + (date.getMonth() + 1)).slice(-2) +
            "/" + date.getFullYear();
    };

    const monthYearDescription = function (date, months) {
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    // next and previous anchors
    const MonthDirectionControl = function ({currentDate, direction, months}) {
        const ctrlDate = new Date(currentDate.getTime());
        ctrlDate.setMonth(ctrlDate.getMonth() + direction);

        const dir = direction === 1
            ? "right"
            : "left";

        return (
            <a className={`month-control ${dir}`} href={urlDateHash(ctrlDate)}
                    title={monthYearDescription(ctrlDate, months)}>
                <img src={`/circle-${dir}.png`}/>
            </a>
        );
    };

    // recursively create year control options
    const yearSelectOption = function _yearSelectOption(options, year, last) {
        return year === last
            ? options
            : _yearSelectOption(
                options.concat(
                    <option key={year} value={year}>{year}</option>
                ),
                year + 1,
                last
            );
    };

    // year select control component
    class YearSelectControl extends React.Component {
        constructor(props) {
            super(props);
        }

        changeHandler(event) {
            window.location.hash = urlDateHash(
                new Date(
                    event.target.value,
                    window.document.getElementById("month-select-ctrl").value
                )
            );
        }

        render() {
            const currentYear = this.props.currentDate.getFullYear();

            return (
                <select id="year-select-ctrl" onChange={this.changeHandler}
                        value={currentYear}>
                    {yearSelectOption([], currentYear- 50, currentYear + 51)}
                </select>
            );
        }
    }

    // month select control component
    class MonthSelectControl extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                options: props.months.map(
                    (name, i) => <option key={name} value={i}>{name}</option>
                )
            };
        }

        changeHandler(event) {
            window.location.hash = urlDateHash(
                new Date(
                    window.document.getElementById("year-select-ctrl").value,
                    event.target.value
                )
            );
        }

        render() {
            return (
                <select id="month-select-ctrl" onChange={this.changeHandler}
                        value={this.props.currentDate.getMonth()}>
                    {this.state.options}
                </select>
            );
        }
    }

    // calendar banner containing naviagtion controls
    const CalendarHeader = function ({date, months}) {
        const options = {currentDate: date, months};
        return (
            <header className="calendar-banner">
                <div className="banner-left">
                    <MonthDirectionControl {...Object.assign({direction: -1}, options)}/>
                </div>
                <div className="banner-centre">
                    <div>
                        <MonthSelectControl {...options}/>
                        <YearSelectControl currentDate={options.currentDate}/>
                    </div>
                </div>
                <div className="banner-right">
                    <MonthDirectionControl {...Object.assign({direction: 1}, options)}/>
                </div>
            </header>
        );
    };

    // main calendar component
    class Calendar extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                calendarDate: new Date(1970, 1, 1),
                dayNames: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ],
                monthNames: [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ],
                displayDate: new Date()
            };
        }

        render() {
            const {calendarDate, dayNames, monthNames, displayDate} = this.state;
            const {month, year} = parameters(window.location.hash.substring(1));

            // the calendarDate object holds the target month / year
            calendarDate.setFullYear(year);
            calendarDate.setMonth(month);

            /*
                the displayDate object builds the view matrix to
                include the days either side of the month.
                offset dusplay sart date to closest Monday past or present
            */
            displayDate.setFullYear(year);
            displayDate.setMonth(month);
            displayDate.setDate(2 - (calendarDate.getDay() || 7));

            // build array of all visible days in calendar view
            const dayMatrix = matrixDays(
                displayDate,
                month,
                [dayValueConfig(displayDate, month)]
            );

            return (
                <div id="calendar-month">
                    <CalendarHeader date={calendarDate} months={monthNames}/>
                    <DayHeaderRow dayNames={dayNames}/>
                    {matrixWeeks(dayMatrix,[],0).map(weekRow)}
                </div>
            );
        }
    }

    const renderCalendar = function () {
        ReactDOM.render(
            <Calendar />,
            window.document.getElementById("react-root")
        );
    };

    // trigger view changes by listening to location.hash change event
    window.addEventListener("hashchange", renderCalendar);
    // entry point
    renderCalendar();
}());
