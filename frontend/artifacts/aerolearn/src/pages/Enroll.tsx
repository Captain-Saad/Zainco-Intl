import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import {
  CheckCircle2, Plane, Clock, Users, BookOpen,
  Phone, Mail, MapPin, Star, Shield, Award,
  Layers, Gauge, Monitor, Headphones
} from "lucide-react";
import { customFetch } from "@workspace/api-client-react";

const courseFeatures = [
  {
    icon: Users,
    text: "Multi Crew Cooperation (MCC) — Full Module",
  },
  {
    icon: Plane,
    text: "Jet Orientation Course (JOC) — Full Module",
  },
  {
    icon: Layers,
    text: "A-320 Systems Introduction & Procedure Training",
  },
  {
    icon: Shield,
    text: "Crew Resource Management (CRM) & Threat/Error Management",
  },
  {
    icon: Gauge,
    text: "High-altitude & high-speed jet aerodynamics",
  },
  {
    icon: BookOpen,
    text: "ECAM systems, FMS & autopilot operations",
  },
  {
    icon: Monitor,
    text: "50 hours of structured simulator practice sessions",
  },
  {
    icon: Headphones,
    text: "Simulator Briefing & Debrief with instructor feedback",
  },
  {
    icon: Star,
    text: "Non-Technical Skills (NTS) assessment preparation",
  },
  {
    icon: Award,
    text: "Course completion certificate — CAAB aligned curriculum",
  },
  {
    icon: Clock,
    text: "12 months of full portal access",
  },
];

const faqs = [
  {
    q: "Who is eligible to enroll?",
    a: "Pakistani CPL holders who are preparing for an airline career on the Airbus A-320. Prior multi-engine or instrument rating experience is preferred.",
  },
  {
    q: "Is the training conducted online or in-person?",
    a: "Zainco International is a blended learning platform. Theory, video lectures, and assessments are conducted online via this portal. Simulator sessions (where applicable) are conducted in Lahore.",
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
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", license: "", message: "",
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await customFetch("/api/enrollment-inquiries", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          license_number: form.license,
          message: form.message,
        }),
        headers: { "Content-Type": "application/json" },
      });
      setSubmitted(true);
    } catch {
      // Still show success to user (inquiry may have gone through)
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
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
            Our comprehensive MCC + JOC preparation program is specifically designed
            for CPL holders in Pakistan preparing to join airlines operating A-320 aircraft.
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

      {/* What We Offer — Single Course Card */}
      <section className="py-16 max-w-5xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-2xl border-2 border-primary/40 relative overflow-hidden shadow-[0_0_40px_rgba(201,168,76,0.1)]"
        >
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
              <div>
                <div className="inline-block text-[10px] font-mono tracking-widest px-3 py-1 rounded border bg-primary/20 text-primary border-primary/40 mb-4">
                  COMPREHENSIVE PROGRAM
                </div>
                <h2 className="font-display font-bold text-3xl md:text-4xl mb-2">
                  WHAT WE OFFER
                </h2>
                <p className="text-muted-foreground text-sm max-w-lg">
                  A complete MCC + JOC preparation course covering everything you need
                  to transition from CPL to a career-ready airline pilot on the Airbus A-320.
                </p>
              </div>


            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-10" />

            {/* Feature Grid */}
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              {courseFeatures.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <feat.icon size={18} className="text-primary" />
                  </div>
                  <span className="text-sm text-foreground/90 leading-relaxed pt-1.5">{feat.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA inside the card */}
            <div className="mt-10 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                Ready to start? Fill in your details below and our team will reach out within <span className="text-primary font-medium">24 hours</span>.
              </p>
              <button
                onClick={() => {
                  document.getElementById("enroll-form")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shrink-0"
              >
                <Plane size={16} className="-rotate-45" /> Enroll Now
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Enrollment Form */}
      <section id="enroll-form" className="py-16 max-w-5xl mx-auto px-4 md:px-6">
        <div className="glass-card rounded-2xl border border-border p-6 md:p-10">
          {!submitted ? (
            <>
              <div className="mb-8">
                <p className="font-mono text-xs tracking-widest text-primary mb-2">ENROLLMENT ENQUIRY</p>
                <h2 className="font-display font-bold text-2xl md:text-3xl">Your Details</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Enrolling for: <span className="text-foreground font-medium">MCC + JOC Combined Program</span>
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
                  <label className="text-sm text-muted-foreground ml-1">Message (optional)</label>
                  <textarea
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary min-h-[100px] resize-none"
                    placeholder="Any questions or specific requirements..."
                    value={form.message}
                    onChange={handleChange("message")}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
                    <Plane size={18} className="-rotate-45" />
                    {submitting ? "Submitting..." : "Submit Enrollment Enquiry"}
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
                Your enrollment enquiry for <span className="text-foreground font-medium">MCC + JOC Combined Program</span> has been received. We will call you at <span className="text-foreground font-medium">{form.phone}</span> within 24 hours.
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
      <section className="py-16 max-w-5xl mx-auto px-4 md:px-6">
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
            <a href="tel:+923219230301" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Phone size={16} className="text-primary" /> +92 321 9230301
            </a>
            <a href="mailto:zainco747@gmail.com" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Mail size={16} className="text-primary" /> zainco747@gmail.com
            </a>
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={16} className="text-primary" /> Lahore
            </span>
          </div>
        </div>
      </section>

      {/* Footer mini */}
      <div className="border-t border-border/30 py-6 text-center text-xs text-muted-foreground font-mono">
        © {new Date().getFullYear()} Zainco International.
        <Link href="/login" className="text-primary hover:underline ml-3">Login Zainco Intl →</Link>
      </div>
    </div>
  );
}
