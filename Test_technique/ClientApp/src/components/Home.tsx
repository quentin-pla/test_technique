import React, {Component, FunctionComponent, SyntheticEvent, useEffect, useState} from 'react';
import { EventApi, DateSelectArg, EventClickArg } from "@fullcalendar/react";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import {Dropdown, Flex, Dialog, Input, Button, Form, Checkbox} from '@fluentui/react-northstar';
import { CloseIcon } from '@fluentui/react-icons-northstar'

interface EventData {
    title?: string,
    start?: Date,
    end?: Date,
    allDay?: boolean
}


type Props = {}
type State = {
    currentEvents: EventApi[],
    todayStr: string,
    isError: boolean,
    eventCount: number,
    calendar: null|Calendar,
    openEventDialog: boolean,
    eventData: EventData
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
        calendar: null,
        openEventDialog: false,
        eventData: {}
    };

    componentDidMount() {
        let calendar = new Calendar(this.calendarRef.current as HTMLElement, {
            height: "500px",
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
            locale: 'fr',
            firstDay: 1,
            dayHeaderFormat: {
                weekday: 'long',
                month: 'numeric',
                day: 'numeric'
            }
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
        this.setState({
            openEventDialog: true,
            eventData: {
                start: selectInfo.start,
                end: selectInfo.end,
                allDay: selectInfo.allDay
            }
        });
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
            else {
                this.setState({isError: false});
                this.state.calendar!.addEvent(eventData);
            }
        });
    }
    
    createEvent = (title: string, allDay: boolean, beginHour: string, duration: number) => {
        const event : EventData = {...this.state.eventData, title, allDay};
        if (!allDay) {
            event.start?.setHours(parseInt(beginHour));
            event.end = new Date(event.start!);
            event.end?.setHours(parseInt(beginHour), duration);
        }
        this.uploadEvent(event);
    }

    handleEventClick = (clickInfo: EventClickArg) => {
       //
    }

    handleEventsUpdate = (events: EventApi[]) => {
        this.setState({currentEvents: events});
    }

    changeCalendarView (index: number) {
        switch (index) {
            case 0:
                this.state.calendar!.changeView("dayGridMonth");
                break;
            case 1:
                this.state.calendar!.changeView("dayGridWeek");
                break;
            case 2:
                this.state.calendar!.changeView("timeGridDay");
                break;
            default:
                break;
        }
    }

    render() {
        const calendarViews = ["Mois","Semaine","Jour"];
        
        return (
            <Flex fill={true} column={true} padding="padding.medium" gap="gap.small">
                <Flex gap="gap.small">
                    <Dropdown
                        items={calendarViews}
                        align={"start"}
                        defaultValue={calendarViews[0]}
                        checkable
                        onChange={(event,dropdown) => {
                            this.changeCalendarView(dropdown.highlightedIndex!);
                        }}
                    />
                </Flex>
                <Flex.Item grow={true}>
                    <div ref={this.calendarRef}/>
                </Flex.Item>
                <EventDialog
                    open={this.state.openEventDialog}
                    onHide={() => this.setState({openEventDialog: false})}
                    createEvent={this.createEvent}
                />
            </Flex>
        );
    }
}

const EventDialog: FunctionComponent<{
    open: boolean,
    onHide: Function,
    createEvent: Function
}> = ({ open, onHide, createEvent }) => {
    const [valid, setValid] = useState(false);
    const [allDay, setAllDay] = useState(true);
    const [title, setTitle] = useState("");
    const [beginHour, setBeginHour] = useState(undefined);
    const [duration, setDuration] = useState(undefined);
    const firstHour = 8;
    const lastHour = 18;

    useEffect(() => {
        if (title === undefined) {
            setValid(false);
        } else {
            if (allDay) setValid(title.length > 0);
            else setValid(title.length > 0 && beginHour !== undefined && duration !== undefined);
        }
    }, [open, allDay, title, beginHour, duration]);

    const hideDialog = () => {
        onHide();
        setValid(false);
        setAllDay(true);
        setTitle("");
        setBeginHour(undefined);
        setDuration(undefined);
    }
    
    const generateHoursValues = () => {
        let hours = [];
        for (let i = firstHour; i <= lastHour; i++)
            hours.push(i + "H");
        return hours;
    }
    
    const durationValues = {
        "10 minutes": 10,
        "30 minutes": 30,
        "1H": 60,
        "1H30": 90,
        "2H": 120,
        "3H": 180,
        "4H": 240,
        "5H": 300
    };

    const formFields = [
        {
            label: "Nom de la réunion",
            key: 'eventTitle',
            required: true,
            control: {
                as: Input,
                clearable: true,
                fluid: true,
                error: title == undefined,
                onChange: (event: any, data: any) => {
                    let title = data!.value;
                    setTitle(title.length > 0 && title.match("^[a-zA-Z0-9éèàêùç', ]*$") !== null ? title : undefined);
                }
            },
        },
        {
            key: 'allDay',
            control: {
                as: Checkbox,
                label: 'Journée entière',
                defaultChecked: true,
                onClick: (event: any, data: any) => setAllDay(data.checked)
            },
        },
        {
            className: allDay ? "hidden" : "",
            label: "Heure de départ",
            key: 'eventBeginHour',
            control: {
                as: Dropdown,
                items: generateHoursValues(),
                onChange: (event: any, data: any) => setBeginHour(data!.value)
            },
        },
        {
            className: allDay ? "hidden" : "",
            label: "Durée de la réunion",
            key: 'eventDuration',
            control: {
                as: Dropdown,
                items: Object.keys(durationValues),
                onChange: (event: any, data: any) => setDuration(data!.value)
            },
        },
        {
            key: 'confirmButton',
            control: {
                as: Button,
                content: 'Confirmer',
                primary: true,
                disabled: !valid
            },
        },
    ]
    
    return (<Dialog
        open={open}
        onCancel={hideDialog}
        content={
            <Flex column={true} gap="gap.small">
                <Form
                    onSubmit={() => {
                        createEvent(title, allDay, beginHour, durationValues[duration!]);
                        hideDialog();
                    }}
                    fields={formFields}
                />
            </Flex>
        }
        header={<p>Ajouter une réunion</p>}
        headerAction={{icon: <CloseIcon/>, title: 'Fermer', onClick: hideDialog}}
    />);
}