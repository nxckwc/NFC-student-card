import React from 'react'
import { CircleUserRound } from 'lucide-react';

const dashboard = () => {
  return (
      <main className={'flex min-h-screen bg-[#1a1a1a] pt-15 flex-col'}>
          <div>
              <div className={'grid grid-rows-2 gap-2 min-w-screen p-2'}>
                  <div className={'border-b-2 border-gray-200/50 max-h-fit py-2'}>
                      <div className={'text-white  flex flex-row justify-evenly'}>
                          <CircleUserRound className="size-18 rounded-full" />
                          <div className={'min-w-fit flex justify-evenly flex-col items-center'}>
                              <div className={'text-2xl max-h-fit'}>name surname</div>
                              <button
                                  className={'rounded-md border-red-800 max-h-fit max-w-fit px-2 my-4 bg-red-800 '}>
                                  setting
                              </button>
                          </div>
                      </div>
                  </div>
                  <div className={'min-h-30 max-w-[80%] bg-[#3C3C3C] rounded-md'}>f</div>
              </div>
          </div>
      </main>
  )
}

export default dashboard
