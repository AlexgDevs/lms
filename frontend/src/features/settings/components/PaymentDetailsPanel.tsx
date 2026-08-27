import { useState } from "react"
import { CreditCard, Loader2, Landmark, Trash2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  usePayoutAccount,
  usePaymentConfig,
  useSavePayoutAccount,
  useDeletePayoutAccount,
} from "@/features/payment/api/usePayoutAccount"
import type { PayoutMethod } from "@/client"

export function PaymentDetailsPanel() {
  const { data: account, isLoading } = usePayoutAccount()
  const { data: config } = usePaymentConfig()
  const save = useSavePayoutAccount()
  const remove = useDeletePayoutAccount()

  const [method, setMethod] = useState<PayoutMethod>(
    account?.method ?? "card",
  )
  const [recipient, setRecipient] = useState(account?.recipient ?? "")
  const [holderName, setHolderName] = useState(account?.holder_name ?? "")
  const [bankName, setBankName] = useState(account?.bank_name ?? "")

  const isCard = method === "card"

  const handleSave = () => {
    if (!recipient.trim()) return
    save.mutate({
      body: {
        method,
        recipient: recipient.trim(),
        holder_name: isCard ? holderName.trim() || null : null,
        bank_name: bankName.trim() || null,
      },
    })
  }

  const handleDelete = () => {
    remove.mutate({})
    setRecipient("")
    setHolderName("")
    setBankName("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Реквизиты
        </CardTitle>
        <CardDescription>
          Укажите, куда будут переводиться средства с продаж ваших курсов.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {config && config.fee_percent > 0 && (
          <div className="flex items-start gap-2 rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <Landmark className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <div>
              <p>
                Комиссия платформы:{" "}
                <span className="font-semibold text-foreground">
                  {config.fee_percent}%
                </span>
              </p>
              {config.platform_recipient && (
                <p className="text-muted-foreground/80">
                  Платёжные реквизиты платформы: {config.platform_recipient}
                </p>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            <Field>
              <FieldLabel>Способ выплаты</FieldLabel>
              <Select value={method} onValueChange={(v) => setMethod(v as PayoutMethod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Способ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Банковская карта</SelectItem>
                  <SelectItem value="sbp_phone">Телефон (СБП)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>{isCard ? "Номер карты" : "Номер телефона"}</FieldLabel>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={isCard ? "0000 0000 0000 0000" : "+7 900 000-00-00"}
                inputMode={isCard ? "numeric" : "tel"}
              />
            </Field>

            {isCard && (
              <>
                <Field>
                  <FieldLabel>Имя владельца</FieldLabel>
                  <Input
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="ИВАНОВ ИВАН"
                  />
                </Field>
                <Field>
                  <FieldLabel>Банк (необязательно)</FieldLabel>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Название банка"
                  />
                </Field>
              </>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={handleSave}
                disabled={!recipient.trim() || save.isPending}
              >
                {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Сохранить
              </Button>
              {account && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={remove.isPending}
                >
                  {remove.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Удалить
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
