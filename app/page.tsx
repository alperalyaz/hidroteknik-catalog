import { redirect } from 'next/navigation'
import { VARSAYILAN_DIL } from '@/lib/site'

export default function Kok() {
  redirect(`/${VARSAYILAN_DIL}`)
}
