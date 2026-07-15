import type { InventoryItem, OrderGraphEntry } from '../types'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'
import { cn, Modal, Skeleton, Typography } from '@heroui/react'

interface OrderTableProps {
  title: string
  summary?: string
  rows: OrderGraphEntry[]
  currency: string
  onRowClick: (price: number) => void
}

const OrderTable = ({ title, summary, rows, currency, onRowClick }: OrderTableProps) => (
  <div className='flex min-w-0 flex-1 flex-col gap-2'>
    <div className='flex items-center justify-between gap-2'>
      <Typography type='body-sm' weight='semibold'>
        {title}
      </Typography>
      {summary && (
        <Typography className='shrink-0' color='muted' type='body-xs'>
          {summary}
        </Typography>
      )}
    </div>
    <div className='overflow-hidden rounded-lg border border-border'>
      <table className='w-full text-xs'>
        <tbody>
          {rows.length > 0 ? (
            rows.map(([price, quantity], index) => (
              <tr
                key={price}
                className={cn(
                  'cursor-pointer border-t border-border/50 duration-100 first:border-t-0 hover:bg-surface-hover',
                  index % 2 !== 0 && 'bg-surface/50',
                )}
                onClick={() => onRowClick(price)}
              >
                <td className='px-3 py-2 text-left text-primary'>
                  {formatCurrency(price, currency)}
                </td>
                <td className='px-3 py-2 text-right text-muted'>{quantity}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className='px-3 py-4 text-center text-muted' colSpan={2}>
                —
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

interface PriceOrderModalProps {
  item: InventoryItem | null
  currency: string
  isLoading: boolean
  onOpenChange: (open: boolean) => void
  onPickPrice: (price: number) => void
}

// The buy/sell order-book snapshot for one item (`item.priceData`, populated by
// useInventory's fetchItemPrice) - clicking a row fills that price into the item's price input,
// mirroring `main`'s PriceData.tsx. Opened from InventoryItemCard's "Fetch price" affordance.
export const PriceOrderModal = ({
  item,
  currency,
  isLoading,
  onOpenChange,
  onPickPrice,
}: PriceOrderModalProps) => {
  const { t } = useTranslation()

  return (
    <Modal isOpen={item !== null} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size='lg'>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{item?.fullName}</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              {isLoading || !item?.priceData ? (
                <div className='flex gap-4'>
                  <Skeleton className='h-40 flex-1 rounded-lg' />
                  <Skeleton className='h-40 flex-1 rounded-lg' />
                </div>
              ) : (
                <div className='flex gap-4'>
                  <OrderTable
                    currency={currency}
                    rows={item.priceData.sellOrderGraph}
                    summary={item.priceData.sellOrderSummary}
                    title={t('dashboard.inventoryManager.priceData.sellOrders')}
                    onRowClick={price => {
                      onPickPrice(price)
                      onOpenChange(false)
                    }}
                  />
                  <OrderTable
                    currency={currency}
                    rows={item.priceData.buyOrderGraph}
                    summary={item.priceData.buyOrderSummary}
                    title={t('dashboard.inventoryManager.priceData.buyOrders')}
                    onRowClick={price => {
                      onPickPrice(price)
                      onOpenChange(false)
                    }}
                  />
                </div>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
