import React, {Component} from 'react';
import { EventApi, DateSelectArg, EventClickArg } from "@fullcalendar/react";
import {Calendar} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";

type Props = {}
type State = {
    currentEvents: EventApi[],
    todayStr: string,
    isError: boolean,
    eventCount: number,
    calendar: null|Calendar,
}

export class Home extends Component<Props, State> {
    static displayName = Home.name;
    
    private readonly calendarRef: React.RefObject<HTMLDivElement>;

    constructor(props: Props) {
        super(props);
        this.calendarRef = React.createRef();
    }
    
    state: State = {
        currentEvents: [],
        todayStr: new Date().toISOString().replace(/T.*$/, ''),
        isError: false,
        eventCount: 0,
        calendar: null
    };

    componentDidMount() {
        let calendar = new Calendar(this.calendarRef.current as HTMLElement, {
            plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
            headerToolbar: false,
            initialView: 'dayGridMonth',
            editable: true,
            selectable: true,
            selectMirror: true,
            events: this.handleInitEvent,
            select: this.handleDateSelect,
            eventClick: this.handleEventClick,
            eventsSet: this.handleEventsUpdate,
        });
        calendar.render();
        this.setState({calendar});
    }

    handleInitEvent = (fetchInfo: object, successCallback: Function, failureCallback: Function) => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };
        fetch('https://localhost:5001/api/calendar/events', requestOptions).then(res => {
            if (res.status !== 200) {
                this.setState({isError: true});
                failureCallback();
            } else {
                res.json().then(json => {
                    successCallback(json);
                });
            }
        });
    }

    handleDateSelect = (selectInfo: DateSelectArg) => {
        let title = prompt("Saisir le titre de l'évènement");
        const calendar = selectInfo.view.calendar;
        calendar.unselect();
        if (title) {
            let eventData = {
                title,
                start: selectInfo.start,
                end: selectInfo.end,
                allDay: selectInfo.allDay
            };
            this.uploadEvent(eventData);
        }
    }
    
    uploadEvent(eventData: object) {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        };
        fetch('https://localhost:5001/api/calendar/events', requestOptions).then(response => {
            if (response.status !== 200)
                this.setState({isError: true});
            else
                this.state.calendar!.addEvent([eventData]);
        });
    }

    createEventId = () => {
        this.setState((state) => ({eventCount: state.eventCount + 1}));
        return String(this.state.eventCount);
    }

    // renderEventContent = (eventInfo: any) => {
    //     console.log(eventInfo);
    //     return (
    //         <>
    //             <b>{eventInfo.timeText}</b>
    //             <i>{eventInfo.event.title}</i>
    //         </>
    //     )
    // }

    handleEventClick = (clickInfo: EventClickArg) => {
       //
    }

    handleEventsUpdate = (events: EventApi[]) => {
        this.setState({currentEvents: events});
    }

    render() {
        return (
            <div>
                <div ref={this.calendarRef}/>
            </div>
        );
    }
}