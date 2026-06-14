"use client"

import React, { useRef, useEffect } from 'react'
import {
    DoorArrowLeft24Regular,
    PersonAccounts24Filled,
    PersonAccounts24Regular,
    DataHistogram24Regular,
    BookOpen24Regular,
    ChevronRight20Regular,
} from '@fluentui/react-icons';

const Dashboard = () => {
    const currentCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        currentCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
        });
    }, []);

    const todaySchedule = [
        {
            period: 1,
            time: "08:30 - 09:20",
            subject: "English",
            classroom: "5/1",
            status: "Completed",
        },
        {
            period: 3,
            time: "10:25 - 11:15",
            subject: "English",
            classroom: "6/2",
            status: "Ready for attendance",
        },
        {
            period: 6,
            time: "14:00 - 14:50",
            subject: "English",
            classroom: "4/3",
            status: "Upcoming",
        },
        {
            period: 8,
            time: "14:55 - 15:40",
            subject: "English",
            classroom: "4/2",
            status: "Upcoming",
        },
    ];

    const reportScopes = [
        {
            id: 'arrival',
            label: 'Gate arrival',
            desc: 'Daily entry & late tracking',
            icon: <DoorArrowLeft24Regular className="size-5" />,
            color: 'purple',
        },
        {
            id: 'student',
            label: 'Student report',
            desc: 'Attendance per student',
            icon: <PersonAccounts24Regular className="size-5" />,
            color: 'teal',
        },
        {
            id: 'class',
            label: 'Class report',
            desc: 'Attendance by classroom',
            icon: <DataHistogram24Regular className="size-5" />,
            color: 'amber',
        },
        {
            id: 'subject',
            label: 'Subject report',
            desc: 'Attendance by subject',
            icon: <BookOpen24Regular className="size-5" />,
            color: 'coral',
        },
    ];

    const iconColors: Record<string, string> = {
        purple: 'bg-[#7F77DD]/15 text-[#9f9be8]',
        teal:   'bg-[#1D9E75]/15 text-[#3ec99b]',
        amber:  'bg-[#BA7517]/15 text-[#f5a623]',
        coral:  'bg-[#D85A30]/15 text-[#f07850]',
    };


    const handleScopeSelect = (scopeId: string) => {
        //router.push(`/dashboard/reports/${scopeId}`)
        console.log('selected scope:', scopeId);
        };

    return (
        <main className="flex min-h-screen flex-col bg-[#141414] pt-20 gap-5 p-4">

            {/* Profile */}
            <div className="flex items-center gap-3 bg-[#1f1f1f] border border-white/8 rounded-2xl px-4 py-3.5">
                <div className="w-11 h-11 rounded-full bg-[#2a2a2a] border border-white/10 flex items-center justify-center shrink-0">
                    <PersonAccounts24Filled className="size-5 text-white/40" />
                </div>
                <div>
                    <div className="text-[15px] font-medium text-white">Wanchai Maidaeng</div>
                    <div className="text-xs text-white/35 mt-0.5">Teacher</div>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-[10px] text-white/25 tracking-wide mb-1">Homeroom</div>
                    <div className="text-lg font-medium text-white/75 leading-none">5/1</div>
                </div>
            </div>

            {/* Schedule */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[13px] font-medium text-white/40 uppercase tracking-widest">Today</span>

                </div>
                <div className="flex gap-2.5 overflow-x-auto p-2 scrollbar-none">
                    {todaySchedule.map((lesson, index) => (
                        <div
                            key={lesson.period}
                            ref={index === 2 ? currentCardRef : null}
                            className={`min-h-50 max-w-70 w-full shrink-0 rounded-lg snap-center p-5 flex flex-col justify-between border border-white/10 ${index === 2 ? 'bg-[#3C3C3C] scale-105' : 'bg-[#3C3C3C]/30'}`}
                        >
                            <div className="flex justify-between">
                                    <span className="text-white/50">
                                        Period {lesson.period}
                                    </span>
                                <span className="text-white/30 text-sm">
                                        {lesson.time}
                                    </span>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white">
                                    {lesson.subject}
                                </div>

                                <div className="text-white/60 text-lg">
                                    Class {lesson.classroom}
                                </div>
                            </div>
                            <div className="text-white/30">
                                {lesson.status}
                            </div>
                        </div>
                    ))}

                </div>
            </div>

            <div className="h-px bg-white/7" />

            {/* Reports */}
            <div>
                <div className="mb-3">
                    <span className="text-[11px] font-medium text-white/35 uppercase tracking-widest">Reports</span>
                </div>

                <div className="flex flex-col rounded-2xl overflow-hidden border border-white/6">
                    {reportScopes.map((scope, index) => (
                        <div key={scope.id}>
                            <button
                                onClick={() => handleScopeSelect(scope.id)}
                                className="w-full flex items-center gap-3.5 bg-[#1c1c1c] px-4 py-3.5 active:bg-[#2a2a2a] transition-colors"
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColors[scope.color]}`}>
                                    {scope.icon}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-[14px] font-medium text-white/85">{scope.label}</div>
                                    <div className="text-[12px] text-white/30 mt-0.5">{scope.desc}</div>
                                </div>
                                <ChevronRight20Regular className="size-4 text-white/20 shrink-0" />
                            </button>

                            {index < reportScopes.length - 1 && (
                                <div className="h-px bg-white/6" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

        </main>
    )}
export default Dashboard