import { useQuery } from '@tanstack/react-query'

import { getAdminVoidBarcode } from '@/lib/api-settings'

const adminVoidBarcodeQueryKey = ['settings', 'admin-void-barcode'] as const

export function useAdminVoidBarcode() {
  return useQuery({
    queryKey: adminVoidBarcodeQueryKey,
    queryFn: getAdminVoidBarcode,
    staleTime: 60_000
  })
}
