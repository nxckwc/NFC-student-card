"use client"

import React from 'react'
import { PersonAccounts24Filled, DataHistogram24Filled } from '@fluentui/react-icons';
const dashboard = () => {
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
                  <div className={'overflow-auto flex flex-row gap-4 '}>
                      <div className={'min-h-50 min-w-[70%] bg-[#3C3C3C]/30 rounded-md'}></div>
                      <div className={'min-h-50 min-w-[70%] bg-[#3C3C3C] rounded-md'}></div>
                      <div className={'min-h-50 min-w-[70%] bg-[#3C3C3C]/30 rounded-md'}></div>
                  </div>

              </div>
            <div className={'flex flex-col gap-6 min-w-screen p-2'}>
                <div className={' border-b-2 border-t-2 border-gray-200/50 max-h-fit py-2 flex pl-4 items-center text-2xl gap-2'}>
                    reports
                    <DataHistogram24Filled className="size-7" />
                </div>
                <div className={'flex flex-col gap-2 min-h-fit'}>
                    <div className={'min-h-15 bg-[#3C3C3C]/30 rounded-md'}></div>
                    <div className={'min-h-15 bg-[#3C3C3C]/30 rounded-md'}></div>
                    <div className={'min-h-15 bg-[#3C3C3C]/30 rounded-md'}></div>
                    <div className={'min-h-15 bg-[#3C3C3C]/30 rounded-md'}></div>
                    <div className={'min-h-15 bg-[#3C3C3C]/30 rounded-md'}></div>
                    <div className={'min-h-15 bg-[#3C3C3C]/30 rounded-md'}></div>
                    <div className={'min-h-15 bg-[#3C3C3C]/30 rounded-md'}></div>
                    <div className={'min-h-15 bg-[#3C3C3C]/30 rounded-md'}></div>
                </div>
                
            </div>
          </div>
      </main>
  )
}

export default dashboard
