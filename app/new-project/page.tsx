'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { currencyOptions } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatefulButton } from '@/components/aceternity/stateful-button'
import { PageTransition } from '@/components/page-transition'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function NewProjectPage() {
  const router = useRouter()
  const { settings, fetchSettings, addProject, isLoading, error, clearError } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    clearError()
  }, [clearError])

  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [desiredHourlyRate, setDesiredHourlyRate] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!settings) {
      fetchSettings()
    } else {
      setDesiredHourlyRate(settings.desiredHourlyRate.toString())
    }
  }, [settings, fetchSettings])

  const currencyCode = settings?.currencyCode ?? 'gbp'
  const currencyLabel = currencyOptions.find((option) => option.value === currencyCode)?.label ?? 'GBP (£)'

  const budgetedTime = quoteAmount && desiredHourlyRate
    ? (parseFloat(quoteAmount) / parseFloat(desiredHourlyRate)).toFixed(1)
    : '0'

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/269b4729-02a3-48bd-8159-910386a265b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'new-project/page.tsx:handleSubmit:entry',message:'handleSubmit called',data:{name,quoteAmount,desiredHourlyRate,hasAll:!!(name&&quoteAmount&&desiredHourlyRate)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    if (!name || !quoteAmount || !desiredHourlyRate) return

    setIsSubmitting(true)
    try {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/269b4729-02a3-48bd-8159-910386a265b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'new-project/page.tsx:handleSubmit:beforeAddProject',message:'calling addProject',data:{name},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      await addProject({
        name,
        client: client || 'No Client',
        quoteAmount: parseFloat(quoteAmount),
        desiredHourlyRate: parseFloat(desiredHourlyRate),
        status: 'active',
      })
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/269b4729-02a3-48bd-8159-910386a265b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'new-project/page.tsx:handleSubmit:afterAddProjectSuccess',message:'addProject succeeded, pushing to /',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      router.push('/')
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/269b4729-02a3-48bd-8159-910386a265b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'new-project/page.tsx:handleSubmit:catch',message:'addProject threw',data:{errMsg:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H3,H5'})}).catch(()=>{});
      // #endregion
      console.error('Failed to create project:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-dashed">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">New Fixed-Price Project</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Redesign"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quote">Quote Amount ({currencyLabel})</Label>
                <Input
                  id="quote"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Target Rate ({currencyLabel}/hr)</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={desiredHourlyRate}
                  onChange={(e) => setDesiredHourlyRate(e.target.value)}
                  placeholder="100"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-muted-foreground text-sm">Budgeted Time:</span>
              <span className="font-mono font-semibold">{budgetedTime} hours</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope details..."
                rows={3}
              />
            </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push('/')}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <StatefulButton
                    type="button"
                    className="flex-1"
                    disabled={isLoading || isSubmitting}
                    onClick={async (e) => {
                      await handleSubmit(e)
                    }}
                    onError={(error) => {
                      console.error('Create project error:', error)
                    }}
                  >
                    Create Project
                  </StatefulButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  )
}
