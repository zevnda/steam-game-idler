import React from 'react';
import { Button, Input, Select, SelectItem } from '@nextui-org/react';
import { IoMdArrowRoundBack } from 'react-icons/io';
import { MdSort } from 'react-icons/md';
import { RiSearchLine } from 'react-icons/ri';
import usePageHeader from '../hooks/usePageHeader';
import { sortOptions, handleChange } from '../utils/pageHeaderHandler';

export default function PageHeader({ setShowAchievements, achievementList, setAchievementList, achievementsUnavailable, inputValue, setInputValue, percentageMap, userGameAchievementsMap, currentTab }) {
    const { setIsSorted, handleClick, handleInputChange } = usePageHeader({ setShowAchievements, setInputValue });

    return (
        <React.Fragment>
            <div className='flex justify-between items-center mb-4'>
                <Button
                    size='sm'
                    color='primary'
                    isIconOnly
                    className='w-fit rounded duration-50'
                    startContent={<IoMdArrowRoundBack fontSize={18} />}
                    onClick={handleClick}
                />

                <Input
                    isClearable
                    size='sm'
                    isDisabled={achievementsUnavailable || currentTab === 'statistics'}
                    placeholder='Search for an achievement'
                    startContent={<RiSearchLine />}
                    className='max-w-[400px]'
                    classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded'] }}
                    value={inputValue}
                    onChange={handleInputChange}
                    onClear={() => { setInputValue(''); }}
                />

                <div className='flex gap-2'>
                    <Select
                        aria-label='sort'
                        isDisabled={inputValue.length > 0 || achievementsUnavailable || currentTab === 'statistics'}
                        disallowEmptySelection
                        radius='none'
                        size='sm'
                        startContent={<MdSort fontSize={26} />}
                        items={sortOptions}
                        className='w-[200px]'
                        classNames={{
                            listbox: ['p-0'],
                            value: ['text-xs'],
                            trigger: ['bg-input border border-inputborder data-[hover=true]:!bg-titlebar data-[open=true]:!bg-titlebar duration-100 rounded'],
                            popoverContent: ['bg-base border border-border rounded']
                        }}
                        defaultSelectedKeys={['percent']}
                        onSelectionChange={(e) => { handleChange(e, achievementList, setAchievementList, percentageMap, userGameAchievementsMap, setIsSorted); }}
                    >
                        {(item) => <SelectItem classNames={{ title: ['text-xs'], base: ['rounded'] }}>{item.label}</SelectItem>}
                    </Select>
                </div>
            </div>
        </React.Fragment>
    );
}