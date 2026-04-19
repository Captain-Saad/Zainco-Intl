import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import {
  CheckCircle2, Plane, Clock, Users, BookOpen,
  Phone, Mail, MapPin, ChevronRight, Shield, Award, Star
} from "lucide-react";

const programs = [
  {
    id: "mcc",
    tag: "MOST POPULAR",
    title: "MCC + JOC Combined",
    subtitle: "Multi Crew Cooperation & Jet Orientation Course",
    price: "PKR 285,000",
    duration: "60 hrs",
    lessons: 20,
    students: 86,
    highlight: true,
    features: [
      "Multi Crew Cooperation (MCC) — Full Module",
      "Jet Orientation Course (JOC) — Full Module",
      "A-320 Systems Introduction",
      "Simulator Briefing & Debrief sessions",
      "Course completion certificate",
      "12 months portal access",
      "1-on-1 instructor feedback sessions",
    ],
  },
  {
    id: "mcc-only",
    tag: "STANDARD",
    title: "MCC Only",
    subtitle: "Multi Crew Cooperation",
    price: "PKR 155,000",
    duration: "36 hrs",
    lessons: 12,
    students: 47,
    highlight: false,
    features: [
      "Multi Crew Cooperation (MCC) — Full Module",
      "CRM & TEM training",
      "Standard Operating Procedures",
      "Course completion certificate",
      "6 months portal access",
      "Group Q&A sessions",
    ],
  },
  {
    id: "joc-only",
    tag: "ADVANCED",
    title: "JOC Only",
    subtitle: "Jet Orientation Course",
    price: "PKR 145,000",
    duration: "24 hrs",
    lessons: 8,
    students: 39,
    highlight: false,
    features: [
      "Jet Orientation Course (JOC) — Full Module",
      "High-altitude & high-speed aerodynamics",
      "A-320 family overview",
      "ECAM systems & warnings",
      "Course completion certificate",
      "6 months portal access",
    ],
  },
];

const faqs = [
  {
    q: "Who is eligible to enroll?",
    a: "Pakistani CPL holders who are preparing for an airline career on the Airbus A-320. Prior multi-engine or instrument rating experience is preferred.",
  },
  {
    q: "Is the training conducted online or in-person?",
    a: "Zainco International is a blended learning platform. Theory, video lectures, and assessments are conducted online via this portal. Simulator sessions (where applicable) are conducted at Allama Iqbal International Airport Lahore.",
  },
  {
    q: "How long does enrollment take?",
    a: "After submitting your enquiry, our admissions team will contact you within 24 hours. Full onboarding typically takes 2–3 business days.",
  },
  {
    q: "Are payment plans available?",
    a: "Yes. We offer 2- and 3-installment plans for all programs. Contact us during your onboarding call for details.",
  },
];

export default function Enroll() {
  const [selected, setSelected] = useState("mcc");
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", license: "", message: "",
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <div className="grain-overlay" />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center relative z-10">
          <p className="font-mono text-xs tracking-[0.4em] text-primary mb-4">ADMISSIONS OPEN — BATCH 2026</p>
          <h1 className="font-display font-bold text-4xl md:text-6xl mb-6 leading-tight">
            START YOUR <span className="text-primary">AIRLINE</span><br />CAREER TODAY
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            Select your program, fill in your details, and our admissions team will reach out within 24 hours to complete your enrollment.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-mono text-muted-foreground">
            {[
              { icon: Users, text: "166+ Students Trained" },
              { icon: Award, text: "CAAB Aligned Curriculum" },
              { icon: Shield, text: "CPL to ATPL Pathway" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={16} className="text-primary" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16 max-w-7xl mx-auto px-4 md:px-6">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-12">
          CHOOSE YOUR PROGRAM
        </h2>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {programs.map((prog) => (
            <motion.div
              key={prog.id}
              whileHover={{ y: -6 }}
              onClick={() => setSelected(prog.id)}
              className={`glass-card rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col relative overflow-hidden
                ${selected === prog.id
                  ? "border-primary shadow-[0_0_30px_rgba(201,168,76,0.2)]"
                  : "border-border hover:border-primary/40"
                }
                ${prog.highlight ? "border-t-4 border-t-primary" : ""}
              `}
            >
              {prog.tag && (
                <div className={`absolute top-4 right-4 text-[10px] font-mono tracking-widest px-2 py-0.5 rounded border
                  ${prog.highlight
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "bg-secondary text-muted-foreground border-border"
                  }`}>
                  {prog.tag}
                </div>
              )}

              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="font-display font-bold text-xl mb-1">{prog.title}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{prog.subtitle}</p>
                </div>

                <div className="mb-8">
                  <span className="font-display font-bold text-3xl text-foreground">{prog.price}</span>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">Installment plans available</p>
                </div>

                <div className="flex gap-4 text-xs font-mono text-muted-foreground mb-8 pb-6 border-b border-border/50">
                  <span className="flex items-center gap-1"><Clock size={13}/> {prog.duration}</span>
                  <span className="flex items-center gap-1"><BookOpen size={13}/> {prog.lessons} lessons</span>
                  <span className="flex items-center gap-1"><Users size={13}/> {prog.students} enrolled</span>
                </div>

                <ul className="space-y-3 flex-1">
                  {prog.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className={`mt-8 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-colors
                  ${selected === prog.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-primary/20 hover:text-primary"
                  }`}>
                  {selected === prog.id ? (
                    <><CheckCircle2 size={16} /> Selected</>
                  ) : (
                    <>Select Program <ChevronRight size={16} /></>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Enrollment Form */}
      <section className="py-16 max-w-3xl mx-auto px-4 md:px-6">
        <div className="glass-card rounded-2xl border border-border p-6 md:p-10">
          {!submitted ? (
            <>
              <div className="mb-8">
                <p className="font-mono text-xs tracking-widest text-primary mb-2">STEP 2 OF 2</p>
                <h2 className="font-display font-bold text-2xl md:text-3xl">Your Details</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Enrolling for: <span className="text-foreground font-medium">
                    {programs.find(p => p.id === selected)?.title}
                  </span>
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                  <Input
                    label="Full Name"
                    required
                    value={form.name}
                    onChange={handleChange("name")}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange("email")}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                  <Input
                    label="Phone Number"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={handleChange("phone")}
                  />
                  <Input
                    label="CPL License Number"
                    required
                    value={form.license}
                    onChange={handleChange("license")}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground ml-1">
                    Selected Program
                  </label>
                  <select
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                    value={selected}
                    onChange={e => setSelected(e.target.value)}
                  >
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.title} — {p.price}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground ml-1">Message (optional)</label>
                  <textarea
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary min-h-[100px] resize-none"
                    placeholder="Any questions or specific requirements..."
                    value={form.message}
                    onChange={handleChange("message")}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" size="lg" className="w-full gap-2">
                    <Plane size={18} className="-rotate-45" /> Submit Enrollment Enquiry
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-3 font-mono">
                    Our admissions team will contact you within 24 hours.
                  </p>
                </div>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={36} className="text-primary" />
              </div>
              <p className="font-mono text-xs tracking-widest text-primary mb-3">ENQUIRY SUBMITTED</p>
              <h3 className="font-display font-bold text-2xl md:text-3xl mb-4">
                Welcome aboard, {form.name.split(" ")[0] || "Pilot"}!
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                Your enrollment enquiry for <span className="text-foreground font-medium">{programs.find(p => p.id === selected)?.title}</span> has been received. We will call you at <span className="text-foreground font-medium">{form.phone}</span> within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg">Access Student Portal</Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="secondary">Back to Homepage</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 max-w-3xl mx-auto px-4 md:px-6">
        <h2 className="font-display font-bold text-2xl md:text-3xl mb-10 text-center">
          FREQUENTLY ASKED QUESTIONS
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="glass-card rounded-xl border border-border overflow-hidden"
            >
              <button
                className="w-full p-5 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium text-foreground pr-4">{faq.q}</span>
                <Star
                  size={18}
                  className={`text-primary shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Strip */}
      <section className="py-12 border-t border-border/50 max-w-7xl mx-auto px-4 md:px-6 mb-8">
        <div className="glass-card rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-bold text-xl mb-1">Prefer to speak to someone?</h3>
            <p className="text-muted-foreground text-sm">Our admissions team is available 9 AM – 6 PM, Mon–Sat.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 text-sm font-mono shrink-0">
            <a href="tel:+923001234567" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Phone size={16} className="text-primary" /> +92 300 1234567
            </a>
            <a href="mailto:zainco747@gmail.com" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Mail size={16} className="text-primary" /> zainco747@gmail.com
            </a>
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={16} className="text-primary" /> Allama Iqbal International Airport Lahore
            </span>
          </div>
        </div>
      </section>

      {/* Footer mini */}
      <div className="border-t border-border/30 py-6 text-center text-xs text-muted-foreground font-mono">
        © {new Date().getFullYear()} Zainco International Aviation Academy.
        <Link href="/login" className="text-primary hover:underline ml-3">Login Zainco Intl →</Link>
      </div>
    </div>
  );
}
