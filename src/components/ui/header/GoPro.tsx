import type { ReactElement } from 'react'

import WebviewWindow from '@/components/ui/WebviewWindow'

export default function GoPro(): ReactElement {
  return (
    <div className='scale-60 -ml-7' data-tauri-drag-region>
      <WebviewWindow href='http://localhost:3001/pro' size={{ width: 500, height: 600 }}>
        <div
          className='flex justify-center items-center p-1 min-w-[184px] rounded-full hover:brightness-90 cursor-pointer duration-150'
          style={{
            background:
              'linear-gradient(300deg, #1fbaf8 0%, #2a9bf9 10.94%, #3874fb 23.43%, #8a1299ff 69.51%, #6c0b79ff 93.6%, #4a0840ff 109.47%),linear-gradient(86deg, #320057 4.13%, #530de7 35.93%, #3874fb 64.42%, #0bf2f6 104.88%)',
          }}
        >
          <p className='flex flex-col text-xs font-bold items-center w-[100px] space-y-0.5'>
            <span className='block w-full text-center'>SUPPORT THE PROJECT</span>
          </p>
          <div className='bg-white py-1 px-1.5 rounded-full'>
            <p className='text-[16px] font-black text-[#3874fb] italic'>GO PRO</p>
          </div>
        </div>
      </WebviewWindow>
    </div>
  )
}
