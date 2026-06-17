import * as React from "react"
import { Star, Quote, CheckCircle, Image as ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface Review {
  name: string
  role: string
  avatarUrl: string
  quote: string
  rating: number
  tradeType: string
  proofImageUrl: string
  region?: string
  gcReceivedDate: string
  paymentSentDate: string
}

export function Testimonials() {
  const [dbReviews, setDbReviews] = React.useState<Review[]>([])
  const [loading, setLoading] = React.useState(true)
  const [zoomedImages, setZoomedImages] = React.useState<string[]>([])
  const [zoomedIndex, setZoomedIndex] = React.useState(0)
  const [activeTab, setActiveTab] = React.useState("All")
  const [cardSize, setCardSize] = React.useState(365)
  const [carouselReviews, setCarouselReviews] = React.useState<Review[]>([])

  const openZoom = (images: string[], index = 0) => {
    setZoomedImages(images)
    setZoomedIndex(index)
  }

  const closeZoom = () => {
    setZoomedImages([])
    setZoomedIndex(0)
  }

  React.useEffect(() => {
    const fetchDbReviews = async () => {
      try {
        const res = await fetch("https://api.gcx.co.in/api/reviews")
        if (res.ok) {
          const data = await res.json()
          // Normalize DB keys to match static ones
          const mapped = data
            .filter((r: any) => r.verified)
            .map((r: any) => {
              const createdAt = r.created_at || new Date().toISOString()
              return {
                name: r.name,
                role: r.role,
                avatarUrl: r.avatar_url || "",
                quote: r.quote,
                rating: r.rating,
                tradeType: r.trade_type,
                proofImageUrl: r.proof_image_url,
                region: r.region,
                gcReceivedDate: r.gc_received_date || new Date(new Date(createdAt).getTime() - 3600 * 1000 * 24 * 3).toISOString(),
                paymentSentDate: r.payment_sent_date || createdAt
              }
            })
          setDbReviews(mapped)
        }
      } catch (err) {
        console.error("Failed to load live reviews", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDbReviews()
  }, [])

  const filteredReviews = React.useMemo(() => {
    const list = dbReviews
    if (activeTab === "All") return list
    if (activeTab === "UPI") return list.filter(r => (r.tradeType || "").toLowerCase().includes("upi") || (r.tradeType || "").toLowerCase().includes("bank"))
    if (activeTab === "Crypto") return list.filter(r => (r.tradeType || "").toLowerCase().includes("usdt") || (r.tradeType || "").toLowerCase().includes("crypto"))
    if (activeTab === "Amazon") return list.filter(r => (r.tradeType || "").toLowerCase().includes("amazon"))
    if (activeTab === "Gaming") return list.filter(r => 
      (r.tradeType || "").toLowerCase().includes("roblox") || 
      (r.tradeType || "").toLowerCase().includes("lol") || 
      (r.tradeType || "").toLowerCase().includes("legends") || 
      (r.tradeType || "").toLowerCase().includes("overwatch") || 
      (r.tradeType || "").toLowerCase().includes("thieves") ||
      (r.tradeType || "").toLowerCase().includes("sea")
    )
    return list
  }, [activeTab, dbReviews])

  React.useEffect(() => {
    setCarouselReviews(filteredReviews)
  }, [filteredReviews])

  const handleMove = (steps: number) => {
    const list = [...carouselReviews]
    if (list.length === 0) return
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = list.shift()
        if (item) list.push(item)
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = list.pop()
        if (item) list.unshift(item)
      }
    }
    setCarouselReviews(list)
  }

  React.useEffect(() => {
    if (carouselReviews.length <= 1) return
    const timer = setInterval(() => {
      setCarouselReviews((currentReviews) => {
        if (currentReviews.length === 0) return currentReviews
        const list = [...currentReviews]
        const item = list.shift()
        if (item) list.push(item)
        return list
      })
    }, 4500)
    return () => clearInterval(timer)
  }, [carouselReviews.length])

  React.useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)")
      setCardSize(matches ? 365 : 290)
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  if (!loading && dbReviews.length === 0) return null

  return (
    <section id="testimonials" className="relative py-10 sm:py-14 border-t border-border/40 overflow-hidden bg-background">
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-modal-fade {
          animation: modalFadeIn 0.2s ease-out forwards;
        }
        .animate-modal-scale {
          animation: modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="absolute inset-0 grid-bg pointer-events-none opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 mb-8 text-center">
        <p className="text-[10px] font-bold font-sans uppercase tracking-wider text-primary mb-4">Reviews</p>
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display mb-5 tracking-tight leading-tight text-foreground">
          Loved by the <span className="text-gradient">community</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-sans">
          Hear from our community members who converted their unused balances into real cash and crypto.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10 px-4 relative z-10">
        <div className="bg-foreground/[0.015] border border-border/30 rounded-2xl p-4 flex flex-col justify-between text-left">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Rating Score</span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-lg font-bold font-display text-foreground">4.9</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={11} className="fill-primary text-primary" />
              ))}
            </div>
          </div>
        </div>
        <div className="bg-foreground/[0.015] border border-border/30 rounded-2xl p-4 flex flex-col justify-between text-left">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Payout Success</span>
          <span className="text-lg font-bold font-display text-emerald-400 mt-2">100% Verified</span>
        </div>
        <div className="bg-foreground/[0.015] border border-border/30 rounded-2xl p-4 flex flex-col justify-between text-left">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Settlement Time</span>
          <span className="text-lg font-bold font-display text-primary mt-2">&lt; 2 Hours avg</span>
        </div>
        <div className="bg-foreground/[0.015] border border-border/30 rounded-2xl p-4 flex flex-col justify-between text-left">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Proof Receipts</span>
          <span className="text-lg font-bold font-display text-foreground mt-2">Public Ledger</span>
        </div>
      </div>

      {/* Tab Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 relative z-10 px-4">
        {["All", "UPI", "Crypto", "Amazon", "Gaming"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer ${
              activeTab === tab
                ? "bg-primary text-black border-primary shadow-lg shadow-primary/5"
                : "bg-foreground/[0.03] text-muted-foreground border-border/40 hover:text-foreground hover:border-border/80"
            }`}
          >
            {tab === "All" ? "All Trades" : tab === "Crypto" ? "Crypto / USDT" : tab === "UPI" ? "UPI Bank Transfer" : tab === "Amazon" ? "Amazon Cards" : `${tab} Cards`}
          </button>
        ))}
      </div>

      {/* Carousel Container */}
      {loading ? (
        <div
          className="relative w-full overflow-hidden mb-6 flex items-center justify-center select-none"
          style={{ height: "600px" }}
        >
          {[-1, 0, 1].map((pos) => {
            const isCenter = pos === 0
            return (
              <div
                key={pos}
                className="absolute transition-all duration-500 rounded-[2rem] p-6 sm:p-8 border border-border bg-card flex flex-col justify-between"
                style={{
                  width: `${cardSize}px`,
                  height: "450px",
                  transform: `translateX(${pos * (cardSize + 20)}px) scale(${isCenter ? 1 : 0.85})`,
                  opacity: isCenter ? 1 : 0.4,
                  zIndex: isCenter ? 10 : 1,
                  filter: isCenter ? "none" : "blur(1px)",
                }}
              >
                {/* Header Skeleton */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full animate-pulse" />
                    <div className="space-y-1.5 text-left">
                      <Skeleton className="h-3.5 w-24 animate-pulse" />
                      <Skeleton className="h-2.5 w-16 animate-pulse" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-12 rounded-full animate-pulse" />
                </div>
                {/* Comment Skeleton */}
                <div className="space-y-2 mt-6 flex-1">
                  <Skeleton className="h-3.5 w-full animate-pulse" />
                  <Skeleton className="h-3.5 w-5/6" />
                  <Skeleton className="h-3.5 w-4/5" />
                </div>
                {/* Timeline and Proof Skeleton */}
                <div className="space-y-4 mt-6">
                  <div className="relative flex items-center justify-between px-3 py-2 rounded-xl bg-foreground/[0.015] border border-border/40">
                    <div className="flex flex-col gap-1 text-left">
                      <Skeleton className="h-2 w-8 animate-pulse" />
                      <Skeleton className="h-3 w-10 animate-pulse" />
                    </div>
                    <Skeleton className="h-3.5 w-16 rounded-full animate-pulse" />
                    <div className="flex flex-col gap-1 items-end text-right">
                      <Skeleton className="h-2 w-8 animate-pulse" />
                      <Skeleton className="h-3 w-10 animate-pulse" />
                    </div>
                  </div>
                  <Skeleton className="h-14 w-full rounded-xl animate-pulse" />
                </div>
              </div>
            )
          })}
        </div>
      ) : carouselReviews.length === 0 ? (
        <div className="py-12 text-center min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No verified reviews found in this category.</p>
        </div>
      ) : (
        <div
          className="relative w-full overflow-hidden mb-6 flex items-center justify-center select-none"
          style={{ height: "600px" }}
        >
          {carouselReviews.map((t, idx) => {
            const len = carouselReviews.length
            const position = len % 2 ? idx - (len - 1) / 2 : idx - len / 2
            return (
              <TestimonialCard
                key={t.name + t.quote.slice(0, 10)}
                t={t}
                position={position}
                cardSize={cardSize}
                handleMove={handleMove}
                onZoom={openZoom}
              />
            )
          })}

          {/* Navigation Arrows */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 z-30">
            <button
              onClick={() => handleMove(-1)}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-primary hover:text-primary-foreground focus:outline-none transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => handleMove(1)}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/80 hover:bg-primary hover:text-primary-foreground focus:outline-none transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Next testimonial"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* View All CTA */}
      <div className="text-center z-10 relative px-4">
        <a
          href="/reviews"
          className="inline-flex items-center gap-2 rounded-xl bg-foreground/[0.03] border border-border/50 text-foreground hover:border-primary/50 hover:text-primary px-6 py-3.5 text-xs font-bold transition-all duration-300 cursor-pointer shadow-md"
        >
          View All Verified Receipts & Reviews →
        </a>
      </div>

      {/* Zoom / Gallery Modal Overlay */}
      {zoomedImages.length > 0 && (
        <div
          onClick={closeZoom}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-modal-fade"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] rounded-[2rem] overflow-hidden border border-border/80 shadow-2xl bg-card p-3 flex flex-col items-center justify-center select-none animate-modal-scale"
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
                  className="absolute left-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition hover:scale-105 active:scale-95 shadow-lg border border-white/10 cursor-pointer flex items-center justify-center"
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
                  className="absolute right-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition hover:scale-105 active:scale-95 shadow-lg border border-white/10 cursor-pointer flex items-center justify-center"
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
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition shadow-md border border-white/10 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

interface TestimonialCardProps {
  t: Review
  position: number
  cardSize: number
  handleMove: (steps: number) => void
  onZoom: (images: string[], index: number) => void
}

function TestimonialCard({ t, position, cardSize, handleMove, onZoom }: TestimonialCardProps) {
  const isCenter = position === 0

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

  const urls = React.useMemo(() => (t.proofImageUrl ? t.proofImageUrl.split(",") : []), [t.proofImageUrl])

  return (
    <div
      onClick={() => handleMove(position)}
      className={`absolute left-1/2 top-1/2 cursor-pointer transition-all duration-500 ease-in-out flex flex-col justify-between text-left select-none overflow-hidden liquid-glass rounded-[2rem] p-6 sm:p-8 ${
        isCenter
          ? "z-10 border-2 border-primary shadow-[0_12px_40px_-12px_rgba(240,203,135,0.3)] bg-card/95 text-foreground scale-100"
          : "z-0 border border-border/60 hover:border-primary/30 bg-card/70 text-foreground scale-85 opacity-60 blur-[0.5px]"
      }`}
      style={{
        width: `${cardSize}px`,
        height: `${cardSize + 80}px`,
        transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.4) * position}px)
          translateY(${isCenter ? -35 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
      }}
    >
      <div className="relative z-10 flex-grow flex flex-col justify-between">
        <div>
          {/* Rating + Quote Icon */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: t.rating || 5 }).map((_, i) => (
                <Star key={i} size={13} className="fill-primary text-primary" />
              ))}
            </div>
            <Quote size={15} className="text-foreground/10" />
          </div>

          {/* Comment */}
          <p className="text-xs leading-relaxed mb-4 font-medium line-clamp-3 text-muted-foreground">
            "{t.quote}"
          </p>

          {/* Dates / Payout Timeline Widget */}
          <div className="relative flex items-center justify-between mt-1 mb-4 px-3 py-2 rounded-xl bg-foreground/[0.015] border border-border/40 shadow-inner text-[10px]">
            <div className="relative z-10 flex flex-col text-left">
              <span className="text-[7px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-400/90">
                Received
              </span>
              <span className="font-bold mt-0.5 text-foreground">{formatDate(t.gcReceivedDate)}</span>
            </div>

            <div className="relative z-10 flex flex-col items-end text-right">
              <span className="text-[7px] font-bold uppercase tracking-wider flex items-center gap-1 text-emerald-400/90">
                Paid Out
              </span>
              <span className="font-bold mt-0.5 text-foreground">{formatDate(t.paymentSentDate)}</span>
            </div>
          </div>
        </div>

        <div>
          {/* Verification Proof Receipt link if available */}
          {urls.length > 0 && (
            <div className="mb-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onZoom(urls, 0)
                }}
                className="w-full flex items-center gap-3 p-2 rounded-xl border transition-all duration-300 group cursor-pointer text-left focus:outline-none bg-foreground/[0.01] border-border/60 hover:border-primary/40 hover:bg-foreground/[0.02]"
              >
                <div className="relative h-12 w-16 shrink-0 select-none">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border bg-black/40 shadow-sm">
                    <img src={urls[0]} alt="Proof transaction receipt" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <ImageIcon size={12} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[8px] font-bold flex items-center gap-0.5 text-primary">
                      <CheckCircle size={8} className="fill-current/15" /> SECURE LEDGER
                    </span>
                  </div>
                  <h5 className="text-[9px] font-bold truncate uppercase tracking-tight text-foreground">
                    {urls.length === 1 ? "Verify Payout Receipt" : "Browse Receipts"}
                  </h5>
                </div>
              </button>
            </div>
          )}

          {/* Divider line */}
          <div className="w-full h-[1px] mb-4 bg-border/60" />

          {/* Profile info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-border/60 shadow-md">
                {t.avatarUrl && <AvatarImage src={t.avatarUrl} alt={t.name} className="object-cover" />}
                <AvatarFallback className="bg-secondary text-foreground text-[10px] font-bold font-sans uppercase">
                  {(t.name || "").charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div>
                <h4 className="font-bold text-[11px] text-foreground">
                  {t.name}
                </h4>
                <p className="text-[9px] font-sans text-muted-foreground">
                  {t.role}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[8px] font-bold rounded-full px-2 py-0.5 border text-rose-400 bg-rose-500/10 border-rose-500/20">
                {t.tradeType}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Testimonials
