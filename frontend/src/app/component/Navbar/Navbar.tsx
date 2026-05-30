import React from 'react'

import NavTab from './NavTab'

const Navbar = () => {
  return (
    <div className={'fixed top-0 left-0 w-full z-50 backdrop-blur-sm'}>
        <div className={'flex min-h-10 min-w-full items-center justify-between p-2'}>
            <img src="/images-removebg-preview (1) (1).png" alt="icon" className={'h-12 w-12'} />
            <NavTab/>
        </div>
    </div>
  )
}

export default Navbar
