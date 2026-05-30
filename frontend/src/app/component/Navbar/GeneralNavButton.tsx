import React from 'react'

const GeneralNavButton = () => {
  return (
    <div className={'flex-1 flex items-center justify-center gap-2'}>
      <div className={'w-fit p-1 cursor-pointer hover:underline transition duration-300'}>Docs</div>
      <div className={'w-fit p-1 cursor-pointer hover:underline transition duration-300'}>About</div>
    </div>
  )
}

export default GeneralNavButton
