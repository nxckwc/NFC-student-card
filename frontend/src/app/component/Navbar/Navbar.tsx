import React from 'react'
import IconLabel from './IconLabel'
import NavTab from './NavTab'

const Navbar = () => {
  return (
    <div className={'fixed top-0 left-0 w-full z-50 backdrop-blur-sm'}>
        <div className={'flex min-h-10 min-w-full items-center justify-between p-2'}>
            <IconLabel/>
            <NavTab/>
        </div>
    </div>
  )
}

export default Navbar
