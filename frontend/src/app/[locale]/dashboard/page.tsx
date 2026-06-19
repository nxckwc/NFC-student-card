"use client"

import React, { useRef, useEffect } from 'react'
import {
    PersonAccounts24Filled,
    DoorArrowLeft24Regular,
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
        { period: 1, time: "08:30 - 09:20", subject: "English", classroom: "5/1", status: "Completed", state: "done" },
        { period: 3, time: "10:25 - 11:15", subject: "English", classroom: "6/2", status: "Ready for attendance", state: "current" },
        { period: 6, time: "14:00 - 14:50", subject: "English", classroom: "4/3", status: "Upcoming", state: "upcoming" },
        { period: 8, time: "14:55 - 15:40", subject: "English", classroom: "4/2", status: "Upcoming", state: "upcoming" },
    ];

    const reportScopes = [
        { id: 'arrival', label: 'Gate arrival', desc: 'Daily entry & late tracking', icon: <DoorArrowLeft24Regular className="size-5" /> },
        { id: 'student', label: 'Student report', desc: 'Attendance per student', icon: <PersonAccounts24Regular className="size-5" /> },
        { id: 'class', label: 'Class report', desc: 'Attendance by classroom', icon: <DataHistogram24Regular className="size-5" /> },
        { id: 'subject', label: 'Subject report', desc: 'Attendance by subject', icon: <BookOpen24Regular className="size-5" /> },
    ];

    const handleScopeSelect = (scopeId: string) => {
        console.log('selected scope:', scopeId);
    };

    return (
        <main className="flex min-h-screen flex-col bg-[#161616] pt-17 gap-5 p-2">

            {/* Profile */}
            <div className="flex items-center gap-3 bg-[#1f1f1f] border border-white/8 rounded-3xl px-4 py-4">
                <div className="w-12 h-12 rounded-full bg-[#2c2c2c] flex items-center justify-center shrink-0">
                    <PersonAccounts24Filled className="size-5 text-white/55" />
                </div>
                <div>
                    <div className="text-[15px] font-medium text-white">Wanchai Maidaeng</div>
                    <div className="text-[11px] text-white/35 mt-0.5 tracking-wide">Teacher</div>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-[10px] text-white/30 tracking-widest mb-1 uppercase">Homeroom</div>
                    <div className="inline-block text-base font-medium text-white leading-none bg-[#2c2c2c] rounded-full px-3 py-1.5">5/1</div>
                </div>
            </div>

            {/* Schedule */}
            <div>
                <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-[11px] font-medium text-white/35 uppercase tracking-widest">Schedule</span>
                    <span className="text-[11px] text-white/25">4 periods</span>
                </div>
                <div className="flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-none snap-x">
                    {todaySchedule.map((lesson) => {
                        const isCurrent = lesson.state === 'current';
                        const isDone = lesson.state === 'done';
                        return (
                            <div
                                key={lesson.period}
                                ref={isCurrent ? currentCardRef : null}
                                className={`relative min-h-48 max-w-64 w-full shrink-0 rounded-3xl snap-center p-5 flex flex-col justify-between border
                                    ${isCurrent
                                    ? 'bg-[#2c2c2c] border-white/20'
                                    : 'bg-[#1f1f1f] border-white/8'}
                                    ${isDone ? 'opacity-50' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-[11px] font-medium uppercase tracking-widest ${isCurrent ? 'text-white/70' : 'text-white/40'}`}>
                                        Period {lesson.period}
                                    </span>
                                    <span className={`text-[12px] tabular-nums ${isCurrent ? 'text-white/50' : 'text-white/30'}`}>
                                        {lesson.time}
                                    </span>
                                </div>

                                <div>
                                    <div className="text-2xl font-medium text-white tracking-tight">
                                        {lesson.subject}
                                    </div>
                                    <div className={`text-[14px] mt-0.5 ${isCurrent ? 'text-white/65' : 'text-white/45'}`}>
                                        Class {lesson.classroom}
                                    </div>
                                </div>

                                <div>
                                    {isCurrent ? (
                                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white bg-[#161616] rounded-full px-2.5 py-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                            {lesson.status}
                                        </span>
                                    ) : (
                                        <span className="text-[12px] text-white/30">
                                            {lesson.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Reports */}
            <div>
                <div className="mb-3 px-1">
                    <span className="text-[11px] font-medium text-white/35 uppercase tracking-widest">Reports</span>
                </div>

                <div className="flex flex-col gap-2.5">
                    {reportScopes.map((scope) => (
                        <button
                            key={scope.id}
                            onClick={() => handleScopeSelect(scope.id)}
                            className="group w-full flex items-center gap-3.5 bg-[#1f1f1f] border border-white/8 rounded-2xl px-4 py-3.5 active:bg-[#2c2c2c] active:border-white/20 transition-colors"
                        >
                            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 bg-[#2c2c2c] text-white/55">
                                {scope.icon}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-[14px] font-medium text-white/85">{scope.label}</div>
                                <div className="text-[12px] text-white/30 mt-0.5">{scope.desc}</div>
                            </div>
                            <ChevronRight20Regular className="size-4 text-white/20 shrink-0" />
                        </button>
                    ))}
                </div>
            </div>

        </main>
    )}
export default Dashboard