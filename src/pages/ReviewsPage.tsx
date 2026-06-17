import * as React from "react"
import { Star, Quote, CheckCircle, Upload, Image as ImageIcon, Loader2, AlertCircle, Plus, X, ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "../components/router"
import Navbar from "../components/Navbar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

import { Skeleton } from "@/components/ui/skeleton"

interface Review {
  id?: string
  name: string
  role: string
  avatar_url: string
  quote: string
  rating: number
  trade_type: string
  proof_image_url: string
  region?: string | null
  gc_received_date: string
  payment_sent_date: string
}

export function ReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showModal, setShowModal] = React.useState(false)

  // Form state
  const [name, setName] = React.useState("")
  const [role, setRole] = React.useState("")
  const [cardType, setCardType] = React.useState("Amazon")
  const [tradeType, setTradeType] = React.useState("Amazon ➔ UPI")
  const [region, setRegion] = React.useState("")
  const [gcReceivedDate, setGcReceivedDate] = React.useState("")
  const [paymentSentDate, setPaymentSentDate] = React.useState("")
  const [rating, setRating] = React.useState(5)
  const [quote, setQuote] = React.useState("")
  const [uploadingImage, setUploadingImage] = React.useState(false)
  const [imageUrls, setImageUrls] = React.useState<string[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState("")
  const [formSuccess, setFormSuccess] = React.useState(false)
  
  // Multi-image viewer state
  const [zoomedImages, setZoomedImages] = React.useState<string[]>([])
  const [zoomedIndex, setZoomedIndex] = React.useState(0)
  
  const openZoom = (images: string[], index = 0) => {
    setZoomedImages(images)
    setZoomedIndex(index)
  }
  
  const closeZoom = () => {
    setZoomedImages([])
    setZoomedIndex(0)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ""
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch {
      return ""
    }
  }

  const fetchReviews = React.useCallback(async () => {
    try {
      const res = await fetch("https://api.gcx.co.in/api/reviews")
      const data = await res.json()
      const processed = data.map((r: any) => {
        const createdAt = r.created_at || new Date().toISOString()
        return {
          ...r,
          gc_received_date: r.gc_received_date || new Date(new Date(createdAt).getTime() - 3600 * 1000 * 24 * 3).toISOString(),
          payment_sent_date: r.payment_sent_date || createdAt
        }
      })
      setReviews(processed)
      setLoading(false)
    } catch (err) {
      console.error("Failed to fetch reviews:", err)
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploadingImage(true)
    setFormError("")
    try {
      const uploadedList = [...imageUrls]
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        const response = await fetch("https://veltrixcode-vscode.hf.space/upload", {
          method: "POST",
          body: formData,
        })
        const data = await response.json()
        if (data.success && data.url) {
          uploadedList.push(data.url)
        } else {
          setFormError("Failed to upload some image(s). Please try again.")
          toast.error("Failed to upload image.")
        }
      }
      setImageUrls(uploadedList)
      toast.success("Proof receipt(s) uploaded successfully!")
    } catch (err) {
      console.error("Image upload error:", err)
      setFormError("Error uploading image. Check network connection.")
      toast.error("Error uploading image.")
    } finally {
      setUploadingImage(false)
    }
  }

  const removeUploadedImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setFormSuccess(false)

    if (!name.trim()) return setFormError("Name is required")
    if (!quote.trim()) return setFormError("Review description is required")
    if (!tradeType.trim()) return setFormError("Trade type is required (e.g. Amazon ➔ UPI)")
    if (imageUrls.length === 0) return setFormError("Proof image is required to post a review")

    setSubmitting(true)

    try {
      const response = await fetch("https://api.gcx.co.in/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role: role || "Customer",
          avatar_url: "",
          quote,
          rating,
          trade_type: tradeType,
          proof_image_url: imageUrls.join(","),
          region: region || null,
          gc_received_date: gcReceivedDate || null,
          payment_sent_date: paymentSentDate || null
        })
      })

      if (response.ok) {
        setFormSuccess(true)
        toast.success("Review posted successfully!")
        setName("")
        setRole("")
        setQuote("")
        setRating(5)
        setCardType("Amazon")
        setTradeType("Amazon ➔ UPI")
        setRegion("")
        setGcReceivedDate("")
        setPaymentSentDate("")
        setImageUrls([])
        fetchReviews()
        setTimeout(() => {
          setShowModal(false)
          setFormSuccess(false)
        }, 1500)
      } else {
        const errData = await response.json()
        setFormError(errData.error || "Failed to submit review")
        toast.error(errData.error || "Failed to submit review.")
      }
    } catch (err) {
      console.error(err)
      setFormError("Failed to communicate with server")
      toast.error("Failed to communicate with server.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen pt-32 pb-24 overflow-hidden bg-background">
      <Navbar />

      <div className="absolute inset-0 grid-bg pointer-events-none opacity-30 bg-background" />

      <div className="relative mx-auto max-w-7xl px-4 z-10">

        {/* Back Link */}
        <div className="mb-6 flex justify-start">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition font-sans font-semibold">
            <ArrowLeft size={13} /> Back to Home
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <p className="text-[10px] font-bold font-sans uppercase tracking-wider text-primary mb-3">Community Hub</p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-display mb-6 tracking-tight leading-tight text-foreground">
            Real Brokerage <span className="text-gradient">Proofs & Reviews</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg font-sans">
            Every review is posted by an actual client and backed by block or transaction receipts. We believe in 100% transparency.
          </p>
        </div>

        {/* Reviews Feed */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold font-display text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
            Reviews Feed <span className="text-xs font-sans font-bold text-muted-foreground bg-foreground/[0.04] px-2 py-0.5 rounded-full">{reviews.length} total</span>
          </h2>

          {loading ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="relative overflow-hidden liquid-glass rounded-[2rem] p-6 sm:p-8 border border-border/60 bg-card flex flex-col justify-between h-[360px]">
                  <div className="space-y-4">
                    {/* Stars skeleton */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, sIdx) => (
                        <Skeleton key={sIdx} className="h-3.5 w-3.5 rounded-full" />
                      ))}
                    </div>
                    {/* Comment skeleton */}
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {/* Dates / Timeline widget skeleton */}
                    <div className="relative flex items-center justify-between px-4 py-2.5 rounded-2xl bg-foreground/[0.015] border border-border/40">
                      <div className="flex flex-col gap-1.5 text-left">
                        <Skeleton className="h-2 w-10" />
                        <Skeleton className="h-3.5 w-14" />
                      </div>
                      <Skeleton className="h-4 w-20 rounded-full" />
                      <div className="flex flex-col gap-1.5 items-end text-right">
                        <Skeleton className="h-2 w-10" />
                        <Skeleton className="h-3.5 w-14" />
                      </div>
                    </div>
                    {/* Verification image placeholder skeleton */}
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="liquid-glass rounded-2xl p-12 text-center border border-border/60">
              <p className="text-muted-foreground text-sm">No reviews posted yet. Be the first to submit a review below!</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, rIdx) => {
                const diffDays = (() => {
                  if (!r.gc_received_date || !r.payment_sent_date) return null
                  try {
                    const gcDate = new Date(r.gc_received_date)
                    const payDate = new Date(r.payment_sent_date)
                    if (isNaN(gcDate.getTime()) || isNaN(payDate.getTime())) return null
                    return Math.ceil(Math.abs(payDate.getTime() - gcDate.getTime()) / (1000 * 60 * 60 * 24))
                  } catch {
                    return null
                  }
                })()

                const urls = r.proof_image_url ? r.proof_image_url.split(",") : []

                return (
                  <div key={r.id || rIdx} className="relative overflow-hidden liquid-glass rounded-[2rem] p-6 sm:p-8 border border-border/60 hover:border-border hover:bg-foreground/[0.01] transition-all duration-300 flex flex-col justify-between bg-card">

                    <div className="relative z-10">
                      {/* Rating + Quote Icon */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: r.rating || 5 }).map((_, i) => (
                            <Star key={i} size={14} className="fill-[var(--primary)] text-[var(--primary)]" />
                          ))}
                        </div>
                        <Quote size={18} className="text-foreground/10" />
                      </div>

                      {/* Comment */}
                      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6 font-medium whitespace-pre-wrap font-sans">
                        "{r.quote}"
                      </p>
                    </div>

                    <div className="relative z-10">
                      {/* Dates / Payout Timeline Widget */}
                      <div className="relative flex items-center justify-between mt-3 mb-6 px-4 py-2.5 rounded-2xl bg-foreground/[0.015] border border-border/40 shadow-inner">
                        <div className="relative z-10 flex flex-col text-left">
                          <span className="text-[8px] font-bold uppercase text-amber-400/90 tracking-wider flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                            GC Received
                          </span>
                          <span className="text-[10.5px] font-bold text-foreground mt-0.5">{formatDate(r.gc_received_date)}</span>
                        </div>

                        <div className="absolute left-[28%] right-[28%] top-1/2 -translate-y-1/2 flex items-center justify-center">
                          <div className="w-full h-0 border-t border-dashed border-border/60" />
                          <span className="absolute px-2.5 py-0.5 rounded-full bg-background border border-border/60 text-[7.5px] font-bold text-muted-foreground uppercase whitespace-nowrap shadow-sm">
                            {diffDays === 0 ? "⚡ Instant" : `${diffDays}d Settlement`}
                          </span>
                        </div>

                        <div className="relative z-10 flex flex-col items-end text-right">
                          <span className="text-[8px] font-bold uppercase text-emerald-400/90 tracking-wider flex items-center gap-1">
                            Payment Sent
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                          </span>
                          <span className="text-[10.5px] font-bold text-foreground mt-0.5">{formatDate(r.payment_sent_date)}</span>
                        </div>
                      </div>

                      {/* Proof Image Section */}
                      {urls.length > 0 && (
                        <div className="mb-5">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Verification Certificate</p>
                          <button
                            type="button"
                            onClick={() => openZoom(urls, 0)}
                            className="w-full flex items-center gap-4 p-2.5 rounded-2xl bg-foreground/[0.01] border border-border/60 hover:border-primary/40 hover:bg-foreground/[0.02] transition-all duration-300 group cursor-pointer text-left focus:outline-none"
                          >
                            {/* Overlapping image stack */}
                            <div className="relative h-16 w-20 shrink-0 select-none">
                              {urls.length === 1 ? (
                                <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-border bg-black/40 shadow-sm">
                                  <img src={urls[0]} alt="Proof transaction receipt" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <ImageIcon size={14} className="text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="relative w-full h-full">
                                  {urls.slice(0, 3).reverse().map((url, uidx) => {
                                    const revIdx = urls.slice(0, 3).length - 1 - uidx
                                    const offset = revIdx * 6
                                    const rotate = revIdx * 4 - 2
                                    return (
                                      <div
                                        key={uidx}
                                        className="absolute top-0 left-0 h-14 w-14 rounded-xl overflow-hidden border border-border bg-black/40 shadow-md transition-all duration-300 group-hover:scale-105"
                                        style={{
                                          transform: `translate(${offset}px, ${offset/2}px) rotate(${rotate}deg)`,
                                          zIndex: 10 - revIdx,
                                        }}
                                      >
                                        <img src={url} alt="Proof transaction receipt" className="h-full w-full object-cover" />
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[9px] font-bold text-primary flex items-center gap-0.5">
                                  <CheckCircle size={9} className="fill-primary/15" /> SECURE LEDGER
                                </span>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <span className="text-[8px] font-semibold text-muted-foreground uppercase">
                                  {urls.length === 1 ? "1 Receipt" : `${urls.length} Receipts`}
                                </span>
                              </div>
                              <h5 className="text-[10px] font-bold text-foreground truncate uppercase tracking-tight group-hover:text-primary transition-colors">
                                {urls.length === 1 ? "Verify Payout Receipt" : "Browse Payout Receipts"}
                              </h5>
                              <p className="text-[8px] text-muted-foreground truncate">
                                {urls.length === 1 ? "Click to view full receipt" : "Click to view receipt stack"}
                              </p>
                            </div>
                          </button>
                        </div>
                      )}

                      <div className="w-full h-[1px] bg-border/60 mb-5" />

                      {/* Profile info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground shadow-md uppercase">
                            {r.avatar_url ? (
                              <img src={r.avatar_url} alt={r.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              (r.name || "").charAt(0)
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-foreground">{r.name}</h4>
                            <p className="text-[10px] text-muted-foreground font-sans">{r.role}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            {r.region && (
                              <span className={`text-[8px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 border ${
                                r.region === "US" ? "text-sky-400 bg-sky-500/10 border-sky-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                              }`}>
                                {r.region === "US" ? "🇺🇸 US" : "🇬🇧 UK"}
                              </span>
                            )}
                            <span className="text-[8.5px] font-bold text-muted-foreground/80 bg-foreground/[0.03] border border-border/60 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                              {r.trade_type}
                            </span>
                          </div>
                          <span className="text-[7.5px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle size={7} className="fill-emerald-400/20" /> Verified Trade
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) for posting a review */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 z-40 h-14 w-14 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center shadow-2xl cursor-pointer hover:bg-primary/30 hover:border-primary/50 hover:shadow-primary/20 transition-all duration-300 backdrop-blur-md hover:scale-105 active:scale-95 animate-bounce"
      >
        <Plus size={24} className="stroke-[3px]" />
      </button>

      {/* Review Submission Modal Overlay using Card */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Card */}
          <Card className="relative w-full max-w-lg max-h-[90dvh] sm:max-h-[85vh] border border-border/80 shadow-2xl z-10 overflow-y-auto liquid-glass rounded-[2.5rem]">
            <CardAction>
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition p-1.5 rounded-full bg-foreground/[0.04] border border-border hover:bg-foreground/[0.08]"
              >
                <X size={16} />
              </Button>
            </CardAction>

            <CardHeader className="p-6 sm:p-8 pb-4">
              <CardTitle className="text-xl font-bold font-display text-foreground">Share Your Experience</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Fill out the details below. Payout receipt proof is mandatory.</CardDescription>
            </CardHeader>

            <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                  />
                </div>

                {/* Card Type & Trade Route */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cardType" className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground">Gift Card Type *</Label>
                    <Select
                      value={cardType}
                      onValueChange={(val) => {
                        setCardType(val)
                        setTradeType(`${val} ➔ UPI`)
                        if (val !== "Amazon") setRegion("")
                      }}
                    >
                      <SelectTrigger id="cardType" className="w-full h-9 bg-background border border-input text-left text-sm">
                        <SelectValue placeholder="Select Card Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Amazon">Amazon</SelectItem>
                        <SelectItem value="Flipkart">Flipkart</SelectItem>
                        <SelectItem value="Roblox">Roblox</SelectItem>
                        <SelectItem value="League of Legends">League of Legends</SelectItem>
                        <SelectItem value="Overwatch 2">Overwatch 2</SelectItem>
                        <SelectItem value="Sea of Thieves">Sea of Thieves</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tradeType" className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground">Trade Route *</Label>
                    <Input
                      id="tradeType"
                      type="text"
                      required
                      value={tradeType}
                      onChange={(e) => setTradeType(e.target.value)}
                      placeholder="e.g. Amazon ➔ UPI"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role" className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground">Role (Optional)</Label>
                    <Input
                      id="role"
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Casual Gamer"
                    />
                  </div>
                </div>

                {/* Amazon Region Badges */}
                {(cardType === "Amazon" || tradeType.toLowerCase().includes("amazon")) && (
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground">Amazon Card Region Badge</Label>
                    <div className="flex gap-2.5">
                      {["US", "UK", "None"].map((reg) => (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => setRegion(reg === "None" ? "" : reg)}
                          className={`flex-1 py-2.5 rounded-xl border font-mono text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                            (reg === "None" ? !region : region === reg)
                              ? "bg-primary/25 text-primary border-primary/50 font-extrabold"
                              : "bg-foreground/[0.02] text-muted-foreground border-border/80 hover:bg-foreground/[0.04]"
                          }`}
                        >
                          {reg === "US" ? "🇺🇸 US Badge" : reg === "UK" ? "🇬🇧 UK Badge" : "❌ No Badge"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Calendar size={11} className="text-muted-foreground/85" /> Gift Card Received Date
                    </Label>
                    <Input
                      type="date"
                      value={gcReceivedDate}
                      onChange={(e) => setGcReceivedDate(e.target.value)}
                      className="[color-scheme:light-dark]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Calendar size={11} className="text-muted-foreground/85" /> Payment Sent Date
                    </Label>
                    <Input
                      type="date"
                      value={paymentSentDate}
                      onChange={(e) => setPaymentSentDate(e.target.value)}
                      className="[color-scheme:light-dark]"
                    />
                  </div>
                </div>

                {/* Rating */}
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground">Rating</Label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition transform hover:scale-110 bg-transparent border-0 p-0"
                      >
                        <Star
                          size={18}
                          className={star <= rating
                            ? "fill-[var(--primary)] text-[var(--primary)]"
                            : "text-muted-foreground/40"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quote (Description) */}
                <div className="grid gap-2">
                  <Label htmlFor="quote" className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground">Review Description *</Label>
                  <Textarea
                    id="quote"
                    required
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="Tell others how easy your transaction was, how fast the payout completed..."
                    rows={3}
                  />
                </div>

                {/* Proof Image Upload */}
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground">Upload Payout Proof Receipts *</Label>
                  <div className="relative border border-dashed border-border rounded-xl p-3 flex flex-col items-center justify-center bg-foreground/[0.01] hover:bg-foreground/[0.02] transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="flex flex-col items-center space-y-1.5 py-1">
                        <Loader2 className="animate-spin text-primary h-5 w-5" />
                        <span className="text-[9px] text-muted-foreground font-mono">Uploading receipt(s)...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-0.5 py-1 text-center font-sans">
                        <Upload className="text-muted-foreground/60 h-5 w-5 mb-1" />
                        <span className="text-xs font-semibold text-foreground">Click to upload receipt images (Can select multiple)</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Uploaded Images List */}
                  {imageUrls.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[9px] font-bold font-mono uppercase tracking-wider text-muted-foreground">Uploaded Receipts ({imageUrls.length})</p>
                      <div className="grid grid-cols-2 gap-2">
                        {imageUrls.map((url, uidx) => (
                          <div key={uidx} className="flex items-center justify-between p-2 rounded-xl bg-foreground/[0.02] border border-border/60">
                            <div className="flex items-center gap-2">
                              <img src={url} alt="Uploaded Proof Thumbnail" className="h-8 w-8 object-cover rounded" />
                              <span className="text-[9px] font-mono text-muted-foreground">Receipt #{uidx + 1}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeUploadedImage(uidx)}
                              className="p-1 rounded-full hover:bg-red-500/10 text-red-400 hover:text-red-500 transition cursor-pointer bg-transparent border-0"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages */}
                {formError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2">
                    <CheckCircle size={14} className="shrink-0 mt-0.5" />
                    <span>Review posted successfully!</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting || uploadingImage || imageUrls.length === 0}
                  className="w-full cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Zoom / Gallery Modal Overlay */}
      {zoomedImages.length > 0 && (
        <div
          onClick={closeZoom}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] rounded-[2rem] overflow-hidden border border-border/80 shadow-2xl bg-card p-3 flex flex-col items-center justify-center select-none"
          >
            {/* Image display */}
            <div className="relative flex items-center justify-center max-w-full max-h-[75vh]">
              <img
                src={zoomedImages[zoomedIndex]}
                alt={`Receipt Proof ${zoomedIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-inner bg-black/40 border border-border/40"
              />

              {/* Prev Button */}
              {zoomedImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setZoomedIndex((prev) => (prev > 0 ? prev - 1 : zoomedImages.length - 1))
                  }}
                  className="absolute left-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition hover:scale-105 active:scale-95 shadow-lg border border-white/10 cursor-pointer flex items-center justify-center bg-transparent"
                >
                  <ChevronLeft size={20} className="stroke-[2.5]" />
                </button>
              )}

              {/* Next Button */}
              {zoomedImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setZoomedIndex((prev) => (prev < zoomedImages.length - 1 ? prev + 1 : 0))
                  }}
                  className="absolute right-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition hover:scale-105 active:scale-95 shadow-lg border border-white/10 cursor-pointer flex items-center justify-center bg-transparent"
                >
                  <ChevronRight size={20} className="stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* Bottom bar: Title & Pagination */}
            <div className="w-full flex items-center justify-between mt-3 px-4 py-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold font-sans text-primary flex items-center gap-0.5 uppercase">
                  <CheckCircle size={10} className="fill-primary/15" /> Ledger Receipt
                </span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-[9px] font-sans font-bold text-muted-foreground uppercase">
                  Verification Secure
                </span>
              </div>

              {zoomedImages.length > 1 && (
                <span className="text-[10px] font-sans font-bold text-foreground bg-foreground/[0.04] border border-border px-3 py-1 rounded-full">
                  Receipt {zoomedIndex + 1} of {zoomedImages.length}
                </span>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={closeZoom}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition shadow-md border border-white/10 cursor-pointer bg-transparent"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewsPage
