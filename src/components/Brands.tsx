import * as React from "react"
import { TiltCard } from "./TiltCard"
import { ChevronDown, ChevronUp, X } from "lucide-react"

const imgMap: Record<string, string> = {
  amazon: "/card-amazon-pkV6XfjL.png",
  flipkart: "/card-flipkart-SeEfOOvb.png",
  roblox: "/card-roblox-Cn_R-R5S.png",
  lol: "/card-lol-eD770gql.png",
  overwatch: "/overwatch2.png",
  sot: "/sot.png",
}

const getCardImage = (imgSrc: string) => imgMap[imgSrc] || imgSrc

interface Variant {
  name: string
  inr_rate: string | null
  usdt_rate: string | null
}

interface Brand {
  id: string
  name: string
  img: string
  tag: string
  rate: string
  glow: string
  variants: Variant[]
}

const fallbackBrands: Brand[] = [
  { id: "amazon", name: "Amazon", img: "amazon", tag: "Shopping", rate: "100 INR / 0.91 USDT", glow: "rgba(255, 153, 0, 0.4)", variants: [{ name: "arena100", inr_rate: "100 INR", usdt_rate: "0.91 USDT" }] },
  { id: "flipkart", name: "Flipkart", img: "flipkart", tag: "Shopping", rate: "90 INR", glow: "rgba(40, 116, 240, 0.4)", variants: [{ name: "e-Gift Voucher", inr_rate: "90 INR", usdt_rate: null }] },
  { id: "roblox", name: "Roblox", img: "roblox", tag: "Gaming", rate: "88 USDT", glow: "rgba(239, 68, 68, 0.4)", variants: [{ name: "Gift Card", inr_rate: null, usdt_rate: "88 USDT" }] },
  { id: "lol", name: "League of Legends", img: "lol", tag: "Gaming", rate: "86 USDT", glow: "rgba(197, 168, 128, 0.35)", variants: [{ name: "RP Gift Card", inr_rate: null, usdt_rate: "86 USDT" }] },
  { id: "overwatch", name: "Overwatch 2", img: "overwatch", tag: "Gaming", rate: "84 USDT", glow: "rgba(240, 100, 20, 0.4)", variants: [{ name: "Coins Gift Card", inr_rate: null, usdt_rate: "84 USDT" }] },
  { id: "sot", name: "Sea of Thieves", img: "sot", tag: "Gaming", rate: "82 USDT", glow: "rgba(16, 185, 129, 0.4)", variants: [{ name: "Coins Pack", inr_rate: null, usdt_rate: "82 USDT" }] },
]

export function Brands() {
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [expandedCardId, setExpandedCardId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch("https://api.gcx.co.in/api/cards")
        if (res.ok) {
          const data = await res.json()
          setBrands(data)
        } else {
          setBrands(fallbackBrands)
        }
      } catch (err) {
        console.error("Failed to fetch dynamic card rates, using fallback.", err)
        setBrands(fallbackBrands)
      }
    }
    fetchBrands()
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedCardId(expandedCardId === id ? null : id)
  }

  return (
    <section id="brands" className="relative py-10 sm:py-14 overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4">

        <div className="text-center mb-6 sm:mb-8">
          <p className="text-[10px] font-bold font-sans uppercase tracking-wider text-primary mb-3">Accepted cards</p>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-foreground leading-tight">
            We take the cards <span className="text-gradient">you actually own</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-3 font-sans">Click on any card to view detailed variant payout rates</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((b) => {
            const cardId = b.id || b.name
            const isExpanded = expandedCardId === cardId

            return (
              <div
                key={cardId}
                onClick={() => toggleExpand(cardId)}
                className="cursor-pointer h-full relative"
              >
                <TiltCard className="liquid-glass rounded-[2rem] p-6 h-full overflow-hidden flex flex-col justify-between border border-border/60 hover:border-border/90 hover:bg-foreground/[0.01] transition-all duration-300">
                  
                  {/* Rates Overlay Popup */}
                  {isExpanded && b.variants && b.variants.length > 0 && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 bg-background/95 backdrop-blur-xl z-20 p-6 flex flex-col justify-between border border-primary/30 rounded-[2rem] animate-in fade-in duration-200"
                      style={{
                        transform: "translateZ(30px)",
                      }}
                    >
                      <div>
                        {/* Overlay Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-4">
                          <h4 className="text-sm font-bold font-display text-foreground flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            {b.name} Rates
                          </h4>
                          <button
                            type="button"
                            onClick={() => toggleExpand(cardId)}
                            className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-full bg-foreground/[0.04] border border-border hover:bg-foreground/[0.08] cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Scrollable list of variants */}
                        <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 no-scrollbar text-xs">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Variant Payout Breakdown</p>
                          {b.variants.map((v, idx) => (
                            <div key={idx} className="flex justify-between items-center text-muted-foreground hover:text-foreground transition py-1.5 border-b border-border/10 last:border-0">
                              <span className="font-semibold text-foreground truncate max-w-[45%]">{v.name}</span>
                              <div className="flex items-center justify-end gap-1.5 max-w-[55%]">
                                {v.inr_rate && (
                                  <span className="font-sans text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1 text-[10px]">
                                    <span className="text-[7.5px] opacity-75 font-semibold text-emerald-500/90 uppercase">INR</span> {v.inr_rate}
                                  </span>
                                )}
                                {v.usdt_rate && (
                                  <span className="font-sans text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20 flex items-center gap-1 text-[10px]">
                                    <span className="text-[7.5px] opacity-75 font-semibold text-cyan-500/90 uppercase">USDT</span> {v.usdt_rate}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* WhatsApp CTA at the bottom */}
                      <a
                        href="https://wa.me/919120138828"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="group relative inline-block p-px rounded-full bg-slate-800 text-[10.5px] font-semibold leading-5 text-white no-underline shadow-lg cursor-pointer w-full text-center overflow-hidden"
                      >
                        <span className="absolute inset-0 overflow-hidden rounded-full">
                          <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(16,185,129,0.6)_0%,rgba(16,185,129,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        </span>
                        <div className="relative flex items-center justify-center space-x-1.5 rounded-full bg-zinc-950 py-2.5 px-4 ring-1 ring-white/10 transition-colors duration-300 group-hover:bg-zinc-900/80">
                          <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 via-neutral-300 to-neutral-100">
                            Start Trade on WhatsApp ➔
                          </span>
                        </div>
                      </a>
                    </div>
                  )}

                  <div>
                    {/* Image container */}
                    <div className="relative h-40 mb-4 grid place-items-center" style={{ transform: "translateZ(40px)" }}>
                      <img
                        src={getCardImage(b.img)}
                        alt={`${b.name} gift card`}
                        loading="lazy"
                        className="max-h-full w-auto object-contain drop-shadow-2xl"
                      />
                    </div>

                    {/* Header details */}
                    <div className="relative space-y-3.5" style={{ transform: "translateZ(20px)" }}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold font-display text-foreground">{b.name}</h3>
                        <span className="text-[8px] sm:text-[9px] font-bold font-sans uppercase tracking-wider text-muted-foreground/80 bg-card rounded-full px-2.5 py-1 border border-border">
                          {b.tag}
                        </span>
                      </div>
                      
                      {/* Baseline Rate Indicator */}
                      <div className="flex items-center justify-between py-2 px-3.5 rounded-xl bg-foreground/[0.02] border border-border/40">
                        <span className="text-[9px] font-sans font-semibold text-muted-foreground uppercase tracking-wider">Base Exchange Rate</span>
                        <span className="text-xs font-bold text-primary">{b.rate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom breakdown section */}
                  <div className="relative mt-4" style={{ transform: "translateZ(20px)" }}>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground font-sans">
                      <span className="font-bold text-foreground flex items-center gap-1">
                        See Variant Rates
                      </span>
                      <span className="text-foreground/70">
                        {isExpanded ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} />}
                      </span>
                    </div>
                  </div>
                </TiltCard>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Brands
