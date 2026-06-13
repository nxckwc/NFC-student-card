"use client"

import React, { useRef, useEffect } from 'react'
import { PersonAccounts24Filled, DataHistogram24Filled, ClipboardTaskListLtr24Filled } from '@fluentui/react-icons';

const Dashboard = () => {
    const currentCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        currentCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
        });
    }, []);
    const reportScopes = [
        { id: 'arrival', label: 'Gate arrival', icon: <ClipboardTaskListLtr24Filled className="size-6" /> },
        { id: 'student', label: 'Student Report', icon: <PersonAccounts24Filled className="size-6" /> },
        { id: 'class', label: 'Class Report', icon: <DataHistogram24Filled className="size-6" /> },
        { id: 'subject', label: 'Subject Report', icon: <ClipboardTaskListLtr24Filled className="size-6" /> },
        ];

        const handleScopeSelect = (scopeId: string) => {
        //router.push(`/dashboard/reports/${scopeId}`)
        console.log('selected scope:', scopeId);
        };

    return (
        <main className={'flex min-h-screen bg-[#1a1a1a] pt-15 flex-col overflow-auto'}>
            <div className={'flex flex-col gap-4'}>
                <div className={'flex flex-col gap-6 min-w-screen p-2'}>
                    <div className={' border-b-2 border-gray-200/50 max-h-fit py-2 flex justify-center items-center'}>
                        <div className={'text-white min-w-100 flex flex-row justify-evenly '}>
                            <PersonAccounts24Filled className="size-23" />
                            <div className={'min-w-fit flex flex-col items-start gap-2 justify-center'}>
                                <div className={'text-2xl max-h-fit'}>wanchai maidaeng</div>
                                <div className={'text-white/30 flex-row flex justify-between min-w-full'}>
                                    <div>type: teacher</div>
                                    <div>class: 5/1</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={'overflow-x-auto flex flex-row gap-4 snap-x snap-mandatory pb-2'}>
                        <div className={'min-h-50 min-w-[80%] shrink-0 bg-[#3C3C3C]/30 rounded-md snap-center'}>
                        
                        </div>
                        <div ref={currentCardRef} className={'min-h-50 min-w-[80%] shrink-0 bg-[#3C3C3C] rounded-md snap-center'}>
                        
                        </div>
                        <div className={'min-h-50 min-w-[80%] shrink-0 bg-[#3C3C3C]/30 rounded-md snap-center'}>
                        
                        </div>
                        <div className={'min-h-50 min-w-[80%] shrink-0 bg-[#3C3C3C]/30 rounded-md snap-center'}>
                        
                        </div>
                    </div>
                </div>
            </div>
            <div className={'flex flex-col gap-6 min-w-screen p-2'}>
                <div className={'border-b-2 border-t-2 border-gray-200/50 max-h-fit py-2 flex pl-4 items-center text-2xl gap-2'}>
                    reports
                    <DataHistogram24Filled className="size-7" />
                </div>

                <div className={'grid grid-cols-2 gap-3'}>
                    {reportScopes.map((scope) => (
                    <button
                        key={scope.id}
                        onClick={() => handleScopeSelect(scope.id)}
                        className={'flex flex-col items-center justify-center gap-2 min-h-24 bg-[#3C3C3C]/30 rounded-md text-white active:bg-[#3C3C3C]/60 transition-colors'}
                    >
                        {scope.icon}
                        <span className="text-sm">{scope.label}</span>
                    </button>
                    ))}
                </div>
            </div>
        </main>
    )}
export default Dashboard