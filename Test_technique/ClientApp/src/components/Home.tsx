import React, {Component, FunctionComponent, useEffect, useState} from 'react';
import { EventApi, DateSelectArg, EventClickArg } from "@fullcalendar/react";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import {Dropdown, Flex, Dialog, Input, Button, Form, Checkbox, Text, MenuButton, Loader} from '@fluentui/react-northstar';
import { CloseIcon, ArrowRightIcon, ArrowLeftIcon } from '@fluentui/react-icons-northstar'

/**
 * Données d'une réunion
 */
interface EventData {
    // Titre
    title?: string,
    // Départ
    start?: Date,
    // Fin
    end?: Date,
    // Journée entière ?
    allDay?: boolean,
}

/**
 * Props
 */
type Props = {}

/**
 * État
 */
type State = {
    // Évènements
    currentEvents: EventApi[],
    // Date du jour
    todayStr: string,
    // Erreur ?
    isError: boolean,
    // Calendrier
    calendar: null|Calendar,
    // Dialogue de création de réunion ouvert ?
    openEventDialog: boolean,
    // Données pour créer une réunion
    eventData: EventData,
    // Heure de début pour les réunions (Format 24H)
    startHour: number,
    // Heure de fin pour les réunions (Format 24H)
    endHour: number,
    // Chargement de la page
    loaded: boolean
}

/**
 * Page d'accueil
 */
export class Home extends Component<Props, State> {
    static displayName = Home.name;

    /**
     * Référence du calendrier 
     */
    private readonly calendarRef: React.RefObject<HTMLDivElement>;

    /**
     * Constructeur
     * @param props props
     */
    constructor(props: Props) {
        super(props);
        this.calendarRef = React.createRef();
    }

    /**
     * État initial du composant
     */
    state: State = {
        currentEvents: [],
        todayStr: new Date().toISOString().replace(/T.*$/, ''),
        isError: false,
        calendar: null,
        openEventDialog: false,
        eventData: {},
        startHour: 8,
        endHour: 19,
        loaded: false
    };

    /**
     * Initialisation du composant
     */
    componentDidMount() {
        let calendar = new Calendar(this.calendarRef.current as HTMLElement, {
            plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
            headerToolbar: false,
            initialView: 'dayGridMonth',
            editable: true,
            selectable: true,
            events: this.handleInitEvent,
            select: this.handleDateSelect,
            eventsSet: this.handleEventsUpdate,
            locale: 'fr',
            firstDay: 1,
            height: "500px",
            validRange: {
                start: new Date()
            },
            businessHours: {
                daysOfWeek: [ 1, 2, 3, 4, 5 ],
                startTime: this.state.startHour + ":00",
                endTime: this.state.endHour + ":00",
            },
            selectConstraint: {
                daysOfWeek: [ 1, 2, 3, 4, 5 ],
            }
        });
        calendar.render();
        this.setState({calendar});
    }

    /**
     * Initialiser les réunions présentes dans la base de données
     * @param fetchInfo informations sur les dates visibles du calendrier
     * @param successCallback méthode de retour en cas de succès
     * @param failureCallback méthode de retour en cas d'échec
     */
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
                    this.setState({loaded: true});
                    successCallback(json);
                });
            }
        });
    }

    /**
     * Lorsqu'une date est sélectionnée
     * @param selectInfo informations sur la date sélectionnée
     */
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

    /**
     * Sauvegarder une réunion dans la base de données
     * @param eventData données de la réunion à sauvegarder
     */
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

    /**
     * Créer une réunion
     * @param title titre
     * @param allDay toute la journée ?
     * @param beginHour heure de début
     * @param duration durée
     */
    createEvent = (title: string, allDay: boolean, beginHour: string, duration: number) => {
        const event : EventData = {...this.state.eventData, title, allDay};
        if (!allDay) {
            event.start?.setHours(parseInt(beginHour));
            event.end = new Date(event.start!);
            event.end?.setHours(parseInt(beginHour), duration);
        }
        this.uploadEvent(event);
    }

    /**
     * Mise à jour des réunions du calendrier
     * @param events réunions
     */
    handleEventsUpdate = (events: EventApi[]) => {
        this.setState({currentEvents: events});
    }

    /**
     * Changer la vue du calendrier
     * @param index index
     */
    changeCalendarView (index: number) {
        switch (index) {
            case 1:
                this.state.calendar!.changeView("dayGridMonth");
                break;
            case 2:
                this.state.calendar!.changeView("dayGridWeek");
                break;
            case 3:
                this.state.calendar!.changeView("timeGridDay");
                break;
            default:
                break;
        }
    }

    /**
     * Rendu
     */
    render() {
        // Vues du calendrier
        const calendarViews = ["Mois","Semaine","Jour"];
        
        return (
            <Flex fill={true} column={true} padding="padding.medium" gap="gap.small">
                <Flex gap="gap.small">
                    <Flex.Item>
                        <Button.Group
                            circular
                            buttons={[
                                {
                                    icon: <ArrowLeftIcon />,
                                    key: 'left',
                                    onClick: () => this.state.calendar?.prev()
                                },
                                {
                                    icon: <ArrowRightIcon />,
                                    key: 'right',
                                    onClick: () => this.state.calendar?.next()
                                },
                            ]}
                        />
                    </Flex.Item>
                    <Flex.Item grow={true}>
                        <Text align={"center"}
                              styles={{"text-transform": "capitalize"}}
                              size={"larger"}
                              content={this.state.calendar?.currentData.viewTitle} />
                    </Flex.Item>
                    <Flex.Item>
                        <MenuButton
                            menu={calendarViews}
                            trigger={<Button content={"Affichage"} title="Modifier l'affichage du calendrier" />}
                            defaultValue={calendarViews[0]}
                            onMenuItemClick={(event,dropdown) => {
                                this.changeCalendarView(dropdown?.itemPosition!);
                            }}
                        />
                    </Flex.Item>
                </Flex>
                <Flex.Item grow={true}>
                    <div ref={this.calendarRef}/>
                </Flex.Item>
                {this.state.eventData.start! ?
                    <EventDialog
                        open={this.state.openEventDialog}
                        onHide={() => this.setState({openEventDialog: false})}
                        date={this.state.eventData.start!}
                        createEvent={this.createEvent}
                        startHour={this.state.startHour}
                        endHour={this.state.endHour}
                    />
                    :
                    null
                }
                {!this.state.loaded ?
                    <Dialog
                        open={true}
                        styles={{"max-height": "120px", "max-width": "250px"}}
                        closeOnOutsideClick={false}
                        content={<Loader label="Récupération des réunions" />}
                    />
                    :
                    null
                }
            </Flex>
        );
    }
}

/**
 * Fenêtre de dialogue afin d'ajouter une réunion
 * @param open état d'affichage du dialogue
 * @param onHide lors de la fermeture du dialogue
 * @param date date sélectionnée
 * @param createEvent créer une nouvelle réunion
 * @param startHour heure de départ autorisée pour les réunions
 * @param endHour heure de fin des réunions
 * @param currentEvents évènements en cours
 * @constructor
 */
const EventDialog: FunctionComponent<{
    open: boolean,
    onHide: Function,
    date: Date,
    createEvent: Function,
    startHour: number,
    endHour: number
}> = ({ open, onHide, date, createEvent, startHour, endHour }) => {
    /**
     * Champs du formulaire valides
     */
    const [valid, setValid] = useState(false);

    /**
     * Rendez-vous durant toute la journée ?
     */
    const [allDay, setAllDay] = useState(true);

    /**
     * Titre du rendez-vous
     */
    const [title, setTitle] = useState("");

    /**
     * Heure de début du rendez-vous
     */
    const [beginHour, setBeginHour] = useState(undefined);

    /**
     * Durée de rendez-vous
     */
    const [duration, setDuration] = useState(undefined);

    /**
     * Liste des durées disponibles
     */
    const [validDurations, setValidDurations] = useState([""]);

    /**
     * Liste des heures disponibles
     */
    const [validHours, setValidHours] = useState([""]);

    /**
     * Lorsqu'une mise à jour a été effectuée
     */
    useEffect(() => {
        if (title === undefined) {
            setValid(false);
        } else {
            if (allDay) setValid(title.length > 0);
            else {
                updateValidHours();
                setValid(title.length > 0 && beginHour !== undefined && duration !== undefined);
            }
        }
        if (beginHour !== undefined)
            updateValidDurations();
    }, [open, allDay, title, beginHour, duration]);

    /**
     * Masquer la fenêtre de dialogue
     */
    const hideDialog = () => {
        onHide();
        setValid(false);
        setAllDay(true);
        setTitle("");
        setBeginHour(undefined);
        setDuration(undefined);
        setValidDurations([""]);
        setValidHours([""]);
    }

    /**
     * Générer les heures possibles de rendez-vous
     */
    function updateValidHours() {
        let hours = [];
        for (let i = startHour; i < endHour; i++)
            hours.push(i + "H");
        setValidHours(hours);
    }

    /**
     * Durées de rendez-vous
     */
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

    /**
     * Générer les durées possibles de rendez-vous
     */
    function updateValidDurations() {
        let durations = [];
        for (const [key, value] of Object.entries(durationValues))
            if ((parseInt(beginHour!) * 60) + value <= endHour * 60)
                durations.push(key);
        setValidDurations(durations);
    }

    /**
     * Champs du formulaire
     */
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
                label: 'Journée entière (' + date.toLocaleDateString() + ")",
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
                items: validHours,
                disabled: title === undefined || title.length === 0,
                onChange: (event: any, data: any) => setBeginHour(data!.value)
            },
        },
        {
            className: allDay ? "hidden" : "",
            label: "Durée de la réunion",
            key: 'eventDuration',
            control: {
                as: Dropdown,
                items: validDurations,
                disabled: beginHour === undefined,
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